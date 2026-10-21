// src/lib/heroReformClock.js
//
// When the crystal last started reforming (performance.now ms), published by the
// scene (UnifiedCrystalScene) the frame its reform clock starts. The hero copy
// (HeroSection) reads it as it comes back, to hold the headline until the
// gathering fragments are nearly whole (HERO_RETURN_CINEMATIC.headlineAt) rather
// than fading it in over them.

let reformStartedAt = null;

export const markHeroReformStart = (nowMs) => {
  reformStartedAt = Number.isFinite(nowMs) ? nowMs : null;
};

export const getHeroReformStart = () => reformStartedAt;
