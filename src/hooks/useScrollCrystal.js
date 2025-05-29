// src/hooks/useScrollCrystal.js - Enhanced with smooth intro camera transitions
// Updated scroll sections for better intro experience

// src/hooks/useScrollCrystal.js - Updated with inline section definitions
// Enhanced with smooth intro camera transitions

import { useState, useEffect, useCallback, useRef } from 'react';
import { CRYSTAL_STATES, CRYSTAL_EVENTS, getNextState } from '../machines/crystalStateMachine';

/**
 * Scroll sections configuration with smooth intro experience
 */
const SCROLL_SECTIONS = {
  INTRO_CLOSE: {
    key: 'intro-close',
    index: 0,
    crystalState: CRYSTAL_STATES.WHOLE,
    cameraState: 'INTRO_CLOSE',
    threshold: 0,
    duration: 0.05,
    title: 'Multifaceted Designer',
    subtitle: 'Jon Shaw'
  },
  
  INTRO: {
    key: 'intro',
    index: 1,
    crystalState: CRYSTAL_STATES.WHOLE,
    cameraState: 'INTRO',
    threshold: 0.05,
    duration: 0.15,
    title: 'Multifaceted Designer',
    subtitle: 'Scroll to explore',
    enableScrollTransition: true
  },
  
  PROJECTS_OVERVIEW: {
    key: 'projects-overview', 
    index: 2,
    crystalState: CRYSTAL_STATES.EXPLODED,
    cameraState: 'EXPLOSION',
    threshold: 0.2,
    duration: 0.05,
    title: 'Featured Projects',
    subtitle: 'Explore my work across six design facets'
  },
  
  PROJECT_EMPATHY: {
    key: 'project-empathy',
    index: 3,
    crystalState: CRYSTAL_STATES.PROJECT_SELECTED,
    cameraState: 'PROJECT_EMPATHY',
    threshold: 0.25,
    duration: 0.08,
    title: 'Empathy',
    subtitle: 'Understanding user needs and pain points',
    projectKey: 'empathy'
  },
  
  PROJECT_NARRATIVE: {
    key: 'project-narrative',
    index: 4,
    crystalState: CRYSTAL_STATES.PROJECT_SELECTED,
    cameraState: 'PROJECT_NARRATIVE',
    threshold: 0.33,
    duration: 0.08,
    title: 'Narrative',
    subtitle: 'Guiding teams through compelling stories',
    projectKey: 'narrative'
  },
  
  PROJECT_CRAFT: {
    key: 'project-craft',
    index: 5,
    crystalState: CRYSTAL_STATES.PROJECT_SELECTED,
    cameraState: 'PROJECT_CRAFT',
    threshold: 0.41,
    duration: 0.08,
    title: 'Craft',
    subtitle: 'Precision in every design detail',
    projectKey: 'craft'
  },
  
  PROJECT_SYSTEM: {
    key: 'project-system',
    index: 6,
    crystalState: CRYSTAL_STATES.PROJECT_SELECTED,
    cameraState: 'PROJECT_SYSTEM',
    threshold: 0.49,
    duration: 0.08,
    title: 'System',
    subtitle: 'Building scalable design systems',
    projectKey: 'system'
  },
  
  PROJECT_LEADERSHIP: {
    key: 'project-leadership',
    index: 7,
    crystalState: CRYSTAL_STATES.PROJECT_SELECTED,
    cameraState: 'PROJECT_LEADERSHIP',
    threshold: 0.57,
    duration: 0.08,
    title: 'Leadership',
    subtitle: 'Empowering teams to do their best work',
    projectKey: 'leadership'
  },
  
  PROJECT_EXPLORATION: {
    key: 'project-exploration',
    index: 8,
    crystalState: CRYSTAL_STATES.PROJECT_SELECTED,
    cameraState: 'PROJECT_EXPLORATION',
    threshold: 0.65,
    duration: 0.08,
    title: 'Exploration',
    subtitle: 'Finding opportunities in ambiguity',
    projectKey: 'exploration'
  },
  
  ABOUT: {
    key: 'about',
    index: 9,
    crystalState: CRYSTAL_STATES.WHOLE,
    cameraState: 'ABOUT',
    threshold: 0.73,
    duration: 0.12,
    title: 'About Me',
    subtitle: 'The story behind the facets'
  },
  
  FOOTER: {
    key: 'footer',
    index: 10,
    crystalState: CRYSTAL_STATES.WHOLE,
    cameraState: 'FOOTER',
    threshold: 0.85,
    duration: 0.15,
    title: 'Let\'s Connect',
    subtitle: 'Ready to create something beautiful together?'
  }
};