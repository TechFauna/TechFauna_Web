import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ user, onLogout }) => {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="mark">TF</div>
        <div className="name">TechFauna</div>
      </div>

      <nav className="nav">
        <NavLink to="/home" className={({isActive}) => (isActive ? 'active' : '')}>
          Início
        </NavLink>

        {user ? (
          <>
            <NavLink to="/home-user" className={({isActive}) => (isActive ? 'active' : '')}>
              Painel
            </NavLink>
            <NavLink to="/recintos" className={({isActive}) => (isActive ? 'active' : '')}>
              Recintos
            </NavLink>
            <NavLink to="/species-control" className={({isActive}) => (isActive ? 'active' : '')}>
              Espécies
            </NavLink>
            
            <NavLink to="/perfil" className={({isActive}) => (isActive ? 'active' : '')}>
              Perfil
            </NavLink>

            <NavLink to="/usuarios" className={({isActive}) => (isActive ? 'active' : '')}>
              Perfil
            </NavLink>
            {user && user.user_metadata?.role === 'admin' && (
              <NavLink to="/usuarios" className={({isActive}) => (isActive ? 'active' : '')}>
                Usuários
              </NavLink>
            )}
          </>
        ) : (
          <>
            <NavLink to="/login" className={({isActive}) => (isActive ? 'active' : '')}>
              Entrar
            </NavLink>
            <NavLink to="/register" className={({isActive}) => (isActive ? 'active' : '')}>
              Cadastrar
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        {user ? <button className="logout-btn" onClick={onLogout}>Sair</button> : null}
      </div>
    </aside>
  );
};

export default Sidebar;
