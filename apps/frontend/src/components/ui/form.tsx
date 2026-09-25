'use client';

import * as React from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export const inputClassName =
  'flex h-11 w-full border-2 border-foreground bg-card px-3 text-base text-foreground transition-colors duration-150 placeholder:text-muted-foreground focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-60 sm:text-[14px] aria-[invalid=true]:border-destructive';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(inputClassName, className)} {...props} />,
);
Input.displayName = 'Input';

export const PasswordInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    const [visivel, setVisivel] = React.useState(false);
    return (
      <div className="relative">
        <input
          ref={ref}
          type={visivel ? 'text' : 'password'}
          className={cn(inputClassName, 'pr-11', className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {visivel ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, rows = 4, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(inputClassName, 'h-auto min-h-[88px] py-2 leading-relaxed', className)}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => <select ref={ref} className={cn(inputClassName, 'pr-8', className)} {...props} />,
);
Select.displayName = 'Select';

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactElement<{ id?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }>;
  className?: string;
}

export function Field({ id, label, error, hint, children, className }: FieldProps) {
  const describedBy = error ? `${id}-erro` : hint ? `${id}-dica` : undefined;
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {React.cloneElement(children, { id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {error ? (
        <p id={`${id}-erro`} className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <div id={`${id}-dica`} className="text-xs text-muted-foreground">
            {hint}
          </div>
        )
      )}
    </div>
  );
}

const ALERT_STYLES = {
  erro: { className: 'border-destructive/30 bg-destructive/5 text-destructive', icon: AlertCircle },
  sucesso: { className: 'border-success/30 bg-success/5 text-success', icon: CheckCircle2 },
  info: { className: 'border-border bg-muted/60 text-foreground', icon: Info },
} as const;

export function Alert({
  tipo = 'info',
  children,
  className,
}: {
  tipo?: keyof typeof ALERT_STYLES;
  children: React.ReactNode;
  className?: string;
}) {
  const { className: estilo, icon: Icon } = ALERT_STYLES[tipo];
  return (
    <div
      role={tipo === 'erro' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-lg border px-4 py-3 text-sm', estilo, className)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 space-y-2 [&_a]:font-medium [&_a]:underline">{children}</div>
    </div>
  );
}

// Converte as issues do zod (cliente ou backend) em { campo: primeira mensagem }.
export function errosPorCampo(issues: { path: string | (string | number)[]; message: string }[]) {
  const erros: Record<string, string> = {};
  for (const issue of issues) {
    const campo = Array.isArray(issue.path) ? issue.path.join('.') : issue.path;
    erros[campo] ??= issue.message;
  }
  return erros;
}
