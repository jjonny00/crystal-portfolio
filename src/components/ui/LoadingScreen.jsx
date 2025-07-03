import React from 'react';

const LoadingScreen = ({
  style = {},
  className = '',
  text = 'Loading...',
  progress = null,
}) => {
  const showProgress =
    progress !== null && progress !== undefined && !Number.isNaN(progress);
  const displayText = showProgress
    ? `${text} ${Math.floor(progress)}%`
    : text;

  return (
    <div
      className={className}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#050505',
        color: '#64ffda',
        fontSize: '1.2rem',
        zIndex: 100000,
        ...style,
      }}
    >
      {displayText}
    </div>
  );
};

export default LoadingScreen;
