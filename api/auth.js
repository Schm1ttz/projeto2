const fs = require('fs');
const path = require('path');

// Banco de dados em memória (em produção use um banco real)
let database = {
  users: [
    { 
      id: 1, 
      name: "Administrador", 
      email: "admin@eletromaquinas.com", 
      password: "admin123", 
      role: "admin", 
      createdAt: new Date().toISOString() 
    }
  ],
  products: [],
  clients: []
};

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { method } = req;
  
  try {
    switch (method) {
      case 'POST':
        if (req.url === '/api/login') {
          return handleLogin(req, res);
        }
        if (req.url === '/api/clients/register') {
          return handleRegister(req, res);
        }
        break;
    }
    
    return res.status(404).json({ error: 'Endpoint não encontrado' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

async function handleLogin(req, res) {
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', async () => {
    try {
      const { email, password } = JSON.parse(body);
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }
      
      const user = database.users.find(u => 
        u.email.toLowerCase() === email.toLowerCase() && 
        u.password === password
      );
      
      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      
      return res.json({
        success: true,
        token: user.email,
        user: userWithoutPassword
      });
    } catch (error) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }
  });
}

async function handleRegister(req, res) {
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', async () => {
    try {
      const clientData = JSON.parse(body);
      
      if (!clientData.name || !clientData.email || !clientData.password) {
        return res.status(400).json({ error: 'Dados incompletos' });
      }
      
      const existingClient = database.clients.find(c => c.email === clientData.email);
      if (existingClient) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }
      
      const newClient = {
        id: database.clients.length + 1,
        ...clientData,
        status: 'ativo',
        createdAt: new Date().toISOString()
      };
      
      database.clients.push(newClient);
      
      const newUser = {
        id: database.users.length + 1,
        name: clientData.name,
        email: clientData.email,
        password: clientData.password,
        role: 'client',
        createdAt: new Date().toISOString()
      };
      
      database.users.push(newUser);
      
      const { password: _, ...clientWithoutPassword } = newClient;
      
      return res.status(201).json({
        success: true,
        client: clientWithoutPassword,
        token: newClient.email
      });
    } catch (error) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }
  });
}