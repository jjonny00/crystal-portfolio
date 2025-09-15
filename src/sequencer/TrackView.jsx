import React from 'react';

const TrackView = ({
  tracks,
  currentStep,
  onToggleStep,
  activeTrackIds,
  isPlaying,
  songSections,
  currentSection
}) => {
  const stepsPerTrack = tracks[0]?.steps?.length ?? 16;
  const gridTemplateColumns = `160px repeat(${stepsPerTrack}, minmax(0, 1fr))`;

  return (
    <div className="track-view">
      <div className="track-view__header">
        <h2 className="track-view__title">Track View</h2>
        <p className="track-view__subtitle">Toggle steps to program each pattern.</p>
      </div>

      <div className="track-view__grid">
        <div className="track-view__row track-view__row--header" style={{ gridTemplateColumns }}>
          <div className="track-view__cell track-view__cell--label">Track</div>
          {Array.from({ length: stepsPerTrack }).map((_, stepIndex) => (
            <div
              key={`step-label-${stepIndex}`}
              className={`track-view__cell track-view__cell--step-label ${
                stepIndex === currentStep ? 'is-current' : ''
              }`}
            >
              {stepIndex + 1}
            </div>
          ))}
        </div>

        {tracks.map((track, trackIndex) => {
          const steps = track.steps ?? [];
          const trackKey = track.id ?? trackIndex;
          const trackName = track.name ?? `Track ${trackIndex + 1}`;
          const isEnabledInSection = songSections[currentSection]?.[trackIndex] !== false;

          return (
            <div
              key={trackKey}
              className={`track-view__row ${!isEnabledInSection ? 'is-muted' : ''}`}
              style={{ gridTemplateColumns }}
            >
              <div className="track-view__cell track-view__cell--label">{trackName}</div>
              {steps.map((isActive, stepIndex) => {
                const isCurrentStep = stepIndex === currentStep;
                const isTriggering =
                  isActive &&
                  isCurrentStep &&
                  isPlaying &&
                  activeTrackIds.includes(trackKey);

                return (
                  <button
                    key={`track-${trackIndex}-step-${stepIndex}`}
                    type="button"
                    className={`track-view__cell track-view__cell--step ${
                      isActive ? 'is-active' : ''
                    } ${isCurrentStep ? 'is-current' : ''} ${
                      isTriggering ? 'is-triggered' : ''
                    }`}
                    onClick={() => onToggleStep(trackIndex, stepIndex)}
                    aria-pressed={isActive}
                    aria-label={`${trackName} step ${stepIndex + 1} ${
                      isActive ? 'on' : 'off'
                    }`}
                  >
                    <span className="track-view__cell-indicator" />
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrackView;
