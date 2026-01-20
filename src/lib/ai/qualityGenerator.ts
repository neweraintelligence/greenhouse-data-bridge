// Quality/Compliance data generator for Big Marble Farms
// Generates realistic COA, receiving log, and compliance data with planted errors for demo

// Suppliers of inputs for greenhouse operations
const SUPPLIERS = [
  { id: 'SUP-001', name: 'GreenGrow Solutions', type: 'fertilizer', reliability: 0.95 },
  { id: 'SUP-002', name: 'AgroChem Canada', type: 'chemicals', reliability: 0.88 },
  { id: 'SUP-003', name: 'NutriBlend Corp', type: 'fertilizer', reliability: 0.92 },
  { id: 'SUP-004', name: 'BioControl Systems', type: 'biocontrols', reliability: 0.97 },
  { id: 'SUP-005', name: 'PackTech Industries', type: 'packaging', reliability: 0.90 },
  { id: 'SUP-006', name: 'Prairie Substrates', type: 'growing_media', reliability: 0.85 },
];

// Materials received at BMG (relevant to greenhouse produce operations)
const MATERIALS = [
  { sku: 'FERT-NPK-20-20-20', name: '20-20-20 NPK Fertilizer', category: 'fertilizer', unit: 'kg', shelf_life_weeks: 52 },
  { sku: 'FERT-CA-NITRATE', name: 'Calcium Nitrate', category: 'fertilizer', unit: 'kg', shelf_life_weeks: 52 },
  { sku: 'FERT-MG-SULFATE', name: 'Magnesium Sulfate (Epsom)', category: 'fertilizer', unit: 'kg', shelf_life_weeks: 104 },
  { sku: 'PEST-BT-KURSTAKI', name: 'Bacillus thuringiensis (Bt)', category: 'biocontrol', unit: 'L', shelf_life_weeks: 26 },
  { sku: 'PEST-NEEMOIL-1L', name: 'Neem Oil Concentrate', category: 'pesticide', unit: 'L', shelf_life_weeks: 52 },
  { sku: 'SANI-OXYL-5L', name: 'Oxygenated Sanitizer', category: 'sanitizer', unit: 'L', shelf_life_weeks: 26 },
  { sku: 'MEDIA-COCO-3CF', name: 'Coco Coir Substrate (3 cu ft)', category: 'growing_media', unit: 'bag', shelf_life_weeks: 156 },
  { sku: 'PACK-CLAM-454G', name: 'Clamshell Container 454g', category: 'packaging', unit: 'case', shelf_life_weeks: null },
  { sku: 'PACK-LABEL-TOMATO', name: 'Tomato Product Labels', category: 'packaging', unit: 'roll', shelf_life_weeks: null },
];

// Test parameters for COA (Certificate of Analysis)
const COA_TEST_PARAMS = {
  fertilizer: [
    { test: 'Nitrogen (N)', unit: '%', min: 19.5, max: 20.5, typical: 20.0 },
    { test: 'Phosphorus (P)', unit: '%', min: 19.5, max: 20.5, typical: 20.0 },
    { test: 'Potassium (K)', unit: '%', min: 19.5, max: 20.5, typical: 20.0 },
    { test: 'Heavy Metals (Pb)', unit: 'ppm', min: 0, max: 10, typical: 2 },
    { test: 'Moisture Content', unit: '%', min: 0, max: 2, typical: 0.5 },
  ],
  biocontrol: [
    { test: 'Viable Spore Count', unit: 'CFU/mL', min: 1e9, max: 5e9, typical: 3e9 },
    { test: 'Contaminant Count', unit: 'CFU/mL', min: 0, max: 100, typical: 10 },
    { test: 'pH', unit: '', min: 6.0, max: 7.5, typical: 6.8 },
  ],
  pesticide: [
    { test: 'Active Ingredient Azadirachtin', unit: '%', min: 0.9, max: 1.1, typical: 1.0 },
    { test: 'Microbial Count', unit: 'CFU/mL', min: 0, max: 1000, typical: 50 },
  ],
  sanitizer: [
    { test: 'Active Oxygen', unit: '%', min: 4.5, max: 5.5, typical: 5.0 },
    { test: 'pH', unit: '', min: 2.0, max: 4.0, typical: 3.0 },
    { test: 'Heavy Metals', unit: 'ppm', min: 0, max: 5, typical: 1 },
  ],
  growing_media: [
    { test: 'pH', unit: '', min: 5.5, max: 6.5, typical: 6.0 },
    { test: 'EC (Electrical Conductivity)', unit: 'mS/cm', min: 0.3, max: 0.8, typical: 0.5 },
    { test: 'Moisture Content', unit: '%', min: 8, max: 12, typical: 10 },
    { test: 'Pathogen Screen (E. coli)', unit: 'CFU/g', min: 0, max: 0, typical: 0 },
  ],
  packaging: [],
};

export interface GeneratedReceivingEntry {
  receiving_id: string;
  received_date: string;
  supplier_id: string;
  supplier_name: string;
  sku: string;
  material_name: string;
  lot_number: string;
  quantity: number;
  unit: string;
  po_number: string;
  receiver_name: string;
  notes: string;
}

export interface GeneratedCOAEntry {
  coa_id: string;
  receiving_id: string;
  lot_number: string;
  supplier_name: string;
  material_name: string;
  manufacture_date: string;
  expiry_date: string;
  test_results: Array<{
    test: string;
    result: number | string;
    unit: string;
    min_spec: number | string;
    max_spec: number | string;
    status: 'pass' | 'fail';
  }>;
  overall_status: 'pass' | 'fail' | 'pending_review';
  coa_received: boolean;
  shelf_life_weeks: number | null;
}

export interface QualityPlantedError {
  receiving_id: string;
  type: 'short_shelf_life' | 'missing_coa' | 'failed_test' | 'expired_material';
  severity: 'medium' | 'high' | 'critical';
  description: string;
  canadagap_section: string;
  recommendedAction: string;
}

export interface GeneratedQualityScenario {
  receivingLog: GeneratedReceivingEntry[];
  coaRecords: GeneratedCOAEntry[];
  plantedErrors: QualityPlantedError[];
}

function generateLotNumber(date: Date, supplier: string): string {
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const supplierCode = supplier.substring(0, 3).toUpperCase();
  const seq = Math.floor(Math.random() * 900) + 100;
  return `${supplierCode}${dateStr}-${seq}`;
}

function generatePONumber(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `BMG-PO-${year}-${seq}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

export function generateQualityScenario(): GeneratedQualityScenario {
  const receivingLog: GeneratedReceivingEntry[] = [];
  const coaRecords: GeneratedCOAEntry[] = [];
  const plantedErrors: QualityPlantedError[] = [];

  const receivers = ['J. Nguyen', 'R. Patel', 'A. Chen', 'M. Santos'];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 7); // Start from a week ago

  let receivingCounter = 1;

  // Generate 6-8 receiving entries
  const numEntries = 6 + Math.floor(Math.random() * 3);

  // Select which entry gets which planted error
  const shortShelfLifeIndex = 1; // Second entry
  const missingCOAIndex = 3; // Fourth entry
  const failedTestIndex = 5; // Sixth entry (if it exists)

  for (let i = 0; i < numEntries; i++) {
    const supplier = SUPPLIERS[Math.floor(Math.random() * SUPPLIERS.length)];
    const material = MATERIALS.filter(m =>
      m.category !== 'packaging' || supplier.type === 'packaging'
    )[Math.floor(Math.random() * MATERIALS.length)];

    const receivedDate = addDays(baseDate, i);
    const manufactureDate = addDays(receivedDate, -30 - Math.floor(Math.random() * 60));
    const lotNumber = generateLotNumber(manufactureDate, supplier.name);
    const receivingId = `RCV-2025-${String(receivingCounter).padStart(4, '0')}`;
    receivingCounter++;

    // Receiving log entry
    receivingLog.push({
      receiving_id: receivingId,
      received_date: receivedDate.toISOString().split('T')[0],
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      sku: material.sku,
      material_name: material.name,
      lot_number: lotNumber,
      quantity: 10 + Math.floor(Math.random() * 90),
      unit: material.unit,
      po_number: generatePONumber(),
      receiver_name: receivers[Math.floor(Math.random() * receivers.length)],
      notes: '',
    });

    // Generate COA (or mark as missing)
    const isMissingCOA = i === missingCOAIndex;

    if (isMissingCOA) {
      // Missing COA - critical compliance issue
      coaRecords.push({
        coa_id: `COA-${receivingId}`,
        receiving_id: receivingId,
        lot_number: lotNumber,
        supplier_name: supplier.name,
        material_name: material.name,
        manufacture_date: manufactureDate.toISOString().split('T')[0],
        expiry_date: material.shelf_life_weeks
          ? addWeeks(manufactureDate, material.shelf_life_weeks).toISOString().split('T')[0]
          : 'N/A',
        test_results: [],
        overall_status: 'pending_review',
        coa_received: false,
        shelf_life_weeks: material.shelf_life_weeks,
      });

      plantedErrors.push({
        receiving_id: receivingId,
        type: 'missing_coa',
        severity: 'critical',
        description: `No COA received for ${material.name} (Lot: ${lotNumber}) from ${supplier.name}. Material cannot be used until documentation is received.`,
        canadagap_section: '4.3.2',
        recommendedAction: 'Contact supplier immediately to request COA. Quarantine material until documentation received.',
      });
    } else {
      // Generate COA with test results
      const category = material.category as keyof typeof COA_TEST_PARAMS;
      const testParams = COA_TEST_PARAMS[category] || [];

      const isShortShelfLife = i === shortShelfLifeIndex;
      const isFailedTest = i === failedTestIndex && testParams.length > 0;

      // Calculate expiry based on planted error or normal
      let expiryDate: Date;
      if (isShortShelfLife && material.shelf_life_weeks) {
        // Planted error: Only 8 weeks remaining instead of required 12
        expiryDate = addWeeks(receivedDate, 8);
      } else if (material.shelf_life_weeks) {
        expiryDate = addWeeks(manufactureDate, material.shelf_life_weeks);
      } else {
        expiryDate = addWeeks(receivedDate, 52); // Default 1 year for non-perishables
      }

      // Generate test results
      const testResults = testParams.map((param, testIndex) => {
        let result: number;
        let status: 'pass' | 'fail';

        if (isFailedTest && testIndex === 0) {
          // First test fails - out of spec
          if (typeof param.max === 'number' && param.max < 100) {
            result = param.max * 1.5; // 50% over max spec
          } else if (typeof param.min === 'number') {
            result = param.min * 0.5; // 50% under min spec
          } else {
            result = param.typical * 2;
          }
          status = 'fail';
        } else {
          // Normal variation around typical
          const variation = (Math.random() - 0.5) * 0.1 * param.typical;
          result = param.typical + variation;
          status = result >= param.min && result <= param.max ? 'pass' : 'fail';
        }

        // Format large numbers
        const formattedResult = result > 1e6
          ? result.toExponential(1)
          : Math.round(result * 100) / 100;

        return {
          test: param.test,
          result: formattedResult,
          unit: param.unit,
          min_spec: param.min,
          max_spec: param.max,
          status,
        };
      });

      const hasFailedTest = testResults.some(t => t.status === 'fail');

      coaRecords.push({
        coa_id: `COA-${receivingId}`,
        receiving_id: receivingId,
        lot_number: lotNumber,
        supplier_name: supplier.name,
        material_name: material.name,
        manufacture_date: manufactureDate.toISOString().split('T')[0],
        expiry_date: expiryDate.toISOString().split('T')[0],
        test_results: testResults,
        overall_status: hasFailedTest ? 'fail' : 'pass',
        coa_received: true,
        shelf_life_weeks: material.shelf_life_weeks,
      });

      // Add planted errors
      if (isShortShelfLife) {
        plantedErrors.push({
          receiving_id: receivingId,
          type: 'short_shelf_life',
          severity: 'high',
          description: `${material.name} (Lot: ${lotNumber}) expires in 8 weeks. CanadaGAP requires minimum 12 weeks remaining shelf life at time of receipt.`,
          canadagap_section: '4.5.1',
          recommendedAction: 'Request replacement or credit from supplier. Use material first if production schedule allows.',
        });
      }

      if (isFailedTest && testResults.length > 0) {
        const failedTest = testResults.find(t => t.status === 'fail')!;
        plantedErrors.push({
          receiving_id: receivingId,
          type: 'failed_test',
          severity: 'critical',
          description: `${material.name} (Lot: ${lotNumber}) failed ${failedTest.test} test. Result: ${failedTest.result} ${failedTest.unit} (Spec: ${failedTest.min_spec}-${failedTest.max_spec})`,
          canadagap_section: '4.3.1',
          recommendedAction: 'Reject material and return to supplier. Do not use in production. Document rejection.',
        });
      }
    }
  }

  return {
    receivingLog,
    coaRecords,
    plantedErrors,
  };
}

// Alias for consistency with orderGenerator
export { generateQualityScenario as generateDeterministicQualityScenario };
