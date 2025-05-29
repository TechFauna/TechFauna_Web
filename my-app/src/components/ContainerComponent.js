import React from 'react';
import './ContainerComponent.css';

const ContainerComponent = ({ children }) => {
  return <div className="container">{children}</div>;
};

export default ContainerComponent;
