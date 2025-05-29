import React from 'react';
import './StyledButton.css';

const StyledButton = ({ children, onClick, disabled }) => (
  <button className="styled-button" onClick={onClick} disabled={disabled}>
    {children}
  </button>
);

export default StyledButton;
