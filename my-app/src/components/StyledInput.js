import React from 'react';
import './StyledInput.css';

const StyledInput = ({ label, type = 'text', value, onChange, placeholder, ...props }) => (
  <div className="styled-input-container">
    {label && <label className="styled-input-label">{label}</label>}
    <input
      className="styled-input"
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      {...props}
    />
  </div>
);

export default StyledInput;
