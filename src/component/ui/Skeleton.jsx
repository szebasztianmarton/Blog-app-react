export function SkeletonLine({ className = '', style }) {
  return <div className={`skeleton-line ${className}`} style={style} />;
}

export function SkeletonCard() {
  return (
    <article className="border-2 border-current p-6 space-y-4">
      <SkeletonLine style={{ height: '0.75rem', width: '30%' }} />
      <SkeletonLine style={{ height: '1.5rem', width: '80%' }} />
      <SkeletonLine style={{ height: '1.5rem', width: '60%' }} />
      <div className="space-y-2 pt-4">
        <SkeletonLine />
        <SkeletonLine style={{ width: '92%' }} />
        <SkeletonLine style={{ width: '70%' }} />
      </div>
    </article>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
