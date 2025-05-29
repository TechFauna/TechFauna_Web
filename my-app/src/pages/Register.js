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

  const handleRegister = async (e) => {
    e.preventDefault();
    const { data: user, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
  
    if (error) {
      setErrorMessage('Erro ao cadastrar. Email já utilizado ou dados inválidos.');
    } else {
      // Salvar o perfil na tabela "perfil"
      const { error: profileError } = await supabase
        .from('perfil')
        .insert({
          id_user: user.user?.id,
          nome: name,
          email,
        });
  
      if (profileError) {
        setErrorMessage('Erro ao salvar dados no perfil. Tente novamente.');
      } else {
        setErrorMessage('');
        setSuccessMessage('Cadastro realizado com sucesso! Redirecionando...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    }
  };
  
  return (
    <div className="register-container">
      <div className="register-card">
        <h2>Registrar</h2>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
          <button type="submit">Cadastrar</button>
        </form>
      </div>
    </div>
  );
}

export default Register;
