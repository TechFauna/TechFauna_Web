const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express();

app.use(cors({
  origin: 'http://localhost:3000',  
}));
app.use(express.json());

const supabaseUrl = 'https://zognwavmiwcywwzxkrmg.supabase.co';  
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvZ253YXZtaXdjeXd3enhrcm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Nzg0MzcsImV4cCI6MjA2MzQ1NDQzN30.oKbW7X-kjsjvrxASv0ARDiPO_IVFno3F8MRzhJlueSE';  // Insira sua chave pública do Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};


app.post('/register', async (req, res) => {
  const { email, senha } = req.body;

  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Endereço de e-mail inválido' });
  }

  try {
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: senha,
    });

    if (authError) throw authError;

    
    const { data: recintoData, error: recintoError } = await supabase
      .from('recintos')
      .insert([{ nome: 'Recinto Padrão', especie: 'Espécie Inicial', qnt_animais: 0, id_user: authData.user.id }]);

    if (recintoError) throw recintoError;

    return res.status(201).json({ message: 'Usuário e recinto criado com sucesso', recinto: recintoData });
  } catch (error) {
    console.error('Erro ao registrar usuário e criar recinto:', error);
    return res.status(500).json({ message: 'Erro ao registrar usuário e criar recinto', error: error.message });
  }
});


app.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Endereço de e-mail inválido' });
  }

  try {
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: senha,
    });

    if (authError) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    return res.status(200).json({ message: 'Login realizado com sucesso', id_user: authData.user.id });
  } catch (error) {
    console.error('Erro ao realizar login:', error);
    return res.status(500).json({ message: 'Erro ao realizar login', error: error.message });
  }
});

app.get('/recintos', async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ message: 'user_id é necessário' });
  }

  try {
    const { data, error } = await supabase
      .from('recintos')
      .select('*')
      .eq('id_user', user_id);

    if (error) {
      throw error;
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Erro ao buscar recintos:', error);
    return res.status(500).json({ message: 'Erro ao buscar recintos', error: error.message });
  }
});

app.post('/recintos', async (req, res) => {
  const { nome, especie, animais, id_user } = req.body;

  try {
    const { data, error } = await supabase
      .from('recintos')
      .insert([{ nome, especie, animais, id_user }]);

    if (error) throw error;

    return res.status(201).json({ message: 'Recinto criado com sucesso', data });
  } catch (error) {
    console.error('Erro ao criar recinto:', error);
    return res.status(500).json({ message: 'Erro ao criar recinto', error: error.message });
  }
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
