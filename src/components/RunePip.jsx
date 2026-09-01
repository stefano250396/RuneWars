const RUNE_COLORS = {
  W: '#f0c040',
  U: '#3b82f6',
  B: '#6b21a8',
  R: '#ef4444',
  G: '#22c55e',
  P: '#a855f7',
  C: '#9ca3af',
};

const RUNE_TEXT_COLORS = {
  W: '#000',
  U: '#fff',
  B: '#fff',
  R: '#fff',
  G: '#000',
  P: '#fff',
  C: '#000',
};

export default function RunePip({ rune, size = 12 }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        background: RUNE_COLORS[rune] || '#888',
        border: '1px solid rgba(255,255,255,0.4)',
        borderRadius: '50%',
        fontSize: size * 0.42,
        lineHeight: `${size}px`,
        textAlign: 'center',
        fontWeight: 700,
        color: RUNE_TEXT_COLORS[rune] || '#fff',
        boxShadow: '0 0 3px rgba(0,0,0,0.5)',
      }}
    >
      {rune}
    </span>
  );
}
