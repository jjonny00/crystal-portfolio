import React from 'react';

const Loader = () => {
  return (
    <div
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
        zIndex: 100000
      }}
    >
      Loading...
    </div>
  );
};

export default Loader;
