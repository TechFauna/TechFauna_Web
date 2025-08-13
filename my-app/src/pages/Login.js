import React, { useState } from 'react';
import supabase from '../supabaseCliente';
import './Login.css';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setErrorMessage('Erro ao fazer login. Verifique suas credenciais.');
      } else {
        onLogin?.(data.user);
        setSuccessMessage('Login realizado com sucesso! Redirecionando...');
        setTimeout(() => { window.location.href = '/home-user'; }, 1200);
      }
    } catch (err) {
      console.error('Erro inesperado ao fazer login:', err);
      setErrorMessage('Erro inesperado ao fazer login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="auth-card">
        <div className="brand">
          <div className="brand-mark">TF</div>
          <div className="brand-name">TechFauna</div>
        </div>

        <h2>Entrar</h2>

        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}

        <form className="auth-form" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button className="button-primary" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="helper">
          Esqueceu sua senha?{' '}
          <a href="#" onClick={() => alert('Função de redefinição de senha ainda não implementada.')}>
            Redefinir
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;
