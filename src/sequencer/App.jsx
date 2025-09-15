import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SongView from './SongView';
import TrackView from './TrackView';
import './sequencer.css';

const STEPS_PER_BAR = 16;

const DEFAULT_TRACKS = [
  {
    id: 'kick',
    name: 'Kick',
    steps: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false]
  },
  {
    id: 'snare',
    name: 'Snare',
    steps: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false]
  },
  {
    id: 'hihat',
    name: 'Hi-Hat',
    steps: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true]
  },
  {
    id: 'bass',
    name: 'Bass',
    steps: [true, false, false, true, false, false, true, false, true, false, false, true, false, false, true, false]
  }
];

const createSongSections = (trackCount, sectionCount = 4) =>
  Array.from({ length: sectionCount }, () => Array(trackCount).fill(true));

const clampSectionIndex = (sectionIndex, sectionCount) => {
  if (sectionCount === 0) return 0;
  return Math.min(sectionIndex, sectionCount - 1);
};

const SequencerApp = () => {
  const [tracks, setTracks] = useState(DEFAULT_TRACKS);
  const [viewMode, setViewMode] = useState('track');
  const [songSections, setSongSections] = useState(() => createSongSections(DEFAULT_TRACKS.length, 4));
  const [currentStep, setCurrentStep] = useState(0);
  const [currentSection, setCurrentSection] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [activeTrackIds, setActiveTrackIds] = useState([]);

  const trackCount = tracks.length;
  const sectionCount = songSections.length;

  useEffect(() => {
    setSongSections((prevSections) => {
      if (prevSections.length === 0) {
        return createSongSections(trackCount, 1);
      }

      let didChange = false;
      const nextSections = prevSections.map((section) => {
        if (section.length === trackCount) return section;

        didChange = true;
        if (section.length < trackCount) {
          return [...section, ...Array(trackCount - section.length).fill(true)];
        }

        return section.slice(0, trackCount);
      });

      return didChange ? nextSections : prevSections;
    });
  }, [trackCount]);

  useEffect(() => {
    setCurrentSection((prev) => clampSectionIndex(prev, sectionCount));
  }, [sectionCount]);

  const stepDuration = useMemo(() => {
    return ((60 / bpm) / 4) * 1000;
  }, [bpm]);

  useEffect(() => {
    if (!isPlaying) return undefined;

    const totalSections = sectionCount || 1;
    const interval = setInterval(() => {
      setCurrentStep((prevStep) => {
        const nextStep = (prevStep + 1) % STEPS_PER_BAR;
        if (nextStep === 0) {
          setCurrentSection((prevSection) => (prevSection + 1) % totalSections);
        }
        return nextStep;
      });
    }, stepDuration);

    return () => clearInterval(interval);
  }, [isPlaying, stepDuration, sectionCount]);

  useEffect(() => {
    if (!isPlaying) {
      setActiveTrackIds([]);
      return;
    }

    const section = songSections[currentSection];
    if (!section) {
      setActiveTrackIds([]);
      return;
    }

    const triggeredTracks = [];

    tracks.forEach((track, trackIndex) => {
      const enabledInSection = section[trackIndex];
      if (!enabledInSection) return;

      const isStepActive = Boolean(track.steps?.[currentStep]);
      if (isStepActive) {
        triggeredTracks.push(track.id ?? trackIndex);
      }
    });

    setActiveTrackIds(triggeredTracks);
  }, [tracks, songSections, currentSection, currentStep, isPlaying]);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev;
      if (!prev) {
        setCurrentStep(0);
        setCurrentSection(0);
      }
      return next;
    });
  }, []);

  const handleBpmChange = useCallback((event) => {
    const value = Number(event.target.value);
    if (Number.isFinite(value) && value > 0) {
      setBpm(Math.max(40, Math.min(240, value)));
    }
  }, []);

  const handleToggleStep = useCallback((trackIndex, stepIndex) => {
    setTracks((prevTracks) =>
      prevTracks.map((track, index) => {
        if (index !== trackIndex) return track;
        const steps = track.steps ?? Array(STEPS_PER_BAR).fill(false);
        const nextSteps = steps.map((step, idx) => (idx === stepIndex ? !step : step));
        return { ...track, steps: nextSteps };
      })
    );
  }, []);

  const handleToggleSongSection = useCallback((sectionIndex, trackIndex) => {
    setSongSections((prevSections) =>
      prevSections.map((section, idx) => {
        if (idx !== sectionIndex) return section;
        return section.map((value, trackIdx) =>
          trackIdx === trackIndex ? !value : value
        );
      })
    );
  }, []);

  const handleAddSection = useCallback(() => {
    setSongSections((prevSections) => [
      ...prevSections,
      Array(trackCount).fill(true)
    ]);
  }, [trackCount]);

  const handleSelectSection = useCallback((sectionIndex) => {
    setCurrentSection(sectionIndex);
    setCurrentStep(0);
  }, []);

  return (
    <div className="sequencer-app">
      <header className="sequencer-header">
        <h1 className="sequencer-title">Sequencer Instrument</h1>
        <div className="sequencer-controls">
          <button
            type="button"
            className="sequencer-button"
            onClick={togglePlay}
          >
            {isPlaying ? 'Stop' : 'Play'}
          </button>

          <label>
            <span>BPM</span>
            <input
              type="number"
              value={bpm}
              min={40}
              max={240}
              onChange={handleBpmChange}
            />
          </label>

          <div className="sequencer-status">
            Section {currentSection + 1} / {Math.max(sectionCount, 1)}
          </div>
        </div>
      </header>

      <div className="sequencer-tabs" role="tablist" aria-label="View mode">
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === 'track'}
          className={`sequencer-tab ${viewMode === 'track' ? 'is-active' : ''}`}
          onClick={() => setViewMode('track')}
        >
          Track View
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === 'song'}
          className={`sequencer-tab ${viewMode === 'song' ? 'is-active' : ''}`}
          onClick={() => setViewMode('song')}
        >
          Song View
        </button>
      </div>

      <main className="sequencer-content">
        {viewMode === 'track' ? (
          <TrackView
            tracks={tracks}
            currentStep={currentStep}
            onToggleStep={handleToggleStep}
            activeTrackIds={activeTrackIds}
            isPlaying={isPlaying}
            songSections={songSections}
            currentSection={currentSection}
          />
        ) : (
          <SongView
            tracks={tracks}
            songSections={songSections}
            onToggleCell={handleToggleSongSection}
            onAddSection={handleAddSection}
            currentSection={currentSection}
            onSelectSection={handleSelectSection}
          />
        )}
      </main>
    </div>
  );
};

export default SequencerApp;
