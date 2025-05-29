// src/components/FlipCard.js
import React, { useState } from 'react';
import './FlipCard.css';

function FlipCard({ title, description }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className={`flip-card ${flipped ? 'flipped' : ''}`}
      onClick={() => setFlipped(!flipped)}
    >
      <div className="flip-card-inner">
        <div className="flip-card-front">
          <h2>{title}</h2>
        </div>
        <div className="flip-card-back">
          <p>{description}</p>
        </div>
      </div>
    </div>
  );
}

export default FlipCard;
