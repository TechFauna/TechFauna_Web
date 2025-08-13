import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import supabase from '../supabaseCliente';
import './RecintoView.css';

function RecintoView() {
  const { id } = useParams();
  const [recinto, setRecinto] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleUpdateRecinto = async () => {
    const { error } = await supabase
      .from('recintos')
      .update({
        nome: recinto.nome,
        qnt_animais: recinto.qnt_animais,
      })
      .eq('id_recinto', recinto.id_recinto);

    if (error) {
      console.error('Erro ao atualizar recinto:', error);
      alert('Erro ao atualizar o recinto.');
    } else {
      alert('Recinto atualizado com sucesso!');
    }
  };

  useEffect(() => {
    const fetchRecinto = async () => {
      try {
        const { data, error } = await supabase
          .from('recintos')
          .select('*')
          .eq('id_recinto', id)
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
              value={recinto.nome || ''}
              onChange={(e) => setRecinto({ ...recinto, nome: e.target.value })}
            />
          </div>

          <div className="recinto-field">
            <label>Quantidade</label>
            <input
              type="number"
              min="0"
              value={recinto.qnt_animais || 0}
              onChange={(e) => setRecinto({ ...recinto, qnt_animais: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="actions">
          <button className="btn btn-primary" onClick={handleUpdateRecinto}>Salvar alterações</button>
        </div>
      </div>
    </div>
  );
}

export default RecintoView;
