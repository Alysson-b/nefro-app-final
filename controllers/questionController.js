const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.listQuestionsByQuiz = async (req, res) => {
    const { idProva } = req.params;

    try {
        const { data, error } = await supabase
            .from('questoes')
            .select('*')
            .eq('id_prova', idProva);

        if (error) {
            console.error('Erro ao buscar questões por prova:', error);
            return res.status(500).json({ error: 'Erro ao buscar questões.', details: error });
        }

        res.status(200).json(data);
    } catch (err) {
        console.error('Erro interno ao buscar questões por prova:', err.message);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

exports.listQuestionsByModule = async (req, res) => {
    const { idModulo } = req.params;

    try {
        const { data, error } = await supabase
            .from('questoes')
            .select('*')
            .eq('id_modulo', idModulo);

        if (error) {
            console.error('Erro ao buscar questões por módulo:', error);
            return res.status(500).json({ error: 'Erro ao buscar questões.', details: error });
        }

        res.status(200).json(data);
    } catch (err) {
        console.error('Erro interno ao buscar questões por módulo:', err.message);
        res.status(500).json({ error: 'Erro interno do servidor.', details: err.message });
    }
};

exports.createQuestion = async (req, res) => {
    const { 
        pergunta, 
        opcao_a, 
        opcao_b, 
        opcao_c, 
        opcao_d, 
        opcao_e, 
        resposta_correta, 
        respostas_incorretas, 
        explicacao, 
        modulos 
    } = req.body;

    if (!pergunta || !opcao_a || !opcao_b || !opcao_c || !opcao_d || !opcao_e || !resposta_correta || !modulos || modulos.length === 0) {
        return res.status(400).json({ error: 'Preencha todos os campos obrigatórios e selecione pelo menos um módulo.' });
    }

    try {
        const { data: questionData, error: questionError } = await supabase
            .from('questoes')
            .insert([
                { 
                    pergunta, 
                    opcao_a, 
                    opcao_b, 
                    opcao_c, 
                    opcao_d, 
                    opcao_e, 
                    resposta_correta, 
                    respostas_incorretas, 
                    explicacao,
                    id_modulo: modulos[0] 
                }
            ])
            .select();

        if (questionError) throw questionError;

        const questaoId = questionData[0].id;

        for (const moduloId of modulos) {
            const { error: moduleError } = await supabase
                .from('questao_modulo')
                .insert({ questao_id: questaoId, modulo_id: moduloId });

            if (moduleError) throw moduleError;
        }

        res.status(201).json({ message: 'Questão criada com sucesso!', questao: questionData[0] });
    } catch (error) {
        console.error('Erro ao criar questão:', error);
        res.status(500).json({ error: 'Erro ao criar questão.' });
    }
};

exports.listAllQuestions = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('questoes')
            .select('*');

        if (error) {
            console.error('Erro ao buscar todas as questões:', error);
            return res.status(500).json({ error: 'Erro ao buscar todas as questões.', details: error });
        }

        res.status(200).json(data);
    } catch (err) {
        console.error('Erro interno ao buscar todas as questões:', err.message);
        res.status(500).json({ error: 'Erro interno do servidor.', details: err.message });
    }
};


exports.getQuestionById = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: 'O ID da questão é obrigatório.' });
    }

    try {
        const { data: question, error } = await supabase
            .from('questoes')
            .select('id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, opcao_e, resposta_correta, explicacao')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Erro ao buscar questão:', error);
            return res.status(404).json({ error: 'Questão não encontrada.' });
        }

        res.status(200).json({
            id: question.id,
            pergunta: question.pergunta,
            opcao_a: question.opcao_a,
            opcao_b: question.opcao_b,
            opcao_c: question.opcao_c,
            opcao_d: question.opcao_d,
            opcao_e: question.opcao_e,
            resposta_correta: question.resposta_correta,
            explicacao: question.explicacao,
        });
    } catch (err) {
        console.error('Erro ao buscar questão:', err.message);
        res.status(500).json({ error: 'Erro no servidor.', detalhes: err.message });
    }
};

exports.saveAnswer = async (req, res) => {
    try {
        const { questao_id, resposta } = req.body;

        if (!questao_id || !resposta) {
            return res.status(400).json({ error: 'ID da questão e resposta são obrigatórios.' });
        }

        const result = await supabase
            .from('respostas')
            .insert([{ questao_id, resposta }]);

        if (result.error) {
            return res.status(500).json({ error: 'Erro ao salvar a resposta.', detalhes: result.error });
        }

        return res.status(200).json({ message: 'Resposta salva com sucesso.' });
    } catch (error) {
        console.error('Erro ao salvar resposta:', error);
        return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
};

