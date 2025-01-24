const supabase = require('../supabase');
const mongoose = require('mongoose');

async function validateApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 20) {
        console.error('API Key inválida ou não fornecida.');
        return res.status(401).json({ error: 'API Key inválida ou não fornecida.' });
    }

    const { data, error } = await supabase
        .from('api_keys')
        .select('user_id')
        .eq('api_key', apiKey)
        .single();

    if (error || !data) {
        console.error('[AuthMiddleware] API Key inválida ou inexistente:', error?.message);
        return res.status(403).json({ error: 'API Key inválida ou inexistente.' });
    }

    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(data.user_id)) {
        console.error(`ID de usuário inválido: ${data.user_id}`);
        return res.status(400).json({ error: 'ID de usuário inválido.' });
    }

    req.user = { id: data.user_id };
    console.log('[AuthMiddleware] API Key validada com sucesso.');
    console.log(`[AuthMiddleware] Usuário autenticado: ${req.user.id}`);
    console.log('[AuthMiddleware] ID do usuário:', req.user.id);

    next();
}

module.exports = { validateApiKey };
