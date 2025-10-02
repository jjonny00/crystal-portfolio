import React from 'react';
import styles from './SongView.module.css';

const SaveIcon = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
    <path d="M4 2a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V6.83a2 2 0 0 0-.59-1.41l-2.83-2.83A2 2 0 0 0 13.17 2H4zm0 2h9v4H4V4zm0 6h12v6H4v-6zm3 2v2h6v-2H7z" />
  </svg>
);

const MoreIcon = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
    <path d="M4.5 10a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm7 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm5.5 1.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
  </svg>
);

const PlayIcon = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
    <path d="M6.5 4.5a1 1 0 0 1 1.52-.85l7 4.5a1 1 0 0 1 0 1.7l-7 4.5A1 1 0 0 1 6.5 14.5v-10z" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
    <path d="M10 3a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H4a1 1 0 0 1 0-2h5V4a1 1 0 0 1 1-1z" />
  </svg>
);

const IconButton = ({ icon: Icon, label, className, children }) => (
  <button
    type="button"
    className={`${styles.iconButton} ${className ?? ''}`.trim()}
    aria-label={label}
  >
    {Icon ? <Icon /> : null}
    {children}
  </button>
);

const SongView = () => (
  <div className={styles.songView}>
    <div className={styles.topToolbar}>
      <span className={styles.topToolbarTitle}>Timeline</span>
      <div className={styles.topToolbarActions}>
        <IconButton icon={SaveIcon} label="Save" />
        <IconButton icon={MoreIcon} label="More options" />
      </div>
    </div>

    <div className={styles.primaryContainer} />

    <div className={`${styles.bottomToolbar} ${styles.controlsRow}`}>
      <IconButton icon={PlayIcon} label="Play" className={styles.playButton} />
      <div className={styles.bpmDropdown} role="button" tabIndex={0} aria-label="Tempo">
        120 BPM
      </div>
      <IconButton
        icon={PlusIcon}
        label="Add Loop"
        className={styles.iconButtonLabeled}
      >
        <span className={styles.plusButtonText}>+Loop</span>
      </IconButton>
      <IconButton
        icon={PlusIcon}
        label="Add Row"
        className={styles.iconButtonLabeled}
      >
        <span className={styles.plusButtonText}>+Row</span>
      </IconButton>
      <IconButton
        icon={PlusIcon}
        label="Add Track"
        className={styles.iconButtonLabeled}
      >
        <span className={styles.plusButtonText}>+Track</span>
      </IconButton>
    </div>

    <div className={styles.instrumentControls}>Instrument Controls Area</div>
  </div>
);

export default SongView;
