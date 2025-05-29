// Sidebar.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

function Sidebar({ user, onLogout }) {
  return (
    <div className="sidebar">
      {user ? (
        <>
          <Link to="/home-user">Home</Link>
          <Link to="/recintos">Recintos</Link>
          <Link to="/species-control">Espécies</Link>
          <Link to="/controle-reprodutivo">Controle Reprodutivo</Link>
          <button onClick={onLogout}>Logout</button>
        </>
      ) : (
        <>
          <Link to="/home">Home</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Registrar</Link>
        </>
      )}
    </div>
  );
}

export default Sidebar;
