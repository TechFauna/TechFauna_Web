import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseCliente';
import './Recintos.css';

const Recintos = ({ user }) => {
  const navigate = useNavigate();
  const [nomeRecinto, setNomeRecinto] = useState('');
  const [especie, setEspecie] = useState('');
  const [qntAnimais, setQntAnimais] = useState(0);
  const [recintos, setRecintos] = useState([]);
  const [filteredRecintos, setFilteredRecintos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const fetchRecintos = async () => {
      try {
        const { data, error } = await supabase
          .from('recintos')
          .select('*')
          .eq('id_user', user.id);

        if (error) throw error;
        setRecintos(data || []);
        setFilteredRecintos(data || []);
      } catch (err) {
        setError('Erro ao buscar os recintos do usuário.');
        console.error('Erro ao buscar recintos:', err);
      }
    };
    fetchRecintos();
  }, [user.id]);

  const createRecinto = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    try {
      const { data, error } = await supabase
        .from('recintos')
        .insert([{
          nome: nomeRecinto,
          especie: especie,
          qnt_animais: qntAnimais,
          id_user: user.id, // mantém compatível com sua RLS atual
        }])
        .select();

      if (error) throw error;

      const updated = [...recintos, ...data];
      setRecintos(updated);
      setFilteredRecintos(updated);
      setNomeRecinto('');
      setEspecie('');
      setQntAnimais(0);
      setSuccessMessage('Recinto criado com sucesso!');
    } catch (err) {
      setError('Erro ao criar o recinto.');
      console.error('Erro ao criar recinto:', err);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    setFilteredRecintos(
      recintos.filter(
        (r) =>
          r.nome?.toLowerCase().includes(term) ||
          r.especie?.toLowerCase().includes(term)
      )
    );
  };

  const handleViewRecinto = (idRecinto) => navigate(`/recinto-view/${idRecinto}`);

  return (
    <div className="recintos-container">
      <h1>Meus Recintos</h1>
      {error && <p className="error-message">{error}</p>}
      {successMessage && <p className="success-message">{successMessage}</p>}

      <form className="create-recinto-form" onSubmit={createRecinto}>
        <h2>Criar Recinto</h2>

        <label>Nome do recinto</label>
        <input
          type="text"
          placeholder="Ex: Recinto 01 – Felinos"
          value={nomeRecinto}
          onChange={(e) => setNomeRecinto(e.target.value)}
          required
        />

        <label>Espécie (principal)</label>
        <input
          type="text"
          placeholder="Ex: Leão"
          value={especie}
          onChange={(e) => setEspecie(e.target.value)}
          required
        />

        <label>Quantidade</label>
        <input
          type="number"
          min="0"
          placeholder="Ex: 5"
          value={qntAnimais}
          onChange={(e) => setQntAnimais(e.target.value)}
          required
        />

        <button type="submit">Criar Recinto</button>
      </form>

      <div className="search-container">
        <input
          type="text"
          placeholder="Pesquisar por recinto ou espécie..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      <h2>Recintos Criados</h2>
      <div className="recintos-list">
        {filteredRecintos.map((recinto) => (
          <div
            key={recinto.id_recinto}
            className="recinto-card"
            onClick={() => handleViewRecinto(recinto.id_recinto)}
          >
            <h3>{recinto.nome}</h3>
            <p>Espécie: {recinto.especie}</p>
            <p>Quantidade de indivíduos: {recinto.qnt_animais}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recintos;
