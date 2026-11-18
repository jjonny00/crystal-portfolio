// src/caseStudies/flying-axes/VenueSystem.jsx
//
// "Each Venue Could Run Independently": how one venue runs a game, in
// FeatureSection's stage. The coach's tablet and the venue's local edge
// platform, the three things it drives, then the one claim the copy makes
// about the venues together: the same coach-app improvement could be deployed
// to each local system. The build photos run as a strip beneath it, composed
// by the page rather than here, so the rail can bleed.
//
// Local functions only: how each device is wired or talks to the platform
// isn't documented, so none is drawn. Live text at every width. Drawn from
// flyingAxesContent.js (`venues.system`).

import React from 'react';
import './flyingAxes.css';

const VenueSystem = ({ label, hub, devices = [], bridge, locations = [] }) => (
  <figure className="fa-venues">
    <figcaption className="type-subhead-sm fa-venues__label">{label}</figcaption>

    <div className="fa-venues__node">
      <p className="type-subhead-sm fa-venues__hub">{hub.title}</p>
      <p className="type-body-sm fa-venues__muted">{hub.body}</p>
      <ul className="fa-venues__devices">
        {devices.map((device) => (
          <li className="type-body-sm fa-venues__device" key={device.key}>
            <span className="fa-venues__name">{device.name}</span>
            <span className="fa-venues__muted">{device.text}</span>
          </li>
        ))}
      </ul>
    </div>

    {bridge && <p className="type-body-sm fa-venues__bridge">{bridge}</p>}

    {locations.length > 0 && (
      <ul className="fa-venues__locations">
        {locations.map((location) => (
          <li className="type-subhead-sm fa-venues__location" key={location}>
            {location}
          </li>
        ))}
      </ul>
    )}
  </figure>
);

export default VenueSystem;
