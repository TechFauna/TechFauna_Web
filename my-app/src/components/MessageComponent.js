import React from 'react';
import './MessageComponent.css';

const MessageComponent = ({ message, type }) => {
  return <p className={`message ${type}`}>{message}</p>;
};

export default MessageComponent;
