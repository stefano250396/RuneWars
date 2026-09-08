import React from 'react';

export default function ErrorBanner({ errors }) {
  if (!errors || errors.length === 0) return null;
  return (
    <details className="errors" open>
      <summary>{errors.length} problema/i nel CSV</summary>
      <ul>
        {errors.map((err, i) => (
          <li key={i}>
            riga <b>{err.line}</b>
            {err.name ? <> — <b>{err.name}</b></> : null}
            {' — '}{err.message}
          </li>
        ))}
      </ul>
    </details>
  );
}
