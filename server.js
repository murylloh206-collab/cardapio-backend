const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ============================================
// CONFIGURAÇÃO DOS ARQUIVOS
// ============================================
const PRODUTOS_FILE = path.join(__dirname, 'produtos.json');
const USUARIOS_FILE = path.join(__dirname, 'usuarios.json');
const PEDIDOS_FILE = path.join(__dirname, 'pedidos.json');
const ENDERECOS_FILE = path.join(__dirname, 'enderecos.json');
const CUPONS_FILE = path.join(__dirname, 'cupons.json');

// ============================================
// FUNÇÕES GENÉRICAS DE LEITURA/ESCRITA
// ============================================
function lerArquivo(caminho, dadosPadrao = []) {
    try {
        if (!fs.existsSync(caminho)) {
            fs.writeFileSync(caminho, JSON.stringify(dadosPadrao, null, 2));
            return dadosPadrao;
        }
        const dados = fs.readFileSync(caminho, 'utf8');
        return JSON.parse(dados);
    } catch (erro) {
        console.error(`Erro ao ler ${caminho}:`, erro);
        return [];
    }
}

function salvarArquivo(caminho, dados) {
    try {
        fs.writeFileSync(caminho, JSON.stringify(dados, null, 2));
        return true;
    } catch (erro) {
        console.error(`Erro ao salvar ${caminho}:`, erro);
        return false;
    }
}

// ============================================
// FUNÇÕES ESPECÍFICAS
// ============================================
function lerProdutos() { return lerArquivo(PRODUTOS_FILE, []); }
function salvarProdutos(produtos) { return salvarArquivo(PRODUTOS_FILE, produtos); }

function lerUsuarios() { 
    const padrao = [
        {
            id: 1,
            nome: 'Administrador',
            email: 'deliciasdacs@admin.com',
            senha: 'adm123',
            telefone: '',
            nascimento: '',
            cpf: '',
            genero: '',
            tipo: 'admin',
            criadoEm: new Date().toISOString()
        }
    ];
    return lerArquivo(USUARIOS_FILE, padrao);
}
function salvarUsuarios(usuarios) { return salvarArquivo(USUARIOS_FILE, usuarios); }

function lerEnderecos() { return lerArquivo(ENDERECOS_FILE, []); }
function salvarEnderecos(enderecos) { return salvarArquivo(ENDERECOS_FILE, enderecos); }

function lerPedidos() { return lerArquivo(PEDIDOS_FILE, []); }
function salvarPedidos(pedidos) { return salvarArquivo(PEDIDOS_FILE, pedidos); }

function lerCupons() { 
    const padrao = [
        {
            id: 1,
            codigo: 'FOMEZERO',
            tipo: 'combo_price',
            categoria: 'pizzas',
            quantidade: 2,
            valor_combo: 95.00,
            descricao: '2 Pizzas + Coca-Cola 2L por R$ 95,00',
            ativo: true
        },
        {
            id: 2,
            codigo: 'COMBOESFIHA',
            tipo: 'combo_price',
            categoria: 'esfihas',
            quantidade: 6,
            valor_combo: 28.00,
            descricao: '6 Esfihas por R$ 28,00',
            ativo: true
        },
        {
            id: 3,
            codigo: 'BEMVINDO10',
            tipo: 'percentual',
            valor: 10,
            descricao: '10% de desconto',
            ativo: true
        },
        {
            id: 4,
            codigo: 'DESCONTO20',
            tipo: 'fixo',
            valor: 20.00,
            descricao: 'R$ 20,00 de desconto',
            ativo: true
        }
    ];
    return lerArquivo(CUPONS_FILE, padrao);
}
function salvarCupons(cupons) { return salvarArquivo(CUPONS_FILE, cupons); }

// ============================================
// ROTA PRINCIPAL
// ============================================
app.get('/', (req, res) => {
    res.json({ mensagem: "API do Cardápio funcionando! 🚀" });
});

// ============================================
// ROTAS DE PRODUTOS
// ============================================
app.get('/api/produtos', (req, res) => {
    res.json(lerProdutos());
});

app.get('/api/produtos/categoria/:categoria', (req, res) => {
    const produtos = lerProdutos();
    const filtrados = produtos.filter(p => p.categoria === req.params.categoria);
    res.json(filtrados);
});

app.get('/api/produtos/:id', (req, res) => {
    const produtos = lerProdutos();
    const produto = produtos.find(p => p.id === parseInt(req.params.id));
    produto ? res.json(produto) : res.status(404).json({ erro: "Produto não encontrado" });
});

app.post('/api/produtos', (req, res) => {
    const produtos = lerProdutos();
    const novoProduto = req.body;
    
    if (!novoProduto.nome) return res.status(400).json({ erro: "Nome é obrigatório" });
    if (!novoProduto.categoria) return res.status(400).json({ erro: "Categoria é obrigatória" });
    
    novoProduto.id = produtos.length > 0 ? Math.max(...produtos.map(p => p.id)) + 1 : 1;
    novoProduto.imagem = novoProduto.imagem || '/images/padrao.jpg';
    novoProduto.is_new = novoProduto.is_new || false;
    novoProduto.is_coming_soon = novoProduto.is_coming_soon || false;
    
    if (novoProduto.categoria === 'tortas') {
        if (!novoProduto.priceMedium || !novoProduto.priceLarge) {
            return res.status(400).json({ erro: "Tortas precisam de preço médio e preço grande" });
        }
    } else {
        if (!novoProduto.preco && !novoProduto.is_coming_soon) {
            return res.status(400).json({ erro: "Produto precisa de preço (a menos que seja EM BREVE)" });
        }
    }
    
    produtos.push(novoProduto);
    
    if (salvarProdutos(produtos)) {
        console.log(`✅ Produto adicionado: ${novoProduto.nome} (ID: ${novoProduto.id})`);
        res.status(201).json(novoProduto);
    } else {
        res.status(500).json({ erro: "Erro ao salvar produto" });
    }
});

app.put('/api/produtos/:id', (req, res) => {
    const produtos = lerProdutos();
    const id = parseInt(req.params.id);
    const index = produtos.findIndex(p => p.id === id);
    
    if (index === -1) return res.status(404).json({ erro: "Produto não encontrado" });
    
    const produtoAtualizado = { ...produtos[index], ...req.body, id };
    
    if (!produtoAtualizado.nome) return res.status(400).json({ erro: "Nome é obrigatório" });
    
    produtoAtualizado.is_new = produtoAtualizado.is_new || false;
    produtoAtualizado.is_coming_soon = produtoAtualizado.is_coming_soon || false;
    
    if (produtoAtualizado.categoria === 'tortas') {
        if (!produtoAtualizado.priceMedium || !produtoAtualizado.priceLarge) {
            return res.status(400).json({ erro: "Tortas precisam de preço médio e preço grande" });
        }
    } else {
        if (!produtoAtualizado.preco && !produtoAtualizado.is_coming_soon) {
            return res.status(400).json({ erro: "Produto precisa de preço (a menos que seja EM BREVE)" });
        }
    }
    
    produtos[index] = produtoAtualizado;
    
    if (salvarProdutos(produtos)) {
        console.log(`✅ Produto atualizado: ${produtoAtualizado.nome} (ID: ${id})`);
        res.json(produtos[index]);
    } else {
        res.status(500).json({ erro: "Erro ao atualizar produto" });
    }
});

app.delete('/api/produtos/:id', (req, res) => {
    const produtos = lerProdutos();
    const novosProdutos = produtos.filter(p => p.id !== parseInt(req.params.id));
    
    if (salvarProdutos(novosProdutos)) {
        console.log(`🗑️ Produto removido ID: ${req.params.id}`);
        res.json({ mensagem: "Produto removido com sucesso!" });
    } else {
        res.status(500).json({ erro: "Erro ao deletar" });
    }
});

// ============================================
// ROTAS DE USUÁRIOS
// ============================================
app.post('/api/usuarios/cadastro', (req, res) => {
    const usuarios = lerUsuarios();
    const { nome, email, senha } = req.body;
    
    if (!nome || !email || !senha) {
        return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });
    }
    
    if (usuarios.find(u => u.email === email)) {
        return res.status(400).json({ erro: 'Email já cadastrado' });
    }
    
    const novoUsuario = {
        id: usuarios.length > 0 ? Math.max(...usuarios.map(u => u.id)) + 1 : 1,
        nome,
        email,
        senha,
        telefone: '',
        nascimento: '',
        cpf: '',
        genero: '',
        tipo: 'cliente',
        criadoEm: new Date().toISOString()
    };
    
    usuarios.push(novoUsuario);
    
    if (salvarUsuarios(usuarios)) {
        const { senha, ...usuarioSemSenha } = novoUsuario;
        res.status(201).json(usuarioSemSenha);
    } else {
        res.status(500).json({ erro: 'Erro ao salvar usuário' });
    }
});

app.post('/api/usuarios/login', (req, res) => {
    const usuarios = lerUsuarios();
    const { email, senha } = req.body;
    
    const usuario = usuarios.find(u => u.email === email && u.senha === senha);
    
    if (usuario) {
        const { senha, ...usuarioSemSenha } = usuario;
        res.json(usuarioSemSenha);
    } else {
        res.status(401).json({ erro: 'Email ou senha inválidos' });
    }
});

app.post('/api/usuarios/google', (req, res) => {
    const usuarios = lerUsuarios();
    const { email, nome, googleId } = req.body;
    
    let usuario = usuarios.find(u => u.email === email);
    
    if (!usuario) {
        usuario = {
            id: usuarios.length > 0 ? Math.max(...usuarios.map(u => u.id)) + 1 : 1,
            nome,
            email,
            googleId,
            tipo: 'cliente',
            criadoEm: new Date().toISOString()
        };
        usuarios.push(usuario);
        salvarUsuarios(usuarios);
    }
    
    const { senha, ...usuarioSemSenha } = usuario;
    res.json(usuarioSemSenha);
});

app.get('/api/usuarios', (req, res) => {
    const usuarios = lerUsuarios();
    const usuariosSemSenha = usuarios.map(({ senha, ...resto }) => resto);
    res.json(usuariosSemSenha);
});

app.get('/api/usuarios/:id', (req, res) => {
    const usuarios = lerUsuarios();
    const usuario = usuarios.find(u => u.id === parseInt(req.params.id));
    
    if (usuario) {
        const { senha, ...usuarioSemSenha } = usuario;
        res.json(usuarioSemSenha);
    } else {
        res.status(404).json({ erro: 'Usuário não encontrado' });
    }
});

app.put('/api/usuarios/:id', (req, res) => {
    const usuarios = lerUsuarios();
    const id = parseInt(req.params.id);
    const index = usuarios.findIndex(u => u.id === id);
    
    if (index === -1) return res.status(404).json({ erro: 'Usuário não encontrado' });
    
    const { nome, telefone, nascimento, cpf, genero } = req.body;
    
    usuarios[index] = {
        ...usuarios[index],
        nome: nome || usuarios[index].nome,
        telefone: telefone || '',
        nascimento: nascimento || '',
        cpf: cpf || '',
        genero: genero || ''
    };
    
    if (salvarUsuarios(usuarios)) {
        const { senha, ...usuarioSemSenha } = usuarios[index];
        res.json(usuarioSemSenha);
    } else {
        res.status(500).json({ erro: 'Erro ao atualizar usuário' });
    }
});

app.put('/api/usuarios/:id/senha', (req, res) => {
    const usuarios = lerUsuarios();
    const id = parseInt(req.params.id);
    const index = usuarios.findIndex(u => u.id === id);
    
    if (index === -1) return res.status(404).json({ erro: 'Usuário não encontrado' });
    
    const { senhaAtual, novaSenha } = req.body;
    
    if (usuarios[index].senha !== senhaAtual) {
        return res.status(401).json({ erro: 'Senha atual incorreta' });
    }
    
    usuarios[index].senha = novaSenha;
    
    if (salvarUsuarios(usuarios)) {
        res.json({ mensagem: 'Senha alterada com sucesso' });
    } else {
        res.status(500).json({ erro: 'Erro ao alterar senha' });
    }
});

// ============================================
// ROTAS DE ENDEREÇOS
// ============================================
app.get('/api/usuarios/:usuarioId/enderecos', (req, res) => {
    const enderecos = lerEnderecos();
    const enderecosUsuario = enderecos.filter(e => e.usuarioId === parseInt(req.params.usuarioId));
    res.json(enderecosUsuario);
});

app.post('/api/enderecos', (req, res) => {
    const enderecos = lerEnderecos();
    const novoEndereco = req.body;
    
    if (!novoEndereco.usuarioId || !novoEndereco.logradouro) {
        return res.status(400).json({ erro: 'Dados incompletos' });
    }
    
    novoEndereco.id = enderecos.length > 0 ? Math.max(...enderecos.map(e => e.id)) + 1 : 1;
    enderecos.push(novoEndereco);
    
    if (salvarEnderecos(enderecos)) {
        res.status(201).json(novoEndereco);
    } else {
        res.status(500).json({ erro: 'Erro ao salvar endereço' });
    }
});

app.put('/api/enderecos/:id', (req, res) => {
    const enderecos = lerEnderecos();
    const id = parseInt(req.params.id);
    const index = enderecos.findIndex(e => e.id === id);
    
    if (index === -1) return res.status(404).json({ erro: 'Endereço não encontrado' });
    
    enderecos[index] = { ...enderecos[index], ...req.body, id };
    
    if (salvarEnderecos(enderecos)) {
        res.json(enderecos[index]);
    } else {
        res.status(500).json({ erro: 'Erro ao atualizar endereço' });
    }
});

app.delete('/api/enderecos/:id', (req, res) => {
    const enderecos = lerEnderecos();
    const novosEnderecos = enderecos.filter(e => e.id !== parseInt(req.params.id));
    
    if (salvarEnderecos(novosEnderecos)) {
        res.json({ mensagem: 'Endereço removido' });
    } else {
        res.status(500).json({ erro: 'Erro ao deletar endereço' });
    }
});

// ============================================
// ROTAS DE PEDIDOS (CORRIGIDAS)
// ============================================

// Rota para criar um novo pedido
app.post('/api/pedidos', (req, res) => {
    const pedidos = lerPedidos();
    const novoPedido = req.body;
    
    novoPedido.id = pedidos.length > 0 ? Math.max(...pedidos.map(p => p.id)) + 1 : 1;
    novoPedido.data = new Date().toISOString();
    novoPedido.status = 'aguardando';
    
    pedidos.push(novoPedido);
    
    if (salvarPedidos(pedidos)) {
        res.status(201).json(novoPedido);
    } else {
        res.status(500).json({ erro: 'Erro ao salvar pedido' });
    }
});

// ✅ Rota para listar TODOS os pedidos (ADMIN)
app.get('/api/pedidos', (req, res) => {
    const pedidos = lerPedidos();
    res.json(pedidos);
});

// Rota para listar pedidos de UM usuário específico
app.get('/api/usuarios/:usuarioId/pedidos', (req, res) => {
    const pedidos = lerPedidos();
    const pedidosUsuario = pedidos.filter(p => p.usuarioId === parseInt(req.params.usuarioId));
    res.json(pedidosUsuario);
});

// Rota para atualizar status de um pedido
app.put('/api/pedidos/:id/status', (req, res) => {
    const pedidos = lerPedidos();
    const id = parseInt(req.params.id);
    const index = pedidos.findIndex(p => p.id === id);
    
    if (index === -1) return res.status(404).json({ erro: 'Pedido não encontrado' });
    
    pedidos[index].status = req.body.status;
    
    if (salvarPedidos(pedidos)) {
        res.json(pedidos[index]);
    } else {
        res.status(500).json({ erro: 'Erro ao atualizar pedido' });
    }
});

// ============================================
// ROTAS DE CUPONS (ATUALIZADAS)
// ============================================
app.get('/api/admin/cupons', (req, res) => {
    res.json(lerCupons());
});

app.post('/api/admin/cupons', (req, res) => {
    const cupons = lerCupons();
    const novoCupom = req.body;
    
    if (!novoCupom.codigo) {
        return res.status(400).json({ erro: "Código do cupom é obrigatório" });
    }
    
    if (cupons.some(c => c.codigo === novoCupom.codigo)) {
        return res.status(400).json({ erro: "Código de cupom já existe" });
    }
    
    novoCupom.id = cupons.length > 0 ? Math.max(...cupons.map(c => c.id)) + 1 : 1;
    novoCupom.ativo = novoCupom.ativo !== undefined ? novoCupom.ativo : true;
    novoCupom.usosRestantes = novoCupom.usosRestantes || null; // Para cupons de uso limitado
    novoCupom.dataExpiracao = novoCupom.dataExpiracao || null; // Para cupons com data de expiração
    
    cupons.push(novoCupom);
    
    if (salvarCupons(cupons)) {
        res.status(201).json(novoCupom);
    } else {
        res.status(500).json({ erro: "Erro ao salvar cupom" });
    }
});

// Rota para validar cupom (usada pelo site)
app.post('/api/cupons/validar', (req, res) => {
    const cupons = lerCupons();
    const { codigo, usuarioId } = req.body;
    
    const cupom = cupons.find(c => c.codigo === codigo.toUpperCase() && c.ativo);
    
    if (!cupom) {
        return res.status(404).json({ erro: "Cupom não encontrado ou inativo" });
    }
    
    // Verificar data de expiração
    if (cupom.dataExpiracao) {
        const hoje = new Date();
        const expiracao = new Date(cupom.dataExpiracao);
        if (hoje > expiracao) {
            return res.status(400).json({ erro: "Cupom expirado" });
        }
    }
    
    // Verificar usos restantes
    if (cupom.usosRestantes !== null && cupom.usosRestantes <= 0) {
        return res.status(400).json({ erro: "Cupom sem usos disponíveis" });
    }
    
    // Se for cupom de indicação, verificar se o usuário já usou
    if (cupom.tipo === 'indicacao' && usuarioId) {
        const pedidos = lerPedidos();
        const jaUsou = pedidos.some(p => 
            p.usuarioId === usuarioId && 
            p.cupomAplicado === cupom.codigo
        );
        
        if (jaUsou) {
            return res.status(400).json({ erro: "Você já usou este cupom de indicação" });
        }
    }
    
    res.json(cupom);
});

// Rota para usar cupom (decrementa usos)
app.post('/api/cupons/usar', (req, res) => {
    const cupons = lerCupons();
    const { codigo, usuarioId } = req.body;
    
    const index = cupons.findIndex(c => c.codigo === codigo.toUpperCase());
    
    if (index === -1) {
        return res.status(404).json({ erro: "Cupom não encontrado" });
    }
    
    // Se tiver usos restantes, decrementar
    if (cupons[index].usosRestantes !== null) {
        cupons[index].usosRestantes -= 1;
        
        // Se chegou a zero, desativar
        if (cupons[index].usosRestantes <= 0) {
            cupons[index].ativo = false;
        }
    }
    
    // Registrar que o usuário usou o cupom (para indicação)
    if (cupons[index].tipo === 'indicacao' && usuarioId) {
        // Podemos salvar isso em um arquivo separado se quiser
    }
    
    if (salvarCupons(cupons)) {
        res.json({ mensagem: "Cupom utilizado com sucesso" });
    } else {
        res.status(500).json({ erro: "Erro ao atualizar cupom" });
    }
});
// ============================================
// DELETAR USUÁRIO (para o dashboard)
// ============================================
app.delete('/api/usuarios/:id', (req, res) => {
    const usuarios = lerUsuarios();
    const id = parseInt(req.params.id);
    
    // Não permitir deletar admin
    const usuario = usuarios.find(u => u.id === id);
    if (usuario && usuario.tipo === 'admin') {
        return res.status(403).json({ erro: 'Não é possível deletar o administrador' });
    }
    
    const novosUsuarios = usuarios.filter(u => u.id !== id);
    
    if (salvarUsuarios(novosUsuarios)) {
        console.log(`🗑️ Usuário removido ID: ${id}`);
        res.json({ mensagem: "Usuário removido com sucesso!" });
    } else {
        res.status(500).json({ erro: "Erro ao deletar usuário" });
    }
});

// ============================================
// DELETAR PEDIDO (para o dashboard)
// ============================================
app.delete('/api/pedidos/:id', (req, res) => {
    const pedidos = lerPedidos();
    const novosPedidos = pedidos.filter(p => p.id !== parseInt(req.params.id));
    
    if (salvarPedidos(novosPedidos)) {
        console.log(`🗑️ Pedido removido ID: ${req.params.id}`);
        res.json({ mensagem: "Pedido removido com sucesso!" });
    } else {
        res.status(500).json({ erro: "Erro ao deletar pedido" });
    }
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📦 Produtos: http://localhost:${PORT}/api/produtos`);
    console.log(`👤 Usuários: http://localhost:${PORT}/api/usuarios`);
    console.log(`🏷️ Cupons: http://localhost:${PORT}/api/cupons/FOMEZERO`);
});