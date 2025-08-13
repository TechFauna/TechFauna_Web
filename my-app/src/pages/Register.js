// Register.js
import React, { useState } from 'react';
import supabase from '../supabaseCliente';
import './Register.css';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const { data: user, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      setErrorMessage('Erro ao cadastrar. Email já utilizado ou dados inválidos.');
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from('perfil')
      .insert({ id_user: user.user?.id, nome: name, email });

    if (profileError) {
      setErrorMessage('Erro ao salvar dados no perfil. Tente novamente.');
    } else {
      setSuccessMessage('Cadastro realizado com sucesso! Redirecionando...');
      setTimeout(() => { window.location.href = '/login'; }, 1200);
    }
    setLoading(false);
  };

  return (
    <div className="register-container">
      <div className="auth-card">
        <div className="brand">
          <div className="brand-mark">TF</div>
          <div className="brand-name">TechFauna</div>
        </div>

        <h2>Criar conta</h2>

        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}

        <form className="auth-form" onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Crie uma senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <button className="button-primary" type="submit" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;
