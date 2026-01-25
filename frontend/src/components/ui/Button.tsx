import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      children,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const variantClass = styles[variant];
    const sizeClass = styles[`size${size.charAt(0).toUpperCase() + size.slice(1)}`];

    return (
      <button
        ref={ref}
        className={`${styles.button} ${variantClass} ${sizeClass} ${
          fullWidth ? styles.fullWidth : ''
        } ${loading ? styles.loading : ''} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <span className={styles.spinner} />}
        {!loading && icon && iconPosition === 'left' && (
          <span className={styles.icon}>{icon}</span>
        )}
        {children && <span className={styles.text}>{children}</span>}
        {!loading && icon && iconPosition === 'right' && (
          <span className={styles.icon}>{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

// Icon-only button variant
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  label: string;
  children: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = 'ghost',
      size = 'md',
      loading = false,
      label,
      children,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const variantClass = styles[variant];
    const sizeClass = styles[`iconSize${size.charAt(0).toUpperCase() + size.slice(1)}`];

    return (
      <button
        ref={ref}
        className={`${styles.iconButton} ${variantClass} ${sizeClass} ${
          loading ? styles.loading : ''
        } ${className}`}
        disabled={disabled || loading}
        aria-label={label}
        title={label}
        {...props}
      >
        {loading ? <span className={styles.spinner} /> : children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
