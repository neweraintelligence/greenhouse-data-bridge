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

  // Helper to get product name from SKU
  const getProductName = (sku: string): string => {
    const productMap: Record<string, string> = {
      'CTN-12OZ': 'Petunias',
      'CTN-1LB': 'Tomatoes',
      'BAG-2LB': 'Herbs',
    };
    return productMap[sku] || 'Mixed Produce';
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
