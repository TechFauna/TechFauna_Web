import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseCliente";
import "./HomeUser.css";

function HomeUser({ user }) {
  const [userNome, setUserNome] = useState("");
  const [userFotoPerfil, setUserFotoPerfil] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const { data, error } = await supabase
        .from("perfil")
        .select("nome, fotos_perfil")
        .eq("id_user", user.id)
        .single();

      if (data) {
        setUserNome(data.nome);
        setUserFotoPerfil(data.fotos_perfil || "/images/imagem_usuario_padrao.png");
      } else {
        console.error("Erro ao carregar dados do usuário:", error.message);
      }
    };

    fetchUserData();
  }, [user.id, userNome]); // Atualiza sempre que o nome mudar

  return (
    <div className="home-user-container">
      <div className="user-info">
        <img
          src={userFotoPerfil}
          alt="Foto de Perfil"
          className="profile-photo"
          onClick={() => navigate("/perfil")}
        />
        <p>Bem-vindo(a), {userNome}!</p>
      </div>
      <div className="card-container">
        <div className="card" onClick={() => navigate("/recintos")}>
          <h2>Recintos</h2>
          <p>Visualizar recintos</p>
        </div>
        <div className="card" onClick={() => navigate("/species-control")}>
          <h2>Espécies</h2>
          <p>Gerenciar espécies</p>
        </div>
        <div className="card" onClick={() => navigate("/controle-reprodutivo")}>
          <h2>Controle Reprodutivo</h2>
          <p>Acompanhar reprodução</p>
        </div>
      </div>
    </div>
  );
}

export default HomeUser;
