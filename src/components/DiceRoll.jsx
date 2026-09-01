import React, { useState, useEffect, useRef } from 'react';

/**
 * DiceRoll - shows a d4 result with a brief rolling animation.
 *
 * Props:
 *   result     — final d4 result (1-4), or null if not yet rolled
 *   label      — text label below the die
 *   onComplete — callback when animation finishes
 *   rolling    — whether currently rolling
 */
export default function DiceRoll({ result, label, onComplete, rolling: externalRolling }) {
  const [display, setDisplay] = useState(externalRolling ? '?' : (result ?? '?'));
  const [isRolling, setIsRolling] = useState(externalRolling ?? false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (externalRolling) {
      setIsRolling(true);
      setDisplay(Math.floor(Math.random() * 4) + 1);
      intervalRef.current = setInterval(() => {
        setDisplay(Math.floor(Math.random() * 4) + 1);
      }, 80);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsRolling(false);
    }
  }, [externalRolling]);

  useEffect(() => {
    if (result != null && isRolling) {
      // Stop rolling after a brief delay
      const timer = setTimeout(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplay(result);
        setIsRolling(false);
        onComplete?.();
      }, 600);

      return () => clearTimeout(timer);
    } else if (result != null && !isRolling) {
      setDisplay(result);
    }
  }, [result, isRolling, onComplete]);

  return (
    <div className="dice-roll">
      <div className={`dice-roll__die ${isRolling ? 'dice-roll__die--rolling' : ''}`}>
        {display}
      </div>
      {label && <div className="dice-roll__label">{label}</div>}
    </div>
  );
}
