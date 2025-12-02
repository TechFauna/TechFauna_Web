import React, { useEffect, useState } from 'react';
import supabase from '../supabaseCliente';

function Notifications({ user, onUpdate }) {
  const [convites, setConvites] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchConvites = async () => {
    if (!user?.id) return;

    // Buscar convites pendentes
    const { data: invites, error } = await supabase
      .from('company_invites')
      .select('*')
      .eq('invited_user_id', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Erro ao buscar convites:', error);
      return;
    }

    // Buscar dados dos donos
    if (invites && invites.length > 0) {
      const ownerIds = [...new Set(invites.map(i => i.company_owner_id))];
      const { data: owners } = await supabase
        .from('profiles')
        .select('id, nome, email')
        .in('id', ownerIds);

      const ownersMap = (owners || []).reduce((acc, o) => {
        acc[o.id] = o;
        return acc;
      }, {});

      const invitesWithOwners = invites.map(invite => ({
        ...invite,
        owner: ownersMap[invite.company_owner_id] || null
      }));

      setConvites(invitesWithOwners);
    } else {
      setConvites([]);
    }
  };

  useEffect(() => {
    fetchConvites();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchConvites, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleResponse = async (conviteId, accept) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('company_invites')
        .update({ 
          status: accept ? 'accepted' : 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', conviteId);

      if (error) throw error;

      await fetchConvites();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Erro ao responder convite:', error);
      alert('Erro ao responder convite. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const count = convites.length;

  return (
    <>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          padding: '8px',
          fontSize: '20px'
        }}
        title="Notificações"
      >
        🔔
        {count > 0 && (
          <span style={{
            position: 'absolute',
            top: 0,
            right: 0,
            backgroundColor: '#dc2626',
            color: 'white',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            {count}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div
            onClick={() => setShowDropdown(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
          />
          <div style={{
            position: 'fixed',
            top: '60px',
            left: '140px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            width: '320px',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 1000
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', fontWeight: 600 }}>
              Notificações
            </div>

            {convites.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                Nenhuma notificação
              </div>
            ) : (
              convites.map(convite => (
                <div key={convite.id} style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                    <strong>{convite.owner?.nome || convite.owner?.email || 'Uma empresa'}</strong>
                    {' '}convidou você para fazer parte da equipe
                    {convite.cargo && <> como <strong>{convite.cargo}</strong></>}.
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleResponse(convite.id, true)}
                      disabled={loading}
                      style={{
                        flex: 1, padding: '6px 12px', borderRadius: '4px',
                        border: 'none', backgroundColor: '#16a34a', color: 'white',
                        cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px'
                      }}
                    >
                      Aceitar
                    </button>
                    <button
                      onClick={() => handleResponse(convite.id, false)}
                      disabled={loading}
                      style={{
                        flex: 1, padding: '6px 12px', borderRadius: '4px',
                        border: '1px solid #ccc', backgroundColor: 'white',
                        cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px'
                      }}
                    >
                      Recusar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </>
  );
}

export default Notifications;

