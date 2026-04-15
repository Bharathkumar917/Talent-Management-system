import { cn } from '../../lib/utils';

function Badge({ className, variant = 'default', ...props }) {
  const variants = {
    default: "border-transparent bg-primary-500/10 text-primary-400 border border-primary-500/20",
    secondary: "border-transparent bg-surfaceHover text-text-secondary border border-border",
    destructive: "border-transparent bg-red-500/10 text-red-500 border border-red-500/20",
    outline: "text-text-primary border-border",
    success: "border-transparent bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    warning: "border-transparent bg-amber-500/10 text-amber-400 border border-amber-500/20",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
