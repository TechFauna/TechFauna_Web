import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import supabase from '../supabaseCliente';
import './RecintoView.css';

function RecintoView() {
  const { id } = useParams();
  const [recinto, setRecinto] = useState(null);
  const [especieDetalhes, setEspecieDetalhes] = useState(null);
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
        const { data: recintoData, error: recintoError } = await supabase
          .from('recintos')
          .select('*')
          .eq('id_recinto', id)
          .single();

        if (recintoError) {
          console.error('Erro ao buscar recinto:', recintoError);
        } else {
          setRecinto(recintoData);

          // Buscar informações da espécie associada
          const { data: especieData, error: especieError } = await supabase
            .from('species')
            .select('*')
            .eq('name', recintoData?.especie)
            .single();

          if (especieError) {
            console.error('Erro ao buscar espécie:', especieError);
          } else {
            setEspecieDetalhes(especieData);
          }
        }
      } catch (error) {
        console.error('Erro inesperado ao buscar dados do recinto:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecinto();
  }, [id]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!recinto) {
    return <div>Erro ao carregar os dados do recinto. Tente novamente mais tarde.</div>;
  }
  
  return (
    <div className="recinto-view-container">
      <h1>Editar Recinto</h1>
      <input
        type="text"
        value={recinto.nome}
        onChange={(e) => setRecinto({ ...recinto, nome: e.target.value })}
      />
      <input
        type="number"
        value={recinto.qnt_animais}
        onChange={(e) => setRecinto({ ...recinto, qnt_animais: e.target.value })}
      />
      <button onClick={handleUpdateRecinto}>Salvar Alterações</button>
    </div>
  );
}  

export default RecintoView;
