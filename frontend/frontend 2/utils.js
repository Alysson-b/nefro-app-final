// FAZER REQUISIÇÃO GENÉRICA
export async function fazerRequisicao(url, metodo, corpo = null) {
    try {
        const opcoes = {
            method: metodo,
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': 'SUA_API_KEY'
            }
        };

        if (corpo) {
            opcoes.body = JSON.stringify(corpo);
        }

        const resposta = await fetch(url, opcoes);

        if (!resposta.ok) {
            throw new Error(`Erro na requisição: ${resposta.status}`);
        }

        return await resposta.json();
    } catch (erro) {
        console.error('Erro ao fazer requisição:', erro);
        throw erro;
    }
}
