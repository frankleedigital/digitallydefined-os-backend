export default function Spinner({ className = '' }) {
  return (
    <span className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-brand-border border-t-brand-accent ${className}`} aria-label="Loading" />
  );
}
