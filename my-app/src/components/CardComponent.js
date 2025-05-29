// components/CardComponent.js
import React from 'react';
import './CardComponent.css';

const CardComponent = ({ title, content, onClick }) => (
  <div className="card" onClick={onClick}>
    <h2>{title}</h2>
    <p>{content}</p>
  </div>
);

export default CardComponent;
