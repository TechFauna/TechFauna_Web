import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../supabaseCliente';
import './RecintoView.css';

function RecintoView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recinto, setRecinto] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleUpdateRecinto = async () => {
    const { error } = await supabase
      .from('enclosures')
      .update({
        name: recinto.name,
        environment_type: recinto.environment_type,
        capacity: recinto.capacity,
        status: recinto.status,
        notes: recinto.notes,
      })
      .eq('id', recinto.id);

    if (error) {
      console.error('Erro ao atualizar recinto:', error);
      alert('Erro ao atualizar o recinto.');
    } else {
      alert('Recinto atualizado com sucesso!');
    }
  };

  const handleDeleteRecinto = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este recinto?')) return;

    const { error } = await supabase
      .from('enclosures')
      .delete()
      .eq('id', recinto.id);

    if (error) {
      console.error('Erro ao excluir recinto:', error);
      alert('Erro ao excluir o recinto.');
    } else {
      alert('Recinto excluído com sucesso!');
      navigate('/recintos');
    }
  };

  useEffect(() => {
    const fetchRecinto = async () => {
      try {
        const { data, error } = await supabase
          .from('enclosures')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setRecinto(data);
      } catch (err) {
        console.error('Erro ao buscar recinto:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecinto();
  }, [id]);

  if (loading) return <div className="recinto-view-container">Carregando...</div>;
  if (!recinto) return <div className="recinto-view-container">Recinto não encontrado.</div>;

  return (
    <div className="recinto-view-container">
      <div className="recinto-card-form">
        <h1>Editar Recinto</h1>

        <div className="recinto-form-grid">
          <div className="recinto-field">
            <label>Nome do recinto</label>
            <input
              type="text"
              value={recinto.name || ''}
              onChange={(e) => setRecinto({ ...recinto, name: e.target.value })}
            />
          </div>

          <div className="recinto-field">
            <label>Tipo de ambiente</label>
            <input
              type="text"
              value={recinto.environment_type || ''}
              onChange={(e) => setRecinto({ ...recinto, environment_type: e.target.value })}
            />
          </div>

          <div className="recinto-field">
            <label>Capacidade</label>
            <input
              type="number"
              min="0"
              value={recinto.capacity || ''}
              onChange={(e) => setRecinto({ ...recinto, capacity: Number(e.target.value) })}
            />
          </div>

          <div className="recinto-field">
            <label>Status</label>
            <select
              value={recinto.status || 'ativo'}
              onChange={(e) => setRecinto({ ...recinto, status: e.target.value })}
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="manutencao">Em Manutenção</option>
            </select>
          </div>

          <div className="recinto-field" style={{ gridColumn: '1 / -1' }}>
            <label>Observações</label>
            <textarea
              value={recinto.notes || ''}
              onChange={(e) => setRecinto({ ...recinto, notes: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <div className="actions">
          <button className="btn btn-primary" onClick={handleUpdateRecinto}>Salvar alterações</button>
          <button className="btn btn-danger" onClick={handleDeleteRecinto}>Excluir recinto</button>
        </div>
      </div>
    </div>
  );
}

export default RecintoView;
