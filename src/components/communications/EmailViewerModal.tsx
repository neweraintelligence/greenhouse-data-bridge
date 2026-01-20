import { memo, useState } from 'react';
import { X, Mail, Send, Loader2, Sparkles } from 'lucide-react';

interface EmailViewerModalProps {
  email: {
    id: string;
    recipient: string;
    subject: string;
    body?: string;
    sent_at: string;
  };
  onClose: () => void;
  onSendReply?: (replyBody: string) => void;
}

function EmailViewerModalComponent({ email, onClose, onSendReply }: EmailViewerModalProps) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleGenerateReply = async () => {
    setIsGenerating(true);
    setShowReply(true);

    try {
      // Simulate Gemini generating reply
      await new Promise(resolve => setTimeout(resolve, 1500));

      setReplyText(`Dear ${email.recipient},

Thank you for bringing this to our attention. We have reviewed the discrepancy and taken the following actions:

- Updated inventory records to reflect actual quantities received
- Adjusted invoice to match delivered quantities
- Documented the shortage in our vendor performance tracking

We will continue to monitor this supplier for future order accuracy.

Please let us know if you need any additional information.

Best regards,
Operations Team
Big Marble Farms`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = () => {
    setIsSending(true);
    onSendReply?.(replyText);
    setTimeout(() => {
      setIsSending(false);
      onClose();
    }, 500);
  };

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Email header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-lg font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                {email.subject}
              </h2>
              <p className="text-sm text-white/80">To: {email.recipient}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Email body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap" style={{ fontFamily: 'var(--font-body)' }}>
              {email.body || 'Email body not available'}
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-400">
              Sent: {new Date(email.sent_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Reply section */}
        {!showReply ? (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <button
              onClick={handleGenerateReply}
              disabled={isGenerating}
              className="w-full px-6 py-3 rounded-xl bg-bmf-blue hover:bg-bmf-blue-dark text-white font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <Sparkles className="w-4 h-4" />
              {isGenerating ? 'Generating Reply...' : 'Auto-Reply with AI'}
            </button>
          </div>
        ) : (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Draft Reply:</label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-bmf-blue focus:ring-2 focus:ring-bmf-blue/20 outline-none resize-none mb-3"
              rows={8}
              style={{ fontFamily: 'var(--font-body)' }}
              disabled={isGenerating}
            />
            <div className="flex gap-3">
              <button
                onClick={handleSend}
                disabled={isSending || !replyText.trim()}
                className="flex-1 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Reply
              </button>
              <button
                onClick={() => setShowReply(false)}
                className="px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-colors"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const EmailViewerModal = memo(EmailViewerModalComponent);
