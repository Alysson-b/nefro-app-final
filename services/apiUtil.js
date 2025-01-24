const fetchApi = async (url, method = 'GET', body = null, apiKey = null) => {
    const headers = {
        'Content-Type': 'application/json',
    };
    if (apiKey) {
        headers['x-api-key'] = apiKey;
    }

    const options = {
        method,
        headers,
    };
    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro na requisição');
        }
        return await response.json();
    } catch (error) {
        console.error(`Erro ao realizar requisição ${method} em ${url}:`, error.message);
        throw error;
    }
};

module.exports = fetchApi;
