import React, { useState } from 'react';
import supabase from '../supabaseCliente';
import './Login.css';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage('Erro ao fazer login. Verifique suas credenciais.');
      } else {
        setErrorMessage('');
        setSuccessMessage('Login realizado com sucesso! Redirecionando...');
        
        // Chama o callback para atualizar o estado do usuário no App.js
        onLogin(data.user);

        setTimeout(() => {
          window.location.href = '/home-user';
        }, 2000);
      }
    } catch (err) {
      console.error('Erro inesperado ao fazer login:', err);
      setErrorMessage('Erro inesperado ao fazer login.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login</h2>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Entrar</button>
        </form>
        <p>
          Esqueceu sua senha?{' '}
          <a
            href="#"
            role="button"
            onClick={() =>
              alert('Função de redefinição de senha ainda não implementada.')
            }
          >
            Clique aqui
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;
