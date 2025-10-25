// App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import supabase from './supabaseCliente';

import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import HomeUser from './pages/HomeUser';
import Recintos from './pages/Recintos';
import SpeciesControl from './pages/SpeciesControl';
import ControleReprodutivo from './pages/ControleReprodutivo';
import RecintoView from './pages/RecintoView';
import Perfil from './pages/PerfilPage';
import Usuarios from './pages/Usuarios'; // novo import

import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    // unsubscribe com segurança
    return () => data?.subscription?.unsubscribe?.();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <Router>
      <div className="app with-sidebar">
        {/* Sidebar sempre visível (com links de login/cadastro se deslogado) */}
        <Sidebar user={user} onLogout={handleLogout} />

        <div className="main-content">
          <Routes>
            {/* públicas */}
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login onLogin={(u) => setUser(u)} />} />
            <Route path="/register" element={<Register />} />

            {/* protegidas (evitam erro ao entrar direto na URL sem user) */}
            <Route path="/home-user" element={user ? <HomeUser user={user} /> : <Navigate to="/login" />} />
            <Route path="/recintos" element={user ? <Recintos user={user} /> : <Navigate to="/login" />} />
            <Route path="/recinto-view/:id" element={user ? <RecintoView user={user} /> : <Navigate to="/login" />} />
            <Route path="/species-control" element={user ? <SpeciesControl user={user} /> : <Navigate to="/login" />} />
            <Route path="/controle-reprodutivo" element={user ? <ControleReprodutivo user={user} /> : <Navigate to="/login" />} />
            <Route path="/perfil" element={user ? <Perfil user={user} /> : <Navigate to="/login" />} />
            <Route
              path="/usuarios"
              element={
                user && user.user_metadata?.role === 'admin'
                  ? <Usuarios user={user} />
                  : <Navigate to="/usuarios" />
              }
            />

            {/* defaults */}
            <Route path="/" element={<Navigate to="/home" />} />
            <Route path="*" element={<Navigate to="/home" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
