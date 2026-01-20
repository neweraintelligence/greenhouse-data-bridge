import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Check, AlertCircle, Loader2, Plus, Package, User, FileText, AlertTriangle, Mail, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { IncidentPhotoReporter } from '../components/incidents/IncidentPhotoReporter';
import { Toast } from '../components/ui/Toast';

type SourceType = 'shipments_expected' | 'training_roster' | 'incidents' | 'customer_orders' | 'quality_issues' | 'communications' | 'barcode_scans';

export function MobileDataEntry() {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const [searchParams] = useSearchParams();
  const sourceType = searchParams.get('source') as SourceType;
  const nodeName = searchParams.get('node') || 'Unknown Node';

  const [participantName, setParticipantName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitComplete, setSubmitComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Form state for shipments
  const [shipmentData, setShipmentData] = useState({
    shipment_id: '',
    vendor: '',
    destination: '',
    expected_qty: '',
    expected_sku: '',
    ship_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Form state for training
  const [trainingData, setTrainingData] = useState({
    employee_id: '',
    employee_name: '',
    department: '',
    training_type: 'Safety & SOP',
    scheduled_date: new Date().toISOString().split('T')[0],
  });

  // Form state for email/communications
  const [emailData, setEmailData] = useState({
    subject: 'Re: Order Acknowledgment',
    body: '',
  });

  useEffect(() => {
    // Set viewport for mobile
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1');
    }
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantName.trim()) return;

    setIsJoining(true);
    setError(null);

    try {
      // Record participant joining
      const { error: insertError } = await supabase.from('session_participants').insert({
        session_code: sessionCode,
        participant_name: participantName.trim(),
        node_name: nodeName,
        joined_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      setHasJoined(true);
      setToast({
        message: `Welcome, ${participantName}! You've successfully joined.`,
        type: 'success'
      });
    } catch (err) {
      console.error('Join error:', err);
      setError('Failed to join. Please try again.');
      setToast({
        message: 'Failed to join. Please try again.',
        type: 'error'
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleSubmitShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from('shipments_expected').insert({
        session_code: sessionCode,
        shipment_id: shipmentData.shipment_id.toUpperCase(),
        vendor: shipmentData.vendor,
        destination: shipmentData.destination,
        expected_qty: parseInt(shipmentData.expected_qty, 10),
        expected_sku: shipmentData.expected_sku.toUpperCase(),
        ship_date: shipmentData.ship_date,
        notes: shipmentData.notes || null,
        submitted_by: participantName,
      });

      if (insertError) throw insertError;

      setSubmitComplete(true);
      setToast({
        message: '✓ Shipment data submitted successfully!',
        type: 'success'
      });
    } catch (err) {
      console.error('Submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to add shipment. Please try again.');
      setToast({
        message: 'Failed to submit shipment. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from('training_roster').insert({
        session_code: sessionCode,
        employee_id: trainingData.employee_id.toUpperCase(),
        name: trainingData.employee_name,
        department: trainingData.department,
        submitted_by: participantName,
      });

      if (insertError) throw insertError;

      setSubmitComplete(true);
      setToast({
        message: '✓ Training record submitted successfully!',
        type: 'success'
      });
    } catch (err) {
      console.error('Submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to add training record. Please try again.');
      setToast({
        message: 'Failed to submit training record. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from('communications_log').insert({
        session_code: sessionCode,
        comm_type: 'email',
        recipient: 'customer@example.com',
        subject: emailData.subject,
        body: `${emailData.body}\n\nBest regards,\n${participantName}`,
        sent_at: new Date().toISOString(),
        submitted_by: participantName,
      });

      if (insertError) throw insertError;

      setSubmitComplete(true);
      setToast({
        message: '✓ Email sent successfully!',
        type: 'success'
      });
    } catch (err) {
      console.error('Submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send email. Please try again.');
      setToast({
        message: 'Failed to send email. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitComplete(false);
    setError(null);
    // Reset forms
    if (sourceType === 'shipments_expected') {
      setShipmentData({
        shipment_id: '',
        vendor: '',
        destination: '',
        expected_qty: '',
        expected_sku: '',
        ship_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    } else if (sourceType === 'training_roster') {
      setTrainingData({
        employee_id: '',
        employee_name: '',
        department: '',
        training_type: 'Safety & SOP',
        scheduled_date: new Date().toISOString().split('T')[0],
      });
    } else if (sourceType === 'communications') {
      setEmailData({
        subject: 'Re: Order Acknowledgment',
        body: '',
      });
    }
  };

  if (!sessionCode || !sourceType) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 shadow-lg text-center max-w-sm w-full">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Invalid Link</h1>
          <p className="text-gray-600">
            This data entry link is not valid. Please scan a new QR code from the application.
          </p>
        </div>
      </div>
    );
  }

  if (submitComplete) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 shadow-lg text-center max-w-sm w-full">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Added Successfully!</h1>
          <p className="text-gray-600 mb-4">
            Your data has been sent to the live session. Check the main screen to see your entry.
          </p>
          <button
            onClick={handleReset}
            className="text-bmf-blue font-medium hover:underline"
          >
            Add another entry
          </button>
        </div>
      </div>
    );
  }

  // Render form based on source type
  const renderForm = () => {
    switch (sourceType) {
      case 'shipments_expected':
        return (
          <form onSubmit={handleSubmitShipment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shipment ID *
              </label>
              <input
                type="text"
                value={shipmentData.shipment_id}
                onChange={(e) => setShipmentData({ ...shipmentData, shipment_id: e.target.value })}
                placeholder="SHP-0001"
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bmf-blue/20 focus:border-bmf-blue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor *
              </label>
              <input
                type="text"
                value={shipmentData.vendor}
                onChange={(e) => setShipmentData({ ...shipmentData, vendor: e.target.value })}
                placeholder="Nature's Pride"
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bmf-blue/20 focus:border-bmf-blue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination *
              </label>
              <input
                type="text"
                value={shipmentData.destination}
                onChange={(e) => setShipmentData({ ...shipmentData, destination: e.target.value })}
                placeholder="Distribution Center A"
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bmf-blue/20 focus:border-bmf-blue"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  value={shipmentData.expected_qty}
                  onChange={(e) => setShipmentData({ ...shipmentData, expected_qty: e.target.value })}
                  placeholder="500"
                  required
                  min="1"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bmf-blue/20 focus:border-bmf-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU *
                </label>
                <input
                  type="text"
                  value={shipmentData.expected_sku}
                  onChange={(e) => setShipmentData({ ...shipmentData, expected_sku: e.target.value })}
                  placeholder="CTN-12OZ"
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bmf-blue/20 focus:border-bmf-blue"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ship Date *
              </label>
              <input
                type="date"
                value={shipmentData.ship_date}
                onChange={(e) => setShipmentData({ ...shipmentData, ship_date: e.target.value })}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-bmf-blue/20 focus:border-bmf-blue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={shipmentData.notes}
                onChange={(e) => setShipmentData({ ...shipmentData, notes: e.target.value })}
                placeholder="Optional notes..."
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bmf-blue/20 focus:border-bmf-blue resize-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-bmf-blue text-white font-medium hover:bg-bmf-blue-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Add Shipment
                </>
              )}
            </button>
          </form>
        );

      case 'training_roster':
        return (
          <form onSubmit={handleSubmitTraining} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee ID *
              </label>
              <input
                type="text"
                value={trainingData.employee_id}
                onChange={(e) => setTrainingData({ ...trainingData, employee_id: e.target.value })}
                placeholder="BM-1001"
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bmf-blue/20 focus:border-bmf-blue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee Name *
              </label>
              <input
                type="text"
                value={trainingData.employee_name}
                onChange={(e) => setTrainingData({ ...trainingData, employee_name: e.target.value })}
                placeholder="John Doe"
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bmf-blue/20 focus:border-bmf-blue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department *
              </label>
              <select
                value={trainingData.department}
                onChange={(e) => setTrainingData({ ...trainingData, department: e.target.value })}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-bmf-blue/20 focus:border-bmf-blue"
              >
                <option value="">Select department...</option>
                <option value="Growing">Growing</option>
                <option value="Harvesting">Harvesting</option>
                <option value="Packing">Packing</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Quality Control">Quality Control</option>
                <option value="Shipping">Shipping</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Training Type *
              </label>
              <select
                value={trainingData.training_type}
                onChange={(e) => setTrainingData({ ...trainingData, training_type: e.target.value })}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-bmf-blue/20 focus:border-bmf-blue"
              >
                <option value="Safety & SOP">Safety & SOP</option>
                <option value="Equipment Operation">Equipment Operation</option>
                <option value="Quality Standards">Quality Standards</option>
                <option value="Emergency Procedures">Emergency Procedures</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scheduled Date *
              </label>
              <input
                type="date"
                value={trainingData.scheduled_date}
                onChange={(e) => setTrainingData({ ...trainingData, scheduled_date: e.target.value })}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-bmf-blue/20 focus:border-bmf-blue"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-bmf-blue text-white font-medium hover:bg-bmf-blue-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Add Training Record
                </>
              )}
            </button>
          </form>
        );

      case 'incidents':
        return (
          <IncidentPhotoReporter
            sessionCode={sessionCode!}
            participantName={participantName}
            onComplete={() => {
              setSubmitComplete(true);
            }}
          />
        );

      case 'communications':
        return (
          <form onSubmit={handleSubmitEmail} className="space-y-4">
            {/* Pre-filled context */}
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-xs text-blue-600 font-medium mb-1">Responding to:</p>
              <p className="text-sm text-gray-700">Customer inquiry about order status</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bmf-blue/20 focus:border-bmf-blue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Message *
              </label>
              <textarea
                value={emailData.body}
                onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                placeholder="Thank you for your inquiry. I've reviewed your order and can confirm..."
                required
                rows={5}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bmf-blue/20 focus:border-bmf-blue resize-none"
              />
            </div>

            {/* Signature preview */}
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Signature:</p>
              <p className="text-sm text-gray-700">Best regards,</p>
              <p className="text-sm font-medium text-gray-800">{participantName}</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-bmf-blue text-white font-medium hover:bg-bmf-blue-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Email
                </>
              )}
            </button>
          </form>
        );

      default:
        return (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <p className="text-gray-600">
              Data entry for this source type is not yet available.
            </p>
          </div>
        );
    }
  };

  // Get title and icon based on source type
  const getSourceInfo = () => {
    switch (sourceType) {
      case 'shipments_expected':
        return { title: 'Add Shipment', icon: Package };
      case 'training_roster':
        return { title: 'Add Training Record', icon: User };
      case 'incidents':
        return { title: 'Report Incident', icon: AlertTriangle };
      case 'customer_orders':
        return { title: 'Add Customer Order', icon: FileText };
      case 'quality_issues':
        return { title: 'Report Quality Issue', icon: AlertCircle };
      case 'communications':
        return { title: 'Send Response', icon: Mail };
      default:
        return { title: 'Add Data', icon: Plus };
    }
  };

  const { title, icon: Icon } = getSourceInfo();

  // Show name entry screen first if not joined yet
  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-6">
            <img
              src="/bmf-logo.png"
              alt="Big Marble Farms"
              className="h-12 mx-auto mb-4"
            />
            <div className="flex items-center justify-center gap-2 mb-2">
              <Icon className="w-7 h-7 text-bmf-blue" />
              <h1 className="text-2xl font-semibold text-gray-800">Join Activity</h1>
            </div>
            <p className="text-gray-600 mb-1">{nodeName}</p>
            <p className="text-sm text-gray-500">
              Session: <span className="font-mono">{sessionCode}</span>
            </p>
          </div>

          {/* Name entry form */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What's your name?
                </label>
                <input
                  type="text"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bmf-blue/20 focus:border-bmf-blue"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isJoining || !participantName.trim()}
                className="w-full py-3 px-4 rounded-xl bg-bmf-blue text-white font-semibold hover:bg-bmf-blue-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <User className="w-5 h-5" />
                    Join Session
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Info */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Your participation will be visible to the presenter</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 p-4">
      <div className="max-w-sm mx-auto">
        {/* Header */}
        <div className="text-center mb-6 pt-4">
          <img
            src="/bmf-logo.png"
            alt="Big Marble Farms"
            className="h-10 mx-auto mb-3"
          />
          <div className="flex items-center justify-center gap-2 mb-2">
            <Icon className="w-6 h-6 text-bmf-blue" />
            <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
          </div>
          <p className="text-xs text-gray-500 mb-1">
            Welcome, <span className="font-medium text-gray-700">{participantName}</span>!
          </p>
          <p className="text-xs text-gray-500">
            Session: <span className="font-mono">{sessionCode}</span>
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          {renderForm()}
        </div>

        {/* Info */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Your entry will appear live on the main screen</p>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
