export default function Spinner({ className = '' }) {
  return (
    <span className={`inline-block h-5 w-5 animate-spin border-2 border-ink border-t-orange ${className}`} aria-label="Loading" />
  );
}
