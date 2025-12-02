// App.js
import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import supabase from './supabaseCliente';

import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import HomeUser from './pages/HomeUser';
import Recintos from './pages/Recintos';
import SpeciesControl from './pages/SpeciesControl';
import AnimalsControl from './pages/AnimalsControl';
import ControleReprodutivo from './pages/ControleReprodutivo';
import RecintoView from './pages/RecintoView';
import Perfil from './pages/PerfilPage';
import Usuarios from './pages/Usuarios';
import Tasks from './pages/Tasks';

import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) {
        return;
      }
      setUser(data?.session?.user || null);
      setAuthLoading(false);
    };

    syncSession();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) {
        return;
      }
      setUser(session?.user || null);
      setAuthLoading(false);
    });

    return () => {
      active = false;
      subscription?.subscription?.unsubscribe?.();
    };
  }, []);

  const handleLogin = useCallback((nextUser) => {
    setUser(nextUser);
    setAuthLoading(false);
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAuthLoading(false);
  }, []);

  const renderProtected = (element) => {
    if (authLoading) {
      return <div className="route-loading">Carregando...</div>;
    }
    return user ? element : <Navigate to="/login" />;
  };

  return (
    <Router>
      <div className="app with-sidebar">
        <Sidebar user={user} onLogout={handleLogout} />

        <div className="main-content">
          <Routes>
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register />} />

            <Route path="/home-user" element={renderProtected(<HomeUser user={user} />)} />
            <Route path="/recintos" element={renderProtected(<Recintos user={user} />)} />
            <Route path="/recinto-view/:id" element={renderProtected(<RecintoView user={user} />)} />
            <Route path="/species-control" element={renderProtected(<SpeciesControl user={user} />)} />
            <Route path="/animals-control" element={renderProtected(<AnimalsControl user={user} />)} />
            <Route path="/controle-reprodutivo" element={renderProtected(<ControleReprodutivo user={user} />)} />
            <Route path="/perfil" element={renderProtected(<Perfil user={user} />)} />
            <Route path="/usuarios" element={renderProtected(<Usuarios user={user} />)} />
            <Route path="/tasks" element={renderProtected(<Tasks user={user} />)} />

            <Route path="/" element={<Navigate to="/home" />} />
            <Route path="*" element={<Navigate to="/home" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
