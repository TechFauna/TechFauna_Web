import React, { useState, useEffect } from "react";
import supabase from "../supabaseCliente";
import "./ControleReprodutivo.css";

const ControleReprodutivo = ({ user }) => {
  const [species, setSpecies] = useState([]);
  const [recintos, setRecintos] = useState([]);
  const [selectedSpecies, setSelectedSpecies] = useState("");
  const [selectedRecinto, setSelectedRecinto] = useState("");
  const [gestations, setGestations] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: speciesData } = await supabase
          .from("species")
          .select("*")
          .eq("id_user", user.id);

        const { data: recintosData } = await supabase
          .from("recintos")
          .select("*")
          .eq("id_user", user.id);

        const { data: gestationsData } = await supabase
          .from("reproducao")
          .select("*")
          .eq("id_user", user.id);

        setSpecies(speciesData || []);
        setRecintos(recintosData || []);
        setGestations(gestationsData || []);
      } catch (error) {
        console.error("Erro ao carregar dados:", error.message);
        setErrorMessage("Erro ao carregar dados. Tente novamente mais tarde.");
      }
    };

    fetchData();
  }, [user.id]);

  const handleReproduction = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!selectedSpecies || !selectedRecinto) {
      setErrorMessage("Por favor, selecione uma espécie e um recinto.");
      return;
    }

    try {
      // Define o status inicial como "Em andamento"
      const startDate = new Date().toISOString();

      // Insere os dados na tabela `reproducao`
      const { error } = await supabase.from("reproducao").insert([
        {
          id_especie: selectedSpecies,
          id_recinto: selectedRecinto,
          data_inicio: startDate,
          status: "Em andamento",
          filhotes_gerados: 0, // Inicialmente 0
          id_user: user.id,
        },
      ]);

      if (error) throw error;

      // Atualiza a lista de gestações
      setGestations((prev) => [
        ...prev,
        {
          id_especie: selectedSpecies,
          id_recinto: selectedRecinto,
          data_inicio: startDate,
          status: "Em andamento",
          filhotes_gerados: 0,
        },
      ]);

      setSuccessMessage("Reprodução iniciada com sucesso!");
    } catch (error) {
      setErrorMessage("Erro ao iniciar reprodução. Tente novamente.");
      console.error("Erro ao iniciar reprodução:", error.message);
    }
  };

  const updateGestationStatus = () => {
    setGestations((prev) =>
      prev.map((gestation) => {
        const timeElapsed = Math.floor(
          (new Date() - new Date(gestation.data_inicio)) / (1000 * 60 * 60 * 24)
        );

        if (timeElapsed >= 5 && gestation.status === "Em andamento") {
          // Atualiza o status para "Concluído" e incrementa os filhotes no banco
          (async () => {
            try {
              await supabase
                .from("reproducao")
                .update({ status: "Concluído", filhotes_gerados: gestation.filhotes_gerados + 1 })
                .eq("id_recinto", gestation.id_recinto)
                .eq("id_especie", gestation.id_especie);

              const recinto = recintos.find((r) => r.id_recinto === gestation.id_recinto);

              await supabase
                .from("recintos")
                .update({
                  qnt_animais: parseInt(recinto.qnt_animais) + 1,
                })
                .eq("id_recinto", gestation.id_recinto);
            } catch (error) {
              console.error("Erro ao atualizar status no banco:", error.message);
            }
          })();

          return { ...gestation, status: "Concluído", filhotes_gerados: gestation.filhotes_gerados + 1 };
        }

        return gestation;
      })
    );
  };

  useEffect(() => {
    const interval = setInterval(updateGestationStatus, 10000); // Atualiza o status a cada 10 segundos
    return () => clearInterval(interval);
  }, [gestations]);

  return (
    <div className="controle-reprodutivo-container">
      <h1>Controle Reprodutivo</h1>
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      {successMessage && <p className="success-message">{successMessage}</p>}

      <div className="form-group">
        <label>Selecionar Espécie:</label>
        <select
          value={selectedSpecies}
          onChange={(e) => setSelectedSpecies(e.target.value)}
        >
          <option value="">Selecione uma espécie</option>
          {species.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Selecionar Recinto:</label>
        <select
          value={selectedRecinto}
          onChange={(e) => setSelectedRecinto(e.target.value)}
        >
          <option value="">Selecione um recinto</option>
          {recintos.map((r) => (
            <option key={r.id_recinto} value={r.id_recinto}>
              {r.nome}
            </option>
          ))}
        </select>
      </div>

      <button className="reproducao-button" onClick={handleReproduction}>
        Iniciar Reprodução
      </button>

      <h2>Gestações Ativas</h2>
      <div className="active-gestations">
        {gestations.length > 0 ? (
          gestations.map((gestation, index) => (
            <div key={index} className="gestation-card">
              <p>
                <strong>Espécie:</strong>{" "}
                {species.find((s) => s.id === gestation.id_especie)?.name || "Não informado"}
              </p>
              <p>
                <strong>Recinto:</strong>{" "}
                {recintos.find((r) => r.id_recinto === gestation.id_recinto)?.nome || "Não informado"}
              </p>
              <p>
                <strong>Data Início:</strong>{" "}
                {new Date(gestation.data_inicio).toLocaleDateString()}
              </p>
              <p>
                <strong>Status:</strong> {gestation.status}
              </p>
            </div>
          ))
        ) : (
          <p className="no-gestations">Nenhuma gestação ativa no momento.</p>
        )}
      </div>
    </div>
  );
};

export default ControleReprodutivo;
