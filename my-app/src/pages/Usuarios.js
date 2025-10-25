import React, { useEffect, useState } from 'react';
import supabase from '../supabaseCliente';

function Usuarios({ user }) {
  const [usuarios, setUsuarios] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCargo, setFilterCargo] = useState('');

  useEffect(() => {
    async function fetchUsuarios() {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, email, cargo, empresa, created_at, updated_at');
      if (!error) setUsuarios(data || []);
    }
    fetchUsuarios();
  }, []);

  // Filtro/busca
  const filtered = usuarios.filter(u =>
    (u.nome?.toLowerCase().includes(search.toLowerCase()) ||
     u.email?.toLowerCase().includes(search.toLowerCase())) &&
    (filterCargo ? u.cargo === filterCargo : true)
  );

  // Cargos únicos para filtro
  const cargos = Array.from(new Set(usuarios.map(u => u.cargo).filter(Boolean)));

  return (
    <div className="usuarios-page">
      <h2>Usuários</h2>
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <select value={filterCargo} onChange={e => setFilterCargo(e.target.value)}>
          <option value="">Todos os cargos</option>
          {cargos.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="usuarios-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Cargo</th>
              <th>Empresa</th>
              <th>Data de Criação</th>
              <th>Data de Atualização</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td>{u.nome}</td>
                <td>{u.email}</td>
                <td>{u.cargo}</td>
                <td>{u.empresa}</td>
                <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : ''}</td>
                <td>{u.updated_at ? new Date(u.updated_at).toLocaleDateString() : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div>Nenhum usuário encontrado.</div>}
      </div>
    </div>
  );
}

export default Usuarios;
