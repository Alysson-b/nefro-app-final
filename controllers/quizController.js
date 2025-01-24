const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.listQuizzes = async (req, res) => {
    const { idModulo } = req.params;  

    try {
        const { data, error } = await supabase
            .from('provas')
            .select('*')
            .eq('id_modulo', idModulo);  

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.status(200).json(data);  
    } catch (err) {
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

exports.createQuiz = async (req, res) => {
    const { idModulo } = req.params;
    const { titulo, descricao } = req.body;

    try {
        const { data, error } = await supabase
            .from('provas')
            .insert([{ titulo, descricao, id_modulo: idModulo }])
            .select();


        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.status(201).json(data);  
    } catch (err) {
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

exports.listAllQuizzes = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('provas')
            .select('*'); 

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.status(200).json(data);  
    } catch (err) {
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};
