const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: process.env.WEB_APP_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Supabase credentials are missing. Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const PRIORITY_MAP = new Map([
  ['baixa', 'baixa'],
  ['media', 'media'],
  ['alta', 'alta'],
  ['low', 'baixa'],
  ['medium', 'media'],
  ['high', 'alta'],
]);
const STATUS_MAP = new Map([
  ['pending', 'pending'],
  ['blocked', 'blocked'],
  ['completed', 'completed'],
  ['in_progress', 'blocked'],
  ['em_andamento', 'blocked'],
  ['concluida', 'completed'],
  ['pendente', 'pending'],
  ['bloqueada', 'blocked'],
]);
const DEFAULT_PRIORITY = 'media';
const DEFAULT_STATUS = 'pending';

const normalizePriority = (value) => {
  if (!value) {
    return DEFAULT_PRIORITY;
  }
  const normalized = PRIORITY_MAP.get(String(value).toLowerCase());
  return normalized || null;
};

const normalizeStatus = (value) => {
  if (!value) {
    return DEFAULT_STATUS;
  }
  const normalized = STATUS_MAP.get(String(value).toLowerCase());
  return normalized || null;
};

const fetchTaskPrerequisites = async (taskIds = []) => {
  if (!taskIds.length) {
    return [];
  }

  const { data, error } = await supabase
    .from('task_prerequisites')
    .select('id, task_id, depends_on_task_id')
    .in('task_id', taskIds);

  if (error) {
    throw error;
  }

  return data || [];
};

const buildTaskResponse = (tasks = [], prerequisites = []) => {
  const prerequisitesByTask = prerequisites.reduce((acc, entry) => {
    if (!acc[entry.task_id]) {
      acc[entry.task_id] = [];
    }
    acc[entry.task_id].push(entry);
    return acc;
  }, {});

  return tasks.map((task) => ({
    ...task,
    prerequisites: prerequisitesByTask[task.id] || [],
  }));
};

app.post('/register', async (req, res) => {
  const { email, senha } = req.body;

  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Endereco de e-mail invalido.' });
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    if (authError) throw authError;

    const { data: recintoData, error: recintoError } = await supabase
      .from('recintos')
      .insert([{
        nome: 'Recinto Padrao',
        especie: 'Especie Inicial',
        qnt_animais: 0,
        id_user: authData.user.id,
      }])
      .select('*');

    if (recintoError) throw recintoError;

    return res.status(201).json({
      message: 'Usuario e recinto criados com sucesso.',
      recinto: recintoData,
    });
  } catch (error) {
    console.error('Erro ao registrar usuario e criar recinto:', error);
    return res.status(500).json({
      message: 'Erro ao registrar usuario e criar recinto.',
      error: error.message,
    });
  }
});

app.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Endereco de e-mail invalido.' });
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (authError) {
      return res.status(401).json({ message: 'Credenciais invalidas.' });
    }

    return res.status(200).json({
      message: 'Login realizado com sucesso.',
      id_user: authData.user.id,
    });
  } catch (error) {
    console.error('Erro ao realizar login:', error);
    return res.status(500).json({ message: 'Erro ao realizar login.', error: error.message });
  }
});

app.get('/recintos', async (req, res) => {
  const { user_id: userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: 'user_id eh necessario.' });
  }

  try {
    const { data, error } = await supabase
      .from('recintos')
      .select('*')
      .eq('id_user', userId);

    if (error) {
      throw error;
    }

    return res.status(200).json(data || []);
  } catch (error) {
    console.error('Erro ao buscar recintos:', error);
    return res.status(500).json({ message: 'Erro ao buscar recintos.', error: error.message });
  }
});

app.post('/recintos', async (req, res) => {
  const { nome, especie, animais, id_user: idUser } = req.body;

  try {
    const { data, error } = await supabase
      .from('recintos')
      .insert([{ nome, especie, animais, id_user: idUser }])
      .select('*');

    if (error) throw error;

    return res.status(201).json({ message: 'Recinto criado com sucesso.', data });
  } catch (error) {
    console.error('Erro ao criar recinto:', error);
    return res.status(500).json({ message: 'Erro ao criar recinto.', error: error.message });
  }
});

app.get('/tasks', async (req, res) => {
  const {
    status,
    assigned_to: assignedTo,
    due_from: dueFrom,
    due_to: dueTo,
  } = req.query;

  const normalizedStatus = normalizeStatus(status);

  try {
    let query = supabase.from('tasks').select('*');

    if (status) {
      if (!normalizedStatus) {
        return res.status(400).json({ message: 'Filtro de status invalido.' });
      }
      query = query.eq('status', normalizedStatus);
    }
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }
    if (dueFrom) {
      query = query.gte('due_at', dueFrom);
    }
    if (dueTo) {
      query = query.lte('due_at', dueTo);
    }

    const { data: tasksData, error: tasksError } = await query.order('due_at', { ascending: true });
    if (tasksError) {
      throw tasksError;
    }

    const prerequisites = await fetchTaskPrerequisites((tasksData || []).map((task) => task.id));
    res.json(buildTaskResponse(tasksData || [], prerequisites));
  } catch (error) {
    console.error('Erro ao listar tarefas:', error);
    res.status(500).json({ message: 'Erro ao listar tarefas.', error: error.message });
  }
});

app.post('/tasks', async (req, res) => {
  const {
    title,
    description,
    assigned_to: assignedTo,
    due_at: dueAt,
    priority,
    status,
    photo_required: photoRequired = false,
    enclosure_id: enclosureId,
    species_id: speciesId,
    checklist_template_id: checklistTemplateId,
    recinto_id: legacyRecintoId,
    especie_id: legacyEspecieId,
    template_id: legacyTemplateId,
    prerequisites = [],
  } = req.body;

  if (!title) {
    res.status(400).json({ message: 'O campo title eh obrigatorio.' });
    return;
  }

  const normalizedPriority = normalizePriority(priority ?? DEFAULT_PRIORITY);
  if (!normalizedPriority) {
    res.status(400).json({ message: 'Valor de prioridade invalido.' });
    return;
  }

  const normalizedStatus = normalizeStatus(status ?? DEFAULT_STATUS);
  if (!normalizedStatus) {
    res.status(400).json({ message: 'Valor de status invalido.' });
    return;
  }

  try {
    const payload = {
      title,
      status: normalizedStatus,
      photo_required: photoRequired,
      priority: normalizedPriority,
    };

    const optionalFields = {
      description,
      assigned_to: assignedTo,
      due_at: dueAt,
      enclosure_id: enclosureId ?? legacyRecintoId ?? null,
      species_id: speciesId ?? legacyEspecieId ?? null,
      checklist_template_id: checklistTemplateId ?? legacyTemplateId ?? null,
    };

    Object.entries(optionalFields).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        payload[key] = value;
      }
    });

    const { data: insertedTask, error: insertError } = await supabase
      .from('tasks')
      .insert([payload])
      .select('*')
      .single();

    if (insertError) {
      throw insertError;
    }

    if (Array.isArray(prerequisites) && prerequisites.length > 0) {
      const prereqPayload = prerequisites
        .filter((dependsOnId) => Boolean(dependsOnId))
        .map((dependsOnId) => ({
          task_id: insertedTask.id,
          depends_on_task_id: dependsOnId,
        }));

      if (prereqPayload.length > 0) {
        const { error: prereqError } = await supabase
          .from('task_prerequisites')
          .insert(prereqPayload);

        if (prereqError) {
          throw prereqError;
        }
      }
    }

    const prerequisitesData = await fetchTaskPrerequisites([insertedTask.id]);
    res.status(201).json(buildTaskResponse([insertedTask], prerequisitesData)[0]);
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    res.status(500).json({
      message: 'Erro ao criar tarefa.',
      error: error.message,
      details: error.details,
    });
  }
});

app.patch('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    assigned_to: assignedTo,
    due_at: dueAt,
    priority,
    status,
    photo_required: photoRequired,
    recinto_id: recintoId,
    especie_id: especieId,
    template_id: templateId,
    prerequisites,
  } = req.body;

  const updatePayload = {};
  const enclosureId =
    req.body.enclosure_id ?? recintoId ?? req.body.recintoId ?? undefined;
  const speciesId =
    req.body.species_id ?? especieId ?? req.body.especieId ?? undefined;
  const checklistTemplateId =
    req.body.checklist_template_id ?? templateId ?? req.body.templateId ?? undefined;

  const normalizedPriority = priority !== undefined ? normalizePriority(priority) : undefined;
  if (priority !== undefined && !normalizedPriority) {
    res.status(400).json({ message: 'Valor de prioridade invalido.' });
    return;
  }

  const normalizedStatus = status !== undefined ? normalizeStatus(status) : undefined;
  if (status !== undefined && !normalizedStatus) {
    res.status(400).json({ message: 'Valor de status invalido.' });
    return;
  }

  const fields = {
    title,
    description,
    assigned_to: assignedTo,
    due_at: dueAt,
    photo_required: photoRequired,
    enclosure_id: enclosureId,
    species_id: speciesId,
    checklist_template_id: checklistTemplateId,
  };

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined) {
      updatePayload[key] = value;
    }
  });

  if (normalizedPriority !== undefined) {
    updatePayload.priority = normalizedPriority;
  }

  if (normalizedStatus !== undefined) {
    updatePayload.status = normalizedStatus;
  }

  if (!Object.keys(updatePayload).length && prerequisites === undefined) {
    res.status(400).json({ message: 'Nenhum campo recebido para atualizacao.' });
    return;
  }

  try {
    if (Object.keys(updatePayload).length) {
      const { error: updateError } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }
    }

    if (prerequisites !== undefined) {
      const { data: currentPrereq, error: currentPrereqError } = await supabase
        .from('task_prerequisites')
        .select('depends_on_task_id')
        .eq('task_id', id);

      if (currentPrereqError) {
        throw currentPrereqError;
      }

      const currentIds = new Set((currentPrereq || []).map((item) => item.depends_on_task_id));
      const nextIds = new Set((prerequisites || []).filter(Boolean));

      const toInsert = Array.from(nextIds).filter((depId) => !currentIds.has(depId));
      const toRemove = Array.from(currentIds).filter((depId) => !nextIds.has(depId));

      if (toInsert.length) {
        const insertPayload = toInsert.map((depId) => ({
          task_id: id,
          depends_on_task_id: depId,
        }));

        const { error: insertError } = await supabase
          .from('task_prerequisites')
          .insert(insertPayload);

        if (insertError) {
          throw insertError;
        }
      }

      if (toRemove.length) {
        const { error: removeError } = await supabase
          .from('task_prerequisites')
          .delete()
          .eq('task_id', id)
          .in('depends_on_task_id', toRemove);

        if (removeError) {
          throw removeError;
        }
      }
    }

    const { data: updatedTask, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (taskError) {
      throw taskError;
    }

    const prereqData = await fetchTaskPrerequisites([id]);
    res.json(buildTaskResponse([updatedTask], prereqData)[0]);
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    res.status(500).json({ message: 'Erro ao atualizar tarefa.', error: error.message });
  }
});

app.delete('/tasks/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { error: deletePrereqError } = await supabase
      .from('task_prerequisites')
      .delete()
      .eq('task_id', id);

    if (deletePrereqError) {
      throw deletePrereqError;
    }

    const { error: deleteTaskError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (deleteTaskError) {
      throw deleteTaskError;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao remover tarefa:', error);
    res.status(500).json({ message: 'Erro ao remover tarefa.', error: error.message });
  }
});

app.post('/tasks/:id/reopen', async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        status: 'pending',
        reopened_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    const prereqData = await fetchTaskPrerequisites([id]);
    res.json(buildTaskResponse([data], prereqData)[0]);
  } catch (error) {
    console.error('Erro ao reabrir tarefa:', error);
    res.status(500).json({ message: 'Erro ao reabrir tarefa.', error: error.message });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
