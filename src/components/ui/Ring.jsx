import React, { useMemo } from "react";

export default function Ring({ size=200, width=12, progress=0, color="#fff", trackOpacity=0.2, label }) {
  const radius = (size - width) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, progress));
  const offset = circumference * (1 - clamped / 100);

  const trackColor = `rgba(255,255,255,${trackOpacity})`;

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size/2} cy={size/2} r={radius}
          stroke={trackColor} strokeWidth={width} fill="transparent"
        />
        <circle
          cx={size/2} cy={size/2} r={radius}
          stroke={color} strokeWidth={width} fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.2s ease-out" }}
        />
      </svg>
      {label && (
        <div style={{
          position: "absolute", left: 0, top: "50%", width: "100%", textAlign: "center",
          transform: "translateY(-50%) rotate(0deg)", color: "#fff", fontSize: 12, opacity: 0.7
        }}>
          {label} {clamped}%
        </div>
      )}
    </div>
  );
}
