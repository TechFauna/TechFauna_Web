import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import axios from 'axios';
import supabase from '../supabaseCliente';
import './Tasks.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const emptyForm = {
  title: '',
  description: '',
  assigned_to: '',
  due_at: '',
  priority: 'media',
  status: 'pending',
  photo_required: false,
  enclosure_id: '',
  species_id: '',
  checklist_template_id: '',
  prerequisites: [],
};

const statusOptions = [
  { value: 'pending', label: 'Pendente' },
  { value: 'blocked', label: 'Bloqueada' },
  { value: 'completed', label: 'Concluida' },
];

const priorityOptions = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
];

const isValidStatus = (value) => statusOptions.some((option) => option.value === value);

const isValidPriority = (value) => priorityOptions.some((option) => option.value === value);

const getErrorMessage = (err, fallback) => {
  const data = err.response?.data;
  return data?.details || data?.error || data?.message || fallback;
};

const formatDateTime = (value) => {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch (error) {
    return value;
  }
};

const toInputDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localISOTime = new Date(date.getTime() - tzOffset).toISOString();
  return localISOTime.slice(0, 16);
};

const ensureArrayOfNumbers = (values) => {
  if (!values) return [];
  return values
    .map((value) => Number(value))
    .filter((num) => !Number.isNaN(num));
};

const buildQueryString = (filters) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.assigned_to) params.append('assigned_to', filters.assigned_to);
  if (filters.due_from) params.append('due_from', filters.due_from);
  if (filters.due_to) params.append('due_to', filters.due_to);
  const query = params.toString();
  return query ? `?${query}` : '';
};

function Tasks({ canManage = true }) {
  const [token, setToken] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'pending',
    assigned_to: '',
    due_from: '',
    due_to: '',
  });
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const readOnly = !canManage;

  useEffect(() => {
    let isMounted = true;

    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (isMounted) {
        setToken(data.session?.access_token || '');
      }
    };

    fetchSession();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setToken(session?.access_token || '');
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const queryString = buildQueryString(filters);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_BASE_URL}/tasks${queryString}`, { headers });
      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Nao foi possivel carregar as tarefas.'));
    } finally {
      setLoading(false);
    }
  }, [filters, token]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const availablePrerequisites = useMemo(() => {
    const excludeId = editingId;
    return tasks.filter((task) => task.id !== excludeId);
  }, [editingId, tasks]);

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (name === 'photo_required') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    if (name === 'prerequisites') {
      const selectedValues = Array.from(event.target.selectedOptions).map((option) => option.value);
      setFormData((prev) => ({ ...prev, prerequisites: ensureArrayOfNumbers(selectedValues) }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const setFormFromTask = (task) => {
    if (!canManage) {
      return;
    }
    setEditingId(task.id);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      assigned_to: task.assigned_to || '',
      due_at: toInputDateTime(task.due_at),
      priority: isValidPriority(task.priority) ? task.priority : 'media',
      status: isValidStatus(task.status) ? task.status : 'pending',
      photo_required: Boolean(task.photo_required),
      enclosure_id: task.enclosure_id || '',
      species_id: task.species_id || '',
      checklist_template_id: task.checklist_template_id || '',
      prerequisites: ensureArrayOfNumbers(task.prerequisites?.map((p) => p.depends_on_task_id) || []),
    });
  };

  const payloadFromForm = () => {
    const dueAtPayload = formData.due_at ? `${formData.due_at}:00` : undefined;

    const sanitizedPriority = isValidPriority(formData.priority) ? formData.priority : 'media';
    const sanitizedStatus = isValidStatus(formData.status) ? formData.status : 'pending';

    return {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      assigned_to: formData.assigned_to.trim() || undefined,
      due_at: dueAtPayload,
      priority: sanitizedPriority,
      status: sanitizedStatus,
      photo_required: formData.photo_required,
      enclosure_id: formData.enclosure_id.trim() || undefined,
      species_id: formData.species_id.trim() || undefined,
      checklist_template_id: formData.checklist_template_id.trim() || undefined,
      prerequisites: ensureArrayOfNumbers(formData.prerequisites),
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canManage) {
      return;
    }

    if (!formData.title.trim()) {
      setError('Informe um titulo para a tarefa.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = payloadFromForm();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (editingId) {
        await axios.patch(`${API_BASE_URL}/tasks/${editingId}`, payload, { headers });
      } else {
        await axios.post(`${API_BASE_URL}/tasks`, payload, { headers });
      }

      resetForm();
      await fetchTasks();
    } catch (err) {
      setError(getErrorMessage(err, 'Nao foi possivel salvar a tarefa.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (taskId) => {
    if (!canManage) {
      return;
    }

    const confirmDelete = window.confirm('Deseja remover esta tarefa?');
    if (!confirmDelete) {
      return;
    }

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`${API_BASE_URL}/tasks/${taskId}`, { headers });
      if (editingId === taskId) {
        resetForm();
      }
      await fetchTasks();
    } catch (err) {
      setError(getErrorMessage(err, 'Nao foi possivel remover a tarefa.'));
    }
  };

  const handleReopen = async (taskId) => {
    if (!canManage) {
      return;
    }

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${API_BASE_URL}/tasks/${taskId}/reopen`, undefined, { headers });
      await fetchTasks();
    } catch (err) {
      setError(getErrorMessage(err, 'Nao foi possivel reabrir a tarefa.'));
    }
  };

  const statusChipClass = (value) => {
    switch (value) {
      case 'completed':
        return 'status-chip status-chip--completed';
      case 'blocked':
        return 'status-chip status-chip--blocked';
      default:
        return 'status-chip status-chip--pending';
    }
  };

  const priorityLabel = (value) => {
    const option = priorityOptions.find((item) => item.value === value);
    return option?.label || (value ? value : 'Nao definido');
  };

  const statusLabel = (value) => {
    const option = statusOptions.find((item) => item.value === value);
    return option?.label || (value ? value : 'Nao definido');
  };

  return (
    <div className="tasks-page">
      <header className="tasks-header">
        <div>
          <h1>Gestao de Tarefas</h1>
          <p className="tasks-subtitle">
            Acompanhe e organize as tarefas criadas pelo time de campo. Este painel aceita criacao e edicao livre para testes.
          </p>
        </div>
        <div className="tasks-filters">
          <div className="filter-field">
            <label htmlFor="status-filter">Status</label>
            <select
              id="status-filter"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">Todos</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-field">
            <label htmlFor="responsavel-filter">Responsavel</label>
            <input
              id="responsavel-filter"
              name="assigned_to"
              placeholder="ID do responsavel"
              value={filters.assigned_to}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-field">
            <label htmlFor="from-filter">Data inicial</label>
            <input
              id="from-filter"
              type="date"
              name="due_from"
              value={filters.due_from}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-field">
            <label htmlFor="to-filter">Data final</label>
            <input
              id="to-filter"
              type="date"
              name="due_to"
              value={filters.due_to}
              onChange={handleFilterChange}
            />
          </div>
          <button
            type="button"
            className="filter-reset"
            onClick={() => setFilters({
              status: 'pending',
              assigned_to: '',
              due_from: '',
              due_to: '',
            })}
          >
            Limpar filtros
          </button>
        </div>
      </header>

      {readOnly && (
        <div className="tasks-readonly-banner">
          Voce esta visualizando as tarefas em modo leitura. Solicite acesso de edicao se precisar alterar conteudos.
        </div>
      )}

      {error && <div className="tasks-error">{error}</div>}

      <section className="tasks-layout">
        <div className="tasks-list">
          {loading ? (
            <div className="tasks-empty">Carregando tarefas...</div>
          ) : tasks.length === 0 ? (
            <div className="tasks-empty">
              Nenhuma tarefa encontrada com os filtros atuais.
            </div>
          ) : (
            <div className="tasks-grid">
              {tasks.map((task) => (
                <article key={task.id} className="task-card">
                  <header className="task-card__header">
                    <h2>{task.title}</h2>
                    <span className={statusChipClass(task.status)}>
                      {statusLabel(task.status)}
                    </span>
                  </header>
                  <p className="task-card__description">
                    {task.description || 'Sem descricao.'}
                  </p>
                  <dl className="task-card__meta">
                    <div>
                      <dt>Responsavel</dt>
                      <dd>{task.assigned_to || '-'}</dd>
                    </div>
                    <div>
                      <dt>Prazo</dt>
                      <dd>{formatDateTime(task.due_at)}</dd>
                    </div>
                    <div>
                      <dt>Prioridade</dt>
                      <dd>{priorityLabel(task.priority)}</dd>
                    </div>
                    <div>
                      <dt>Precisa de foto?</dt>
                      <dd>{task.photo_required ? 'Sim' : 'Nao'}</dd>
                    </div>
                    <div>
                      <dt>Recinto</dt>
                      <dd>{task.enclosure_id || '-'}</dd>
                    </div>
                    <div>
                      <dt>Especie</dt>
                      <dd>{task.species_id || '-'}</dd>
                    </div>
                    <div>
                      <dt>Template</dt>
                      <dd>{task.checklist_template_id || '-'}</dd>
                    </div>
                  </dl>

                  {task.prerequisites?.length > 0 && (
                    <div className="task-card__prereq">
                      <h3>Dependencias</h3>
                      <ul>
                        {task.prerequisites.map((item) => (
                          <li key={item.id || `${task.id}-${item.depends_on_task_id}`}>
                            Tarefa #{item.depends_on_task_id}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {canManage && (
                    <footer className="task-card__actions">
                      <button type="button" onClick={() => setFormFromTask(task)}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => handleDelete(task.id)}
                      >
                        Excluir
                      </button>
                      {task.status === 'completed' && (
                        <button
                          type="button"
                          className="ghost"
                          onClick={() => handleReopen(task.id)}
                        >
                          Reabrir
                        </button>
                      )}
                    </footer>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="task-form-card">
          <h2>{canManage ? (editingId ? 'Editar tarefa' : 'Nova tarefa') : 'Painel de tarefas'}</h2>
          <p className="task-form-card__caption">
            {canManage
              ? 'Defina responsavel, prioridade e vinculos. Utilize dependencias para controlar precedencias.'
              : 'Visualize o andamento das tarefas do time. Solicite a um administrador para realizar alteracoes.'}
          </p>

          {canManage ? (
            <form onSubmit={handleSubmit} className="task-form">
            <label htmlFor="task-title">Titulo</label>
            <input
              id="task-title"
              name="title"
              placeholder="Informe um titulo curto"
              value={formData.title}
              onChange={handleFormChange}
              required
            />

            <label htmlFor="task-description">Descricao</label>
            <textarea
              id="task-description"
              name="description"
              placeholder="Detalhes da tarefa"
              value={formData.description}
              onChange={handleFormChange}
              rows={3}
            />

            <div className="task-form__row">
              <div>
                <label htmlFor="task-assigned">Responsavel</label>
                <input
                  id="task-assigned"
                  name="assigned_to"
                  placeholder="ID ou nome do responsavel"
                  value={formData.assigned_to}
                  onChange={handleFormChange}
                />
              </div>
              <div>
                <label htmlFor="task-due">Prazo</label>
                <input
                  id="task-due"
                  type="datetime-local"
                  name="due_at"
                  value={formData.due_at}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            <div className="task-form__row">
              <div>
                <label htmlFor="task-priority">Prioridade</label>
                <select
                  id="task-priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleFormChange}
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="task-status">Status</label>
                <select
                  id="task-status"
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="task-form__row">
              <div>
                <label htmlFor="task-recinto">Recinto</label>
                <input
                  id="task-recinto"
                  name="enclosure_id"
                  placeholder="ID do recinto"
                  value={formData.enclosure_id}
                  onChange={handleFormChange}
                />
              </div>
              <div>
                <label htmlFor="task-especie">Especie</label>
                <input
                  id="task-especie"
                  name="species_id"
                  placeholder="ID da especie"
                  value={formData.species_id}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            <label htmlFor="task-template">Template</label>
            <input
              id="task-template"
              name="checklist_template_id"
              placeholder="ID do template"
              value={formData.checklist_template_id}
              onChange={handleFormChange}
            />

            <label htmlFor="task-prereq">Dependencias</label>
            <select
              id="task-prereq"
              name="prerequisites"
              value={formData.prerequisites.map(String)}
              onChange={handleFormChange}
              multiple
            >
              {availablePrerequisites.map((task) => (
                <option key={task.id} value={task.id}>
                  #{task.id} - {task.title}
                </option>
              ))}
            </select>

            <label className="checkbox">
              <input
                type="checkbox"
                name="photo_required"
                checked={formData.photo_required}
                onChange={handleFormChange}
              />
              Solicitar foto como comprovacao
            </label>

            <div className="task-form__actions">
              {editingId && (
                <button
                  type="button"
                  className="ghost"
                  onClick={resetForm}
                >
                  Cancelar edicao
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Salvando...' : editingId ? 'Atualizar tarefa' : 'Criar tarefa'}
              </button>
            </div>
            </form>
          ) : (
            <div className="task-form-readonly">
              <p>
                Voce esta em modo de leitura. Apenas administradores podem criar ou editar tarefas.
              </p>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

export default Tasks;
