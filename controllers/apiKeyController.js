const crypto = require('crypto');
const supabase = require('../supabase');


exports.gerarApiKey = async (userId) => {
    const apiKey = crypto.randomBytes(30).toString('hex');  
    const { data, error } = await supabase
        .from('api_keys')
        .insert([{
            api_key: apiKey,  
            user_id: userId,
            created_at: new Date(),
            expires_at: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        }]);

    if (error) {
        console.error('Erro ao inserir API Key no banco:', error);
        throw new Error('Erro ao gerar a API Key');
    }

    return apiKey;  
};

