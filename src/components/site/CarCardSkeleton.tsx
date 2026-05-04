export function CarCardSkeleton() {
  return (
    <div className="luxury-card animate-pulse">
      <div className="aspect-[16/10] bg-surface-2" />
      <div className="p-6 space-y-3">
        <div className="h-3 w-1/3 bg-surface-2 rounded" />
        <div className="h-5 w-2/3 bg-surface-2 rounded" />
        <div className="h-px bg-white/5 my-3" />
        <div className="h-3 w-full bg-surface-2 rounded" />
      </div>
    </div>
  );
}
