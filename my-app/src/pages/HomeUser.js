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
      } else if (error) {
        console.error("Erro ao carregar dados do usuário:", error.message);
      }
    };
    fetchUserData();
  }, [user.id]);

  return (
    <div className="home-user-container">
      <header className="app-header">
        <div className="brand">
          <div className="mark">TF</div>
          <div className="name">TechFauna</div>
        </div>
        <div className="header-right">
          <span>Olá, {userNome || "Usuário"}</span>
          <img
            src={userFotoPerfil}
            alt="Foto de Perfil"
            className="profile-photo"
            onClick={() => navigate("/perfil")}
          />
        </div>
      </header>

      <section className="dashboard-hero">
        <h1>Painel</h1>
        <p className="subtitle">Acesse rapidamente as áreas principais do sistema.</p>
      </section>

      <div className="card-container">
        <div className="card" onClick={() => navigate("/recintos")}>
          <h2>Recintos</h2>
          <p>Cadastre e visualize seus recintos.</p>
        </div>

        <div className="card" onClick={() => navigate("/species-control")}>
          <h2>Espécies</h2>
          <p>Gerencie indivíduos e atributos.</p>
        </div>

        <div className="card" onClick={() => navigate("/controle-reprodutivo")}>
          <h2>Controle Reprodutivo</h2>
          <p>Acompanhe cruzas, ovos e nascimentos.</p>
        </div>
      </div>
    </div>
  );
}

export default HomeUser;
