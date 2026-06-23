"use client";
import { useState } from "react";
import { type CSSProperties } from "react";

import { cn } from "@/lib/utils";

const ACTION_HAND_WAVE_DELAY = "0s"; // No delay when triggering with click
export default function HandWave() {
  const [waveKey, setWaveKey] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  const onClick = () => {
    if (isAnimating) {
      return;
    }

    setIsAnimating(true);
    setWaveKey((currentWaveKey) => currentWaveKey + 1);
  };

  return (
    <span
      key={waveKey} // Re-render the component to restart the animation
      onClick={onClick}
      onAnimationStart={() => setIsAnimating(true)}
      onAnimationEnd={() => setIsAnimating(false)}
      style={
        waveKey > 0
          ? ({ "--hand-wave-delay": ACTION_HAND_WAVE_DELAY } as CSSProperties)
          : undefined
      }
      className={cn(
        "animate-hand-wave inline-block origin-bottom -rotate-50 pl-4",
        isAnimating && "pointer-events-none cursor-default",
        !isAnimating && "cursor-pointer",
      )}
    >
      ✋
    </span>
  );
}
