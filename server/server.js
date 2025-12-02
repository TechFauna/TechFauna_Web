const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

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
  const { email, senha, name } = req.body;

  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Endereco de e-mail invalido.' });
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    if (authError) throw authError;

    // Criar perfil do usuario na tabela profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: authData.user.id,
        email: email,
        name: name || email.split('@')[0],
        full_name: name || null,
      }])
      .select('*');

    if (profileError) throw profileError;

    return res.status(201).json({
      message: 'Usuario criado com sucesso.',
      user: authData.user,
      profile: profileData,
    });
  } catch (error) {
    console.error('Erro ao registrar usuario:', error);
    return res.status(500).json({
      message: 'Erro ao registrar usuario.',
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

// ==================== ENCLOSURES (Recintos) ====================

app.get('/enclosures', async (req, res) => {
  const { area_id: areaId, status } = req.query;

  try {
    let query = supabase.from('enclosures').select('*');

    if (areaId) {
      query = query.eq('area_id', areaId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('name', { ascending: true });

    if (error) throw error;

    return res.status(200).json(data || []);
  } catch (error) {
    console.error('Erro ao buscar recintos:', error);
    return res.status(500).json({ message: 'Erro ao buscar recintos.', error: error.message });
  }
});

app.get('/enclosures/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('enclosures')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    console.error('Erro ao buscar recinto:', error);
    return res.status(500).json({ message: 'Erro ao buscar recinto.', error: error.message });
  }
});

app.post('/enclosures', async (req, res) => {
  const { name, code, area_id, environment_type, capacity, status, notes } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'O campo name eh obrigatorio.' });
  }

  try {
    const { data, error } = await supabase
      .from('enclosures')
      .insert([{
        name,
        code: code || null,
        area_id: area_id || null,
        environment_type: environment_type || null,
        capacity: capacity || null,
        status: status || 'ativo',
        notes: notes || null,
      }])
      .select('*')
      .single();

    if (error) throw error;

    return res.status(201).json({ message: 'Recinto criado com sucesso.', data });
  } catch (error) {
    console.error('Erro ao criar recinto:', error);
    return res.status(500).json({ message: 'Erro ao criar recinto.', error: error.message });
  }
});

app.patch('/enclosures/:id', async (req, res) => {
  const { id } = req.params;
  const { name, code, area_id, environment_type, capacity, status, notes } = req.body;

  const updatePayload = {};
  if (name !== undefined) updatePayload.name = name;
  if (code !== undefined) updatePayload.code = code;
  if (area_id !== undefined) updatePayload.area_id = area_id;
  if (environment_type !== undefined) updatePayload.environment_type = environment_type;
  if (capacity !== undefined) updatePayload.capacity = capacity;
  if (status !== undefined) updatePayload.status = status;
  if (notes !== undefined) updatePayload.notes = notes;

  if (!Object.keys(updatePayload).length) {
    return res.status(400).json({ message: 'Nenhum campo recebido para atualizacao.' });
  }

  try {
    const { data, error } = await supabase
      .from('enclosures')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    return res.status(200).json({ message: 'Recinto atualizado com sucesso.', data });
  } catch (error) {
    console.error('Erro ao atualizar recinto:', error);
    return res.status(500).json({ message: 'Erro ao atualizar recinto.', error: error.message });
  }
});

app.delete('/enclosures/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('enclosures')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao remover recinto:', error);
    return res.status(500).json({ message: 'Erro ao remover recinto.', error: error.message });
  }
});

// ==================== SPECIES (Especies) ====================

app.get('/species', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('species')
      .select('*')
      .order('common_name', { ascending: true });

    if (error) throw error;

    return res.status(200).json(data || []);
  } catch (error) {
    console.error('Erro ao buscar especies:', error);
    return res.status(500).json({ message: 'Erro ao buscar especies.', error: error.message });
  }
});

app.get('/species/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('species')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    console.error('Erro ao buscar especie:', error);
    return res.status(500).json({ message: 'Erro ao buscar especie.', error: error.message });
  }
});

app.post('/species', async (req, res) => {
  const { common_name, scientific_name, conservation_status, diet, description } = req.body;

  if (!common_name) {
    return res.status(400).json({ message: 'O campo common_name eh obrigatorio.' });
  }

  try {
    const { data, error } = await supabase
      .from('species')
      .insert([{
        common_name,
        scientific_name: scientific_name || null,
        conservation_status: conservation_status || null,
        diet: diet || null,
        description: description || null,
      }])
      .select('*')
      .single();

    if (error) throw error;

    return res.status(201).json({ message: 'Especie criada com sucesso.', data });
  } catch (error) {
    console.error('Erro ao criar especie:', error);
    return res.status(500).json({ message: 'Erro ao criar especie.', error: error.message });
  }
});

app.patch('/species/:id', async (req, res) => {
  const { id } = req.params;
  const { common_name, scientific_name, conservation_status, diet, description } = req.body;

  const updatePayload = {};
  if (common_name !== undefined) updatePayload.common_name = common_name;
  if (scientific_name !== undefined) updatePayload.scientific_name = scientific_name;
  if (conservation_status !== undefined) updatePayload.conservation_status = conservation_status;
  if (diet !== undefined) updatePayload.diet = diet;
  if (description !== undefined) updatePayload.description = description;

  if (!Object.keys(updatePayload).length) {
    return res.status(400).json({ message: 'Nenhum campo recebido para atualizacao.' });
  }

  try {
    const { data, error } = await supabase
      .from('species')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    return res.status(200).json({ message: 'Especie atualizada com sucesso.', data });
  } catch (error) {
    console.error('Erro ao atualizar especie:', error);
    return res.status(500).json({ message: 'Erro ao atualizar especie.', error: error.message });
  }
});

app.delete('/species/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('species')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao remover especie:', error);
    return res.status(500).json({ message: 'Erro ao remover especie.', error: error.message });
  }
});

// ==================== PROFILES ====================

app.get('/profiles', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, full_name, created_at')
      .order('name', { ascending: true });

    if (error) throw error;

    return res.status(200).json(data || []);
  } catch (error) {
    console.error('Erro ao buscar perfis:', error);
    return res.status(500).json({ message: 'Erro ao buscar perfis.', error: error.message });
  }
});

app.get('/profiles/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return res.status(500).json({ message: 'Erro ao buscar perfil.', error: error.message });
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
    animal_id: animalId,
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
      animal_id: animalId ?? null,
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
    animal_id: animalId,
    prerequisites,
  } = req.body;

  const updatePayload = {};
  const enclosureId =
    req.body.enclosure_id ?? recintoId ?? req.body.recintoId ?? undefined;
  const speciesId =
    req.body.species_id ?? especieId ?? req.body.especieId ?? undefined;

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
    animal_id: animalId,
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
