# Performance Test vs Runtime Differences

The benchmark scene used by `PerformanceManagerV2` mirrors the runtime **medium** profile but intentionally simplifies a few details. Use this list to keep the test scene and runtime visuals in sync.

## Medium Tier Alignment
- Removed advanced PBR features (`transmission`, `clearcoat`, `iridescence`) for medium profile to match `MaterialManager`.
- Directional and point light intensities now match values from `crystalConfig.js`.

## Remaining Differences
- The test scene only applies a bloom pass. Runtime medium also enables noise and vignette effects which are omitted here for simplicity.
- Runtime uses additional lights (spot light, pulsing omni light) that are not recreated in the benchmark.
- Bloom in the test uses `UnrealBloomPass` whereas runtime uses the react-postprocessing `Bloom` effect.

Documenting these gaps helps future performance tuning stay aligned with gameplay visuals.
