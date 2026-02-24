const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ============================================
// CONFIGURAÇÃO DO SUPABASE
// ============================================
const supabaseUrl = 'https://acbydgxfeejppogdulcw.supabase.co';
const supabaseKey = 'sb_publishable_8hv1iq5wsRvjb25TP7jndQ_iGTeVhYJ';
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// ROTA PRINCIPAL
// ============================================
app.get('/', (req, res) => {
    res.json({ mensagem: "API do Cardápio funcionando com Supabase! 🚀" });
});

// ============================================
// ROTAS DE PRODUTOS
// ============================================
app.get('/api/produtos', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('produtos')
            .select('*');
        
        if (error) throw error;
        res.json(data);
    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ erro: "Erro ao carregar produtos" });
    }
});

app.get('/api/produtos/categoria/:categoria', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('produtos')
            .select('*')
            .eq('categoria', req.params.categoria);
        
        if (error) throw error;
        res.json(data);
    } catch (erro) {
        res.status(500).json({ erro: "Erro ao filtrar produtos" });
    }
});

app.get('/api/produtos/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('produtos')
            .select('*')
            .eq('id', req.params.id)
            .single();
        
        if (error) throw error;
        data ? res.json(data) : res.status(404).json({ erro: "Produto não encontrado" });
    } catch (erro) {
        res.status(500).json({ erro: "Erro ao buscar produto" });
    }
});

app.post('/api/produtos', async (req, res) => {
    try {
        const novoProduto = req.body;
        
        if (!novoProduto.nome) return res.status(400).json({ erro: "Nome é obrigatório" });
        if (!novoProduto.categoria) return res.status(400).json({ erro: "Categoria é obrigatória" });
        
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
        
        const { data, error } = await supabase
            .from('produtos')
            .insert([novoProduto])
            .select();
        
        if (error) throw error;
        
        console.log(`✅ Produto adicionado: ${novoProduto.nome}`);
        res.status(201).json(data[0]);
    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ erro: "Erro ao salvar produto" });
    }
});

app.put('/api/produtos/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const produtoAtualizado = req.body;
        
        if (!produtoAtualizado.nome) return res.status(400).json({ erro: "Nome é obrigatório" });
        
        const { data, error } = await supabase
            .from('produtos')
            .update(produtoAtualizado)
            .eq('id', id)
            .select();
        
        if (error) throw error;
        
        if (data.length === 0) {
            return res.status(404).json({ erro: "Produto não encontrado" });
        }
        
        console.log(`✅ Produto atualizado: ${produtoAtualizado.nome}`);
        res.json(data[0]);
    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ erro: "Erro ao atualizar produto" });
    }
});

app.delete('/api/produtos/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('produtos')
            .delete()
            .eq('id', req.params.id);
        
        if (error) throw error;
        
        console.log(`🗑️ Produto removido ID: ${req.params.id}`);
        res.json({ mensagem: "Produto removido com sucesso!" });
    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ erro: "Erro ao deletar produto" });
    }
});

// ============================================
// ROTA DE CADASTRO - VERSÃO DEBUG
// ============================================
app.post('/api/usuarios/cadastro', async (req, res) => {
    try {
        console.log('🔵 ROTA /api/usuarios/cadastro ACESSADA');
        console.log('📦 Body recebido:', JSON.stringify(req.body, null, 2));
        
        const { nome, email, senha, telefone } = req.body;
        
        console.log('📝 Dados extraídos:', { nome, email, senha, telefone });
        
        // Validação mais flexível para debug
        if (!nome) {
            console.log('❌ Erro: nome não fornecido');
            return res.status(400).json({ erro: 'Nome é obrigatório' });
        }
        
        if (!email) {
            console.log('❌ Erro: email não fornecido');
            return res.status(400).json({ erro: 'Email é obrigatório' });
        }
        
        if (!senha) {
            console.log('❌ Erro: senha não fornecida');
            return res.status(400).json({ erro: 'Senha é obrigatória' });
        }
        
        // Verificar se email já existe
        console.log('🔍 Verificando se email já existe:', email);
        
        const { data: existe, error: erroExiste } = await supabase
            .from('usuarios')
            .select('id')
            .eq('email', email);
        
        if (erroExiste) {
            console.error('❌ Erro ao verificar email:', erroExiste);
            return res.status(500).json({ erro: 'Erro ao verificar email', detalhes: erroExiste });
        }
        
        console.log('📊 Resultado verificação:', existe);
        
        if (existe && existe.length > 0) {
            console.log('❌ Email já cadastrado');
            return res.status(400).json({ erro: 'Email já cadastrado' });
        }
        
        // Criar novo usuário
        const novoUsuario = {
            nome,
            email,
            senha,
            telefone: telefone || '',
            tipo: 'cliente',
            criadoEm: new Date().toISOString()
        };
        
        console.log('💾 Inserindo usuário:', novoUsuario);
        
        const { data, error } = await supabase
            .from('usuarios')
            .insert([novoUsuario])
            .select();
        
        if (error) {
            console.error('❌ Erro do Supabase:', error);
            return res.status(500).json({ 
                erro: 'Erro do Supabase', 
                detalhes: error.message,
                code: error.code
            });
        }
        
        console.log('✅ Usuário cadastrado com sucesso:', data[0]);
        
        const { senha: _, ...usuarioSemSenha } = data[0];
        res.status(201).json(usuarioSemSenha);
        
    } catch (erro) {
        console.error('❌ Erro inesperado:', erro);
        console.error('Stack trace:', erro.stack);
        res.status(500).json({ 
            erro: 'Erro interno no servidor',
            mensagem: erro.message,
            stack: erro.stack 
        });
    }
});

app.post('/api/usuarios/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .eq('senha', senha);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            const { senha, ...usuarioSemSenha } = data[0];
            res.json(usuarioSemSenha);
        } else {
            res.status(401).json({ erro: 'Email ou senha inválidos' });
        }
    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ erro: 'Erro ao fazer login' });
    }
});

app.post('/api/usuarios/google', async (req, res) => {
    try {
        const { email, nome, googleId } = req.body;
        
        // Verificar se usuário já existe
        const { data: existe } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email);
        
        let usuario;
        
        if (existe && existe.length > 0) {
            usuario = existe[0];
        } else {
            const novoUsuario = {
                nome,
                email,
                googleId,
                tipo: 'cliente',
                criadoEm: new Date().toISOString()
            };
            
            const { data, error } = await supabase
                .from('usuarios')
                .insert([novoUsuario])
                .select();
            
            if (error) throw error;
            usuario = data[0];
        }
        
        const { senha, ...usuarioSemSenha } = usuario;
        res.json(usuarioSemSenha);
    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ erro: 'Erro ao autenticar com Google' });
    }
});

app.get('/api/usuarios', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*');
        
        if (error) throw error;
        
        const usuariosSemSenha = data.map(({ senha, ...resto }) => resto);
        res.json(usuariosSemSenha);
    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ erro: 'Erro ao carregar usuários' });
    }
});

app.get('/api/usuarios/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', req.params.id)
            .single();
        
        if (error) throw error;
        
        if (data) {
            const { senha, ...usuarioSemSenha } = data;
            res.json(usuarioSemSenha);
        } else {
            res.status(404).json({ erro: 'Usuário não encontrado' });
        }
    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ erro: 'Erro ao carregar usuário' });
    }
});

app.put('/api/usuarios/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { nome, telefone, nascimento, cpf, genero } = req.body;
        
        const { data, error } = await supabase
            .from('usuarios')
            .update({
                nome,
                telefone: telefone || '',
                nascimento: nascimento || '',
                cpf: cpf || '',
                genero: genero || ''
            })
            .eq('id', id)
            .select();
        
        if (error) throw error;
        
        if (data.length === 0) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        
        const { senha, ...usuarioSemSenha } = data[0];
        res.json(usuarioSemSenha);
    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ erro: 'Erro ao atualizar usuário' });
    }
});

app.put('/api/usuarios/:id/senha', async (req, res) => {
    try {
        const id = req.params.id;
        const { senhaAtual, novaSenha } = req.body;
        
        // Verificar senha atual
        const { data: usuario, error: erroBusca } = await supabase
            .from('usuarios')
            .select('senha')
            .eq('id', id)
            .single();
        
        if (erroBusca) throw erroBusca;
        
        if (!usuario) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        
        if (usuario.senha !== senhaAtual) {
            return res.status(401).json({ erro: 'Senha atual incorreta' });
        }
        
        const { error } = await supabase
            .from('usuarios')
            .update({ senha: novaSenha })
            .eq('id', id);
        
        if (error) throw error;
        
        res.json({ mensagem: 'Senha alterada com sucesso' });
    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ erro: 'Erro ao alterar senha' });
    }
});

// ============================================
// ROTAS DE ENDEREÇOS
// ============================================
app.get('/api/usuarios/:usuarioId/enderecos', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('enderecos')
            .select('*')
            .eq('usuarioId', req.params.usuarioId);
        
        if (error) throw error;
        res.json(data);
    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ erro: 'Erro ao carregar endereços' });
    }
});

app.post('/api/enderecos', async (req, res) => {
    try {
        const novoEndereco = req.body;
        
        if (!novoEndereco.usuarioId || !novoEndereco.logradouro) {
            return res.status(400).json({ erro: 'Dados incompletos' });
        }
        
        const { data, error } = await supabase
            .from('enderecos')
            .insert([novoEndereco])
            .select();
        
        if (error) throw error;
        
        res.status(201).json(data[0]);
    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ erro: 'Erro ao salvar endereço' });
    }
});

app.put('/api/enderecos/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const enderecoAtualizado = req.body;
        
        const { data, error } = await supabase
            .from('enderecos')
            .update(enderecoAtualizado)
            .eq('id', id)
            .select();
        
        if (error) throw error;
        
        if (data.length === 0) {
            return res.status(404).json({ erro: 'Endereço não encontrado' });
        }
        
        res.json(data[0]);
    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ erro: 'Erro ao atualizar endereço' });
    }
});

app.delete('/api/enderecos/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('enderecos')
            .delete()
            .eq('id', req.params.id);
        
        if (error) throw error;
        
        res.json({ mensagem: 'Endereço removido' });
    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ erro: 'Erro ao deletar endereço' });
    }
});

// ============================================
// ROTAS DE PEDIDOS
// ============================================
app.post('/api/pedidos', async (req, res) => {
    try {
        const novoPedido = req.body;
        
        novoPedido.data = new Date().toISOString();
        novoPedido.status = 'aguardando';
        
        const { data, error } = await supabase
            .from('pedidos')
            .insert([novoPedido])
            .select();
        
        if (error) throw error;
        
        res.status(201).json(data[0]);
    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ erro: 'Erro ao salvar pedido' });
    }
});

app.get('/api/pedidos', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('pedidos')
            .select('*');
        
        if (error) throw error;
        res.json(data);
    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ erro: 'Erro ao carregar pedidos' });
    }
});

app.get('/api/usuarios/:usuarioId/pedidos', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('pedidos')
            .select('*')
            .eq('usuarioId', req.params.usuarioId);
        
        if (error) throw error;
        res.json(data);
    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ erro: 'Erro ao carregar pedidos' });
    }
});

app.put('/api/pedidos/:id/status', async (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        
        const { data, error } = await supabase
            .from('pedidos')
            .update({ status })
            .eq('id', id)
            .select();
        
        if (error) throw error;
        
        if (data.length === 0) {
            return res.status(404).json({ erro: 'Pedido não encontrado' });
        }
        
        res.json(data[0]);
    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ erro: 'Erro ao atualizar pedido' });
    }
});

// ============================================
// ROTAS DE CUPONS
// ============================================
app.get('/api/admin/cupons', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('cupons')
            .select('*');
        
        if (error) throw error;
        res.json(data);
    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ erro: "Erro ao carregar cupons" });
    }
});

app.post('/api/admin/cupons', async (req, res) => {
    try {
        const novoCupom = req.body;
        
        if (!novoCupom.codigo) {
            return res.status(400).json({ erro: "Código do cupom é obrigatório" });
        }
        
        // Verificar se código já existe
        const { data: existe } = await supabase
            .from('cupons')
            .select('id')
            .eq('codigo', novoCupom.codigo);
        
        if (existe && existe.length > 0) {
            return res.status(400).json({ erro: "Código de cupom já existe" });
        }
        
        novoCupom.ativo = novoCupom.ativo !== undefined ? novoCupom.ativo : true;
        novoCupom.usosRestantes = novoCupom.usosRestantes || null;
        novoCupom.dataExpiracao = novoCupom.dataExpiracao || null;
        
        const { data, error } = await supabase
            .from('cupons')
            .insert([novoCupom])
            .select();
        
        if (error) throw error;
        
        res.status(201).json(data[0]);
    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ erro: "Erro ao salvar cupom" });
    }
});

app.put('/api/admin/cupons/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const cupomAtualizado = req.body;
        
        const { data, error } = await supabase
            .from('cupons')
            .update(cupomAtualizado)
            .eq('id', id)
            .select();
        
        if (error) throw error;
        
        if (data.length === 0) {
            return res.status(404).json({ erro: "Cupom não encontrado" });
        }
        
        res.json(data[0]);
    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ erro: "Erro ao atualizar cupom" });
    }
});

app.delete('/api/admin/cupons/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('cupons')
            .delete()
            .eq('id', req.params.id);
        
        if (error) throw error;
        
        res.json({ mensagem: "Cupom removido" });
    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ erro: "Erro ao deletar cupom" });
    }
});

app.get('/api/cupons/:codigo', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('cupons')
            .select('*')
            .eq('codigo', req.params.codigo.toUpperCase())
            .eq('ativo', true);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            const cupom = data[0];
            
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
            
            res.json(cupom);
        } else {
            res.status(404).json({ erro: "Cupom não encontrado ou inativo" });
        }
    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ erro: "Erro ao validar cupom" });
    }
});

// ============================================
// DELETAR USUÁRIO
// ============================================
app.delete('/api/usuarios/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        // Verificar se é admin
        const { data: usuario } = await supabase
            .from('usuarios')
            .select('tipo')
            .eq('id', id)
            .single();
        
        if (usuario && usuario.tipo === 'admin') {
            return res.status(403).json({ erro: 'Não é possível deletar o administrador' });
        }
        
        const { error } = await supabase
            .from('usuarios')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        console.log(`🗑️ Usuário removido ID: ${id}`);
        res.json({ mensagem: "Usuário removido com sucesso!" });
    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ erro: "Erro ao deletar usuário" });
    }
});

// ============================================
// DELETAR PEDIDO
// ============================================
app.delete('/api/pedidos/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('pedidos')
            .delete()
            .eq('id', req.params.id);
        
        if (error) throw error;
        
        console.log(`🗑️ Pedido removido ID: ${req.params.id}`);
        res.json({ mensagem: "Pedido removido com sucesso!" });
    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ erro: "Erro ao deletar pedido" });
    }
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT} com Supabase!`);
    console.log(`📦 Produtos: http://localhost:${PORT}/api/produtos`);
    console.log(`👤 Usuários: http://localhost:${PORT}/api/usuarios`);
    console.log(`🏷️ Cupons: http://localhost:${PORT}/api/cupons/FOMEZERO`);
});