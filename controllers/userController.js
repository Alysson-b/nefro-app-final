const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.listUsers = async (req, res) => {
    try {
        const { data, error } = await supabase.from('usuarios').select('*'); 
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

exports.saveUserHistory = async (req, res) => {
    const { id_test, correctAnswers, totalQuestions, score } = req.body; 
    const user_id = req.user?.id; 

    if (!user_id || !id_test || correctAnswers == null || totalQuestions == null || score == null) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    try {
        const { data, error } = await supabase
            .from('user_history')
            .insert([
                {
                    user_id: user_id,
                    id_test: id_test,
                    correct_answers: correctAnswers,
                    total_questions: totalQuestions,
                    score,
                },
            ])
            .select();

        if (error) {
            console.error('[SaveUserHistory] Erro ao salvar histórico:', error);
            return res.status(500).json({
                error: 'Erro ao salvar histórico do usuário.',
                details: error.message || 'Erro não especificado.',
            });
        }

        res.status(201).json({ message: 'Histórico salvo com sucesso!', data });
    } catch (err) {
        console.error('[SaveUserHistory] Erro interno:', err.message);
        res.status(500).json({ error: 'Erro interno do servidor.', details: err.message });
    }
};


// OBTER HISTÓRICO DO USUÁRIO
exports.getUserHistory = async (req, res) => {
    const user_id = req.user?.id;

    if (!user_id) {
        return res.status(400).json({ error: 'ID do usuário não encontrado.' });
    }

    try {
        const { data, error } = await supabase
            .from('user_history')
            .select('id_test, correct_answers, total_questions, score, created_at')
            .eq('user_id', user_id)
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({ error: 'Erro ao buscar histórico do usuário.' });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({ message: 'Nenhum histórico encontrado para o usuário.' });
        }

        res.status(200).json({ data });
    } catch (err) {
        console.error('Erro ao buscar histórico do usuário:', err.message);
        res.status(500).json({ error: 'Erro interno do servidor.', detalhes: err.message });
    }
};


exports.getUserPerformance = async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    try {
        console.log('[GetUserPerformance] Buscando desempenho para userId:', userId);

        // Buscar respostas do usuário
        const { data: respostas, error: respostasError } = await supabase
            .from('respostas')
            .select('correta')
            .eq('user_id', userId);

        if (respostasError) {
            console.error('[GetUserPerformance] Erro ao buscar respostas:', respostasError);
            return res.status(500).json({ error: 'Erro ao buscar respostas.', details: respostasError });
        }

        const totalQuestions = respostas?.length || 0;
        const totalCorrectAnswers = respostas?.filter((r) => r.correta)?.length || 0;
        const totalErrors = totalQuestions - totalCorrectAnswers;

        const rendimento = totalQuestions
            ? ((totalCorrectAnswers / totalQuestions) * 100).toFixed(2) + '%'
            : '0%';

        // Buscar maior pontuação do usuário
        const { data: testHistory, error: historyError } = await supabase
            .from('test_history')
            .select('score')
            .eq('user_id', userId)
            .order('score', { ascending: false })
            .limit(1); // Apenas o maior score

        if (historyError) {
            console.error('[GetUserPerformance] Erro ao buscar histórico:', historyError);
            return res.status(500).json({ error: 'Erro ao buscar maior pontuação.', details: historyError });
        }

        const highestScore = testHistory?.[0]?.score || 0;

        res.status(200).json({
            rendimento,
            totalResolutions: totalQuestions,
            totalCorrectAnswers,
            totalErrors,
            highestScore, // Adicionando a maior pontuação
        });
    } catch (err) {
        console.error('[GetUserPerformance] Erro interno:', err.message);
        res.status(500).json({ error: 'Erro interno.', details: err.message });
    }
};
