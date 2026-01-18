import { memo } from 'react';
import { CheckCircle2, AlertCircle, XCircle, Sparkles } from 'lucide-react';

type ConfidenceLevel = 'high' | 'medium' | 'low';

interface ConfidenceIndicatorProps {
  score: number; // 0-100
  showLabel?: boolean;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

const levelConfig: Record<ConfidenceLevel, {
  icon: typeof CheckCircle2;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}> = {
  high: {
    icon: CheckCircle2,
    color: 'text-confidence-high',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    label: 'High Confidence',
  },
  medium: {
    icon: AlertCircle,
    color: 'text-confidence-medium',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    label: 'Review Suggested',
  },
  low: {
    icon: XCircle,
    color: 'text-confidence-low',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Manual Review Required',
  },
};

const sizeConfig = {
  sm: { icon: 'w-3 h-3', text: 'text-xs', padding: 'px-2 py-0.5' },
  md: { icon: 'w-4 h-4', text: 'text-sm', padding: 'px-3 py-1' },
  lg: { icon: 'w-5 h-5', text: 'text-base', padding: 'px-4 py-1.5' },
};

function ConfidenceIndicatorComponent({
  score,
  showLabel = true,
  showScore = true,
  size = 'md',
  animate = true,
}: ConfidenceIndicatorProps) {
  const level = getConfidenceLevel(score);
  const config = levelConfig[level];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div
      className={`
        inline-flex items-center gap-1.5
        ${config.bgColor} ${config.borderColor}
        border rounded-full ${sizes.padding}
        ${animate && level === 'low' ? 'confidence-low' : ''}
      `}
    >
      <div className="flex items-center gap-1">
        <Sparkles className={`${sizes.icon} text-ai-purple opacity-70`} />
        <Icon className={`${sizes.icon} ${config.color}`} />
      </div>

      {showScore && (
        <span className={`${sizes.text} font-semibold ${config.color}`}>
          {Math.round(score)}%
        </span>
      )}

      {showLabel && (
        <span className={`${sizes.text} text-gray-600`}>
          {config.label}
        </span>
      )}
    </div>
  );
}

export const ConfidenceIndicator = memo(ConfidenceIndicatorComponent);

// Simple badge version for compact displays
interface ConfidenceBadgeProps {
  score: number;
  size?: 'sm' | 'md';
}

function ConfidenceBadgeComponent({ score, size = 'sm' }: ConfidenceBadgeProps) {
  const level = getConfidenceLevel(score);
  const config = levelConfig[level];
  const sizes = sizeConfig[size];

  return (
    <span
      className={`
        inline-flex items-center gap-1
        ${config.bgColor} ${config.borderColor}
        border rounded-full ${sizes.padding}
        ${level === 'low' ? 'confidence-low' : ''}
      `}
    >
      <Sparkles className={`w-3 h-3 text-ai-purple opacity-70`} />
      <span className={`${sizes.text} font-semibold ${config.color}`}>
        {Math.round(score)}%
      </span>
    </span>
  );
}

export const ConfidenceBadge = memo(ConfidenceBadgeComponent);
