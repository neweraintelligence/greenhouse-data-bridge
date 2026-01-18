import { forwardRef, type ReactNode, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'glass' | 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

const variantClasses: Record<ButtonVariant, string> = {
  glass: 'btn-glass',
  primary: 'btn-primary',
  secondary: `
    bg-gradient-to-br from-nei-green to-nei-green-dark
    text-white border-none rounded-[var(--radius-button)]
    font-semibold transition-all duration-200
    shadow-[0_4px_16px_rgba(26,77,77,0.3)]
    hover:shadow-[0_6px_24px_rgba(26,77,77,0.4)] hover:-translate-y-0.5
    active:translate-y-0 active:shadow-[0_2px_8px_rgba(26,77,77,0.3)]
  `,
  ghost: `
    bg-transparent text-gray-700 border border-gray-300/50 rounded-[var(--radius-button)]
    font-medium transition-all duration-200
    hover:bg-white/50 hover:border-gray-400/50
    active:bg-white/30
  `,
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      children,
      variant = 'glass',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center gap-2
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          icon && iconPosition === 'left' && icon
        )}
        {children}
        {!loading && icon && iconPosition === 'right' && icon}
      </button>
    );
  }
);

GlassButton.displayName = 'GlassButton';
