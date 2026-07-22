// src/components/layout/ScrollablePortfolio.jsx

import React, { useEffect, useRef, useState } from 'react';
import HeroSection from '../sections/HeroSection';
import ProjectFocusSection from '../sections/ProjectFocusSection';
import AboutSection from '../sections/AboutSection';
import { projects } from '../../data/projects';
import { useLayoutConfig } from '../../hooks/useLayoutConfig';

const SECTION_SETTLE_DELAY_MS = 220;

const ScrollablePortfolio = ({
  snapSpeed = 'medium',
  hideContent = false,
  viewMode = 'overview',
  activeProjectId = null,
  onActiveProjectChange = null,
  onOpenCaseStudy = null,
  onBackToProject = null,
  onSettledSectionChange = null
}) => {
  const { variant } = useLayoutConfig();
  const isMobileViewport = variant === 'mobile';
  const containerRef = useRef(null);
  const settleTimeoutRef = useRef(null);

  const [settledSectionId, setSettledSectionId] = useState('hero');
  const overviewInteractionMode = settledSectionId === 'overview';

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const container = document.querySelector('.scroll-container');
      if (container) {
        container.classList.remove('fast-snap', 'medium-snap', 'slow-snap', 'extra-slow-snap', 'no-snap');

        const speedClass = snapSpeed === 'no-snap'
          ? 'no-snap'
          : `${snapSpeed}-snap`;
        container.classList.add(speedClass);

        if (import.meta.env.DEV) console.log('🎯 Applied snap speed:', snapSpeed);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [snapSpeed]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const sections = Array.from(container.querySelectorAll(':scope > div > section[id]'));
    if (!sections.length) return undefined;

    const getClosestSectionId = () => {
      const containerRect = container.getBoundingClientRect();
      const viewportMidpoint = containerRect.top + containerRect.height / 2;

      let closestId = sections[0].id;
      let closestDistance = Number.POSITIVE_INFINITY;

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const sectionMidpoint = rect.top + rect.height / 2;
        const distance = Math.abs(sectionMidpoint - viewportMidpoint);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestId = section.id;
        }
      });

      return closestId;
    };

    const scheduleSettle = () => {
      const candidateId = getClosestSectionId();

      setSettledSectionId(null);

      if (settleTimeoutRef.current) {
        clearTimeout(settleTimeoutRef.current);
      }

      settleTimeoutRef.current = setTimeout(() => {
        setSettledSectionId(candidateId);
      }, SECTION_SETTLE_DELAY_MS);
    };

    scheduleSettle();

    container.addEventListener('scroll', scheduleSettle, { passive: true });

    return () => {
      container.removeEventListener('scroll', scheduleSettle);
      if (settleTimeoutRef.current) {
        clearTimeout(settleTimeoutRef.current);
      }
    };
  }, []);

  // Relay the settled section up so App-level UI (e.g. the About scrim) can stay
  // perfectly in sync with the section the content layer has settled on — this is
  // the same signal that drives each section's `visible` prop, so it responds
  // identically to scrolling and to nav-click jumps.
  useEffect(() => {
    onSettledSectionChange?.(settledSectionId);
  }, [onSettledSectionChange, settledSectionId]);

  useEffect(() => {
    if (!onActiveProjectChange) return;
    if (!settledSectionId || settledSectionId === 'hero' || settledSectionId === 'overview' || settledSectionId === 'about') {
      onActiveProjectChange(null);
      return;
    }

    if (settledSectionId.startsWith('project-')) {
      onActiveProjectChange(settledSectionId.replace('project-', ''));
    }
  }, [onActiveProjectChange, settledSectionId]);

  useEffect(() => {
    const container = document.querySelector('.scroll-container');
    if (!container) return;

    const handleWheel = (e) => {
      if (!e.target.closest('.scroll-container')) {
        container.scrollBy({ top: e.deltaY });
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div
      ref={containerRef}
      className="scroll-container"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 10,
        WebkitOverflowScrolling: 'touch',
        backgroundColor: 'transparent',
        pointerEvents: overviewInteractionMode ? 'none' : 'auto',
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
        opacity: hideContent ? 0 : 1
      }}
    >
      <div
        style={{
          width: '100%',
          minHeight: '800vh',
          position: 'relative',
          opacity: hideContent ? 0 : 1
        }}
      >
        <section
          id="hero"
          className="scroll-section"
          data-headline-color="#FFFCEE"
          style={{
            height: '100vh',
            minHeight: '100vh',
            maxHeight: '100vh',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            width: '100%',
            margin: 0,
            padding: 0,
            boxSizing: 'border-box',
            pointerEvents: 'auto'
          }}
        >
          <HeroSection visible={settledSectionId === 'hero'} />
        </section>

        <section
          id="overview"
          className="scroll-section"
          style={{
            scrollSnapAlign: 'start',
            scrollSnapStop: 'normal',
            height: '100vh',
            minHeight: '100vh',
            maxHeight: '100vh',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            width: '100%',
            margin: 0,
            padding: 0,
            boxSizing: 'border-box',
            pointerEvents: 'none'
          }}
        />

        {projects.map((project) => {
          const sectionId = `project-${project.facetKey || project.id}`;
          return (
            <section
              key={project.id}
              id={sectionId}
              className="scroll-section project"
              data-headline-color={project.color}
              style={{
                height: '100vh',
                minHeight: '100vh',
                maxHeight: '100vh',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                width: '100%',
                margin: 0,
                padding: 0,
                boxSizing: 'border-box',
                pointerEvents: 'auto'
              }}
            >
              <ProjectFocusSection
                project={project}
                isMobile={isMobileViewport}
                visible={settledSectionId === sectionId}
                viewMode={viewMode}
                isActiveProject={activeProjectId === (project.facetKey || project.id)}
                onOpenCaseStudy={onOpenCaseStudy}
                onBackToProject={onBackToProject}
              />
            </section>
          );
        })}

        <section
          id="about"
          className="scroll-section"
          style={{
            height: '100vh',
            minHeight: '100vh',
            maxHeight: '100vh',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            width: '100%',
            margin: 0,
            padding: 0,
            boxSizing: 'border-box',
            pointerEvents: 'auto'
          }}
        >
          <AboutSection visible={settledSectionId === 'about'} />
        </section>
      </div>
    </div>
  );
};

export default ScrollablePortfolio;
