import { useState, useEffect, useRef } from 'react';
import { Camera, Image, AlertCircle, Loader2, Check, AlertTriangle, MapPin, Clock, User, FileText, ChevronRight, ChevronLeft } from 'lucide-react';
import { listIncidentPhotos, uploadIncidentPhoto, type IncidentPhoto } from '../../lib/storage/incidentPhotos';
import { analyzeIncidentPhoto, type IncidentAnalysisResult } from '../../lib/ai/incidentAnalyzer';
import { supabase } from '../../lib/supabase';

// Greenhouse location options for Big Marble Farms
const LOCATION_OPTIONS = [
  { value: '', label: 'Select location...' },
  { value: 'zone1-row1-4', label: 'Zone 1 - Rows 1-4 (Tomatoes)' },
  { value: 'zone1-row5-8', label: 'Zone 1 - Rows 5-8 (Peppers)' },
  { value: 'zone2-row1-4', label: 'Zone 2 - Rows 1-4 (Cucumbers)' },
  { value: 'zone2-row5-8', label: 'Zone 2 - Rows 5-8 (Lettuce)' },
  { value: 'zone3-row1-6', label: 'Zone 3 - Rows 1-6 (Herbs)' },
  { value: 'packhouse-station1', label: 'Pack House - Station 1' },
  { value: 'packhouse-station2', label: 'Pack House - Station 2' },
  { value: 'packhouse-station3', label: 'Pack House - Station 3' },
  { value: 'receiving-dock', label: 'Receiving Dock' },
  { value: 'shipping-dock', label: 'Shipping Dock' },
  { value: 'cold-storage', label: 'Cold Storage' },
  { value: 'equipment-room', label: 'Equipment Room' },
  { value: 'breakroom', label: 'Break Room' },
  { value: 'office', label: 'Office Area' },
  { value: 'parking', label: 'Parking Lot' },
  { value: 'other', label: 'Other (specify in notes)' },
];

type FormStep = 'info' | 'photo' | 'review';

interface IncidentPhotoReporterProps {
  sessionCode: string;
  participantName: string;
  onComplete: () => void;
}

export function IncidentPhotoReporter({
  sessionCode,
  participantName,
  onComplete,
}: IncidentPhotoReporterProps) {
  // Form state
  const [formStep, setFormStep] = useState<FormStep>('info');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [reportTime] = useState(new Date());

  // Photo state
  const [photos, setPhotos] = useState<IncidentPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<IncidentAnalysisResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    const photoList = await listIncidentPhotos();
    setPhotos(photoList);
  };

  const handleSelectPhoto = async (photoUrl: string) => {
    setSelectedPhoto(photoUrl);
    setCapturedPhoto(null);
    setAnalysisResult(null);
    setError(null);
    setFormStep('review');

    // Auto-analyze the selected photo
    await analyzePhoto(photoUrl);
  };

  const handleCapturePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const photoData = event.target?.result as string;
        setCapturedPhoto(photoData);
        setSelectedPhoto(null);
        setAnalysisResult(null);
        setError(null);
        setFormStep('review');

        // Auto-analyze the captured photo
        await analyzePhoto(photoData);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzePhoto = async (photoUrl: string) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // If it's a URL, fetch it and convert to base64
      let photoData: string;
      if (photoUrl.startsWith('http')) {
        const response = await fetch(photoUrl);
        const blob = await response.blob();
        photoData = await blobToBase64(blob);
      } else {
        photoData = photoUrl;
      }

      const result = await analyzeIncidentPhoto(photoData);
      setAnalysisResult(result);

      if (!result.isIncident) {
        // Show dismissal message
        setError(result.dismissalReason || 'This does not appear to be an incident.');
      }
    } catch (err) {
      console.error('Error analyzing photo:', err);
      setError('Failed to analyze photo. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSubmit = async () => {
    if (!analysisResult || !analysisResult.isIncident) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Upload photo if it's a captured one
      let photoUrl = selectedPhoto;
      if (capturedPhoto && !selectedPhoto) {
        const fileName = `incident-${Date.now()}.jpg`;
        const uploadedUrl = await uploadIncidentPhoto(sessionCode, capturedPhoto, fileName);
        if (uploadedUrl) {
          photoUrl = uploadedUrl;
        }
      }

      // Get the friendly location label
      const locationLabel = LOCATION_OPTIONS.find(opt => opt.value === location)?.label || location || analysisResult.location;

      // Combine user notes with AI description
      const fullDescription = description
        ? `Reporter Notes: ${description}\n\nAI Analysis: ${analysisResult.description}`
        : analysisResult.description;

      // Save incident to database
      const { error: insertError } = await supabase.from('incidents').insert({
        session_code: sessionCode,
        incident_type: analysisResult.incident_type,
        severity: analysisResult.severity,
        location: locationLabel,
        description: fullDescription,
        reported_by: participantName,
        status: analysisResult.needsEscalation ? 'Escalated' : 'Open',
        photo_url: photoUrl,
        ai_confidence: analysisResult.confidence,
        reported_at: reportTime.toISOString(),
      });

      if (insertError) throw insertError;

      onComplete();
    } catch (err) {
      console.error('Error submitting incident:', err);
      setError('Failed to submit incident. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const photoToDisplay = capturedPhoto || selectedPhoto;

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Check if form info is valid to proceed
  const canProceedToPhoto = location !== '';

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
          formStep === 'info' ? 'bg-bmf-blue text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">1</span>
          <span>Info</span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
          formStep === 'photo' ? 'bg-bmf-blue text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">2</span>
          <span>Photo</span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
          formStep === 'review' ? 'bg-bmf-blue text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">3</span>
          <span>Review</span>
        </div>
      </div>

      {/* STEP 1: Incident Information Form */}
      {formStep === 'info' && (
        <div className="space-y-5">
          <h3 className="text-lg font-semibold text-gray-800">Report an Incident</h3>

          {/* Reporter info (read-only) */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-bmf-blue flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Reporting as</p>
                <p className="font-semibold text-gray-800">{participantName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Report Time</p>
                <p className="font-medium text-gray-700">{formatTime(reportTime)}</p>
              </div>
            </div>
          </div>

          {/* Location selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1 text-gray-500" />
              Where did this occur? <span className="text-red-500">*</span>
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-bmf-blue focus:outline-none bg-white text-gray-800"
            >
              {LOCATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Description (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1 text-gray-500" />
              Additional Notes <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you observed... (AI will also analyze the photo)"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-bmf-blue focus:outline-none resize-none"
            />
          </div>

          {/* Next button */}
          <button
            onClick={() => setFormStep('photo')}
            disabled={!canProceedToPhoto}
            className="w-full py-3 px-4 bg-bmf-blue hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            Continue to Photo
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* STEP 2: Photo selection/capture */}
      {formStep === 'photo' && !photoToDisplay && (
        <div className="space-y-4">
          {/* Back button */}
          <button
            onClick={() => setFormStep('info')}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Back to info</span>
          </button>

          <h3 className="text-lg font-semibold text-gray-800">Add Photo Evidence</h3>
          <p className="text-sm text-gray-500">
            Take a photo or select from your gallery. AI will analyze the image to identify the incident type and severity.
          </p>

          {/* Camera button - iPhone style */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-5 px-4 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 transition-all flex items-center justify-center gap-3 text-white shadow-lg"
          >
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Camera className="w-6 h-6" />
            </div>
            <div className="text-left">
              <span className="font-semibold text-lg">Take Photo</span>
              <p className="text-xs text-gray-300">Open camera to capture incident</p>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCapturePhoto}
            className="hidden"
          />

          {/* Photo gallery - iPhone style grid */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Image className="w-4 h-4" />
              Or select from gallery
            </p>
            <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
              {photos.map((photo) => (
                <button
                  key={photo.name}
                  onClick={() => handleSelectPhoto(photo.publicUrl)}
                  className="relative aspect-square overflow-hidden group"
                >
                  <img
                    src={photo.publicUrl}
                    alt={photo.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Check className="w-5 h-5 text-bmf-blue" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {photos.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No photos in gallery</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: Photo preview and AI analysis */}
      {(formStep === 'photo' || formStep === 'review') && photoToDisplay && (
        <div className="space-y-4">
          {/* Back button */}
          <button
            onClick={() => {
              setSelectedPhoto(null);
              setCapturedPhoto(null);
              setAnalysisResult(null);
              setFormStep('photo');
            }}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Choose different photo</span>
          </button>

          {/* Summary of form info */}
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{participantName}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{LOCATION_OPTIONS.find(opt => opt.value === location)?.label}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{formatTime(reportTime)}</span>
              </div>
            </div>
            {description && (
              <p className="mt-2 text-gray-600 italic">"{description}"</p>
            )}
          </div>

          {/* Photo preview */}
          <div className="relative rounded-xl overflow-hidden">
            <img
              src={photoToDisplay}
              alt="Selected incident"
              className="w-full"
            />
          </div>

          {/* Analysis status */}
          {isAnalyzing && (
            <div className="flex items-center justify-center gap-3 py-6 bg-blue-50 rounded-xl">
              <Loader2 className="w-6 h-6 text-bmf-blue animate-spin" />
              <span className="text-bmf-blue font-medium">AI analyzing photo...</span>
            </div>
          )}

          {/* Analysis result */}
          {analysisResult && (
            <div className="space-y-4">
              {/* False positive / Not an incident */}
              {!analysisResult.isIncident && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertCircle className="w-6 h-6 text-gray-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">Not an Incident</h4>
                      <p className="text-sm text-gray-600">{analysisResult.dismissalReason}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPhoto(null);
                      setCapturedPhoto(null);
                      setAnalysisResult(null);
                      setFormStep('photo');
                    }}
                    className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-all"
                  >
                    Select Different Photo
                  </button>
                </div>
              )}

              {/* Real incident - show details */}
              {analysisResult.isIncident && (
                <div className={`p-4 rounded-xl border-2 ${
                  analysisResult.needsEscalation
                    ? 'bg-red-50 border-red-300'
                    : analysisResult.severity >= 3
                    ? 'bg-orange-50 border-orange-300'
                    : 'bg-yellow-50 border-yellow-300'
                }`}>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <AlertTriangle className={`w-5 h-5 ${
                      analysisResult.needsEscalation
                        ? 'text-red-600'
                        : analysisResult.severity >= 3
                        ? 'text-orange-600'
                        : 'text-yellow-600'
                    }`} />
                    AI Analysis Results
                    {analysisResult.needsEscalation && (
                      <span className="ml-auto text-xs px-2 py-0.5 bg-red-200 text-red-800 rounded-full">
                        Needs Escalation
                      </span>
                    )}
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div className="bg-white/50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Incident Type</p>
                      <p className="font-semibold text-gray-800">{analysisResult.incident_type}</p>
                    </div>
                    <div className="bg-white/50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Severity</p>
                      <p className={`font-semibold ${
                        analysisResult.severity >= 4 ? 'text-red-700' :
                        analysisResult.severity === 3 ? 'text-orange-700' :
                        'text-yellow-700'
                      }`}>
                        {analysisResult.severity}/5 {analysisResult.severity >= 4 ? '(Critical)' : analysisResult.severity === 3 ? '(Moderate)' : '(Minor)'}
                      </p>
                    </div>
                    <div className="bg-white/50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">AI Confidence</p>
                      <p className="font-semibold text-gray-800">{analysisResult.confidence}%</p>
                    </div>
                    <div className="bg-white/50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Detected Location</p>
                      <p className="font-semibold text-gray-800">{analysisResult.location}</p>
                    </div>
                  </div>

                  <div className="bg-white/50 rounded-lg p-3 mb-3">
                    <p className="text-xs text-gray-500 mb-1">AI Description</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{analysisResult.description}</p>
                  </div>

                  {analysisResult.ambiguityNote && (
                    <div className="bg-yellow-100 rounded-lg p-3 mb-3">
                      <p className="text-xs text-yellow-700 mb-1">Review Note</p>
                      <p className="text-sm text-yellow-800">{analysisResult.ambiguityNote}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setSelectedPhoto(null);
                        setCapturedPhoto(null);
                        setAnalysisResult(null);
                        setFormStep('photo');
                      }}
                      className="flex-1 py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl border border-gray-300 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 py-3 px-6 bg-bmf-blue hover:bg-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Submit Report
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error message */}
          {error && !analysisResult && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
