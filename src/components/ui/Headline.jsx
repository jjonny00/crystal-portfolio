// src/components/ui/Headline.jsx
// 1970s cinematic headline component with dynamic glow effect

import React from 'react';

/**
 * Headline component with 1970s cinematic glow effect
 * Uses CSS classes from glow-70s.css and responds to color changes
 */
const Headline = ({ 
  children, 
  as: Component = 'h1', 
  className = '', 
  style = {}, 
  ...props 
}) => {
  // Get the text content for the data-text attribute (needed for CSS pseudo-elements)
  const getTextContent = (children) => {
    if (typeof children === 'string') {
      return children;
    }
    if (React.isValidElement(children)) {
      return getTextContent(children.props.children);
    }
    if (Array.isArray(children)) {
      return children.map(child => getTextContent(child)).join('');
    }
    return '';
  };

  const textContent = getTextContent(children);

  return (
    <Component
      className={`headline-70s ${className}`}
      data-text={textContent}
      style={{
        // Apply the dynamic color from CSS variables
        color: 'var(--headline-ink)',
        // Ensure the glow effect renders properly
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