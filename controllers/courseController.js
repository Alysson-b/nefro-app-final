const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.listCourses = async (req, res) => {
    try {
        const { data, error } = await supabase.from('cursos').select('*');
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

exports.createCourse = async (req, res) => {
    const { titulo, descricao } = req.body;
    const criado_por = req.user.id;
    try {
        const { data, error } = await supabase
            .from('cursos')
            .insert([{ titulo, descricao, criado_por }])
            .select();
            
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        res.status(201).json(data); 
    } catch (err) {
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

