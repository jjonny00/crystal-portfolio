import React from "react";
import Ring from "./ui/Ring";

export default function LoaderV2({
  phase,
  blueProgress,
  purpleProgress,
  yellowProgress,
  statusMessage = "",
  currentAsset = ""
}) {
  const showBlue = phase === "testing" ? blueProgress : (blueProgress >= 100 ? 100 : 0);
  const showPurple = phase === "loading" ? purpleProgress : (purpleProgress >= 100 ? 100 : 0);
  const showYellow = Math.min(100, Math.max(0, yellowProgress));

  const renderStatus = () => {
    if (phase === "testing") {
      return statusMessage || "Testing performance...";
    }
    if (phase === "loading") {
      return currentAsset ? `Loading ${currentAsset}` : (statusMessage || "Loading assets...");
    }
    if (phase === "ready") {
      return "Crystal experience ready";
    }
    return statusMessage || "";
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.stack}>
        <Ring size={220} width={10} progress={showYellow} trackOpacity={0.15} color="#FFD84D" label="Overall" />
        <Ring size={180} width={10} progress={showPurple} trackOpacity={0.15} color="#B68CFF" label="Assets" />
        <Ring size={140} width={10} progress={showBlue}   trackOpacity={0.15} color="#5BB8FF" label="Performance" />
      </div>
      <div style={styles.status}>{renderStatus()}</div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0, display: "flex",
    alignItems: "center", justifyContent: "center",
    flexDirection: "column", background: "rgba(0,0,0,0.85)",
    zIndex: 9999
  },
  stack: { position: "relative", width: 240, height: 240 },
  status: { marginTop: 16, color: "#fff", fontFamily: "system-ui, sans-serif", fontSize: 14, opacity: 0.9 }
};
