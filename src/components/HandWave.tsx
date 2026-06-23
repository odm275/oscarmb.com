"use client";
import { useState } from "react";
import { type CSSProperties } from "react";

const ACTION_HAND_WAVE_DELAY = "0s"; // No delay when triggering with click
export default function HandWave() {
  const [waveKey, setWaveKey] = useState(0);

  const onClick = () => {
    setWaveKey(waveKey + 1);
  };

  return (
    <span
      key={waveKey} // Re-render the component to restart the animation
      onClick={onClick}
      style={
        waveKey > 0
          ? ({ "--hand-wave-delay": ACTION_HAND_WAVE_DELAY } as CSSProperties)
          : undefined
      }
      className="animate-hand-wave inline-block origin-bottom -rotate-50 cursor-pointer pl-4"
    >
      ✋
    </span>
  );
}
