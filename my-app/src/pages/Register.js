// Register.js
import React, { useState } from 'react';
import supabase from '../supabaseCliente';
import './Register.css';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Gera código único para a empresa
  const generateCompanyCode = () => {
    return 'ORG-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Validações
    if (!userRole) {
      setErrorMessage('Selecione uma função (Dono ou Funcionário).');
      setLoading(false);
      return;
    }

    if (userRole === 'owner' && !companyName.trim()) {
      setErrorMessage('Informe o nome da empresa.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, full_name: name } },
      });

      if (error) {
        setErrorMessage('Erro ao cadastrar. Email já utilizado ou dados inválidos.');
        setLoading(false);
        return;
      }

      const userId = data.user?.id;
      let organizationId = null;

      // Se for dono, criar a organização primeiro
      if (userRole === 'owner') {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: companyName.trim(),
            code: generateCompanyCode(),
            owner_id: userId,
          })
          .select()
          .single();

        if (orgError) {
          console.error('Erro ao criar organização:', orgError);
          setErrorMessage('Erro ao criar a empresa. Tente novamente.');
          setLoading(false);
          return;
        }

        organizationId = orgData.id;
      }

      // Inserir perfil na tabela profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          name: name,
          full_name: name,
          user_role: userRole === 'owner' ? 'admin' : 'funcionario',
          organization_id: organizationId,
        });

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError);
        setErrorMessage('Erro ao salvar dados no perfil. Tente novamente.');
      } else {
        setSuccessMessage('Cadastro realizado com sucesso! Redirecionando...');
        setTimeout(() => { window.location.href = '/login'; }, 1200);
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
      setErrorMessage('Erro inesperado ao cadastrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
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

          <select
            value={userRole}
            onChange={(e) => setUserRole(e.target.value)}
            required
            className="role-select"
          >
            <option value="">Selecione sua função</option>
            <option value="owner">Dono de empresa</option>
            <option value="employee">Funcionário</option>
          </select>

          {userRole === 'owner' && (
            <input
              type="text"
              placeholder="Nome da empresa"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              autoComplete="organization"
            />
          )}

          {userRole === 'employee' && (
            <p className="info-message">
              Como funcionário, você precisará receber um convite de uma empresa para acessar os dados.
            </p>
          )}

          <button className="button-primary" type="submit" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;
