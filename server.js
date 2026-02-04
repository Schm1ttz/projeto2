const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/admin', express.static('admin'));

// Banco de dados em memória
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
      description: "Motor de alta eficiência para aplicações industriais.", 
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
      description: "Gerador elétrico para standby ou uso contínuo.", 
      specifications: ["50 kVA", "Trifásico", "Silencioso", "Painel digital"],
      image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      status: "ativo",
      featured: true,
      createdAt: new Date().toISOString()
    }
  ],
  clients: [],
  orders: [],
  categories: ["Motores", "Geradores", "Transformadores", "Compressores"]
};

// Rotas principais
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// API pública
app.get('/api/products', (req, res) => {
  const { category, featured } = req.query;
  let products = database.products.filter(p => p.status === 'ativo');
  
  if (category) {
    products = products.filter(p => p.category === category);
  }
  
  if (featured === 'true') {
    products = products.filter(p => p.featured);
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
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }
  
  const user = database.users.find(u => 
    u.email === email && u.password === password
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
});

// Login admin
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = database.users.find(u => 
    u.email === email && u.password === password
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
});

// Dashboard stats
app.get('/api/admin/stats', (req, res) => {
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

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    service: 'EletroMáquinas',
    timestamp: new Date().toISOString()
  });
});

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API funcionando!',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
  ========================================
  🚀 ELETROMÁQUINAS - RENDER.COM
  ========================================
  ✅ Servidor rodando na porta: ${PORT}
  👥 Cliente: http://localhost:${PORT}
  👨‍💼 Admin: http://localhost:${PORT}/admin
  🔑 Login: admin@eletromaquinas.com / admin123
  🩺 Health: http://localhost:${PORT}/health
  ========================================
  `);
});
