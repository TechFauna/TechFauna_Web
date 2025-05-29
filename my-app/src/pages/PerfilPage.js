import React, { useState } from "react";
import supabase from "../supabaseCliente";
import "./PerfilPage.css";

const PerfilPage = ({ user }) => {
  const [nome, setNome] = useState("");
  const [userFotoPerfil, setUserFotoPerfil] = useState(
    user.fotos_perfil || "/images/imagem_usuario_padrao.png"
  );
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleFotoUpload = async (e) => {
    const file = e.target.files[0];

    if (file.size > 5 * 1024 * 1024) {
      alert("O arquivo é muito grande. Por favor, envie uma imagem menor que 5 MB.");
      return;
    }

    const filePath = `${user.id}/${file.name}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("fotos_perfil")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from("fotos_perfil")
        .getPublicUrl(filePath);

      if (!publicData) throw new Error("Erro ao obter URL pública da imagem.");

      setUserFotoPerfil(publicData.publicUrl);

      const { error: dbError } = await supabase
        .from("perfil")
        .update({ fotos_perfil: publicData.publicUrl })
        .eq("id_user", user.id);

      if (dbError) throw dbError;

      alert("Foto atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer upload da foto:", error.message);
      setErrorMessage("Erro ao fazer upload da foto. Tente novamente.");
    }
  };

  const handleNomeUpdate = async () => {
    try {
      const { error } = await supabase
        .from("perfil")
        .update({ nome })
        .eq("id_user", user.id);

      if (error) throw error;

      setSuccessMessage("Nome atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar nome:", error.message);
      setErrorMessage("Erro ao atualizar o nome. Tente novamente.");
    }
  };

  return (
    <div className="perfil-page-container">
      <h1>Perfil do Usuário</h1>
      <div className="profile-info">
        <img src={userFotoPerfil} alt="Foto do Usuário" className="profile-pic" />
        <input type="file" accept="image/png, image/jpeg" onChange={handleFotoUpload} />
        <label>Nome:</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <button onClick={handleNomeUpdate}>Salvar Nome</button>
      </div>
      {successMessage && <p className="success-message">{successMessage}</p>}
      {errorMessage && <p className="error-message">{errorMessage}</p>}
    </div>
  );
};

export default PerfilPage;
