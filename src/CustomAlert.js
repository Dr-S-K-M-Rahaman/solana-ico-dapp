import React from 'react';
import './CustomAlert.css';

const CustomAlert = ({ message, explorerLink, onClose }) => {
  return (
    <div className="custom-alert-container">
      <div className="custom-alert-content">
        <div>{message}</div>
        {explorerLink && (
          <a href={explorerLink} target="_blank" rel="noopener noreferrer">
            View Transaction
          </a>
        )}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default CustomAlert;