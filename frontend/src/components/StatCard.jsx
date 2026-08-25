export default function StatCard({ label, value, sub, subColor }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ fontSize: 12.5, color: 'var(--color-text-secondary)', fontWeight: 500 }}>{label}</div>
      <div className="mono" style={{ fontSize: 30, fontWeight: 700, marginTop: 8 }}>{value}</div>
      <div style={{ fontSize: 12, marginTop: 6, color: subColor || 'var(--color-text-secondary)' }}>{sub}</div>
    </div>
  );
}
