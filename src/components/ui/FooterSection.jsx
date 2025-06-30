// src/components/ui/FooterSection.jsx
// FIXED: Footer only appears when reaching the bottom of the page

import React, { useState, useEffect } from 'react';
import { animated, useSpring } from '@react-spring/web';

const FooterSection = ({ visible = false, onLoopBack }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);
  
  // FIXED: Track if user has scrolled to the bottom of the page
  useEffect(() => {
    const checkIfAtBottom = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
      
      // Consider "at bottom" when within 100px of the bottom
      const threshold = 100;
      const atBottom = scrollTop + windowHeight >= documentHeight - threshold;
      
      setIsAtBottom(atBottom);
      
      // Only show footer when at bottom AND visible prop is true
      setIsVisible(atBottom && visible);
    };
    
    // Check on scroll
    const handleScroll = () => {
      // Throttle scroll events for performance
      requestAnimationFrame(checkIfAtBottom);
    };
    
    // Check initially
    checkIfAtBottom();
    
    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Also check on resize in case content height changes
    window.addEventListener('resize', checkIfAtBottom, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkIfAtBottom);
    };
  }, [visible]);
  
  // Update visibility when visible prop changes (but still respect bottom check)
  useEffect(() => {
    if (visible && isAtBottom) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [visible, isAtBottom]);
  
  // FIXED: Enhanced animation with slide-up effect
  const containerSpring = useSpring({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0px)' : 'translateY(100%)', // Slide up from bottom
    config: {
      tension: 280,
      friction: 24
    },
    onRest: () => {
      if (!isVisible) {
        // Can add any cleanup here if needed
      }
    }
  });
  
  // Staggered animations for content
  const contentSpring = useSpring({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0px)' : 'translateY(20px)',
    delay: isVisible ? 100 : 0,
    config: { tension: 300, friction: 26 }
  });
  
  const linksSpring = useSpring({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0px)' : 'translateY(15px)',
    delay: isVisible ? 200 : 0,
    config: { tension: 300, friction: 26 }
  });
  
  const ctaSpring = useSpring({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0px)' : 'translateY(15px)',
    delay: isVisible ? 300 : 0,
    config: { tension: 300, friction: 26 }
  });
  
  // FIXED: Don't render footer at all unless conditions are met
  if (!isVisible && !isAtBottom) return null;
  
  // Social links data
  const socialLinks = [
    {
      name: 'Email',
      href: 'mailto:jon.shaw@example.com',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: '#64ffda'
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/in/jonshaw',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 8C18.2091 8 20.2091 8.79018 21.6569 10.2379C23.1046 11.6857 23.8947 13.6857 23.8947 15.8947V21H19.7895V15.8947C19.7895 15.0649 19.4593 14.2689 18.8699 13.6795C18.2805 13.0901 17.4845 12.7598 16.6547 12.7598C15.8249 12.7598 15.0289 13.0901 14.4395 13.6795C13.8501 14.2689 13.5199 15.0649 13.5199 15.8947V21H9.41468V15.8947C9.41468 13.6857 10.2048 11.6857 11.6526 10.2379C13.1003 8.79018 15.1003 8 17.3094 8H16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="2" y="9" width="4" height="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: '#0077b5'
    },
    {
      name: 'Behance',
      href: 'https://behance.net/jonshaw',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 8L12 13L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 8C21 6.89543 20.1046 6 19 6H5C3.89543 6 3 6.89543 3 8V16C3 17.1046 3.89543 18 5 18H19C20.1046 18 21 17.1046 21 16V8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 4H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: '#1769ff'
    },
    {
      name: 'Dribbble',
      href: 'https://dribbble.com/jonshaw',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8.56 2.75C4.37 6.03 2 10.16 2 15.23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21.21 15.89C15.5 14.4 10.12 11.13 6 6.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3.59 8.93C9.43 9.89 15.57 11.54 21 14.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: '#ea4c89'
    }
  ];

  return (
    <animated.div
      style={{
        ...containerSpring,
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
        background: 'linear-gradient(0deg, rgba(5, 5, 5, 0.95) 0%, transparent 100%)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(100, 255, 218, 0.1)',
        zIndex: 999,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
      }}
    >
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 24px 24px',
        color: 'white'
      }}>
        
        {/* Main content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '40px',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          
          {/* Left side - Branding */}
          <animated.div style={contentSpring}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              margin: '0 0 8px 0',
              background: 'linear-gradient(135deg, #64ffda 0%, #bb86fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Jon Shaw
            </h2>
            <p style={{
              fontSize: '1rem',
              color: 'rgba(255, 255, 255, 0.7)',
              margin: '0 0 16px 0',
              lineHeight: '1.5'
            }}>
              Multifaceted Designer • Design Leader • Systems Thinker
            </p>
            <p style={{
              fontSize: '0.875rem',
              color: 'rgba(255, 255, 255, 0.5)',
              margin: '0',
              lineHeight: '1.4'
            }}>
              Creating meaningful experiences through empathy, craft, and systematic thinking.
            </p>
          </animated.div>
          
          {/* Right side - Contact CTA */}
          <animated.div style={ctaSpring}>
            <div style={{
              textAlign: 'right',
              '@media (max-width: 768px)': {
                textAlign: 'center'
              }
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                margin: '0 0 12px 0',
                color: '#64ffda'
              }}>
                Ready to collaborate?
              </h3>
              <a
                href="mailto:jon.shaw@example.com"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  background: 'rgba(100, 255, 218, 0.1)',
                  border: '1px solid rgba(100, 255, 218, 0.3)',
                  borderRadius: '8px',
                  color: '#64ffda',
                  textDecoration: 'none',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(100, 255, 218, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(100, 255, 218, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(100, 255, 218, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Let's work together
              </a>
            </div>
          </animated.div>
        </div>
        
        {/* Social links */}
        <animated.div style={linksSpring}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            marginBottom: '32px',
            flexWrap: 'wrap'
          }}>
            {socialLinks.map((link, index) => (
              <a
                key={link.name}
                href={link.href}
                target={link.name !== 'Email' ? '_blank' : undefined}
                rel={link.name !== 'Email' ? 'noopener noreferrer' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '24px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${link.color}15`;
                  e.currentTarget.style.borderColor = `${link.color}40`;
                  e.currentTarget.style.color = link.color;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {link.icon}
                {link.name}
              </a>
            ))}
          </div>
        </animated.div>
        
        {/* Bottom bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '0.875rem',
          color: 'rgba(255, 255, 255, 0.5)',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            © 2024 Jon Shaw. All rights reserved.
          </div>
          
          {/* Loop back button */}
          <button
            onClick={onLoopBack}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#64ffda';
              e.currentTarget.style.background = 'rgba(100, 255, 218, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
              e.currentTarget.style.background = 'none';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 12L7 18L1 12L7 6L1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to top
          </button>
        </div>
      </div>
    </animated.div>
  );
};

export default FooterSection;