import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

const Button = forwardRef(({ className, variant = 'primary', size = 'default', children, isLoading, ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50";
  
  const variants = {
    primary: "bg-primary-600 text-white shadow hover:bg-primary-500",
    secondary: "bg-surfaceHover text-text-primary shadow-sm hover:bg-border border border-border",
    destructive: "bg-red-600/10 text-red-500 hover:bg-red-600/20 border border-red-900/50",
    ghost: "hover:bg-surfaceHover hover:text-text-primary text-text-secondary",
    link: "text-primary-400 underline-offset-4 hover:underline",
  };

  const sizes = {
    default: "h-9 px-4 py-2 text-sm",
    sm: "h-8 rounded-md px-3 text-xs",
    lg: "h-11 rounded-md px-8 text-base",
    icon: "h-9 w-9",
  };

  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.98 }}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </motion.button>
  );
});
Button.displayName = "Button";

export { Button };
