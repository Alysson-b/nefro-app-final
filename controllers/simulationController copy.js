const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const ProgressoModel = require('../models/ProgressoModel');
const mongoose = require('mongoose');



exports.listTests = async (req, res) => {
    const userId = req.user.id;

    try {
        const { data: ultimoTesteResolvido, error: errorUltimoTeste } = await supabase
            .from('test_history')
            .select('id_test, average_score')
            .eq('user_id', userId)
            .order('resolved_at', { ascending: false })
            .limit(1);

        if (errorUltimoTeste) {
            console.error('Erro ao buscar o último teste resolvido:', errorUltimoTeste);
        }

        let ultimoTeste = null;

        if (ultimoTesteResolvido && ultimoTesteResolvido.length > 0) {
            const { data: testeDetalhes, error: testeError } = await supabase
                .from('testes')
                .select('*')
                .eq('id', ultimoTesteResolvido[0].id_test)
                .single();

            if (testeError) {
                console.error('Erro ao buscar detalhes do último teste:', testeError);
            } else {
                testeDetalhes.porcentagemAcerto = `${ultimoTesteResolvido[0].average_score || 0}%`;
                ultimoTeste = testeDetalhes;
            }
        }

        const { data: meusTestes, error: errorMeusTestes } = await supabase
            .from('testes')
            .select('*')
            .eq('criado_por', userId)
            .order('criado_em', { ascending: false });

        if (errorMeusTestes) {
            console.error('Erro ao buscar testes do usuário:', errorMeusTestes);
            throw errorMeusTestes;
        }

        const { data: testesDisponiveis, error: errorTestesDisponiveis } = await supabase
            .from('testes')
            .select('*')
            .order('criado_em', { ascending: false });

        if (errorTestesDisponiveis) {
            console.error('Erro ao buscar testes disponíveis:', errorTestesDisponiveis);
            throw errorTestesDisponiveis;
        }

        const enriquecerTeste = async (testes) => {
            for (const teste of testes) {
                const { data: questoes, error: questoesError } = await supabase
                    .from('test_questoes')
                    .select('id_questao')
                    .eq('id_test', teste.id);

                if (questoesError || !questoes) {
                    console.error('Erro ao buscar questões do teste:', questoesError);
                    teste.modulos = ['Erro ao buscar módulos'];
                    teste.porcentagemAcerto = '0%';
                    continue;
                }

                const questaoIds = questoes.map(q => q.id_questao);

                const { data: questaoModulos, error: questaoModulosError } = await supabase
                    .from('questao_modulo')
                    .select('modulo_id')
                    .in('questao_id', questaoIds);

                const moduloIds = questaoModulos
                    ? [...new Set(questaoModulos.map(qm => qm.modulo_id))]
                    : [];

                const { data: modulos, error: modulosError } = await supabase
                    .from('modulos')
                    .select('nome')
                    .in('id', moduloIds);

                if (modulosError) {
                    console.error('Erro ao buscar nomes dos módulos:', modulosError);
                    teste.modulos = ['Erro ao buscar módulos'];
                } else {
                    teste.modulos = modulos.map(modulo => modulo.nome);
                }

                const { data: testHistory, error: historyError } = await supabase
                    .from('test_history')
                    .select('average_score')
                    .eq('id_test', teste.id);

                if (historyError || !testHistory || testHistory.length === 0) {
                    teste.porcentagemAcerto = '0%';
                } else {
                    teste.porcentagemAcerto = `${testHistory[0].average_score || 0}%`;
                }
            }
        };

        await enriquecerTeste(meusTestes);
        await enriquecerTeste(testesDisponiveis);

        res.status(200).json({
            ultimoTeste,
            meusTestes,
            testesDisponiveis,
        });
    } catch (err) {
        console.error('Erro interno ao listar testes:', err.message);
        res.status(500).json({ error: 'Erro interno do servidor.', detalhes: err.message });
    }
};

exports.createTest = async (req, res) => {
    const { titulo, descricao } = req.body;
    const criado_por = req.user.id;

    if (!titulo || !descricao) {
        return res.status(400).json({ error: 'Título e descrição são obrigatórios.' });
    }

    try {
        const { data, error } = await supabase
            .from('testes')
            .insert([{ titulo, descricao, criado_por }])
            .select();

        if (error) {
            console.error('Erro ao criar teste:', error);
            return res.status(500).json({ error: 'Erro ao criar teste.', detalhes: error.message });
        }

        res.status(201).json(data[0]); 
    } catch (err) {
        console.error('Erro interno ao criar teste:', err.message);
        res.status(500).json({ error: 'Erro interno do servidor.', detalhes: err.message });
    }
};

exports.searchModules = async (req, res) => {
    const { search } = req.query;

    if (!search) {
        return res.status(400).json({ error: 'O parâmetro de busca é obrigatório.' });
    }

    try {
        const { data, error } = await supabase
            .from('modulos')
            .select('id, name')
            .ilike('name', `%${search}%`)
            .limit(10);

        if (error) {
            console.error('Erro ao buscar módulos:', error);
            return res.status(500).json({ error: 'Erro ao buscar módulos.', details: error });
        }

        res.status(200).json(data);
    } catch (err) {
        console.error('Erro interno ao buscar módulos:', err.message);
        res.status(500).json({ error: 'Erro interno do servidor.', details: err.message });
    }
};

exports.addQuestionsToTest = async (req, res) => {
    const { testId } = req.params;
    const { questoes } = req.body;

    if (!questoes || !Array.isArray(questoes) || questoes.length === 0) {
        return res.status(400).json({ error: 'Nenhuma questão fornecida.' });
    }

    try {
        const { data: questoesExistentes, error: errorQuestoesExistentes } = await supabase
            .from('questoes')
            .select('id')
            .in('id', questoes); 

        if (errorQuestoesExistentes) {
            console.error('Erro ao verificar questões existentes:', errorQuestoesExistentes);
            return res.status(500).json({ error: 'Erro ao verificar questões existentes.', detalhes: errorQuestoesExistentes.message });
        }

        if (questoesExistentes.length !== questoes.length) {
            return res.status(400).json({ error: 'Algumas questões fornecidas não existem.' });
        }

        const { data: existentes, error: errorExistentes } = await supabase
            .from('test_questoes')
            .select('id_questao')
            .eq('id_test', testId);

        if (errorExistentes) {
            console.error('Erro ao verificar questões existentes no teste:', errorExistentes);
            throw errorExistentes;
        }

        const existentesIds = existentes.map((e) => e.id_questao);
        const novasQuestoes = questoes.filter((questaoId) => !existentesIds.includes(questaoId));

        const { error: errorInsercao } = await supabase
            .from('test_questoes')
            .insert(
                novasQuestoes.map((questaoId) => ({
                    id_test: testId,
                    id_questao: questaoId,
                }))
            );

        if (errorInsercao) {
            console.error('Erro ao inserir questões no teste:', errorInsercao);
            throw errorInsercao;
        }

        res.status(200).json({ message: 'Questões adicionadas com sucesso!' });
    } catch (err) {
        console.error('Erro interno ao adicionar questões ao teste:', err.message);
        res.status(500).json({ error: 'Erro interno do servidor.', detalhes: err.message });
    }
};


exports.addRandomQuestionsToSimulation = async (req, res) => {
    const { simuladoId } = req.params;
    const { quantidade, idModulo } = req.body;

    if (!quantidade || !idModulo) {
        return res.status(400).json({ error: 'Quantidade e ID do módulo são obrigatórios.' });
    }

    try {
        const { data: questoes, error: errorQuestoes } = await supabase
            .from('questoes')
            .select('id, pergunta')
            .eq('id_modulo', idModulo)
            .order('criado_em', { ascending: false })
            .limit(quantidade);

        if (errorQuestoes) {
            console.error('Erro ao buscar questões aleatórias:', errorQuestoes);
            throw errorQuestoes;
        }

        if (questoes.length === 0) {
            return res.status(404).json({ error: 'Nenhuma questão encontrada para o módulo.' });
        }

        const { error: errorInsercao } = await supabase
            .from('simulado_questoes')
            .insert(questoes.map(questao => ({
                id_test: simuladoId,
                id_questao: questao.id,
            })));

        if (errorInsercao) {
            console.error('Erro ao inserir questões no simulado:', errorInsercao);
            throw errorInsercao;
        }

        res.status(200).json({ message: 'Questões adicionadas com sucesso!', questoes });
    } catch (err) {
        console.error('Erro interno ao adicionar questões ao simulado:', err.message);
        res.status(500).json({ error: 'Erro interno do servidor.', detalhes: err.message });
    }
};

exports.getTestDetails = async (req, res) => {
    const { testId } = req.params;

    if (!testId) {
        return res.status(400).json({ error: 'O ID do teste é obrigatório.' });
    }

    try {
        const userId = req.user?.id; 

        const { data: teste, error: testeError } = await supabase
            .from('testes')
            .select('id, titulo, descricao, criado_por, rating')
            .eq('id', testId)
            .single();

        if (testeError || !teste) {
            console.error('Erro ao buscar detalhes do teste:', testeError);
            return res.status(404).json({ error: 'Teste não encontrado.' });
        }

        const { data: testHistory, error: testHistoryError } = await supabase
            .from('test_history')
            .select('total_attempts, average_score, highest_score')
            .eq('id_test', testId)
            .single();

        if (testHistoryError) {
            console.error('Erro ao buscar histórico do teste:', testHistoryError);
        }

        const totalResolucoes = testHistory?.total_attempts || 0;
        const porcentagemAcerto = testHistory?.average_score || 0;
        const maiorPontuacao = testHistory?.highest_score || 0;

        const { data: userHistory, error: userHistoryError } = await supabase
            .from('user_history')
            .select('highest_score')
            .eq('id_test', testId)
            .eq('user_id', userId)
            .single();

        const minhaMaiorPontuacao = userHistory?.highest_score || 0;

        if (userHistoryError) {
            console.error('Erro ao buscar histórico do usuário:', userHistoryError);
        }

        const { data: criador, error: criadorError } = await supabase
            .from('usuarios')
            .select('nome')
            .eq('id', teste.criado_por)
            .single();

        const nomeCriador = criador?.nome || 'Desconhecido';

        if (criadorError) {
            console.error('Erro ao buscar criador do teste:', criadorError);
        }

        const { data: questoes, error: questoesError } = await supabase
            .from('test_questoes')
            .select('id_questao')
            .eq('id_test', testId);

        const questaoIds = questoes?.map(q => q.id_questao) || [];

        const { data: questaoModulos, error: questaoModulosError } = await supabase
            .from('questao_modulo')
            .select('modulo_id')
            .in('questao_id', questaoIds);

        const moduloIds = questaoModulos?.map(qm => qm.modulo_id) || [];

        const { data: modulos, error: modulosError } = await supabase
            .from('modulos')
            .select('nome')
            .in('id', moduloIds);

        const nomesModulos = modulos?.map(modulo => modulo.nome) || [];

        if (modulosError) {
            console.error('Erro ao buscar nomes dos módulos:', modulosError);
        }

        res.status(200).json({
            titulo: teste.titulo,
            descricao: teste.descricao || 'Sem descrição disponível.',
            rating: teste.rating || 0,
            porcentagemAcerto: `${porcentagemAcerto}%`,
            totalResolucoes: totalResolucoes,
            maiorPontuacao: maiorPontuacao,
            minhaMaiorPontuacao: minhaMaiorPontuacao,
            criador: nomeCriador,
            modulos: nomesModulos,
            totalQuestoes: questoes?.length || 0,
            questoes: questaoIds,
        });
    } catch (err) {
        console.error('Erro ao buscar detalhes do teste:', err.message);
        res.status(500).json({
            error: 'Erro interno do servidor.',
            detalhes: err.message,
        });
    }
};

exports.startTestAttempt = async (req, res) => {
    const { testId } = req.params; // Usando testId da URL
    const userId = req.user?.id;

    // Validação inicial
    if (!testId || !userId) {
        return res.status(400).json({ error: 'Os parâmetros testId e userId são obrigatórios.' });
    }

    try {
        // Busca tentativas existentes para o mesmo teste e usuário
        const { data: attempts, error: attemptsError } = await supabase
            .from('test_attempts')
            .select('attempt_number, id')
            .eq('id_test', testId)
            .eq('user_id', userId);

        if (attemptsError) {
            console.error('Erro ao buscar tentativas anteriores:', attemptsError);
            return res.status(500).json({ error: 'Erro ao buscar tentativas anteriores.' });
        }

        // Determina o número da próxima tentativa
        const nextAttemptNumber = attempts.length > 0
            ? Math.max(...attempts.map(a => a.attempt_number)) + 1
            : 1;

        // Cria uma nova tentativa
        const { data: newAttempt, error: createError } = await supabase
            .from('test_attempts')
            .insert({
                id_test: testId,
                user_id: userId,
                attempt_number: nextAttemptNumber,
                created_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (createError) {
            console.error('Erro ao criar tentativa:', createError);
            return res.status(500).json({ error: 'Erro ao criar tentativa de teste.' });
        }

        // Retorna os dados da nova tentativa e quaisquer tentativas anteriores
        return res.status(201).json({
            message: 'Tentativa iniciada com sucesso.',
            attempt: newAttempt,
            previousAttempts: attempts,
        });
    } catch (err) {
        console.error('Erro inesperado ao iniciar tentativa:', err.message);
        return res.status(500).json({ error: 'Erro inesperado ao iniciar tentativa.' });
    }
};


// SALVAR RESPOSTA
exports.saveAnswer = async (req, res) => {
    const { attempt_id, questao_id, resposta } = req.body;

    if (!attempt_id || !questao_id || !resposta) {
        return res.status(400).json({ error: 'Parâmetros obrigatórios: attempt_id, questao_id e resposta.' });
    }

    try {
        const { data: attempt, error: attemptError } = await supabase
            .from('test_attempts')
            .select('id_test')
            .eq('id', attempt_id)
            .single();

        if (attemptError || !attempt) {
            return res.status(404).json({ error: 'Tentativa não encontrada.' });
        }

        const { data: question, error: questionError } = await supabase
            .from('test_questoes')
            .select('id_questao')
            .eq('id_test', attempt.id_test)
            .eq('id_questao', questao_id)
            .single();

        if (questionError || !question) {
            return res.status(400).json({ error: 'Questão não pertence ao teste.' });
        }

        const { data: existingAnswer, error: checkError } = await supabase
            .from('respostas')
            .select('*')
            .eq('attempt_id', attempt_id)
            .eq('questao_id', questao_id)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
        }

        if (existingAnswer) {
            const { error: updateError } = await supabase
                .from('respostas')
                .update({ resposta })
                .eq('id', existingAnswer.id);

            if (updateError) throw updateError;

            return res.status(200).json({ message: 'Resposta atualizada com sucesso.' });
        }

        const { error: insertError } = await supabase
            .from('respostas')
            .insert({ attempt_id, questao_id, resposta });

        if (insertError) throw insertError;

        return res.status(201).json({ message: 'Resposta salva com sucesso.' });
    } catch (err) {
        console.error('Erro ao salvar resposta:', err.message);
        return res.status(500).json({ error: 'Erro interno.', detalhes: err.message });
    }
};

// OBTER HISTÓRICO DO TESTE
exports.getTestHistory = async (req, res) => {
    const { testId } = req.params;

    if (!testId) {
        return res.status(400).json({ error: 'O ID do teste é obrigatório.' });
    }

    try {
        const { data: historico, error } = await supabase
            .from('test_history')
            .select('*')
            .eq('id_test', testId)
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({ error: 'Erro ao buscar histórico do teste.' });
        }

        if (!historico || historico.length === 0) {
            return res.status(404).json({ message: 'Nenhum histórico encontrado para o teste.' });
        }

        res.status(200).json({ historico });
    } catch (err) {
        console.error('Erro ao buscar histórico do teste:', err.message);
        res.status(500).json({ error: 'Erro interno do servidor.', detalhes: err.message });
    }
};


exports.saveProgress = async (req, res) => {
    const { testId } = req.params; // Pegando o testId da URL
    const userId = req.user?.id; // Obtendo o ID do usuário autenticado
    const { ultimaQuestao, respostas } = req.body;

    if (!userId || !testId) {
        return res.status(400).json({ error: 'Os parâmetros testId e userId são obrigatórios.' });
    }

    try {
        // Verifica se o progresso já existe
        const { data: existingProgress, error: progressError } = await supabase
            .from('test_progress')
            .select('*')
            .eq('id_test', testId)
            .eq('user_id', userId)
            .single();

        if (progressError && progressError.code !== 'PGRST116') {
            throw progressError;
        }

        if (existingProgress) {
            // Atualiza o progresso existente
            const { error: updateError } = await supabase
                .from('test_progress')
                .update({
                    ultima_questao: ultimaQuestao,
                    respostas: respostas,
                    updated_at: new Date().toISOString(),
                })
                .eq('id_test', testId)
                .eq('user_id', userId);

            if (updateError) throw updateError;

            return res.status(200).json({ message: 'Progresso atualizado com sucesso.' });
        } else {
            // Cria um novo registro de progresso
            const { error: insertError } = await supabase
                .from('test_progress')
                .insert({
                    id_test: testId,
                    user_id: userId,
                    ultima_questao: ultimaQuestao,
                    respostas: respostas,
                    created_at: new Date().toISOString(),
                });

            if (insertError) throw insertError;

            return res.status(201).json({ message: 'Progresso salvo com sucesso.' });
        }
    } catch (err) {
        console.error('Erro ao salvar progresso:', err.message);
        return res.status(500).json({ error: 'Erro ao salvar progresso.', detalhes: err.message });
    }
};


exports.loadProgress = async (req, res) => {
    const { testId } = req.params;
    const userId = req.user?.id;

    if (!userId || !testId) {
        return res.status(400).json({ error: 'Os parâmetros testId e userId são obrigatórios.' });
    }

    try {
        const { data: progresso, error: progressoError } = await supabase
            .from('test_progress')
            .select('*')
            .eq('id_test', testId)
            .eq('user_id', userId)
            .single();

        if (progressoError && progressoError.code !== 'PGRST116') {
            throw progressoError;
        }

        const respostasArray = progresso?.respostas || [];

        const { data: questoes, error: questoesError } = await supabase
            .from('test_questoes')
            .select('id_questao')
            .eq('id_test', testId);

        if (questoesError) throw questoesError;

        const questaoIds = questoes.map(q => q.id_questao);
        const respondidas = respostasArray.map(r => r.id_questao);
        const questoesRestantes = questaoIds.filter(id => !respondidas.includes(id));

        return res.status(200).json({
            message: 'Progresso carregado com sucesso.',
            ultimaQuestao: progresso?.ultima_questao || null,
            respostas: respostasArray,
            questoesRestantes,
            created_at: progresso?.created_at || null,
            updated_at: progresso?.updated_at || null,
        });
    } catch (err) {
        console.error('Erro ao carregar progresso:', err.message);
        return res.status(500).json({
            error: 'Erro interno ao carregar progresso.',
            detalhes: err.message || 'Detalhes indisponíveis',
        });
    }
};

exports.updateProgress = async (req, res) => {
    const { testId } = req.params; // Pegando o testId da URL
    const userId = req.user?.id; // Obtendo o ID do usuário autenticado
    const { ultimaQuestao, respostas } = req.body;

    if (!userId || !testId) {
        return res.status(400).json({ error: 'Os parâmetros testId e userId são obrigatórios.' });
    }

    try {
        // Verifica se o progresso existe
        const { data: existingProgress, error: progressError } = await supabase
            .from('test_progress')
            .select('*')
            .eq('id_test', testId)
            .eq('user_id', userId)
            .single();

        if (progressError && progressError.code !== 'PGRST116') {
            throw progressError;
        }

        if (!existingProgress) {
            return res.status(404).json({ error: 'Progresso não encontrado para o teste especificado.' });
        }

        // Atualiza o progresso existente
        const { error: updateError } = await supabase
            .from('test_progress')
            .update({
                ultima_questao: ultimaQuestao,
                respostas: respostas,
                updated_at: new Date().toISOString(),
            })
            .eq('id_test', testId)
            .eq('user_id', userId);

        if (updateError) throw updateError;

        return res.status(200).json({ message: 'Progresso atualizado com sucesso.' });
    } catch (err) {
        console.error('Erro ao atualizar progresso:', err.message);
        return res.status(500).json({ error: 'Erro ao atualizar progresso.', detalhes: err.message });
    }
};


exports.updateTest = async (req, res) => {
    const { testId } = req.params;
    const { titulo, descricao } = req.body;

    if (!titulo || !descricao) {
        return res.status(400).json({ error: 'Título e descrição são obrigatórios.' });
    }

    try {
        const { data, error } = await supabase
            .from('testes')
            .update({ titulo, descricao })
            .eq('id', testId)
            .select();

        if (error) {
            console.error('Erro ao atualizar teste:', error);
            throw error;
        }

        res.status(200).json(data);
    } catch (err) {
        console.error('Erro interno ao atualizar teste:', err.message);
        res.status(500).json({ error: 'Erro interno do servidor.', detalhes: err.message });
    }
};

exports.deleteTest = async (req, res) => {
    const { testId } = req.params;

    try {
        const { error } = await supabase
            .from('testes')
            .delete()
            .eq('id', testId);

        if (error) {
            console.error('Erro ao excluir teste:', error);
            throw error;
        }

        res.status(200).json({ message: 'Teste excluído com sucesso.' });
    } catch (err) {
        console.error('Erro interno ao excluir teste:', err.message);
        res.status(500).json({ error: 'Erro interno do servidor.', detalhes: err.message });
    }
};

// FINALIZAR TESTE
exports.finalizeTest = async (req, res) => {
    const { attempt_id } = req.body;
    const user_id = req.user?.id;

    if (!attempt_id || !user_id) {
        return res.status(400).json({ error: 'Parâmetros obrigatórios: attempt_id e user_id.' });
    }

    try {
        // VALIDAR TENTATIVA EXISTENTE
        const { data: attempt, error: attemptError } = await supabase
            .from('test_attempts')
            .select('id_test')
            .eq('id', attempt_id)
            .single();

        if (attemptError || !attempt) {
            return res.status(404).json({ error: 'Tentativa não encontrada.' });
        }

        const id_test = attempt.id_test;

        // BUSCAR RESPOSTAS E VERIFICAR CORRETAS
        const { data: answers, error: answersError } = await supabase
            .from('respostas')
            .select('questao_id, resposta')
            .eq('attempt_id', attempt_id);

        if (answersError || !answers) {
            return res.status(500).json({ error: 'Erro ao buscar respostas da tentativa.', detalhes: answersError });
        }

        let correctAnswers = 0;
        const totalQuestions = answers.length;

        const questionIds = answers.map(a => a.questao_id);
        const { data: questions, error: questionsError } = await supabase
            .from('questoes')
            .select('id, resposta_correta')
            .in('id', questionIds);

        if (questionsError || !questions) {
            return res.status(500).json({ error: 'Erro ao buscar questões.', detalhes: questionsError });
        }

        // CALCULAR RESPOSTAS CORRETAS
        for (const answer of answers) {
            const question = questions.find(q => q.id === answer.questao_id);
            if (question && answer.resposta === question.resposta_correta) {
                correctAnswers++;
            }
        }

        const score = totalQuestions > 0 
            ? ((correctAnswers / totalQuestions) * 100).toFixed(2)
            : 0;

        // FINALIZAR TENTATIVA
        const { error: updateAttemptError } = await supabase
            .from('test_attempts')
            .update({ status: 'finalizado', score })
            .eq('id', attempt_id);

        if (updateAttemptError) {
            return res.status(500).json({ error: 'Erro ao finalizar tentativa.', detalhes: updateAttemptError });
        }

        // SALVAR HISTÓRICO DO TESTE
        const historyData = {
            user_id,
            id_test,
            attempt_id,
            correct_answers: correctAnswers,
            total_questions: totalQuestions,
            score: parseFloat(score), // Garantir que seja um número válido
            created_at: new Date().toISOString(),
        };

        const { error: historyError } = await supabase
            .from('test_history')
            .insert(historyData);

        if (historyError) {
            console.error('Erro ao salvar histórico do teste:', historyError);
            console.error('Dados enviados para a tabela test_history:', historyData);
            return res.status(500).json({ error: 'Erro ao salvar histórico do teste.', detalhes: historyError.message });
        }

        res.status(200).json({
            message: 'Teste finalizado com sucesso.',
            correctAnswers,
            totalQuestions,
            score,
        });
    } catch (error) {
        console.error('Erro ao finalizar teste:', error.message);
        res.status(500).json({ error: 'Erro interno no servidor.', detalhes: error.message });
    }
};
