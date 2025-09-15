import React from 'react';

const SongView = ({
  tracks,
  songSections,
  onToggleCell,
  onAddSection,
  currentSection,
  onSelectSection
}) => {
  const sectionCount = songSections.length;
  const gridTemplateColumns = `160px repeat(${sectionCount}, minmax(0, 1fr))`;

  return (
    <div className="song-view">
      <div className="song-view__header">
        <h2 className="song-view__title">Song View</h2>
        <button
          type="button"
          className="song-view__add-section"
          onClick={onAddSection}
        >
          + Section
        </button>
      </div>

      {sectionCount === 0 ? (
        <div className="song-view__empty">
          No sections yet. Add a section to start arranging your song.
        </div>
      ) : (
        <div className="song-view__grid">
          <div className="song-view__row song-view__row--header" style={{ gridTemplateColumns }}>
            <div className="song-view__cell song-view__cell--label">Track</div>
            {songSections.map((_, sectionIndex) => (
              <button
                key={`section-label-${sectionIndex}`}
                type="button"
                className={`song-view__cell song-view__cell--section ${
                  sectionIndex === currentSection ? 'is-current' : ''
                }`}
                onClick={() => onSelectSection?.(sectionIndex)}
              >
                Section {sectionIndex + 1}
              </button>
            ))}
          </div>

          {tracks.map((track, trackIndex) => (
            <div
              key={track.id ?? trackIndex}
              className="song-view__row"
              style={{ gridTemplateColumns }}
            >
              <div className="song-view__cell song-view__cell--label">
                {track.name ?? `Track ${trackIndex + 1}`}
              </div>
              {songSections.map((section, sectionIndex) => {
                const isEnabled = Boolean(section?.[trackIndex]);
                const isCurrent = sectionIndex === currentSection;
                return (
                  <button
                    key={`section-${sectionIndex}-track-${trackIndex}`}
                    type="button"
                    className={`song-view__cell song-view__cell--toggle ${
                      isEnabled ? 'is-active' : ''
                    } ${isCurrent ? 'is-current' : ''}`}
                    onClick={() => onToggleCell(sectionIndex, trackIndex)}
                    aria-pressed={isEnabled}
                    aria-label={`${track.name ?? `Track ${trackIndex + 1}`} ${
                      isEnabled ? 'enabled' : 'muted'
                    } in section ${sectionIndex + 1}`}
                  >
                    <span className="song-view__cell-indicator" />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SongView;
