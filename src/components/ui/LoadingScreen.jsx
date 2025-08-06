import React from 'react';

const LoadingScreen = ({ progress, task, isIndeterminate }) => {
  return (
    <div className="loading-screen">
      {isIndeterminate ? (
        <div className="loading-indeterminate">
          <div className="spinner" />
          <p>Preparing your experience...</p>
        </div>
      ) : (
        <div className="loading-determinate">
          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%`, transition: 'width 0.3s ease' }}
              />
            </div>
            <div className="progress-text">
              <span className="task-name">{task}</span>
              <span className="progress-percent">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingScreen;
