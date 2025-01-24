const { createClient } = require('@supabase/supabase-js');
const authService = require('../services/authService');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// const supabase = require('../supabase');
const { gerarApiKey } = require('./apiKeyController');


console.log('JWT_SECRET:', process.env.JWT_SECRET);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.register = async (req, res) => {
    const { email, senha, nome } = req.body;
    if (!email || !senha || !nome) {
        return res.status(400).json({ error: 'Email, senha e nome são obrigatórios.' });
    }

    try {
        const { data: existingUser, error: findError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email);

        if (existingUser && existingUser.length > 0) {
            return res.status(409).json({ error: 'Usuário já existe.' });
        }

        const token = jwt.sign({ email, nome, senha }, process.env.JWT_SECRET, { expiresIn: '1h' });

        await authService.sendConfirmationEmail(email, token);

        res.status(201).json({ message: 'E-mail de confirmação enviado.' });
    } catch (err) {
        console.error('Erro interno do servidor durante o registro:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

exports.confirmEmail = async (req, res) => {
    const { token } = req.query;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const hashedPassword = await bcrypt.hash(decoded.senha, 10);

        const { data, error } = await supabase
            .from('usuarios')
            .insert([{ email: decoded.email, nome: decoded.nome, senha: hashedPassword, nivel_acesso: 'usuario' }])
            .select();

        if (error) {
            return res.status(500).json({ error: 'Erro ao confirmar usuário.' });
        }

        return res.redirect('http://127.0.0.1:5500/index.html');
    } catch (err) {
        console.error('Erro ao confirmar usuário:', err);
        return res.status(500).json({ error: 'Erro ao confirmar usuário.' });
    }
};


exports.login = async (req, res) => {
    console.log("Requisição de login recebida:", req.body);

    const { email, senha } = req.body;

    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email);

        if (error) {
            return res.status(500).json({ error: 'Erro ao buscar o usuário.' });
        }

        if (!data || data.length === 0) {
            return res.status(401).json({ message: 'Usuário não encontrado.' });
        }

        const user = data[0];
        const match = await bcrypt.compare(senha, user.senha);

        if (!match) {
            return res.status(401).json({ message: 'Senha incorreta.' });
        }

        console.log('Senha correta, gerando API Key...');
        const apiKey = await gerarApiKey(user.id); 
        console.log('API Key gerada com sucesso:', apiKey);

        return res.status(200).json({
            message: 'Login efetuado com sucesso!',
            apiKey: apiKey,
            userId: user.id, 
        });
    } catch (err) {
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

exports.resendConfirmation = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório.' });
    }

    try {
        await authService.resendConfirmationEmail(email);
        res.status(200).json({ message: 'E-mail de confirmação reenviado com sucesso.' });
    } catch (err) {
        console.error('Erro ao reenviar e-mail de confirmação:', err);
        res.status(500).json({ error: 'Erro ao reenviar e-mail de confirmação.' });
    }
};

exports.recoverPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório.' });
    }

    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email);

        if (error || !data || data.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        const user = data[0];
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30m' });

        await authService.sendRecoveryEmail(user.email, token);

        res.status(200).json({ message: 'E-mail de recuperação enviado com sucesso.' });
    } catch (err) {
        console.error('Erro interno do servidor:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};
