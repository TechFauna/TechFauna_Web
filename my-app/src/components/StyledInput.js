// components/StyledInput.js
import React from 'react';
import './StyledInput.css';

const StyledInput = ({ label, type = 'text', value, onChange, placeholder }) => (
  <div className="styled-input-container">
    <label className="styled-input-label">{label}</label>
    <input
      className="styled-input"
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  </div>
);

export default StyledInput;
