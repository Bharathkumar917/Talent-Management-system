import { cn } from '../../lib/utils';

export function Avatar({ fallback, src, className }) {
  return (
    <div className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-surfaceHover", className)}>
      {src ? (
        <img
          src={src}
          className="aspect-square h-full w-full object-cover"
          alt="Avatar"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-primary-500/20 text-primary-400 font-semibold border border-primary-500/30">
          {fallback}
        </div>
      )}
    </div>
  );
}
