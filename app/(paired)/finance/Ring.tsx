export function Ring({ pct, size = 84, label }: { pct: number; size?: number; label?: string }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.min(pct, 100);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={label ? `${label}: ${clamped}%` : `${clamped}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#FAF7F3" strokeWidth="6" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#D6B370"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - clamped / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="52%"
        dominantBaseline="middle"
        textAnchor="middle"
        style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, fill: "#2D2D2D" }}
      >
        {clamped}%
      </text>
    </svg>
  );
}
