// src/machines/crystalStateMachine.js
// State machine for crystal animation and interaction

/**
 * Crystal state constants
 * Define all possible states for the crystal
 */
export const CRYSTAL_STATES = {
  WHOLE: 'whole',           // Crystal is intact
  FRACTURING: 'fracturing', // Crystal is beginning to break apart
  EXPLODING: 'exploding',   // Crystal is moving to exploded position
  EXPLODED: 'exploded',     // Crystal is fully exploded into facets
  PROJECT_SELECTED: 'projectSelected', // A project/facet is selected
  REFORMING: 'reforming'    // Crystal is reforming back to whole
};

/**
 * Crystal event constants
 * Define all possible events that can trigger state transitions
 */
export const CRYSTAL_EVENTS = {
  EXPLODE: 'EXPLODE',               // Trigger explosion
  FRACTURE_COMPLETE: 'FRACTURE_COMPLETE', // Fracturing animation finished
  EXPLOSION_COMPLETE: 'EXPLOSION_COMPLETE', // Explosion animation finished
  SELECT_PROJECT: 'SELECT_PROJECT', // Select a project/facet
  DESELECT_PROJECT: 'DESELECT_PROJECT', // Deselect project
  REFORM: 'REFORM',                 // Trigger reform
  REFORM_COMPLETE: 'REFORM_COMPLETE' // Reform animation finished
};

/**
 * Crystal state machine transition map
 * Defines valid transitions between states
 */
export const crystalStateMachine = {
  [CRYSTAL_STATES.WHOLE]: {
    [CRYSTAL_EVENTS.EXPLODE]: CRYSTAL_STATES.FRACTURING
  },
  [CRYSTAL_STATES.FRACTURING]: {
    [CRYSTAL_EVENTS.FRACTURE_COMPLETE]: CRYSTAL_STATES.EXPLODING
  },
  [CRYSTAL_STATES.EXPLODING]: {
    [CRYSTAL_EVENTS.EXPLOSION_COMPLETE]: CRYSTAL_STATES.EXPLODED
  },
  [CRYSTAL_STATES.EXPLODED]: {
    [CRYSTAL_EVENTS.SELECT_PROJECT]: CRYSTAL_STATES.PROJECT_SELECTED,
    [CRYSTAL_EVENTS.REFORM]: CRYSTAL_STATES.REFORMING
  },
  [CRYSTAL_STATES.PROJECT_SELECTED]: {
    [CRYSTAL_EVENTS.DESELECT_PROJECT]: CRYSTAL_STATES.EXPLODED,
    [CRYSTAL_EVENTS.REFORM]: CRYSTAL_STATES.REFORMING
  },
  [CRYSTAL_STATES.REFORMING]: {
    [CRYSTAL_EVENTS.REFORM_COMPLETE]: CRYSTAL_STATES.WHOLE
  }
};

/**
 * Get next state based on current state and event
 * @param {string} currentState - Current state from CRYSTAL_STATES
 * @param {string} event - Event from CRYSTAL_EVENTS
 * @returns {string} Next state or current state if transition is invalid
 */
export const getNextState = (currentState, event) => {
  const nextState = crystalStateMachine[currentState]?.[event];
  if (!nextState) {
    if (import.meta.env.DEV) console.warn(`Invalid transition: ${currentState} -> ${event}`);
    return currentState;
  }
  return nextState;
};

/**
 * Check if a transition is valid
 * @param {string} currentState - Current state from CRYSTAL_STATES
 * @param {string} event - Event from CRYSTAL_EVENTS
 * @returns {boolean} True if transition is valid
 */
export const isValidTransition = (currentState, event) => {
  return !!crystalStateMachine[currentState]?.[event];
};

/**
 * Get available events for current state
 * @param {string} currentState - Current state from CRYSTAL_STATES
 * @returns {Array} Array of available events
 */
export const getAvailableEvents = (currentState) => {
  return Object.keys(crystalStateMachine[currentState] || {});
};

/**
 * Helper to check if crystal is in an interactive state
 * @param {string} state - Current state from CRYSTAL_STATES
 * @returns {boolean} True if crystal is in a state where interaction is allowed
 */
export const isInteractiveState = (state) => {
  return state === CRYSTAL_STATES.EXPLODED || state === CRYSTAL_STATES.PROJECT_SELECTED;
};

/**
 * Helper to check if crystal is in transition
 * @param {string} state - Current state from CRYSTAL_STATES
 * @returns {boolean} True if crystal is in a transition state
 */
export const isTransitionState = (state) => {
  return state === CRYSTAL_STATES.FRACTURING || 
         state === CRYSTAL_STATES.EXPLODING || 
         state === CRYSTAL_STATES.REFORMING;
};