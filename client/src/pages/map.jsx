// src/pages/Map.jsx
import React from "react";

const Map = () => {
  return (
    <div style={{ width: "100%", height: "100vh", overflow: "hidden" }}>
      <iframe src="/kaves-map/index.html" title="Kaves Map Editor" style={{ width: "100%", height: "100%", border: "none" }} />

    </div>
  );
};

export default Map;
