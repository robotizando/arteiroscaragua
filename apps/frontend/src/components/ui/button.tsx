import * as React from 'react';
import { cn } from '@/lib/utils';

const VARIANTS = {
  primary: 'bg-primary text-primary-foreground hover:bg-mata-700',
  // Sobre o verde escuro (cabeçalho, faixa de arteiros).
  claro: 'bg-mata-300 text-mata-800 hover:bg-mata-200',
  outline: 'border-2 border-foreground bg-card text-foreground hover:bg-mata-100',
  ghost: 'text-foreground hover:bg-mata-100',
  link: 'h-auto border-b-2 border-current px-0 text-primary hover:text-mata-700',
} as const;

const SIZES = {
  sm: 'h-9 px-3.5 text-[14px]',
  md: 'h-11 px-4 text-[14px]',
  lg: 'h-12 px-6 text-base',
} as const;

export interface ButtonStyleProps {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  className?: string;
}

// Também usado em <Link> e <a> que precisam parecer botões. Rótulo alinhado à esquerda, inclusive em botões largos.
export function buttonClassName({ variant = 'primary', size = 'md', className }: ButtonStyleProps = {}) {
  return cn(
    'inline-flex items-center justify-start gap-2 whitespace-nowrap font-extrabold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-60',
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyleProps;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, className, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={buttonClassName({ variant, size, className })} {...props} />
  ),
);
Button.displayName = 'Button';
