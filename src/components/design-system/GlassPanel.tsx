import { forwardRef, type ReactNode, type HTMLAttributes } from 'react';

type GlassPanelVariant = 'light' | 'heavy' | 'dark' | 'node';

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: GlassPanelVariant;
  glow?: 'blue' | 'green' | 'purple' | 'none';
  active?: boolean;
  hover?: boolean;
}

const variantClasses: Record<GlassPanelVariant, string> = {
  light: 'glass-panel',
  heavy: 'glass-panel-heavy',
  dark: 'glass-panel-dark',
  node: 'glass-node',
};

const glowClasses = {
  blue: 'shadow-[var(--shadow-glow-blue)]',
  green: 'shadow-[var(--shadow-glow-green)]',
  purple: 'shadow-[var(--shadow-glow-purple)]',
  none: '',
};

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ children, variant = 'light', glow = 'none', active, hover = true, className = '', ...props }, ref) => {
    const baseClass = variantClasses[variant];
    const glowClass = active ? glowClasses[glow] : '';
    const hoverClass = hover && variant === 'node' ? '' : ''; // Node already has hover built in

    return (
      <div
        ref={ref}
        className={`${baseClass} ${glowClass} ${hoverClass} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassPanel.displayName = 'GlassPanel';
