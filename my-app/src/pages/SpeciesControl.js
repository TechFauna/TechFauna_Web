// SpeciesControl.js
import React, { useEffect, useState } from 'react';
import supabase from '../supabaseCliente';
import './SpeciesControl.css';

const SpeciesControl = ({ user }) => {
  const [species, setSpecies] = useState([]);
  const [enclosures, setEnclosures] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [newSpecies, setNewSpecies] = useState({
    common_name: '',
    scientific_name: '',
    diet: '',
    conservation_status: '',
    description: '',
    enclosure_id: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

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

  // Buscar espécies com dados do recinto (filtrado por organização)
  useEffect(() => {
    const fetchSpecies = async () => {
      if (!userProfile?.organization_id) {
        setSpecies([]); // Limpar dados se não tem organização
        return;
      }
      const { data, error } = await supabase
        .from('species')
        .select('*, enclosures(id, name)')
        .eq('organization_id', userProfile.organization_id)
        .order('common_name', { ascending: true });
      if (!error && Array.isArray(data)) setSpecies(data);
    };
    fetchSpecies();
  }, [userProfile]);

  // Buscar recintos (enclosures) filtrados por organização
  useEffect(() => {
    const fetchEnclosures = async () => {
      if (!userProfile?.organization_id) {
        setEnclosures([]); // Limpar dados se não tem organização
        return;
      }
      const { data, error } = await supabase
        .from('enclosures')
        .select('id, name')
        .eq('organization_id', userProfile.organization_id)
        .order('name', { ascending: true });
      if (!error) setEnclosures(data || []);
    };
    fetchEnclosures();
  }, [userProfile]);

  const handleSubmitSpecies = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { common_name, scientific_name, diet, conservation_status, description, enclosure_id } = newSpecies;

    // Validar se usuário tem organização
    if (!userProfile?.organization_id) {
      alert('Você precisa estar vinculado a uma empresa para cadastrar espécies.');
      setLoading(false);
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('species')
          .update({
            common_name,
            scientific_name: scientific_name || null,
            diet: diet || null,
            conservation_status: conservation_status || null,
            description: description || null,
            enclosure_id: enclosure_id || null,
          })
          .eq('id', editingId);
        if (error) throw error;

        // Recarregar para obter dados do enclosure
        const { data: updatedData } = await supabase
          .from('species')
          .select('*, enclosures(id, name)')
          .eq('id', editingId)
          .single();

        setSpecies((prev) => prev.map((s) => s.id === editingId ? updatedData : s));
        alert('Espécie atualizada com sucesso!');
      } else {
        const { data, error } = await supabase
          .from('species')
          .insert([{
            common_name,
            scientific_name: scientific_name || null,
            diet: diet || null,
            conservation_status: conservation_status || null,
            description: description || null,
            enclosure_id: enclosure_id || null,
            organization_id: userProfile.organization_id,
          }])
          .select('*, enclosures(id, name)');
        if (error) throw error;
        if (Array.isArray(data)) setSpecies((prev) => [...prev, ...data]);
        alert('Espécie adicionada com sucesso!');
      }

      setNewSpecies({ common_name: '', scientific_name: '', diet: '', conservation_status: '', description: '', enclosure_id: '' });
      setEditingId(null);
    } catch (err) {
      console.error('Erro ao salvar espécie:', err);
      alert('Erro ao salvar espécie: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (specie) => {
    setNewSpecies({
      common_name: specie.common_name || '',
      scientific_name: specie.scientific_name || '',
      diet: specie.diet || '',
      conservation_status: specie.conservation_status || '',
      enclosure_id: specie.enclosure_id || '',
      description: specie.description || '',
    });
    setEditingId(specie.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta espécie?')) return;

    const { error } = await supabase.from('species').delete().eq('id', id);
    if (error) {
      alert('Erro ao excluir espécie.');
      console.error(error);
    } else {
      setSpecies((prev) => prev.filter((s) => s.id !== id));
      alert('Espécie excluída com sucesso!');
    }
  };

  // Aguardar carregar o perfil
  if (!profileLoaded) {
    return (
      <div className="species-control-container">
        <h1 className="page-title">Controle de Espécies</h1>
        <p style={{ textAlign: 'center', padding: '40px' }}>Carregando...</p>
      </div>
    );
  }

  // Se o usuário não está vinculado a uma empresa, mostrar mensagem
  if (!userProfile?.organization_id) {
    return (
      <div className="species-control-container">
        <h1 className="page-title">Controle de Espécies</h1>
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fff3cd', borderRadius: '8px', margin: '20px auto', maxWidth: '600px' }}>
          <h2 style={{ color: '#856404' }}>⚠️ Acesso Restrito</h2>
          <p style={{ color: '#856404' }}>Você não está vinculado a nenhuma empresa.</p>
          <p style={{ color: '#856404' }}>Para acessar esta funcionalidade, solicite um convite de uma empresa ou crie sua própria empresa.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="species-control-container">
      <h1 className="page-title">Controle de Espécies</h1>

      <form onSubmit={handleSubmitSpecies} className="species-form">
        <div>
          <label>Nome comum</label>
          <input
            type="text"
            placeholder="Ex: Leão"
            value={newSpecies.common_name}
            onChange={(e) => setNewSpecies({ ...newSpecies, common_name: e.target.value })}
            required
          />
        </div>

        <div>
          <label>Nome científico</label>
          <input
            type="text"
            placeholder="Ex: Panthera leo"
            value={newSpecies.scientific_name}
            onChange={(e) => setNewSpecies({ ...newSpecies, scientific_name: e.target.value })}
          />
        </div>

        <div>
          <label>Dieta</label>
          <select
            value={newSpecies.diet}
            onChange={(e) => setNewSpecies({ ...newSpecies, diet: e.target.value })}
          >
            <option value="">Selecione</option>
            <option value="carnivoro">Carnívoro</option>
            <option value="herbivoro">Herbívoro</option>
            <option value="onivoro">Onívoro</option>
          </select>
        </div>

        <div>
          <label>Status de conservação</label>
          <select
            value={newSpecies.conservation_status}
            onChange={(e) => setNewSpecies({ ...newSpecies, conservation_status: e.target.value })}
          >
            <option value="">Selecione</option>
            <option value="LC">Tranquilo (LC)</option>
            <option value="LC">Pouco preocupante (LC)</option>
            <option value="VU">Vulnerável (VU)</option>
            <option value="EN">Em perigo (EN)</option>
            <option value="CR">Criticamente em perigo (CR)</option>
          </select>
        </div>

        <div>
          <label>Recinto</label>
          <select
            value={newSpecies.enclosure_id}
            onChange={(e) => setNewSpecies({ ...newSpecies, enclosure_id: e.target.value })}
          >
            <option value="">Selecione um recinto</option>
            {enclosures.map((enc) => (
              <option key={enc.id} value={enc.id}>
                {enc.name}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : editingId ? 'Atualizar Espécie' : 'Adicionar Espécie'}
        </button>

        {editingId && (
          <button type="button" onClick={() => {
            setNewSpecies({ common_name: '', scientific_name: '', diet: '', conservation_status: '', description: '', enclosure_id: '' });
            setEditingId(null);
          }}>
            Cancelar
          </button>
        )}
      </form>

      <h2 style={{maxWidth:980, margin:'0 auto 10px'}}>Espécies Cadastradas</h2>
      <div className="species-list">
        {species.map((specie) => (
          <div key={specie.id} className="species-card">
            <h3>{specie.common_name}</h3>
            {specie.scientific_name && <p><em>{specie.scientific_name}</em></p>}
            <p>Dieta: {specie.diet || 'Não informada'}</p>
            <p>Conservação: {specie.conservation_status || 'Não informado'}</p>
            <p>Recinto: {specie.enclosures?.name || 'Não atribuído'}</p>
            {specie.description && <p>{specie.description}</p>}
            <div className="species-card-actions">
              <button onClick={() => handleEdit(specie)}>Editar</button>
              <button onClick={() => handleDelete(specie.id)} className="btn-danger">Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpeciesControl;
