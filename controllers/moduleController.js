const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.listAllModules = async (req, res) => {
    try {
        const { data: modulos, error: errorModules } = await supabase
            .from('modulos')
            .select('*');

        if (errorModules) {
            return res.status(500).json({ error: 'Erro ao buscar módulos.', details: errorModules });
        }

        for (let modulo of modulos) {
            const { count: questaoCount, error: errorQuestions } = await supabase
                .from('questoes')
                .select('id', { count: 'exact' })
                .eq('id_modulo', modulo.id);

            if (errorQuestions) {
                return res.status(500).json({ error: 'Erro ao contar questões.', details: errorQuestions });
            }

            modulo.questaoCount = questaoCount || 0;
        }

        res.status(200).json(modulos);
    } catch (err) {
        res.status(500).json({ error: 'Erro interno do servidor.', details: err.message });
    }
};

exports.listModules = async (req, res) => {
    const { idCurso } = req.params;
    try {
        const { data, error } = await supabase
            .from('modulos')
            .select('*')
            .eq('id_curso', idCurso);  
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

exports.createModule = async (req, res) => {
    const { idCurso } = req.params;  
    const { nome, descricao } = req.body;  
    try {
        const { data, error } = await supabase
            .from('modulos')
            .insert([{ nome, descricao, id_curso: idCurso }])
            .select();

        if (error) {
            return res.status(500).json({ error: error.message });
        }
        res.status(201).json(data);  
    } catch (err) {
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

exports.listModulesWithQuestionCount = async (req, res) => {
    const { idCurso } = req.params;
    try {
        const { data: modulos, error: errorModules } = await supabase
            .from('modulos')
            .select('*')
            .eq('id_curso', idCurso);

        if (errorModules) {
            return res.status(500).json({ error: 'Erro ao buscar módulos.' });
        }

        for (let modulo of modulos) {
            const { count: questaoCount, error: errorQuestions } = await supabase
                .from('questoes')
                .select('id', { count: 'exact' })
                .eq('id_modulo', modulo.id);

            if (errorQuestions) {
                return res.status(500).json({ error: 'Erro ao contar questões.' });
            }

            modulo.questaoCount = questaoCount;  
        }

        res.status(200).json(modulos);
    } catch (err) {
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

exports.searchModules = async (req, res) => {
    const { search } = req.query;

    if (!search || search.trim() === '') {
        return res.status(400).json({ error: 'O termo de busca não pode estar vazio.' });
    }

    try {
        const { data: modulos, error } = await supabase
            .from('modulos')
            .select('id, nome') 
            .ilike('nome', `%${search}%`); 

        if (error) {
            console.error('Erro ao buscar módulos:', error.message);
            return res.status(500).json({ error: 'Erro ao buscar módulos.', details: error.message });
        }

        res.status(200).json(modulos);
    } catch (err) {
        console.error('Erro interno ao buscar módulos:', err.message);
        res.status(500).json({ error: 'Erro interno do servidor.', details: err.message });
    }
};
