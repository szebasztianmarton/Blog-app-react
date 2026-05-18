export default function EmptyState({
  title = 'Nincs találat',
  description = 'Próbálj meg módosítani a keresés feltételeit.',
  action,
}) {
  return (
    <div className="border-2 border-dashed border-current p-12 md:p-20 text-center">
      <p className="eyebrow mb-4">Empty</p>
      <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3 text-balance">
        {title}
      </h2>
      <p className="max-w-prose mx-auto text-ink-muted dark:text-bone-muted">
        {description}
      </p>
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
