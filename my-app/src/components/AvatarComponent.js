import React from 'react';
import './AvatarComponent.css';

const AvatarComponent = ({ src, alt, size = 100 }) => {
  return (
    <div className="avatar" style={{ width: size, height: size }}>
      <img src={src} alt={alt} />
    </div>
  );
};

export default AvatarComponent;
