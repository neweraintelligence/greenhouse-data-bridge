import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Camera, Upload, Check, AlertCircle, Loader2 } from 'lucide-react';

export function MobileUpload() {
  const { sessionCode, sourceId } = useParams<{ sessionCode: string; sourceId: string }>();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Set viewport for mobile
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1');
    }
  }, []);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target?.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!capturedImage || !sessionCode || !sourceId) return;

    setIsUploading(true);
    setError(null);

    try {
      // Store in localStorage for the main app to pick up
      // In a real app, this would upload to a server
      const uploadKey = `upload_${sessionCode}_${sourceId}`;
      localStorage.setItem(uploadKey, capturedImage);

      // Trigger a storage event for the main app
      window.dispatchEvent(new StorageEvent('storage', {
        key: uploadKey,
        newValue: capturedImage,
      }));

      setUploadComplete(true);
    } catch {
      setError('Failed to upload. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setUploadComplete(false);
    setError(null);
  };

  if (!sessionCode || !sourceId) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 shadow-lg text-center max-w-sm w-full">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Invalid Link</h1>
          <p className="text-gray-600">
            This upload link is not valid. Please scan a new QR code from the application.
          </p>
        </div>
      </div>
    );
  }

  if (uploadComplete) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 shadow-lg text-center max-w-sm w-full">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Upload Complete!</h1>
          <p className="text-gray-600 mb-4">
            Your document has been sent to the application. You can close this page.
          </p>
          <button
            onClick={handleRetake}
            className="text-bmf-blue font-medium hover:underline"
          >
            Upload another document
          </button>
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
          <h1 className="text-xl font-semibold text-gray-800">Document Upload</h1>
          <p className="text-sm text-gray-500 mt-1">
            Session: <span className="font-mono">{sessionCode}</span>
          </p>
        </div>

        {/* Upload area */}
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          {capturedImage ? (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative rounded-xl overflow-hidden bg-gray-900">
                <img
                  src={capturedImage}
                  alt="Captured document"
                  className="w-full h-auto"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleRetake}
                  className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  disabled={isUploading}
                >
                  Retake
                </button>
                <button
                  onClick={handleUpload}
                  className="flex-1 py-3 px-4 rounded-xl bg-bmf-blue text-white font-medium hover:bg-bmf-blue-dark transition-colors flex items-center justify-center gap-2"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-bmf-blue/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCapture}
                className="hidden"
              />

              <div className="flex justify-center gap-6 mb-4">
                <div className="p-4 rounded-full bg-bmf-blue/10">
                  <Camera className="w-8 h-8 text-bmf-blue" />
                </div>
                <div className="p-4 rounded-full bg-bmf-blue/10">
                  <Upload className="w-8 h-8 text-bmf-blue" />
                </div>
              </div>

              <p className="text-gray-800 font-medium mb-1">
                Tap to capture or upload
              </p>
              <p className="text-sm text-gray-500">
                Take a photo of your physical document
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Tips for best results:</p>
          <ul className="mt-2 space-y-1 text-left pl-4">
            <li>• Ensure good lighting</li>
            <li>• Keep the document flat</li>
            <li>• Capture all edges clearly</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
