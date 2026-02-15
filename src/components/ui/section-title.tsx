import { cn } from '@/lib/utils';

interface SectionTitleProps {
  title: string;
  className?: string;
}

export function SectionTitle({ title, className }: SectionTitleProps) {
  return (
    <div className={cn('flex items-center gap-3 mb-3', className)}>
      <h2 className="font-display font-bold text-lg uppercase tracking-wider text-white/80 shrink-0">
        {title}
      </h2>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
  );
}
