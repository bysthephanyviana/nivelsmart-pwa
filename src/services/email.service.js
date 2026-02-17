const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
require('dotenv').config();

// Create transporter only if credentials exist
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

exports.sendPasswordResetEmail = async (to, resetToken) => {
    // If no credentials, log and return (Safe Fail for Dev)
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        logger.warn('⚠️ SMTP Credentials missing. Email NOT sent.');
        logger.info(`📧 [MOCK EMAIL] To: ${to}`);
        logger.info(`🔗 Link: http://localhost:5173/reset-password/${resetToken}`);
        return true;
    }

    const resetLink = `http://localhost:5173/reset-password/${resetToken}`;

    const mailOptions = {
        from: '"NivelSmart" <noreply@nivelsmart.com>',
        to: to,
        subject: 'Redefinição de Senha - NivelSmart',
        html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Olá,</h2>
                <p>Você solicitou a redefinição de sua senha.</p>
                <p>Clique no link abaixo para criar uma nova senha:</p>
                <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Redefinir Senha</a>
                <p>Ou copie e cole este link no navegador:</p>
                <p>${resetLink}</p>
                <p>Este link expira em 1 hora.</p>
                <br>
                <p>Se você não solicitou isso, ignore este email.</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        logger.info(`📧 Password reset email sent to ${to}`);
        return true;
    } catch (error) {
        logger.error(`❌ Error sending email: ${error.message}`);
        // Don't crash the request logic, just return false
        return false;
    }
};
