import { useState, useEffect, useRef } from 'react';
import { Camera, Image, AlertCircle, Loader2, Check, X, AlertTriangle } from 'lucide-react';
import { listIncidentPhotos, uploadIncidentPhoto, type IncidentPhoto } from '../../lib/storage/incidentPhotos';
import { analyzeIncidentPhoto, type IncidentAnalysisResult } from '../../lib/ai/incidentAnalyzer';
import { supabase } from '../../lib/supabase';

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

      // Save incident to database
      const { error: insertError } = await supabase.from('incidents').insert({
        session_code: sessionCode,
        incident_type: analysisResult.incident_type,
        severity: analysisResult.severity,
        location: analysisResult.location,
        description: analysisResult.description,
        reported_by: participantName,
        status: analysisResult.needsEscalation ? 'Escalated' : 'Open',
        photo_url: photoUrl,
        ai_confidence: analysisResult.confidence,
        reported_at: new Date().toISOString(),
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

  return (
    <div className="space-y-6">
      {/* Photo selection/capture */}
      {!photoToDisplay && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Select an incident photo</h3>

          {/* Camera button */}
          <div className="flex gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-4 px-4 rounded-xl border-2 border-gray-300 hover:border-bmf-blue hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-gray-700"
            >
              <Camera className="w-5 h-5" />
              <span className="font-medium">Take Photo</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCapturePhoto}
              className="hidden"
            />
          </div>

          {/* Photo gallery */}
          <div>
            <p className="text-sm text-gray-500 mb-3">Or select from gallery:</p>
            <div className="grid grid-cols-2 gap-3">
              {photos.map((photo) => (
                <button
                  key={photo.name}
                  onClick={() => handleSelectPhoto(photo.publicUrl)}
                  className="relative aspect-video rounded-lg overflow-hidden border-2 border-gray-200 hover:border-bmf-blue transition-all"
                >
                  <img
                    src={photo.publicUrl}
                    alt={photo.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center">
                    <Image className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Photo preview and analysis */}
      {photoToDisplay && (
        <div className="space-y-4">
          {/* Photo preview */}
          <div className="relative">
            <img
              src={photoToDisplay}
              alt="Selected incident"
              className="w-full rounded-xl"
            />
            {!isAnalyzing && !analysisResult && (
              <button
                onClick={() => {
                  setSelectedPhoto(null);
                  setCapturedPhoto(null);
                  setAnalysisResult(null);
                }}
                className="absolute top-2 right-2 p-2 rounded-full bg-gray-900/50 hover:bg-gray-900/70 text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Analysis status */}
          {isAnalyzing && (
            <div className="flex items-center justify-center gap-3 py-6 bg-blue-50 rounded-xl">
              <Loader2 className="w-6 h-6 text-bmf-blue animate-spin" />
              <span className="text-bmf-blue font-medium">Analyzing photo with AI...</span>
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
                  <div className="flex items-start gap-3 mb-4">
                    <AlertTriangle className={`w-6 h-6 shrink-0 mt-0.5 ${
                      analysisResult.needsEscalation
                        ? 'text-red-600'
                        : analysisResult.severity >= 3
                        ? 'text-orange-600'
                        : 'text-yellow-600'
                    }`} />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 mb-1">
                        {analysisResult.incident_type} Incident
                        {analysisResult.needsEscalation && (
                          <span className="ml-2 text-xs px-2 py-0.5 bg-red-200 text-red-800 rounded-full">
                            Needs Escalation
                          </span>
                        )}
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Severity:</span>{' '}
                          <span className={`font-semibold ${
                            analysisResult.severity >= 4 ? 'text-red-700' :
                            analysisResult.severity === 3 ? 'text-orange-700' :
                            'text-yellow-700'
                          }`}>
                            {analysisResult.severity}/5
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Location:</span>{' '}
                          <span className="text-gray-800">{analysisResult.location}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">AI Confidence:</span>{' '}
                          <span className="text-gray-800">{analysisResult.confidence}%</span>
                        </div>
                        <div className="pt-2">
                          <span className="font-medium text-gray-700">Description:</span>
                          <p className="text-gray-700 mt-1 leading-relaxed">{analysisResult.description}</p>
                        </div>
                        {analysisResult.ambiguityNote && (
                          <div className="pt-2 border-t border-gray-300">
                            <span className="font-medium text-gray-700">Review Note:</span>
                            <p className="text-gray-700 mt-1">{analysisResult.ambiguityNote}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedPhoto(null);
                        setCapturedPhoto(null);
                        setAnalysisResult(null);
                      }}
                      className="flex-1 py-2 px-4 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-2 py-2 px-6 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Reporting...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Report Incident
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
