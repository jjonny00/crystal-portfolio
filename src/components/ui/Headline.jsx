import React from 'react';

/**
 * Shared headline component without legacy 70s glow class styling.
 */
const Headline = ({
  children,
  as: Component = 'h1',
  className = '',
  style = {},
  ...props
}) => {
  return (
    <Component
      className={className}
      style={{
        color: 'var(--headline-ink)',
        position: 'relative',
        display: 'inline-block',
        ...style
      }}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Headline;
