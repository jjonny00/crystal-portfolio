import React from 'react';

const RadialProgressRing = ({
  size = 160,
  strokeWidth = 8,
  progress = 0,
  color = '#64ffda',
  trackColor = 'rgba(255,255,255,0.1)'
}) => {
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const clamped = Math.min(Math.max(progress, 0), 100);
  return (
    <svg
      width={size}
      height={size}
      style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        pathLength="100"
        strokeDasharray="100"
        strokeDashoffset={100 - clamped}
        style={{ transition: 'stroke-dashoffset 0.3s ease' }}
      />
    </svg>
  );
};

export default RadialProgressRing;
