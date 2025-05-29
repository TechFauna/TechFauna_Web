import React from 'react';
import './StyledCard.css';

const StyledCard = ({ title, children }) => (
  <div className="styled-card">
    <h3 className="styled-card-title">{title}</h3>
    <div className="styled-card-content">{children}</div>
  </div>
);

export default StyledCard;
