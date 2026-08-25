export default function StatusBadge({ meta }) {
  if (!meta) return null;
  return <span className={`badge ${meta.className}`}>{meta.label}</span>;
}
