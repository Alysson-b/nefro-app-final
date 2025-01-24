require('dotenv').config();
const { sendEmail } = require('./services/authService');

const testeEnvioEmail = async () => {
  try {
    await sendEmail('seu_email_destino@dominio.com', 'Teste de envio', 'Este é um teste de envio de e-mail.');
    console.log('Email de teste enviado com sucesso!');
  } catch (error) {
    console.error('Erro ao enviar email de teste:', error);
  }
};

testeEnvioEmail();
