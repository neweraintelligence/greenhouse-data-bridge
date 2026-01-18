import { memo, useState } from 'react';
import { Mail, Paperclip, ChevronRight, Circle } from 'lucide-react';

export interface EmailItem {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  preview: string;
  timestamp: string;
  hasAttachment: boolean;
  unread: boolean;
}

interface OutlookMiniAppProps {
  emails: EmailItem[];
  onEmailClick?: (email: EmailItem) => void;
  onSelect?: (email: EmailItem) => void;
  selectedId?: string;
  isLoading?: boolean;
  expanded?: boolean;
}

// Generate realistic placeholder avatar colors
function getAvatarColor(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-purple-500',
    'bg-rose-500',
    'bg-amber-500',
    'bg-cyan-500',
    'bg-indigo-500',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 1) {
    return `${Math.floor(diffMs / (1000 * 60))}m ago`;
  }
  if (diffHours < 24) {
    return `${Math.floor(diffHours)}h ago`;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function OutlookMiniAppComponent({
  emails,
  onEmailClick,
  onSelect,
  selectedId,
  isLoading,
  expanded = false,
}: OutlookMiniAppProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Shimmer loading state
  if (isLoading) {
    return (
      <div className="space-y-1.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-gray-100/50">
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-2.5 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-0.5 overflow-y-auto scrollbar-thin ${expanded ? 'max-h-[500px]' : 'max-h-[200px]'}`}>
      {emails.map((email) => (
        <div
          key={email.id}
          className={`
            email-row group relative
            ${email.unread ? 'email-row-unread' : ''}
            ${selectedId === email.id ? 'bg-bmf-blue/10 border border-bmf-blue/30' : ''}
            ${hoveredId === email.id ? 'bg-gray-50' : ''}
          `}
          onMouseEnter={() => setHoveredId(email.id)}
          onMouseLeave={() => setHoveredId(null)}
          onClick={() => onEmailClick?.(email)}
        >
          {/* Unread indicator */}
          {email.unread && (
            <div className="absolute left-1 top-1/2 -translate-y-1/2">
              <Circle className="w-2 h-2 fill-bmf-blue text-bmf-blue" />
            </div>
          )}

          {/* Avatar */}
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0 ${getAvatarColor(email.from)}`}
          >
            {getInitials(email.from)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-xs truncate ${email.unread ? 'font-semibold text-gray-900' : 'text-gray-700'}`}
              >
                {email.from}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {email.hasAttachment && (
                  <Paperclip className="w-3 h-3 text-gray-400" />
                )}
                <span className="text-[10px] text-gray-400">
                  {formatTime(email.timestamp)}
                </span>
              </div>
            </div>
            <p
              className={`text-[11px] truncate ${email.unread ? 'text-gray-700' : 'text-gray-500'}`}
            >
              {email.subject}
            </p>
          </div>

          {/* Select button on hover */}
          {hoveredId === email.id && onSelect && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(email);
              }}
              className="shrink-0 p-1 rounded bg-bmf-blue/10 hover:bg-bmf-blue/20 transition-colors"
            >
              <ChevronRight className="w-3 h-3 text-bmf-blue" />
            </button>
          )}
        </div>
      ))}

      {emails.length === 0 && (
        <div className="text-center py-4">
          <Mail className="w-6 h-6 text-gray-300 mx-auto mb-1" />
          <p className="text-xs text-gray-400">No emails found</p>
        </div>
      )}
    </div>
  );
}

export const OutlookMiniApp = memo(OutlookMiniAppComponent);
