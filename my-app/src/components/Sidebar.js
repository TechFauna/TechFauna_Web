import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const linkClass = ({ isActive }) => (isActive ? 'active' : '');

const Sidebar = ({ user, onLogout }) => {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="mark">TF</div>
        <div className="name">TechFauna</div>
      </div>

      <nav className="nav">
        <NavLink to="/home" className={linkClass}>
          Inicio
        </NavLink>
        <NavLink to="/tasks" className={linkClass}>
          Tarefas
        </NavLink>

        {user ? (
          <>
            <NavLink to="/home-user" className={linkClass}>
              Painel
            </NavLink>
            <NavLink to="/recintos" className={linkClass}>
              Recintos
            </NavLink>
            <NavLink to="/species-control" className={linkClass}>
              Especies
            </NavLink>
            <NavLink to="/perfil" className={linkClass}>
              Perfil
            </NavLink>
            <NavLink to="/usuarios" className={linkClass}>
              Usuarios
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/login" className={linkClass}>
              Entrar
            </NavLink>
            <NavLink to="/register" className={linkClass}>
              Cadastrar
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        {user ? (
          <button className="logout-btn" onClick={onLogout}>
            Sair
          </button>
        ) : null}
      </div>
    </aside>
  );
};

export default Sidebar;
