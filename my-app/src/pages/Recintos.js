import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseCliente';
import './Recintos.css';

const Recintos = ({ user }) => {
  const navigate = useNavigate();
  const [nomeRecinto, setNomeRecinto] = useState('');
  const [tipoAmbiente, setTipoAmbiente] = useState('');
  const [capacidade, setCapacidade] = useState('');
  const [recintos, setRecintos] = useState([]);
  const [filteredRecintos, setFilteredRecintos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Buscar perfil do usuário logado para obter organization_id
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, organization_id')
        .eq('id', user.id)
        .single();
      if (!error && data) {
        setUserProfile(data);
      }
      setProfileLoaded(true);
    };
    fetchUserProfile();
  }, [user]);

  // Buscar recintos filtrados por organização
  useEffect(() => {
    const fetchRecintos = async () => {
      if (!userProfile?.organization_id) {
        setRecintos([]); // Limpar dados se não tem organização
        setFilteredRecintos([]);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('enclosures')
          .select('*')
          .eq('organization_id', userProfile.organization_id)
          .order('name', { ascending: true });

        if (error) throw error;
        setRecintos(data || []);
        setFilteredRecintos(data || []);
      } catch (err) {
        setError('Erro ao buscar os recintos.');
        console.error('Erro ao buscar recintos:', err);
      }
    };
    fetchRecintos();
  }, [userProfile]);

  const createRecinto = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    try {
      const { data, error } = await supabase
        .from('enclosures')
        .insert([{
          name: nomeRecinto,
          environment_type: tipoAmbiente || null,
          capacity: capacidade ? parseInt(capacidade, 10) : null,
          status: 'ativo',
          organization_id: userProfile?.organization_id,
        }])
        .select();

      if (error) throw error;

      const updated = [...recintos, ...data];
      setRecintos(updated);
      setFilteredRecintos(updated);
      setNomeRecinto('');
      setTipoAmbiente('');
      setCapacidade('');
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
          r.name?.toLowerCase().includes(term) ||
          r.environment_type?.toLowerCase().includes(term)
      )
    );
  };

  const handleViewRecinto = (idRecinto) => navigate(`/recinto-view/${idRecinto}`);

  // Aguardar carregar o perfil
  if (!profileLoaded) {
    return (
      <div className="recintos-container">
        <h1>Meus Recintos</h1>
        <p style={{ textAlign: 'center', padding: '40px' }}>Carregando...</p>
      </div>
    );
  }

  // Se o usuário não está vinculado a uma empresa, mostrar mensagem
  if (!userProfile?.organization_id) {
    return (
      <div className="recintos-container">
        <h1>Meus Recintos</h1>
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fff3cd', borderRadius: '8px', margin: '20px auto', maxWidth: '600px' }}>
          <h2 style={{ color: '#856404' }}>⚠️ Acesso Restrito</h2>
          <p style={{ color: '#856404' }}>Você não está vinculado a nenhuma empresa.</p>
          <p style={{ color: '#856404' }}>Para acessar esta funcionalidade, solicite um convite de uma empresa ou crie sua própria empresa.</p>
        </div>
      </div>
    );
  }

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

        <label>Tipo de ambiente</label>
        <input
          type="text"
          placeholder="Ex: Savana, Aquático, Floresta"
          value={tipoAmbiente}
          onChange={(e) => setTipoAmbiente(e.target.value)}
        />

        <label>Capacidade</label>
        <input
          type="number"
          min="0"
          placeholder="Ex: 10"
          value={capacidade}
          onChange={(e) => setCapacidade(e.target.value)}
        />

        <button type="submit">Criar Recinto</button>
      </form>

      <div className="search-container">
        <input
          type="text"
          placeholder="Pesquisar por recinto ou tipo..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      <h2>Recintos Criados</h2>
      <div className="recintos-list">
        {filteredRecintos.map((recinto) => (
          <div
            key={recinto.id}
            className="recinto-card"
            onClick={() => handleViewRecinto(recinto.id)}
          >
            <h3>{recinto.name}</h3>
            <p>Tipo: {recinto.environment_type || 'Não definido'}</p>
            <p>Capacidade: {recinto.capacity || 'Não definida'}</p>
            <p>Status: {recinto.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recintos;
