import React from 'react';

export default function FGDrivoLogo({
  size = 'md',
  boxed = false,
  className = '',
  style = {}
}) {
  const sizeMap = {
    xs: { height: 20 },
    sm: { height: 28 },
    md: { height: 38 },
    lg: { height: 50 },
    xl: { height: 68 },
  };

  const current = sizeMap[size] || sizeMap.md;

  if (boxed) {
    return (
      <div
        className={`inline-flex items-center justify-center ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '6px 12px',
          boxShadow: '0 2px 10px rgba(84, 39, 168, 0.08)',
          border: '1px solid rgba(84, 39, 168, 0.08)',
          userSelect: 'none',
          ...style,
        }}
      >
        <img
          src="/fg-drivo-logo.png"
          alt="FG DRIVO — Your Journey, Our Responsibility"
          style={{
            height: current.height,
            width: 'auto',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        userSelect: 'none',
        ...style,
      }}
    >
      <img
        src="/fg-drivo-logo.png"
        alt="FG DRIVO — Your Journey, Our Responsibility"
        style={{
          height: current.height,
          width: 'auto',
          objectFit: 'contain',
          display: 'block',
          filter: 'drop-shadow(0 2px 6px rgba(84, 39, 168, 0.06))',
        }}
      />
    </div>
  );
}

export { FGDrivoLogo as RideXLogo };
