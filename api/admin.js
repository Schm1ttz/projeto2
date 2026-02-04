module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Middleware de autenticação simples
  const requireAuth = (handler) => {
    return async (req, res) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Não autorizado' });
      }
      
      // Verificação simples (em produção, use JWT)
      const token = authHeader.split(' ')[1];
      if (token !== 'admin@eletromaquinas.com') {
        return res.status(401).json({ error: 'Token inválido' });
      }
      
      return handler(req, res);
    };
  };
  
  try {
    if (req.method === 'POST' && req.url === '/api/admin/login') {
      let body = '';
      
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const { email, password } = JSON.parse(body);
          
          if (email === 'admin@eletromaquinas.com' && password === 'admin123') {
            return res.json({
              success: true,
              token: email,
              user: {
                id: 1,
                name: "Administrador",
                email: email,
                role: "admin"
              }
            });
          }
          
          return res.status(401).json({ error: 'Credenciais inválidas' });
        } catch (error) {
          return res.status(400).json({ error: 'Dados inválidos' });
        }
      });
      
      return;
    }
    
    if (req.method === 'GET' && req.url === '/api/admin/stats') {
      const statsHandler = requireAuth(async (req, res) => {
        return res.json({
          totalProducts: 3,
          totalClients: 2,
          totalSales: 5,
          totalRevenue: 45000,
          pendingOrders: 1,
          lowStockProducts: 1
        });
      });
      
      return statsHandler(req, res);
    }
    
    return res.status(404).json({ error: 'Endpoint não encontrado' });
  } catch (error) {
    console.error('Admin API Error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};