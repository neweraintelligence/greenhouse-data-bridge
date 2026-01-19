import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PrintableLabels } from '../components/PrintableLabels';
import { supabase } from '../lib/supabase';
import { Loader2, AlertCircle } from 'lucide-react';

export function PrintLabels() {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const [shipments, setShipments] = useState<Array<{shipment_id: string; product_name: string; sku: string; expected_qty: number}>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShipments = async () => {
      if (!sessionCode) return;

      try {
        const { data, error: fetchError } = await supabase
          .from('shipments_expected')
          .select('shipment_id, vendor, expected_sku, expected_qty')
          .eq('session_code', sessionCode)
          .limit(4); // Only first 4 for demo

        if (fetchError) throw fetchError;

        // Map to printable format with product names
        const mapped = (data || []).map(s => ({
          shipment_id: s.shipment_id,
          product_name: getProductName(s.expected_sku),
          sku: s.expected_sku,
          expected_qty: s.expected_qty,
        }));

        setShipments(mapped);
      } catch (err) {
        console.error('Error fetching shipments:', err);
        setError('Failed to load shipments');
      } finally {
        setLoading(false);
      }
    };

    fetchShipments();
  }, [sessionCode]);

  // Helper to get product name from SKU (realistic greenhouse products)
  const getProductName = (sku: string): string => {
    const productMap: Record<string, string> = {
      // Outbound - Bedding Plants
      'PET-WAVE-606-PUR': 'Wave Petunia Purple (606 pack)',
      'PET-WAVE-606-PINK': 'Wave Petunia Pink (606 pack)',
      'PET-STVB-606-PINK': 'Supertunia Vista Bubblegum - PINK (606 pack)',
      'PET-STVB-606-PUR': 'Supertunia Vista Bubblegum - PURPLE (606 pack)', // Wrong color variant
      'GER-ZON-45-RED': 'Zonal Geranium Red (4.5" pot)',
      'GER-IVY-HB10-MIX': 'Ivy Geranium Mix (10" hanging basket)',
      'CAL-SBMG-1801-GRAPE': 'Superbells Magic Grapefruit (1801 pack)',
      'TOM-CEL-1204': 'Celebrity Tomato (1204 pack)',
      'BAS-SWT-804': 'Sweet Basil (804 pack)',
      'PET-WAVE-HB10-PUR': 'Wave Petunia Purple (10" hanging basket)',
      'PER-ECHPW-1GAL': 'Echinacea PowWow (1-gallon)',

      // Inbound - Supplies
      'PLUG-288-PETWAVE': 'Petunia Wave Plugs (288-cell tray)',
      'PLUG-288-TOMBF': 'Tomato Big Beef Plugs (288-cell tray)',
      'SUNGRO-PROF-3CF': 'Sun Gro Professional Mix (3 cu ft bag)',
      'JACK-201020-25LB': 'Jack\'s 20-10-20 Fertilizer (25 lb bag)',
      'INS-606-225': '606 Insert Trays (2.25" deep)',
    };
    return productMap[sku] || sku;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-bmf-blue mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading shipment data...</p>
        </div>
      </div>
    );
  }

  if (error || !sessionCode) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Error</h1>
          <p className="text-gray-600">{error || 'Invalid session'}</p>
        </div>
      </div>
    );
  }

  return <PrintableLabels sessionCode={sessionCode} shipments={shipments} />;
}
