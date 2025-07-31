// src/components/ui/EnhancedLoadingScreen.jsx
// FIXED: Better messaging that explains the conservative approach

import React from 'react';

const EnhancedLoadingScreen = ({
  progress = 0,
  phase = 'initializing',
  currentAsset = '',
  loadedAssets = 0,
  totalAssets = 0,
  profilerProgress = null,
  errors = [],
  onRetry = null
}) => {
  const getPhaseMessage = () => {
    switch (phase) {
      case 'initializing':
        return 'Initializing...';
      case 'profiling':
        return 'Optimizing Performance';
      case 'loading':
        return 'Loading Assets';
      case 'ready':
        return errors.length > 0 ? 'Ready (with warnings)' : 'Ready to Experience';
      case 'error':
        return 'Loading Failed';
      default:
        return 'Preparing...';
    }
  };

  const getProgressColor = () => {
    if (phase === 'error') return '#ff6b6b';
    if (phase === 'ready' && errors.length > 0) return '#ffa726';
    if (phase === 'profiling') return '#bb86fc';
    return '#64ffda';
  };

  const getPhaseDescription = () => {
    switch (phase) {
      case 'profiling':
        return 'Testing your device to find the optimal quality settings for smooth performance...';
      case 'loading':
        return 'Loading 3D models, textures, and environment assets...';
      case 'ready':
        return 'Everything is ready! Starting your crystal experience...';
      default:
        return 'Setting up the multifaceted design experience...';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#050505',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100000,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      
      {/* Main Title */}
      <div style={{
        fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
        fontWeight: '600',
        background: 'linear-gradient(135deg, #64ffda 0%, #bb86fc 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '1rem',
        textAlign: 'center'
      }}>
        Multifaceted Designer
      </div>

      {/* Phase Description */}
      <div style={{
        fontSize: '1rem',
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        marginBottom: '3rem',
        maxWidth: '500px',
        lineHeight: '1.5'
      }}>
        {getPhaseDescription()}
      </div>

      {/* Progress Container */}
      <div style={{
        width: '90%',
        maxWidth: '400px',
        marginBottom: '2rem'
      }}>
        
        {/* Progress Bar Background */}
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: '1rem'
        }}>
          {/* Progress Bar Fill */}
          <div style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: getProgressColor(),
            borderRadius: '4px',
            transition: 'width 0.3s ease, background-color 0.3s ease',
            boxShadow: `0 0 10px ${getProgressColor()}40`
          }} />
        </div>

        {/* Progress Info */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'white',
          fontSize: '0.9rem',
          marginBottom: '0.5rem'
        }}>
          <span style={{ color: getProgressColor(), fontWeight: '600' }}>
            {getPhaseMessage()}
          </span>
          <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            {progress}%
          </span>
        </div>

        {/* Asset Counter */}
        {totalAssets > 0 && phase === 'loading' && (
          <div style={{
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.8rem',
            marginBottom: '0.5rem'
          }}>
            {loadedAssets} / {totalAssets} assets loaded
          </div>
        )}

        {/* Current Asset */}
        {currentAsset && (phase === 'loading' || phase === 'profiling') && (
          <div style={{
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '0.75rem',
            height: '1rem',
            overflow: 'hidden'
          }}>
            {currentAsset}
          </div>
        )}

        {/* Performance Profiler Progress */}
        {profilerProgress !== null && phase === 'profiling' && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: 'rgba(187, 134, 252, 0.1)',
            border: '1px solid rgba(187, 134, 252, 0.3)',
            borderRadius: '8px'
          }}>
            <div style={{
              color: '#bb86fc',
              fontWeight: '600',
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
              textAlign: 'center'
            }}>
              🔧 Performance Optimization
            </div>
            <div style={{
              width: '100%',
              height: '4px',
              backgroundColor: 'rgba(187, 134, 252, 0.2)',
              borderRadius: '2px',
              overflow: 'hidden',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                width: `${profilerProgress}%`,
                height: '100%',
                backgroundColor: '#bb86fc',
                borderRadius: '2px',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.75rem'
            }}>
              Finding optimal settings: {Math.round(profilerProgress)}%
            </div>
          </div>
        )}
      </div>

      {/* FIXED: Performance Test Explanation */}
      {phase === 'profiling' && (
        <div style={{
          backgroundColor: 'rgba(187, 134, 252, 0.1)',
          border: '1px solid rgba(187, 134, 252, 0.3)',
          borderRadius: '8px',
          padding: '1rem',
          margin: '1rem',
          maxWidth: '400px',
          width: '90%'
        }}>
          <div style={{
            color: '#bb86fc',
            fontWeight: '600',
            marginBottom: '0.5rem',
            fontSize: '0.9rem'
          }}>
            🚀 Smart Performance Testing
          </div>
          <div style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '0.8rem',
            lineHeight: '1.4'
          }}>
            We start with balanced settings and only adjust if needed. Most devices will get 
            great performance without any downgrade. This ensures the best possible experience 
            for your hardware.
          </div>
        </div>
      )}

      {/* Error Display */}
      {errors.length > 0 && (
        <div style={{
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          border: '1px solid rgba(255, 107, 107, 0.3)',
          borderRadius: '8px',
          padding: '1rem',
          margin: '1rem',
          maxWidth: '400px',
          width: '90%'
        }}>
          <div style={{
            color: '#ff6b6b',
            fontWeight: '600',
            marginBottom: '0.5rem',
            fontSize: '0.9rem'
          }}>
            {errors.length === 1 ? 'Warning:' : 'Warnings:'}
          </div>
          {errors.map((error, index) => (
            <div key={index} style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.8rem',
              marginBottom: '0.25rem'
            }}>
              • {error}
            </div>
          ))}
        </div>
      )}

      {/* Retry Button */}
      {phase === 'error' && onRetry && (
        <button
          onClick={onRetry}
          style={{
            backgroundColor: '#64ffda',
            color: '#000',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            marginTop: '1rem',
            fontSize: '0.9rem'
          }}
        >
          Retry Loading
        </button>
      )}

      {/* Loading Indicator */}
      {(phase === 'loading' || phase === 'profiling') && (
        <div style={{
          marginTop: '2rem',
          display: 'flex',
          gap: '4px'
        }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: getProgressColor(),
                animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite alternate`,
                opacity: 0.7
              }}
            />
          ))}
        </div>
      )}

      {/* Success message when ready */}
      {phase === 'ready' && (
        <div style={{
          marginTop: '1rem',
          color: errors.length > 0 ? '#ffa726' : '#4caf50',
          fontSize: '0.9rem',
          textAlign: 'center',
          fontWeight: '500'
        }}>
          {errors.length > 0 ? '⚠️ Ready with warnings' : '✅ Ready to explore'}
        </div>
      )}

      {/* FIXED: Development Info with Conservative Approach */}
      {import.meta.env.DEV && phase === 'profiling' && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          right: '20px',
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.4)',
          fontSize: '0.7rem'
        }}>
          Conservative testing: starts with good settings, only downgrades if truly needed
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0% { opacity: 0.3; transform: scale(0.8); }
            100% { opacity: 1; transform: scale(1.2); }
          }
        `}
      </style>
    </div>
  );
};

export default EnhancedLoadingScreen;