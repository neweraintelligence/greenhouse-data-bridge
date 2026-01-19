// ETL transformation utilities for data normalization

export interface TransformationLog {
  field: string;
  original: string;
  transformed: string;
  type: string;
}

// Unit conversions
export function convertWeight(value: string): { metric: number; imperial: number; display: string } {
  // Parse lbs to kg
  if (value.toLowerCase().includes('lbs') || value.toLowerCase().includes('lb')) {
    const lbs = parseFloat(value.replace(/[^\d.]/g, ''));
    const kg = lbs * 0.453592;
    return {
      imperial: lbs,
      metric: Math.round(kg * 10) / 10,
      display: `${Math.round(kg * 10) / 10} kg`,
    };
  }

  // Parse kg to lbs
  if (value.toLowerCase().includes('kg')) {
    const kg = parseFloat(value.replace(/[^\d.]/g, ''));
    const lbs = kg / 0.453592;
    return {
      metric: kg,
      imperial: Math.round(lbs * 10) / 10,
      display: `${Math.round(lbs * 10) / 10} lbs`,
    };
  }

  // Default: assume lbs if no unit specified
  const num = parseFloat(value);
  if (!isNaN(num)) {
    const kg = num * 0.453592;
    return {
      imperial: num,
      metric: Math.round(kg * 10) / 10,
      display: `${Math.round(kg * 10) / 10} kg`,
    };
  }

  return { imperial: 0, metric: 0, display: '0 kg' };
}

// Date standardization
export function standardizeDate(input: string): string {
  // Handle common formats: "1/15/25", "Jan 15 2025", "2025-01-15"
  try {
    // Try ISO format first
    if (input.match(/^\d{4}-\d{2}-\d{2}/)) {
      return input;
    }

    // Try MM/DD/YY or M/D/YY
    if (input.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}/)) {
      const parts = input.split('/');
      const month = parts[0].padStart(2, '0');
      const day = parts[1].padStart(2, '0');
      let year = parts[2];

      // Handle 2-digit year
      if (year.length === 2) {
        year = `20${year}`;
      }

      return `${year}-${month}-${day}`;
    }

    // Try text date (Jan 15 2025)
    const date = new Date(input);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }

    // Fallback: return as-is
    return input;
  } catch {
    return input;
  }
}

// SKU mapping - vendor SKUs to internal SKUs
const SKU_MAP: Record<string, string> = {
  'VNP-1247': 'CTN-12OZ',
  'VNP-1248': 'CTN-1LB',
  'VNP-1249': 'BAG-2LB',
  'NSP-445': 'CTN-1LB',
  'NSP-446': 'CTN-12OZ',
  'NSP-447': 'BAG-2LB',
  'VPC-882': 'CTN-12OZ',
  'VPC-883': 'CTN-1LB',
  'CF-201': 'BAG-2LB',
  'CF-202': 'CTN-12OZ',
};

export function mapVendorSku(vendorSku: string): { internal: string; vendor: string; mapped: boolean } {
  const internal = SKU_MAP[vendorSku];

  if (internal) {
    return {
      vendor: vendorSku,
      internal,
      mapped: true,
    };
  }

  // No mapping found - assume it's already internal SKU
  return {
    vendor: vendorSku,
    internal: vendorSku,
    mapped: false,
  };
}

// Name normalization for matching employees across sources
export function normalizeName(name: string): string {
  // Convert to title case
  const normalized = name
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Handle initials: "A. Chen" vs "A Chen"
  return normalized.replace(/([A-Z])\s+/g, '$1. ');
}

// Location parsing for incidents
export function parseLocation(input: string): { zone: string; row: string; formatted: string } | null {
  // Handle formats: "Zone 3, Row 12", "Z3-R12", "Z3R12", "3-12"

  // Already formatted
  if (input.match(/^Z\d+-R\d+$/i)) {
    const parts = input.toUpperCase().match(/Z(\d+)-R(\d+)/);
    return {
      zone: parts![1],
      row: parts![2],
      formatted: input.toUpperCase(),
    };
  }

  // "Zone 3, Row 12"
  if (input.toLowerCase().includes('zone') && input.toLowerCase().includes('row')) {
    const zoneMatch = input.match(/zone\s*(\d+)/i);
    const rowMatch = input.match(/row\s*(\d+)/i);

    if (zoneMatch && rowMatch) {
      return {
        zone: zoneMatch[1],
        row: rowMatch[1],
        formatted: `Z${zoneMatch[1]}-R${rowMatch[1]}`,
      };
    }
  }

  // "3-12" or "Z3R12"
  const simpleMatch = input.match(/(\d+)[- ]?(\d+)/);
  if (simpleMatch) {
    return {
      zone: simpleMatch[1],
      row: simpleMatch[2],
      formatted: `Z${simpleMatch[1]}-R${simpleMatch[2]}`,
    };
  }

  return null;
}

// Apply all transformations and generate log
export function transformData(
  sourceData: Record<string, any>
): { transformed: Record<string, any>; logs: TransformationLog[] } {
  const logs: TransformationLog[] = [];
  const transformed = { ...sourceData };

  // Weight conversion if present
  if (sourceData.weight) {
    const result = convertWeight(sourceData.weight);
    if (result.metric !== parseFloat(sourceData.weight)) {
      logs.push({
        field: 'weight',
        original: sourceData.weight,
        transformed: result.display,
        type: 'unit_conversion',
      });
      transformed.weight = result.display;
    }
  }

  // Date standardization
  if (sourceData.date || sourceData.ship_date) {
    const dateField = sourceData.date || sourceData.ship_date;
    const standardized = standardizeDate(dateField);
    if (standardized !== dateField) {
      logs.push({
        field: 'date',
        original: dateField,
        transformed: standardized,
        type: 'date_format',
      });
      if (sourceData.date) transformed.date = standardized;
      if (sourceData.ship_date) transformed.ship_date = standardized;
    }
  }

  // SKU mapping
  if (sourceData.sku || sourceData.expected_sku) {
    const skuField = sourceData.sku || sourceData.expected_sku;
    const result = mapVendorSku(skuField);
    if (result.mapped) {
      logs.push({
        field: 'sku',
        original: result.vendor,
        transformed: result.internal,
        type: 'sku_mapping',
      });
      if (sourceData.sku) transformed.sku = result.internal;
      if (sourceData.expected_sku) transformed.expected_sku = result.internal;
    }
  }

  // Name normalization (for training data)
  if (sourceData.name || sourceData.employee_name) {
    const nameField = sourceData.name || sourceData.employee_name;
    const normalized = normalizeName(nameField);
    if (normalized !== nameField) {
      logs.push({
        field: 'name',
        original: nameField,
        transformed: normalized,
        type: 'name_normalization',
      });
      if (sourceData.name) transformed.name = normalized;
      if (sourceData.employee_name) transformed.employee_name = normalized;
    }
  }

  // Location parsing (for incidents)
  if (sourceData.location) {
    const parsed = parseLocation(sourceData.location);
    if (parsed && parsed.formatted !== sourceData.location) {
      logs.push({
        field: 'location',
        original: sourceData.location,
        transformed: parsed.formatted,
        type: 'location_parsing',
      });
      transformed.location = parsed.formatted;
    }
  }

  return { transformed, logs };
}
