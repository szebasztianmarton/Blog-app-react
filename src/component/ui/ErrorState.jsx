export default function ErrorState({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="border-2 border-accent dark:border-accent-dark p-8 md:p-12 max-w-prose mx-auto text-center"
    >
      <p className="font-mono text-eyebrow text-accent dark:text-accent-dark mb-4">Error</p>
      <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-3 text-balance">
        Valami hiba történt
      </h2>
      <p className="text-ink-muted dark:text-bone-muted break-words">
        {message || 'Ismeretlen hiba'}
      </p>
      {onRetry && (
        <div className="mt-6">
          <button type="button" onClick={onRetry} className="btn-brutal btn-brutal--danger">
            Újrapróbálás
          </button>
        </div>
      )}
    </div>
  );
}
