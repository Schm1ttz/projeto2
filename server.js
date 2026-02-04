const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));
app.use('/admin', express.static('admin'));

// Configuração do Multer para Render.com
const storage = multer.memoryStorage(); // Usa memória no Render
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Banco de dados em memória (simplificado para demo)
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
  products: [
    { 
      id: 1, 
      name: "Motor Elétrico Trifásico 10HP", 
      category: "Motores", 
      price: 2850.00, 
      stock: 15, 
      description: "Motor de alta eficiência para aplicações industriais. Construído com materiais de alta qualidade.", 
      specifications: ["10 HP", "220/380V", "1750 RPM", "Proteção IP55"],
      image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      status: "ativo",
      featured: true,
      createdAt: new Date().toISOString()
    },
    { 
      id: 2, 
      name: "Gerador de Energia 50kVA", 
      category: "Geradores", 
      price: 12500.00, 
      stock: 8, 
      description: "Gerador elétrico para standby ou uso contínuo. Equipamento silencioso com painel digital.", 
      specifications: ["50 kVA", "Trifásico", "Motor Diesel", "Painel digital"],
      image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      status: "ativo",
      featured: true,
      createdAt: new Date().toISOString()
    },
    { 
      id: 3, 
      name: "Transformador Industrial 100kVA", 
      category: "Transformadores", 
      price: 8750.00, 
      stock: 5, 
      description: "Transformador de alta potência para distribuição de energia em ambientes industriais.", 
      specifications: ["100 kVA", "Alta eficiência", "Resfriamento a óleo"],
      image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      status: "ativo",
      featured: false,
      createdAt: new Date().toISOString()
    }
  ],
  clients: [],
  orders: [],
  categories: ["Motores", "Geradores", "Transformadores", "Compressores", "Ferramentas"]
};

// Rotas principais
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// API Pública
app.get('/api/products', (req, res) => {
  const { category, featured, search } = req.query;
  let products = database.products.filter(p => p.status === 'ativo');
  
  if (category) {
    products = products.filter(p => p.category === category);
  }
  
  if (featured === 'true') {
    products = products.filter(p => p.featured);
  }
  
  if (search) {
    const searchTerm = search.toLowerCase();
    products = products.filter(p => 
      p.name.toLowerCase().includes(searchTerm) || 
      p.description.toLowerCase().includes(searchTerm)
    );
  }
  
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const product = database.products.find(p => p.id == req.params.id);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: 'Produto não encontrado' });
  }
});

app.get('/api/categories', (req, res) => {
  res.json(database.categories);
});

// Login
app.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
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
    
    res.json({ 
      success: true, 
      token: user.email,
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Login Admin (compatibilidade)
app.post('/api/admin/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = database.users.find(u => 
      u.email.toLowerCase() === email.toLowerCase() && 
      u.password === password &&
      (u.role === 'admin' || u.role === 'vendedor')
    );
    
    if (!user) {
      return res.status(401).json({ error: 'Acesso restrito' });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ 
      success: true, 
      token: user.email,
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Registro de cliente
app.post('/api/clients/register', (req, res) => {
  try {
    const clientData = req.body;
    
    if (!clientData.name || !clientData.email || !clientData.password) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }
    
    const existingClient = database.clients.find(c => c.email === clientData.email);
    if (existingClient) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    
    const newClient = {
      id: database.clients.length + 1,
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone || '',
      company: clientData.company || '',
      status: 'ativo',
      createdAt: new Date().toISOString()
    };
    
    database.clients.push(newClient);
    
    // Criar usuário para login
    const newUser = {
      id: database.users.length + 1,
      name: clientData.name,
      email: clientData.email,
      password: clientData.password,
      role: 'client',
      createdAt: new Date().toISOString()
    };
    
    database.users.push(newUser);
    
    res.status(201).json({ 
      success: true, 
      client: newClient,
      token: newClient.email
    });
    
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// API Admin (simplificada para demo)
app.get('/api/admin/stats', (req, res) => {
  // Verificação simples de token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.includes('admin@eletromaquinas.com')) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  
  const stats = {
    totalProducts: database.products.length,
    totalClients: database.clients.length,
    totalSales: database.orders.length,
    totalRevenue: database.orders.reduce((sum, order) => sum + order.total, 0),
    pendingOrders: database.orders.filter(o => o.status === 'pendente').length,
    lowStockProducts: database.products.filter(p => p.stock < 5).length
  };
  
  res.json(stats);
});

app.get('/api/admin/products', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.includes('admin@eletromaquinas.com')) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  
  res.json(database.products);
});

// Health check para Render
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'EletroMáquinas API'
  });
});

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'API funcionando!' });
});

// Rota 404 para API
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Servir arquivos estáticos
app.use(express.static('public'));

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
  ========================================
  🚀 ELETROMÁQUINAS - RENDER.COM
  ========================================
  
  ✅ Servidor rodando na porta ${PORT}
  
  📍 Endpoints:
  👥 Cliente:      http://localhost:${PORT}
  👨‍💼 Administração: http://localhost:${PORT}/admin
  🩺 Health Check: http://localhost:${PORT}/health
  
  🔑 Credenciais:
  • Admin: admin@eletromaquinas.com / admin123
  
  ========================================
  `);
});
