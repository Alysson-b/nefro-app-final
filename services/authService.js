const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.sendConfirmationEmail = async (email, token) => {
    const msg = {
        to: email,
        from: process.env.EMAIL_FROM,
        subject: 'Confirmação de Cadastro',
        html: `<strong>Por favor, confirme seu cadastro clicando no link:</strong>
               <a href="http://localhost:3000/auth/confirm-email?token=${token}">Confirmar Cadastro</a>`
    };

    try {
        await sgMail.send(msg);
        console.log(`E-mail de confirmação enviado para ${email}`);
    } catch (error) {
        console.error('Erro ao enviar o e-mail de confirmação:', error);
        throw error;
    }
};



exports.resendConfirmationEmail = async (email) => {
    try {
        const { error } = await supabase.auth.api.resendConfirmationEmail(email);
        if (error) {
            console.error('Erro ao reenviar e-mail de confirmação:', error);
            throw new Error('Erro ao reenviar e-mail de confirmação.');
        }
        console.log('E-mail de confirmação reenviado com sucesso!');
    } catch (err) {
        console.error('Erro ao reenviar e-mail:', err);
        throw err;
    }
};


exports.sendRecoveryEmail = async (email, token) => {
    const msg = {
        to: email,
        from: process.env.EMAIL_FROM,
        subject: 'Recuperação de senha',
        text: `Aqui está seu token para redefinir a senha: ${token}`,
        html: `<strong>Clique no link para redefinir sua senha:</strong> 
               <a href="http://localhost:3000/redefinir-senha?token=${token}">Redefinir Senha</a>`
    };

    try {
        await sgMail.send(msg);
        console.log(`E-mail de recuperação enviado para ${email}`);
    } catch (error) {
        console.error('Erro ao enviar o e-mail de recuperação:', error);
        throw error;
    }
};
