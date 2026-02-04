const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));
app.use('/admin', express.static('admin'));

// Configuração do Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Apenas imagens são permitidas'));
  }
});

// Banco de dados
const dbPath = path.join(__dirname, 'database.json');

// Inicializar banco de dados
let database = {
  users: [
    { 
      id: 1, 
      name: "Administrador", 
      email: "admin@eletromaquinas.com", 
      password: "admin123", 
      role: "admin", 
      createdAt: new Date().toISOString() 
    },
    { 
      id: 2, 
      name: "Vendedor", 
      email: "vendedor@eletromaquinas.com", 
      password: "vendedor123", 
      role: "vendedor", 
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
      image: "/uploads/motor.jpg",
      images: [],
      status: "ativo",
      featured: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    { 
      id: 2, 
      name: "Gerador de Energia 50kVA", 
      category: "Geradores", 
      price: 12500.00, 
      stock: 8, 
      description: "Gerador elétrico para standby ou uso contínuo.", 
      specifications: ["50 kVA", "Trifásico", "Silencioso", "Painel digital"],
      image: "/uploads/gerador.jpg",
      images: [],
      status: "ativo",
      featured: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  clients: [],
  vendors: [],
  sales: [],
  orders: [],
  categories: ["Motores", "Geradores", "Transformadores", "Compressores", "Ferramentas"],
  settings: {
    companyName: "EletroMáquinas",
    companyEmail: "contato@eletromaquinas.com",
    companyPhone: "(11) 3456-7890",
    companyAddress: "Av. Industrial, 1234 - São Paulo/SP",
    shippingCost: 50.00,
    freeShippingMin: 1000.00
  }
};

// Salvar banco de dados
function saveDatabase() {
  fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));
}

// Carregar banco de dados se existir
if (fs.existsSync(dbPath)) {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    database = JSON.parse(data);
    console.log('✅ Banco de dados carregado');
  } catch (error) {
    console.error('❌ Erro ao carregar banco:', error);
    saveDatabase();
  }
} else {
  saveDatabase();
  console.log('📁 Banco de dados criado');
}

// Middleware de autenticação
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  const token = authHeader.split(' ')[1];
  
  // Verificar se é um e-mail válido no banco
  const user = database.users.find(u => u.email === token);
  
  if (!user) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  
  req.user = user;
  next();
}

// ROTAS PÚBLICAS
// ===============

// Página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Página admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// API pública de produtos
app.get('/api/products', (req, res) => {
  try {
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
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/products/:id', (req, res) => {
  try {
    const product = database.products.find(p => p.id == req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Produto não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API de categorias
app.get('/api/categories', (req, res) => {
  res.json(database.categories);
});

// API de configurações
app.get('/api/settings', (req, res) => {
  res.json(database.settings);
});

// LOGIN - ROTA PÚBLICA IMPORTANTE!
app.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('📥 Tentativa de login:', { email, password });
    
    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
    }
    
    const user = database.users.find(u => 
      u.email.toLowerCase() === email.toLowerCase() && 
      u.password === password
    );
    
    if (!user) {
      console.log('❌ Usuário não encontrado:', email);
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    console.log('✅ Login bem-sucedido:', user.email);
    
    // Não enviar a senha na resposta
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ 
      success: true, 
      token: user.email, // Usando email como token simples
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ROTA ESPECÍFICA PARA ADMIN LOGIN (mantida para compatibilidade)
app.post('/api/admin/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('📥 Tentativa de login admin:', { email, password });
    
    const user = database.users.find(u => 
      u.email.toLowerCase() === email.toLowerCase() && 
      u.password === password &&
      (u.role === 'admin' || u.role === 'vendedor')
    );
    
    if (!user) {
      return res.status(401).json({ error: 'Acesso restrito a administradores' });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ 
      success: true, 
      token: user.email,
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Erro no login admin:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Registro de cliente
app.post('/api/clients/register', (req, res) => {
  try {
    const clientData = req.body;
    
    if (!clientData.name || !clientData.email || !clientData.password) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }
    
    // Verificar se email já existe
    const existingClient = database.clients.find(c => c.email === clientData.email);
    if (existingClient) {
      return res.status(400).json({ error: 'E-mail já cadastrado' });
    }
    
    const newClient = {
      id: database.clients.length > 0 ? Math.max(...database.clients.map(c => c.id)) + 1 : 1,
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone || '',
      company: clientData.company || '',
      address: clientData.address || '',
      password: clientData.password,
      status: 'ativo',
      createdAt: new Date().toISOString()
    };
    
    database.clients.push(newClient);
    
    // Criar usuário também
    const newUser = {
      id: database.users.length > 0 ? Math.max(...database.users.map(u => u.id)) + 1 : 1,
      name: clientData.name,
      email: clientData.email,
      password: clientData.password,
      role: 'client',
      createdAt: new Date().toISOString()
    };
    
    database.users.push(newUser);
    saveDatabase();
    
    const { password: _, ...clientWithoutPassword } = newClient;
    
    res.status(201).json({ 
      success: true, 
      client: clientWithoutPassword,
      token: newClient.email
    });
    
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar pedido
app.post('/api/orders', (req, res) => {
  try {
    const orderData = req.body;
    
    if (!orderData.clientId || !orderData.items || orderData.items.length === 0) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }
    
    // Verificar estoque
    for (const item of orderData.items) {
      const product = database.products.find(p => p.id === item.productId);
      if (!product) {
        return res.status(400).json({ error: `Produto ${item.productId} não encontrado` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Estoque insuficiente para ${product.name}` });
      }
    }
    
    // Atualizar estoque
    orderData.items.forEach(item => {
      const product = database.products.find(p => p.id === item.productId);
      if (product) {
        product.stock -= item.quantity;
        product.updatedAt = new Date().toISOString();
      }
    });
    
    const client = database.clients.find(c => c.id === orderData.clientId);
    const orderNumber = 'ORD' + Date.now().toString().slice(-8);
    
    const newOrder = {
      id: database.orders.length > 0 ? Math.max(...database.orders.map(o => o.id)) + 1 : 1,
      orderNumber: orderNumber,
      clientId: orderData.clientId,
      clientName: client ? client.name : 'Cliente',
      clientEmail: client ? client.email : '',
      items: orderData.items,
      subtotal: orderData.subtotal || 0,
      discount: orderData.discount || 0,
      shipping: orderData.shipping || 0,
      total: orderData.total || 0,
      status: 'pendente',
      paymentMethod: orderData.paymentMethod || 'boleto',
      paymentStatus: 'pendente',
      shippingAddress: orderData.shippingAddress || '',
      notes: orderData.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    database.orders.push(newOrder);
    saveDatabase();
    
    res.status(201).json({ 
      success: true, 
      order: newOrder
    });
    
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ROTAS ADMINISTRATIVAS (PROTEGIDAS)
// ===================================

// Dashboard stats
app.get('/api/admin/stats', requireAuth, (req, res) => {
  try {
    const stats = {
      totalProducts: database.products.length,
      activeProducts: database.products.filter(p => p.status === 'ativo').length,
      totalClients: database.clients.length,
      totalSales: database.sales.length + database.orders.length,
      totalRevenue: database.sales.reduce((sum, sale) => sum + sale.total, 0) + 
                   database.orders.reduce((sum, order) => sum + order.total, 0),
      pendingOrders: database.orders.filter(o => o.status === 'pendente').length,
      lowStockProducts: database.products.filter(p => p.stock < 5 && p.status === 'ativo').length
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Erro ao carregar stats:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Dashboard charts
app.get('/api/admin/dashboard/charts', requireAuth, (req, res) => {
  try {
    // Simular dados para gráficos
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    
    const salesByMonth = {};
    const allSales = [...database.sales, ...database.orders];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(now.getMonth() - i);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      salesByMonth[key] = 0;
    }
    
    allSales.forEach(sale => {
      const saleDate = new Date(sale.createdAt);
      if (saleDate >= sixMonthsAgo) {
        const monthKey = `${saleDate.getFullYear()}-${saleDate.getMonth() + 1}`;
        if (salesByMonth[monthKey] !== undefined) {
          salesByMonth[monthKey] += sale.total;
        }
      }
    });
    
    const chartData = {
      salesByMonth: Object.entries(salesByMonth).map(([month, value]) => ({
        month,
        value
      })),
      topProducts: [
        { name: "Motor Elétrico", quantity: 25, revenue: 71250 },
        { name: "Gerador", quantity: 12, revenue: 150000 },
        { name: "Transformador", quantity: 8, revenue: 70000 }
      ],
      categorySales: [
        { category: "Motores", value: 85000 },
        { category: "Geradores", value: 150000 },
        { category: "Transformadores", value: 70000 }
      ]
    };
    
    res.json(chartData);
  } catch (error) {
    console.error('Erro ao carregar gráficos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// CRUD de produtos
app.get('/api/admin/products', requireAuth, (req, res) => {
  try {
    res.json(database.products);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/admin/products', requireAuth, upload.single('image'), (req, res) => {
  try {
    const productData = req.body;
    
    if (!productData.name || !productData.category || !productData.price) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }
    
    const newProduct = {
      id: database.products.length > 0 ? Math.max(...database.products.map(p => p.id)) + 1 : 1,
      name: productData.name,
      category: productData.category,
      price: parseFloat(productData.price),
      stock: parseInt(productData.stock) || 0,
      description: productData.description || '',
      specifications: productData.specifications ? 
        (Array.isArray(productData.specifications) ? productData.specifications : productData.specifications.split('\n')) : [],
      image: req.file ? `/uploads/${req.file.filename}` : '/uploads/default-product.jpg',
      images: [],
      status: productData.status || 'ativo',
      featured: productData.featured === 'true' || productData.featured === true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    database.products.push(newProduct);
    saveDatabase();
    
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.put('/api/admin/products/:id', requireAuth, upload.single('image'), (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const productData = req.body;
    
    const index = database.products.findIndex(p => p.id === productId);
    if (index === -1) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    const updatedProduct = {
      ...database.products[index],
      name: productData.name || database.products[index].name,
      category: productData.category || database.products[index].category,
      price: productData.price ? parseFloat(productData.price) : database.products[index].price,
      stock: productData.stock ? parseInt(productData.stock) : database.products[index].stock,
      description: productData.description || database.products[index].description,
      specifications: productData.specifications ? 
        (Array.isArray(productData.specifications) ? productData.specifications : productData.specifications.split('\n')) : 
        database.products[index].specifications,
      status: productData.status || database.products[index].status,
      featured: productData.featured !== undefined ? 
        (productData.featured === 'true' || productData.featured === true) : 
        database.products[index].featured,
      updatedAt: new Date().toISOString()
    };
    
    if (req.file) {
      updatedProduct.image = `/uploads/${req.file.filename}`;
    }
    
    database.products[index] = updatedProduct;
    saveDatabase();
    
    res.json(updatedProduct);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.delete('/api/admin/products/:id', requireAuth, (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    
    const index = database.products.findIndex(p => p.id === productId);
    if (index === -1) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    database.products[index].status = 'inativo';
    database.products[index].updatedAt = new Date().toISOString();
    saveDatabase();
    
    res.json({ success: true, message: 'Produto removido' });
  } catch (error) {
    console.error('Erro ao remover produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Upload de múltiplas imagens
app.post('/api/admin/products/:id/images', requireAuth, upload.array('images', 10), (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    
    const product = database.products.find(p => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    const newImages = req.files.map(file => `/uploads/${file.filename}`);
    product.images = [...product.images, ...newImages];
    product.updatedAt = new Date().toISOString();
    saveDatabase();
    
    res.json({ images: product.images });
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Clientes (admin)
app.get('/api/admin/clients', requireAuth, (req, res) => {
  try {
    res.json(database.clients.map(client => {
      const { password, ...clientWithoutPassword } = client;
      return clientWithoutPassword;
    }));
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Vendedores (admin)
app.get('/api/admin/vendors', requireAuth, (req, res) => {
  try {
    const vendors = database.users.filter(u => u.role === 'vendedor');
    res.json(vendors.map(vendor => {
      const { password, ...vendorWithoutPassword } = vendor;
      return vendorWithoutPassword;
    }));
  } catch (error) {
    console.error('Erro ao buscar vendedores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Pedidos (admin)
app.get('/api/admin/orders', requireAuth, (req, res) => {
  try {
    const allOrders = [...database.sales, ...database.orders];
    allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(allOrders);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/admin/orders/:id', requireAuth, (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    
    let order = database.sales.find(o => o.id === orderId);
    if (!order) {
      order = database.orders.find(o => o.id === orderId);
    }
    
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.put('/api/admin/orders/:id', requireAuth, (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const orderData = req.body;
    
    let orderIndex = database.sales.findIndex(o => o.id === orderId);
    let isSale = true;
    
    if (orderIndex === -1) {
      orderIndex = database.orders.findIndex(o => o.id === orderId);
      isSale = false;
    }
    
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    const ordersCollection = isSale ? database.sales : database.orders;
    ordersCollection[orderIndex] = { 
      ...ordersCollection[orderIndex], 
      ...orderData,
      updatedAt: new Date().toISOString()
    };
    
    saveDatabase();
    
    res.json(ordersCollection[orderIndex]);
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Relatórios
app.get('/api/admin/reports/sales', requireAuth, (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let allSales = [...database.sales, ...database.orders];
    
    if (startDate) {
      const start = new Date(startDate);
      allSales = allSales.filter(s => new Date(s.createdAt) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      allSales = allSales.filter(s => new Date(s.createdAt) <= end);
    }
    
    const summary = {
      totalOrders: allSales.length,
      totalRevenue: allSales.reduce((sum, sale) => sum + sale.total, 0),
      averageOrderValue: allSales.length > 0 ? 
        allSales.reduce((sum, sale) => sum + sale.total, 0) / allSales.length : 0,
      totalItems: allSales.reduce((sum, sale) => 
        sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)
    };
    
    res.json({
      summary,
      sales: allSales
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Configurações
app.get('/api/admin/settings', requireAuth, (req, res) => {
  try {
    res.json(database.settings);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.put('/api/admin/settings', requireAuth, (req, res) => {
  try {
    const settingsData = req.body;
    database.settings = { ...database.settings, ...settingsData };
    saveDatabase();
    res.json(database.settings);
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Backup
app.get('/api/admin/backup', requireAuth, (req, res) => {
  try {
    const backupData = {
      timestamp: new Date().toISOString(),
      data: database
    };
    
    res.json(backupData);
  } catch (error) {
    console.error('Erro ao criar backup:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Upload de imagem
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }
    
    res.json({ 
      success: true, 
      imageUrl: `/uploads/${req.file.filename}` 
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para verificar status do servidor
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online',
    timestamp: new Date().toISOString(),
    database: {
      users: database.users.length,
      products: database.products.length,
      clients: database.clients.length,
      orders: database.orders.length
    }
  });
});

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'API funcionando!' });
});

// Rota 404 para API
app.all('/api/*', (req, res) => {
  console.log(`❌ Rota não encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Endpoint não encontrado',
    path: req.originalUrl,
    method: req.method
  });
});

// Servir arquivos estáticos
app.use(express.static('public'));

// Rota SPA para admin
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
  ========================================
  🚀 ELETROMÁQUINAS - SISTEMA DE VENDAS
  ========================================
  
  ✅ Servidor rodando na porta ${PORT}
  
  📍 Endpoints:
  👥 Cliente:      http://localhost:${PORT}
  👨‍💼 Administração: http://localhost:${PORT}/admin
  📂 Uploads:      http://localhost:${PORT}/uploads
  
  🔑 Credenciais de acesso:
  • Admin:     admin@eletromaquinas.com / admin123
  • Vendedor:  vendedor@eletromaquinas.com / vendedor123
  
  🩺 Health Check: http://localhost:${PORT}/api/health
  🧪 Teste API:    http://localhost:${PORT}/api/test
  
  ========================================
  `);
  
  // Criar imagem padrão se não existir
  const defaultImagePath = path.join(__dirname, 'uploads', 'default-product.jpg');
  if (!fs.existsSync(defaultImagePath)) {
    console.log('📁 Criando imagem padrão...');
  }
});
