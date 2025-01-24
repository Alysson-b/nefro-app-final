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


exports.addRandomQuestionsToTest = async (req, res) => {
    const { testId } = req.params;
    const { quantidade, idModulo } = req.body;

    if (!quantidade || !idModulo) {
        return res.status(400).json({ error: 'Parâmetros inválidos: quantidade e idModulo são obrigatórios.' });
    }

    try {
        // Buscar questões aleatórias no módulo específico
        const { data: questoesAleatorias, error: erroQuestoesAleatorias } = await supabase
            .from('questoes')
            .select('id, pergunta')
            .eq('id_modulo', idModulo) // Filtra pelo módulo
            .order('id', { ascending: false }) // Ordenação aleatória (não é possível usar RANDOM no supabase direto)
            .limit(quantidade); // Limita a quantidade de questões

        if (erroQuestoesAleatorias) {
            console.error('Erro ao buscar questões aleatórias:', erroQuestoesAleatorias.message);
            return res.status(500).json({
                error: 'Erro ao buscar questões aleatórias.',
                detalhes: erroQuestoesAleatorias.message,
            });
        }

        // Agora, você pode adicionar essas questões ao seu teste
        const questoesIds = questoesAleatorias.map(q => q.id);

        // Verifica as questões que já estão no teste
        const { data: questoesExistentes, error: erroQuestoesExistentes } = await supabase
            .from('test_questoes')
            .select('id_questao')
            .eq('id_test', testId);

        if (erroQuestoesExistentes) {
            console.error('Erro ao verificar questões existentes no teste:', erroQuestoesExistentes.message);
            return res.status(500).json({
                error: 'Erro ao verificar questões existentes no teste.',
                detalhes: erroQuestoesExistentes.message,
            });
        }

        // Cria um Set com os IDs das questões já presentes no teste
        const existentesIds = new Set(questoesExistentes.map(e => e.id_questao));
        // Filtra as questões que ainda não estão no teste
        const novasQuestoes = questoesIds.filter(id => !existentesIds.has(id));

        // Se houver novas questões a serem inseridas
        if (novasQuestoes.length > 0) {
            const { error: erroInsercao } = await supabase
                .from('test_questoes')
                .insert(
                    novasQuestoes.map((questaoId) => ({
                        id_test: testId,
                        id_questao: questaoId,
                    }))
                );

            if (erroInsercao) {
                console.error('Erro ao inserir questões no teste:', erroInsercao.message);
                return res.status(500).json({
                    error: 'Erro ao inserir questões no simulado.',
                    detalhes: erroInsercao.message,
                });
            }
        }

        // Retorna uma resposta com sucesso e as questões adicionadas
        return res.status(200).json({
            message: 'Questões aleatórias adicionadas com sucesso ao teste!',
            questoes: questoesAleatorias,  // Retorna as questões que foram selecionadas
        });

    } catch (err) {
        console.error('Erro ao buscar ou inserir questões aleatórias:', err.message);
        return res.status(500).json({
            error: 'Erro ao buscar ou inserir questões.',
            detalhes: err.message,
        });
    }
};




exports.getTestDetails = async (req, res) => {
    const { testId } = req.params;

    if (!testId) {
        return res.status(400).json({ error: 'O ID do teste é obrigatório.' });
    }

    try {
        const userId = req.user?.id; 

        // Buscar detalhes do teste
        const { data: teste, error: testeError } = await supabase
            .from('testes')
            .select('id, titulo, descricao, criado_por, rating')
            .eq('id', testId)
            .single();

        if (testeError || !teste) {
            return res.status(404).json({ error: 'Teste não encontrado.' });
        }

        // Buscar histórico do teste
        const { data: testHistory } = await supabase
            .from('test_history')
            .select('total_attempts, average_score, highest_score, correct_answers, total_questions')
            .eq('test_id', testId)
            .single();

        const totalResolucoes = testHistory?.total_attempts || 0;
        const porcentagemAcerto = testHistory?.average_score || 0;
        const maiorPontuacao = testHistory?.highest_score || 0;
        const totalCorretas = testHistory?.correct_answers || 0;
        const totalQuestoes = testHistory?.total_questions || 0;

        // Calcular acerto geral
        const acertoGeral = totalQuestoes > 0
            ? ((totalCorretas / totalQuestoes) * 100).toFixed(2)
            : '0%';

        // Buscar histórico do usuário
        const { data: userHistory } = await supabase
            .from('user_history')
            .select('highest_score')
            .eq('test_id', testId)
            .eq('user_id', userId)
            .single();

        const minhaMaiorPontuacao = userHistory?.highest_score || 0;

        // Buscar nome do criador
        const { data: criador } = await supabase
            .from('usuarios')
            .select('nome')
            .eq('id', teste.criado_por)
            .single();

        const nomeCriador = criador?.nome || 'Desconhecido';

        // Buscar IDs das questões do teste
        const { data: questoes } = await supabase
            .from('test_questoes')
            .select('id_questao')
            .eq('id_test', testId);

        const questaoIds = questoes?.map(q => q.id_questao) || [];

        // Verificar se existem questões antes de buscar módulos
        let nomesModulos = [];
        if (questaoIds.length > 0) {
            const { data: questaoModulos } = await supabase
                .from('questao_modulo')
                .select('modulo_id')
                .in('questao_id', questaoIds);

            const moduloIds = questaoModulos?.map(qm => qm.modulo_id) || [];

            const { data: modulos } = await supabase
                .from('modulos')
                .select('nome')
                .in('id', moduloIds);

            nomesModulos = modulos?.map(modulo => modulo.nome) || [];
        }

        // Retornar os detalhes do teste
        res.status(200).json({
            titulo: teste.titulo,
            descricao: teste.descricao || 'Sem descrição disponível.',
            rating: teste.rating || 0,
            porcentagemAcerto: acertoGeral,
            totalResolucoes,
            maiorPontuacao,
            minhaMaiorPontuacao,
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
        // Validar se o teste existe
        const { data: teste, error: testeError } = await supabase
            .from('testes')
            .select('id, titulo, descricao')
            .eq('id', testId)
            .single();

        if (testeError || !teste) {
            return res.status(404).json({ error: 'Teste não encontrado.' });
        }

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

        const attemptList = attempts || [];

        // Determina o número da próxima tentativa
        const nextAttemptNumber = attemptList.length > 0
            ? Math.max(...attemptList.map(a => a.attempt_number)) + 1
            : 1;

        // Cria uma nova tentativa
        const { data: newAttempt, error: createError } = await supabase
            .from('test_attempts')
            .insert({
                id_test: testId,
                user_id: userId,
                attempt_number: nextAttemptNumber,
            })
            .select()
            .single();

        if (createError) {
            console.error('Erro ao criar tentativa:', createError);
            return res.status(500).json({ error: 'Erro ao criar tentativa de teste.' });
        }

        // Retorna os dados da nova tentativa e as tentativas anteriores
        return res.status(201).json({
            message: 'Tentativa iniciada com sucesso.',
            test: {
                id: teste.id,
                titulo: teste.titulo,
                descricao: teste.descricao,
            },
            attempt: newAttempt,
            previousAttempts: attemptList,
        });
    } catch (err) {
        console.error('Erro inesperado ao iniciar tentativa:', err.message);
        return res.status(500).json({ error: 'Erro inesperado ao iniciar tentativa.' });
    }
};



exports.saveAnswer = async (req, res) => {
    const { attempt_id, questao_id, resposta } = req.body;

    if (!attempt_id || !questao_id || !resposta) {
        return res.status(400).json({ error: 'Parâmetros obrigatórios: attempt_id, questao_id e resposta.' });
    }

    try {
        // Verifica se a tentativa existe
        const { data: attempt, error: attemptError } = await supabase
            .from('test_attempts')
            .select('id_test')
            .eq('id', attempt_id)
            .single();

        if (attemptError || !attempt) {
            return res.status(404).json({ error: 'Tentativa não encontrada.' });
        }

        // Busca os detalhes da questão
        const { data: question, error: questionError } = await supabase
            .from('questoes')
            .select('id, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta')
            .eq('id', questao_id)
            .single();

        if (questionError || !question) {
            return res.status(400).json({ error: 'Questão não encontrada.' });
        }

        // Mapeia letras para as opções disponíveis
        const opcoes = {
            A: question.opcao_a?.trim(),
            B: question.opcao_b?.trim(),
            C: question.opcao_c?.trim(),
            D: question.opcao_d?.trim(),
        };

        const respostaNormalizada = resposta.trim().toUpperCase();

        // Valida se a resposta enviada corresponde a uma das letras válidas
        if (!opcoes[respostaNormalizada]) {
            return res.status(400).json({ error: 'Resposta inválida para esta questão.' });
        }

        const respostaTexto = opcoes[respostaNormalizada]; // Mapeia para o texto da resposta

        // Ajuste aqui para encontrar a letra correta correspondente ao `resposta_correta`
        const respostaCorretaLetra = Object.keys(opcoes).find(
            (key) => `opcao_${key.toLowerCase()}` === question.resposta_correta
        );

        console.log('Resposta correta esperada (letra):', respostaCorretaLetra);
        console.log('Resposta enviada pelo usuário (letra):', respostaNormalizada);

        const isCorrect = respostaNormalizada === respostaCorretaLetra;

        // Verifica se já existe uma resposta para a questão
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
            // Atualiza a resposta existente
            const { error: updateError } = await supabase
                .from('respostas')
                .update({ resposta: respostaTexto, correta: isCorrect })
                .eq('id', existingAnswer.id);

            if (updateError) throw updateError;

            return res.status(200).json({
                message: 'Resposta atualizada com sucesso.',
                resposta: { attempt_id, questao_id, resposta: respostaTexto, correta: isCorrect },
            });
        }

        // Insere uma nova resposta
        const { error: insertError } = await supabase
            .from('respostas')
            .insert({ attempt_id, questao_id, resposta: respostaTexto, correta: isCorrect });

        if (insertError) throw insertError;

        return res.status(201).json({
            message: 'Resposta salva com sucesso.',
            resposta: { attempt_id, questao_id, resposta: respostaTexto, correta: isCorrect },
        });
    } catch (err) {
        console.error('Erro ao salvar resposta:', err.message);
        return res.status(500).json({ error: 'Erro interno.', detalhes: err.message });
    }
};


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

    if (!Array.isArray(respostas)) {
        return res.status(400).json({ error: 'O campo respostas deve ser um array.' });
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
            // Atualiza o progresso existente somente se houver mudanças
            if (
                existingProgress.ultima_questao === ultimaQuestao &&
                JSON.stringify(existingProgress.respostas) === JSON.stringify(respostas)
            ) {
                return res.status(200).json({ message: 'Progresso já atualizado.' });
            }

            const { data: updatedProgress, error: updateError } = await supabase
                .from('test_progress')
                .update({
                    ultima_questao: ultimaQuestao,
                    respostas: respostas,
                })
                .eq('id_test', testId)
                .eq('user_id', userId)
                .select()
                .single();

            if (updateError) throw updateError;

            return res.status(200).json({
                message: 'Progresso atualizado com sucesso.',
                progresso: updatedProgress,
            });
        } else {
            // Cria um novo registro de progresso
            const { data: newProgress, error: insertError } = await supabase
                .from('test_progress')
                .insert({
                    id_test: testId,
                    user_id: userId,
                    ultima_questao: ultimaQuestao,
                    respostas: respostas,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            return res.status(201).json({
                message: 'Progresso salvo com sucesso.',
                progresso: newProgress,
            });
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
        // Busca progresso do teste
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

        // Busca questões do teste
        const { data: questoes, error: questoesError } = await supabase
            .from('test_questoes')
            .select('id_questao')
            .eq('id_test', testId);

        if (questoesError) throw questoesError;

        const questaoIds = questoes.map(q => q.id_questao);

        // Busca módulos vinculados às questões
        const { data: modulosIds, error: modulosIdsError } = await supabase
            .from('questoes')
            .select('id_modulo')
            .in('id', questaoIds);

        if (modulosIdsError) throw modulosIdsError;

        const modulosUnicos = [...new Set(modulosIds.map(m => m.id_modulo))];

        // Busca nomes dos módulos
        const { data: modulos, error: modulosError } = await supabase
            .from('modulos')
            .select('id, nome')
            .in('id', modulosUnicos);

        if (modulosError) throw modulosError;

        const respondidas = respostasArray.map(r => r.id_questao);
        const questoesRestantes = questaoIds.filter(id => !respondidas.includes(id));

        // Monta os nomes dos tópicos (módulos)
        const topicos = modulos.map(m => m.nome);

        return res.status(200).json({
            message: 'Progresso carregado com sucesso.',
            ultimaQuestao: progresso?.ultima_questao || null,
            respostas: respostasArray,
            questoesRestantes,
            topicos,
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

        // CALCULAR RESPOSTAS CORRETAS E INCORRETAS
        for (const answer of answers) {
            const question = questions.find(q => q.id === answer.questao_id);
            if (question && answer.resposta === question.resposta_correta) {
                correctAnswers++;
            }
        }

        const incorrectAnswers = totalQuestions - correctAnswers; // Calcula as respostas incorretas
        const accuracy = totalQuestions > 0 
            ? ((correctAnswers / totalQuestions) * 100).toFixed(2) 
            : 0; // Porcentagem de acerto
        const score = correctAnswers; // Pontuação baseada em respostas corretas

        // FINALIZAR TENTATIVA
        const { error: updateAttemptError } = await supabase
            .from('test_attempts')
            .update({ status: 'finalizado', score, accuracy })
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
            incorrect_answers: incorrectAnswers,
            total_questions: totalQuestions,
            accuracy: parseFloat(accuracy),
            score,
            created_at: new Date().toISOString(),
        };

        const { error: historyError } = await supabase
            .from('test_history')
            .insert(historyData);

        if (historyError) {
            console.error('Erro ao salvar histórico do teste:', historyError);
            return res.status(500).json({ error: 'Erro ao salvar histórico do teste.', detalhes: historyError.message });
        }

        res.status(200).json({
            message: 'Teste finalizado com sucesso.',
            correctAnswers,
            incorrectAnswers,
            totalQuestions,
            accuracy: `${accuracy}%`,
            score,
        });
    } catch (error) {
        console.error('Erro ao finalizar teste:', error.message);
        res.status(500).json({ error: 'Erro interno no servidor.', detalhes: error.message });
    }
};
