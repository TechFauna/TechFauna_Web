// SpeciesControl.js
import React, { useEffect, useState } from 'react';
import supabase from '../supabaseCliente';
import './SpeciesControl.css';

const SpeciesControl = ({ user }) => {
  const [species, setSpecies] = useState([]);
  const [recintos, setRecintos] = useState([]);
  const [newSpecies, setNewSpecies] = useState({
    name: '',
    weight: '',
    sex: '',
    size: '',
    recinto: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSpecies = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from('species')
          .select('*, recintos(nome)')
          .eq('id_user', user.id);

        if (error) {
          console.error('Erro ao carregar espécies:', error);
        } else if (Array.isArray(data)) {
          setSpecies(data);
        }
      }
    };

    fetchSpecies();
  }, [user]);

  useEffect(() => {
    const fetchRecintos = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from('recintos')
          .select('id_recinto, nome')
          .eq('id_user', user.id);

        if (error) {
          console.error('Erro ao carregar recintos:', error);
        } else {
          setRecintos(data || []);
        }
      }
    };

    fetchRecintos();
  }, [user]);

  const handleSubmitSpecies = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { name, weight, sex, size, recinto } = newSpecies;

    if (!recinto) {
      alert('Por favor, selecione um recinto.');
      setLoading(false);
      return;
    }

    try {
      if (editingId) {
        const { data, error } = await supabase
          .from('species')
          .update({
            name,
            weight: parseFloat(weight),
            sex,
            size: parseFloat(size),
            id_recinto: recinto,
          })
          .eq('id', editingId)
          .select();

        if (error) throw error;

        const updatedList = species.map((s) =>
          s.id === editingId ? { ...s, name, weight, sex, size, id_recinto: recinto } : s
        );
        setSpecies(updatedList);

        alert('Espécie atualizada com sucesso!');
      } else {
        const { data, error } = await supabase
          .from('species')
          .insert([
            {
              name,
              weight: parseFloat(weight),
              sex,
              size: parseFloat(size),
              id_user: user.id,
              id_recinto: recinto,
            },
          ])
          .select();

        if (error) throw error;
        if (Array.isArray(data)) {
          setSpecies((prev) => [...prev.filter((s) => s.id !== data[0].id), ...data]);
        }

        alert('Espécie adicionada com sucesso!');
      }

      setNewSpecies({ name: '', weight: '', sex: '', size: '', recinto: '' });
      setEditingId(null);
    } catch (error) {
      console.error('Erro ao salvar espécie:', error);
      alert('Erro ao salvar espécie.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (specie) => {
    setNewSpecies({
      name: specie.name,
      weight: specie.weight,
      sex: specie.sex,
      size: specie.size,
      recinto: specie.id_recinto || '',
    });
    setEditingId(specie.id);
  };

  return (
    <div className="species-control-container">
      <h1 className="page-title">Controle de Espécies</h1>
      <form onSubmit={handleSubmitSpecies} className="species-form">
        <label>Nome:</label>
        <input
          type="text"
          value={newSpecies.name}
          onChange={(e) => setNewSpecies({ ...newSpecies, name: e.target.value })}
          required
        />
        <label>Peso (kg):</label>
        <input
          type="number"
          value={newSpecies.weight}
          onChange={(e) => setNewSpecies({ ...newSpecies, weight: e.target.value })}
          required
        />
        <label>Sexo:</label>
        <select
          value={newSpecies.sex}
          onChange={(e) => setNewSpecies({ ...newSpecies, sex: e.target.value })}
          required
        >
          <option value="">Selecione</option>
          <option value="M">Macho</option>
          <option value="F">Fêmea</option>
        </select>
        <label>Tamanho (cm):</label>
        <input
          type="number"
          value={newSpecies.size}
          onChange={(e) => setNewSpecies({ ...newSpecies, size: e.target.value })}
          required
        />
        <label>Recinto:</label>
        <select
          value={newSpecies.recinto}
          onChange={(e) => setNewSpecies({ ...newSpecies, recinto: e.target.value })}
          required
        >
          <option value="">Selecione um recinto</option>
          {recintos.map((recinto) => (
            <option key={recinto.id_recinto} value={recinto.id_recinto}>
              {recinto.nome}
            </option>
          ))}
        </select>
        <button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : editingId ? 'Atualizar Espécie' : 'Adicionar Espécie'}
        </button>
      </form>

      <h2>Espécies Cadastradas</h2>
      <div className="species-list">
        {species.map((specie) => (
          <div key={specie.id} className="species-card">
            <h3>{specie.name}</h3>
            <p>Peso: {specie.weight} kg</p>
            <p>Sexo: {specie.sex}</p>
            <p>Tamanho: {specie.size} cm</p>
            <p>Recinto: {specie.recintos?.nome || 'Não atribuído'}</p>
            <button onClick={() => handleEdit(specie)}>Editar</button>
          </div>
        ))}
      </div>
    </div>
  );
};
export default SpeciesControl;
