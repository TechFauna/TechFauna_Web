// AnimalsControl.js
import React, { useEffect, useState } from 'react';
import supabase from '../supabaseCliente';
import './AnimalsControl.css';

const AnimalsControl = ({ user }) => {
  const [animals, setAnimals] = useState([]);
  const [species, setSpecies] = useState([]);
  const [enclosures, setEnclosures] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [newAnimal, setNewAnimal] = useState({
    name: '',
    identifier: '',
    species_id: '',
    current_enclosure_id: '',
    sex: '',
    birthdate: '',
    arrival_date: '',
    status: 'ativo',
    health_status: 'bem',
    notes: '',
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

  // Buscar animais com dados da espécie e recinto (filtrado por organização)
  useEffect(() => {
    const fetchAnimals = async () => {
      if (!userProfile?.organization_id) {
        setAnimals([]); // Limpar dados se não tem organização
        return;
      }
      const { data, error } = await supabase
        .from('animals')
        .select('*, species(id, common_name), enclosures:current_enclosure_id(id, name)')
        .eq('organization_id', userProfile.organization_id)
        .order('name', { ascending: true });
      if (!error && Array.isArray(data)) setAnimals(data);
    };
    fetchAnimals();
  }, [userProfile]);

  // Buscar espécies (filtrado por organização)
  useEffect(() => {
    const fetchSpecies = async () => {
      if (!userProfile?.organization_id) {
        setSpecies([]); // Limpar dados se não tem organização
        return;
      }
      const { data, error } = await supabase
        .from('species')
        .select('id, common_name')
        .eq('organization_id', userProfile.organization_id)
        .order('common_name', { ascending: true });
      if (!error) setSpecies(data || []);
    };
    fetchSpecies();
  }, [userProfile]);

  // Buscar recintos (filtrado por organização)
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

  const handleSubmitAnimal = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { name, identifier, species_id, current_enclosure_id, sex, birthdate, arrival_date, status, health_status, notes } = newAnimal;

    try {
      const animalData = {
        name,
        identifier: identifier || null,
        species_id: species_id || null,
        current_enclosure_id: current_enclosure_id || null,
        sex: sex || null,
        birthdate: birthdate || null,
        arrival_date: arrival_date || null,
        status: status || 'ativo',
        health_status: health_status || 'bem',
        notes: notes || null,
        organization_id: userProfile?.organization_id,
      };

      if (editingId) {
        const { error } = await supabase
          .from('animals')
          .update(animalData)
          .eq('id', editingId);
        if (error) throw error;

        const { data: updatedData } = await supabase
          .from('animals')
          .select('*, species(id, common_name), enclosures:current_enclosure_id(id, name)')
          .eq('id', editingId)
          .single();

        setAnimals((prev) => prev.map((a) => a.id === editingId ? updatedData : a));
        alert('Animal atualizado com sucesso!');
      } else {
        const { data, error } = await supabase
          .from('animals')
          .insert([animalData])
          .select('*, species(id, common_name), enclosures:current_enclosure_id(id, name)');
        if (error) throw error;
        if (Array.isArray(data)) setAnimals((prev) => [...prev, ...data]);
        alert('Animal adicionado com sucesso!');
      }

      resetForm();
    } catch (err) {
      console.error('Erro ao salvar animal:', err);
      alert('Erro ao salvar animal.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewAnimal({ name: '', identifier: '', species_id: '', current_enclosure_id: '', sex: '', birthdate: '', arrival_date: '', status: 'ativo', health_status: 'bem', notes: '' });
    setEditingId(null);
  };

  const handleEdit = (animal) => {
    setNewAnimal({
      name: animal.name || '',
      identifier: animal.identifier || '',
      species_id: animal.species_id || '',
      current_enclosure_id: animal.current_enclosure_id || '',
      sex: animal.sex || '',
      birthdate: animal.birthdate || '',
      arrival_date: animal.arrival_date || '',
      status: animal.status || 'ativo',
      health_status: animal.health_status || 'bem',
      notes: animal.notes || '',
    });
    setEditingId(animal.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este animal?')) return;
    const { error } = await supabase.from('animals').delete().eq('id', id);
    if (error) {
      alert('Erro ao excluir animal.');
      console.error(error);
    } else {
      setAnimals((prev) => prev.filter((a) => a.id !== id));
      alert('Animal excluído com sucesso!');
    }
  };

  // Aguardar carregar o perfil
  if (!profileLoaded) {
    return (
      <div className="animals-control-container">
        <h1 className="page-title">Cadastro de Animais</h1>
        <p style={{ textAlign: 'center', padding: '40px' }}>Carregando...</p>
      </div>
    );
  }

  // Se o usuário não está vinculado a uma empresa, mostrar mensagem
  if (!userProfile?.organization_id) {
    return (
      <div className="animals-control-container">
        <h1 className="page-title">Cadastro de Animais</h1>
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fff3cd', borderRadius: '8px', margin: '20px auto', maxWidth: '600px' }}>
          <h2 style={{ color: '#856404' }}>⚠️ Acesso Restrito</h2>
          <p style={{ color: '#856404' }}>Você não está vinculado a nenhuma empresa.</p>
          <p style={{ color: '#856404' }}>Para acessar esta funcionalidade, solicite um convite de uma empresa ou crie sua própria empresa.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animals-control-container">
      <h1 className="page-title">Cadastro de Animais</h1>

      <form onSubmit={handleSubmitAnimal} className="animals-form">
        <div>
          <label>Nome do Animal *</label>
          <input type="text" placeholder="Ex: Simba" value={newAnimal.name}
            onChange={(e) => setNewAnimal({ ...newAnimal, name: e.target.value })} required />
        </div>

        <div>
          <label>Identificador</label>
          <input type="text" placeholder="Ex: TAG-001" value={newAnimal.identifier}
            onChange={(e) => setNewAnimal({ ...newAnimal, identifier: e.target.value })} />
        </div>

        <div>
          <label>Espécie</label>
          <select value={newAnimal.species_id}
            onChange={(e) => setNewAnimal({ ...newAnimal, species_id: e.target.value })}>
            <option value="">Selecione uma espécie</option>
            {species.map((sp) => (
              <option key={sp.id} value={sp.id}>{sp.common_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Recinto</label>
          <select value={newAnimal.current_enclosure_id}
            onChange={(e) => setNewAnimal({ ...newAnimal, current_enclosure_id: e.target.value })}>
            <option value="">Selecione um recinto</option>
            {enclosures.map((enc) => (
              <option key={enc.id} value={enc.id}>{enc.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Sexo</label>
          <select value={newAnimal.sex}
            onChange={(e) => setNewAnimal({ ...newAnimal, sex: e.target.value })}>
            <option value="">Selecione</option>
            <option value="macho">Macho</option>
            <option value="femea">Fêmea</option>
            <option value="indefinido">Indefinido</option>
          </select>
        </div>

        <div>
          <label>Data de Nascimento</label>
          <input type="date" value={newAnimal.birthdate}
            onChange={(e) => setNewAnimal({ ...newAnimal, birthdate: e.target.value })} />
        </div>

        <div>
          <label>Data de Chegada</label>
          <input type="date" value={newAnimal.arrival_date}
            onChange={(e) => setNewAnimal({ ...newAnimal, arrival_date: e.target.value })} />
        </div>

        <div>
          <label>Status</label>
          <select value={newAnimal.status}
            onChange={(e) => setNewAnimal({ ...newAnimal, status: e.target.value })}>
            <option value="ativo">Ativo</option>
            <option value="em_tratamento">Em Tratamento</option>
            <option value="transferido">Transferido</option>
            <option value="falecido">Falecido</option>
          </select>
        </div>

        <div>
          <label>Estado de Saúde</label>
          <select value={newAnimal.health_status}
            onChange={(e) => setNewAnimal({ ...newAnimal, health_status: e.target.value })}>
            <option value="bem">Bem</option>
            <option value="doente">Doente</option>
            <option value="ferido">Ferido</option>
          </select>
        </div>

        <div>
          <label>Observações</label>
          <textarea placeholder="Observações sobre o animal..." value={newAnimal.notes}
            onChange={(e) => setNewAnimal({ ...newAnimal, notes: e.target.value })} />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : editingId ? 'Atualizar Animal' : 'Adicionar Animal'}
        </button>

        {editingId && (
          <button type="button" onClick={resetForm}>Cancelar</button>
        )}
      </form>

      <h2 style={{maxWidth:980, margin:'0 auto 10px'}}>Animais Cadastrados</h2>
      <div className="animals-list">
        {animals.map((animal) => (
          <div key={animal.id} className="animal-card">
            <h3>{animal.name}</h3>
            {animal.identifier && <p><strong>ID:</strong> {animal.identifier}</p>}
            <p><strong>Espécie:</strong> {animal.species?.common_name || 'Não definida'}</p>
            <p><strong>Recinto:</strong> {animal.enclosures?.name || 'Não atribuído'}</p>
            <p><strong>Sexo:</strong> {animal.sex || 'Não informado'}</p>
            <p><strong>Status:</strong> {animal.status}</p>
            <p><strong>Estado:</strong> {animal.health_status || 'Não informado'}</p>
            {animal.birthdate && <p><strong>Nascimento:</strong> {new Date(animal.birthdate).toLocaleDateString()}</p>}
            <div className="animal-card-actions">
              <button onClick={() => handleEdit(animal)}>Editar</button>
              <button onClick={() => handleDelete(animal.id)} className="btn-danger">Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnimalsControl;
