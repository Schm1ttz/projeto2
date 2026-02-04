module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Dados de exemplo (em produção, use um banco de dados)
  const products = [
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
    },
    {
      id: 3,
      name: "Transformador Industrial 100kVA",
      category: "Transformadores",
      price: 8750.00,
      stock: 5,
      description: "Transformador de alta potência para distribuição.",
      specifications: ["100 kVA", "Alta eficiência", "Resfriamento a óleo"],
      image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      status: "ativo",
      featured: false,
      createdAt: new Date().toISOString()
    }
  ];
  
  const categories = ["Motores", "Geradores", "Transformadores", "Compressores", "Ferramentas"];
  
  try {
    if (req.method === 'GET') {
      if (req.url === '/api/products' || req.url === '/api/products/') {
        const { search, category, featured } = req.query;
        let filteredProducts = [...products];
        
        if (search) {
          const searchTerm = search.toLowerCase();
          filteredProducts = filteredProducts.filter(p =>
            p.name.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm)
          );
        }
        
        if (category) {
          filteredProducts = filteredProducts.filter(p => p.category === category);
        }
        
        if (featured === 'true') {
          filteredProducts = filteredProducts.filter(p => p.featured);
        }
        
        return res.json(filteredProducts);
      }
      
      if (req.url.match(/^\/api\/products\/\d+$/)) {
        const id = parseInt(req.url.split('/').pop());
        const product = products.find(p => p.id === id);
        
        if (product) {
          return res.json(product);
        }
        return res.status(404).json({ error: 'Produto não encontrado' });
      }
      
      if (req.url === '/api/categories') {
        return res.json(categories);
      }
    }
    
    return res.status(404).json({ error: 'Endpoint não encontrado' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};