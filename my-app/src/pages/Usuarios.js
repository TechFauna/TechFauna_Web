import React, { useEffect, useState } from 'react';
import supabase from '../supabaseCliente';

function Usuarios({ user }) {
  const [usuarios, setUsuarios] = useState([]);
  const [convitesPendentes, setConvitesPendentes] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCargo, setFilterCargo] = useState('');
  const [userProfile, setUserProfile] = useState(null); // Perfil do usuário logado com organization_id

  // Estados para convidar usuário
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newCargo, setNewCargo] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [searching, setSearching] = useState(false);

  // Estados para editar usuário
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Estados para excluir usuário
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Buscar perfil do usuário logado para obter organization_id
  const fetchUserProfile = async () => {
    if (!user?.id) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, user_role, organization_id')
      .eq('id', user.id)
      .single();
    if (!error && data) {
      setUserProfile(data);
      return data;
    }
    return null;
  };

  const fetchUsuarios = async (orgId) => {
    // Se não tem organization_id, não mostrar nenhum usuário (ou só o próprio)
    if (!orgId) {
      // Mostrar apenas o próprio usuário se não pertence a nenhuma organização
      if (user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, full_name, email, user_role, organization_id, created_at, updated_at')
          .eq('id', user.id);
        if (!error) setUsuarios(data || []);
      } else {
        setUsuarios([]);
      }
      return;
    }

    // Buscar apenas usuários da mesma organização
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, full_name, email, user_role, organization_id, created_at, updated_at')
      .eq('organization_id', orgId);
    if (!error) setUsuarios(data || []);
  };

  const fetchConvitesPendentes = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('company_invites')
      .select('*')
      .eq('company_owner_id', user.id)
      .eq('status', 'pending');
    if (!error) setConvitesPendentes(data || []);
  };

  useEffect(() => {
    const init = async () => {
      const profile = await fetchUserProfile();
      await fetchUsuarios(profile?.organization_id);
      await fetchConvitesPendentes();
    };
    init();
  }, [user]);

  // Filtro/busca
  const filtered = usuarios.filter(u =>
    (u.name?.toLowerCase().includes(search.toLowerCase()) ||
     u.email?.toLowerCase().includes(search.toLowerCase())) &&
    (filterCargo ? u.user_role === filterCargo : true)
  );

  // Cargos únicos para filtro
  const cargos = Array.from(new Set(usuarios.map(u => u.user_role).filter(Boolean)));

  // Buscar usuário por email
  const handleSearchUser = async () => {
    if (!newEmail.trim()) {
      setAddError('Por favor, informe o e-mail do usuário.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setAddError('Por favor, informe um e-mail válido.');
      return;
    }

    setSearching(true);
    setAddError('');
    setFoundUser(null);

    try {
      // Buscar na tabela profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('email', newEmail.trim().toLowerCase())
        .single();

      if (error || !data) {
        setAddError('Usuário não encontrado. O usuário precisa ter uma conta cadastrada no sistema.');
        setFoundUser(null);
      } else {
        // Verificar se já existe convite pendente
        const { data: existingInvite } = await supabase
          .from('company_invites')
          .select('id, status')
          .eq('invited_email', newEmail.trim().toLowerCase())
          .eq('company_owner_id', user.id)
          .single();

        if (existingInvite) {
          if (existingInvite.status === 'pending') {
            setAddError('Já existe um convite pendente para este usuário.');
          } else if (existingInvite.status === 'accepted') {
            setAddError('Este usuário já faz parte da sua equipe.');
          }
          setFoundUser(null);
        } else {
          setFoundUser(data);
          setAddSuccess(`Usuário encontrado: ${data.name || data.email}`);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      setAddError('Usuário não encontrado. O usuário precisa ter uma conta cadastrada no sistema.');
    } finally {
      setSearching(false);
    }
  };

  // Enviar convite
  const handleSendInvite = async (e) => {
    e.preventDefault();

    if (!foundUser) {
      setAddError('Primeiro busque um usuário válido.');
      return;
    }

    setAdding(true);
    setAddError('');

    try {
      const { error } = await supabase
        .from('company_invites')
        .insert([{
          company_owner_id: user.id,
          invited_user_id: foundUser.id,
          invited_email: foundUser.email,
          cargo: newCargo.trim() || null,
          status: 'pending'
        }]);

      if (error) throw error;

      setAddSuccess('Convite enviado com sucesso! O usuário receberá uma notificação.');
      setNewEmail('');
      setNewCargo('');
      setFoundUser(null);
      await fetchConvitesPendentes();

      setTimeout(() => {
        setShowAddModal(false);
        setAddSuccess('');
      }, 2000);
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      setAddError('Erro ao enviar convite. Tente novamente.');
    } finally {
      setAdding(false);
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setNewEmail('');
    setNewCargo('');
    setAddError('');
    setAddSuccess('');
    setFoundUser(null);
  };

  // Abrir modal de edição
  const handleOpenEditModal = (usuario) => {
    setEditingUser(usuario);
    setEditName(usuario.name || '');
    setEditRole(usuario.user_role || '');
    setEditError('');
    setEditSuccess('');
    setShowEditModal(true);
  };

  // Fechar modal de edição
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
    setEditName('');
    setEditRole('');
    setEditError('');
    setEditSuccess('');
  };

  // Salvar edição do usuário
  const handleSaveEdit = async (e) => {
    e.preventDefault();

    if (!editName.trim()) {
      setEditError('O nome é obrigatório.');
      return;
    }

    setEditing(true);
    setEditError('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editName.trim(),
          user_role: editRole.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      setEditSuccess('Usuário atualizado com sucesso!');
      await fetchUsuarios(userProfile?.organization_id);

      setTimeout(() => {
        closeEditModal();
      }, 1500);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      setEditError('Erro ao atualizar usuário. Tente novamente.');
    } finally {
      setEditing(false);
    }
  };

  // Abrir modal de exclusão
  const handleOpenDeleteModal = (usuario) => {
    setDeletingUser(usuario);
    setDeleteError('');
    setShowDeleteModal(true);
  };

  // Fechar modal de exclusão
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingUser(null);
    setDeleteError('');
  };

  // Excluir usuário da empresa
  const handleDeleteFromCompany = async () => {
    if (!deletingUser) return;

    setDeleting(true);
    setDeleteError('');

    try {
      // Remove o organization_id do usuário (desvincula da empresa)
      const { error } = await supabase
        .from('profiles')
        .update({
          organization_id: null,
          user_role: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', deletingUser.id);

      if (error) throw error;

      await fetchUsuarios(userProfile?.organization_id);
      closeDeleteModal();
    } catch (error) {
      console.error('Erro ao remover usuário da empresa:', error);
      setDeleteError('Erro ao remover usuário. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="usuarios-page">
      <h2>Usuários</h2>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={filterCargo} onChange={e => setFilterCargo(e.target.value)}>
          <option value="">Todos os cargos</option>
          {cargos.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            backgroundColor: '#16a34a',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          + Adicionar Usuário
        </button>
      </div>

      {/* Modal para convidar usuário */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '450px',
            boxShadow: '0 10px 24px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginTop: 0 }}>Convidar Usuário para sua Equipe</h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: 16 }}>
              Digite o e-mail de um usuário cadastrado para enviar um convite.
            </p>

            <form onSubmit={handleSendInvite}>
              {/* Campo de busca por email */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                  E-mail do usuário *
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={e => {
                      setNewEmail(e.target.value);
                      setFoundUser(null);
                      setAddError('');
                      setAddSuccess('');
                    }}
                    placeholder="usuario@exemplo.com"
                    style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                    disabled={foundUser !== null}
                  />
                  {!foundUser ? (
                    <button
                      type="button"
                      onClick={handleSearchUser}
                      disabled={searching}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        cursor: searching ? 'not-allowed' : 'pointer',
                        fontWeight: 500
                      }}
                    >
                      {searching ? 'Buscando...' : 'Buscar'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setFoundUser(null);
                        setNewEmail('');
                        setAddSuccess('');
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: '1px solid #ccc',
                        backgroundColor: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      Alterar
                    </button>
                  )}
                </div>
              </div>

              {/* Usuário encontrado */}
              {foundUser && (
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: 12
                }}>
                  <p style={{ margin: 0, fontWeight: 500 }}>✓ Usuário encontrado</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
                    {foundUser.name || 'Sem nome'} ({foundUser.email})
                  </p>
                </div>
              )}

              {/* Campo de cargo */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                  Cargo na equipe (opcional)
                </label>
                <input
                  type="text"
                  value={newCargo}
                  onChange={e => setNewCargo(e.target.value)}
                  placeholder="Ex: Veterinário, Tratador, Biólogo..."
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </div>

              {addError && (
                <p style={{ color: '#dc2626', marginBottom: 12, fontSize: '14px' }}>{addError}</p>
              )}
              {addSuccess && !foundUser && (
                <p style={{ color: '#16a34a', marginBottom: 12, fontSize: '14px' }}>{addSuccess}</p>
              )}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #ccc',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={adding || !foundUser}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: foundUser ? '#16a34a' : '#9ca3af',
                    color: 'white',
                    cursor: (adding || !foundUser) ? 'not-allowed' : 'pointer',
                    fontWeight: 600
                  }}
                >
                  {adding ? 'Enviando...' : 'Enviar Convite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para editar usuário */}
      {showEditModal && editingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '450px',
            boxShadow: '0 10px 24px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginTop: 0 }}>Editar Funcionário</h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: 16 }}>
              Atualize as informações do funcionário.
            </p>

            <form onSubmit={handleSaveEdit}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                  E-mail
                </label>
                <input
                  type="email"
                  value={editingUser.email}
                  disabled
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #ccc',
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280'
                  }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                  Nome *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Nome do funcionário"
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                  Cargo
                </label>
                <input
                  type="text"
                  value={editRole}
                  onChange={e => setEditRole(e.target.value)}
                  placeholder="Ex: Veterinário, Tratador, Biólogo..."
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </div>

              {editError && (
                <p style={{ color: '#dc2626', marginBottom: 12, fontSize: '14px' }}>{editError}</p>
              )}
              {editSuccess && (
                <p style={{ color: '#16a34a', marginBottom: 12, fontSize: '14px' }}>{editSuccess}</p>
              )}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={closeEditModal}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #ccc',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editing}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    cursor: editing ? 'not-allowed' : 'pointer',
                    fontWeight: 600
                  }}
                >
                  {editing ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para confirmar exclusão */}
      {showDeleteModal && deletingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 10px 24px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginTop: 0, color: '#dc2626' }}>Remover Funcionário</h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: 16 }}>
              Tem certeza que deseja remover <strong>{deletingUser.name || deletingUser.email}</strong> da empresa?
            </p>
            <p style={{ color: '#666', fontSize: '13px', marginBottom: 16 }}>
              O usuário será desvinculado da empresa e perderá acesso aos recursos. Esta ação pode ser revertida convidando o usuário novamente.
            </p>

            {deleteError && (
              <p style={{ color: '#dc2626', marginBottom: 12, fontSize: '14px' }}>{deleteError}</p>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #ccc',
                  backgroundColor: 'white',
                  cursor: deleting ? 'not-allowed' : 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteFromCompany}
                disabled={deleting}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontWeight: 600
                }}
              >
                {deleting ? 'Removendo...' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table className="usuarios-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Cargo</th>
              <th>Data de Criação</th>
              <th>Data de Atualização</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.user_role}</td>
                <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : ''}</td>
                <td>{u.updated_at ? new Date(u.updated_at).toLocaleDateString() : ''}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleOpenEditModal(u)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleOpenDeleteModal(u)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
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
