import nodemailer from "nodemailer";

export async function sendPasswordResetEmail(
  toEmail: string,
  userName: string,
  resetUrl: string
): Promise<{ success: boolean; preview?: string }> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "1025", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "soporte@jabvox.com";

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #1a73e8; margin-bottom: 20px;">Recuperación de contraseña - Jabvox Mail</h2>
      <p>Hola <strong>${userName}</strong>,</p>
      <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Jabvox Mail.</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${resetUrl}" style="background-color: #1a73e8; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
          Restablecer Contraseña
        </a>
      </div>
      <p style="font-size: 13px; color: #5f6368;">
        O copia y pega el siguiente enlace en tu navegador:<br />
        <a href="${resetUrl}" style="color: #1a73e8;">${resetUrl}</a>
      </p>
      <p style="font-size: 12px; color: #9aa0a6; margin-top: 30px;">
        Este enlace es válido durante 1 hora. Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
      </p>
    </div>
  `;

  // If SMTP is configured, attempt sending
  if (host && host !== "localhost" && user) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      await transporter.sendMail({
        from,
        to: toEmail,
        subject: "Restablece tu contraseña - Jabvox Mail",
        html: htmlContent,
      });

      return { success: true };
    } catch (err) {
      console.warn("SMTP send failed, logging reset URL locally:", err);
    }
  }

  // Development fallback: Log the reset link directly in server console
  console.log("=================================================");
  console.log(`[PASSWORD RESET EMAIL] to: ${toEmail}`);
  console.log(`Reset link: ${resetUrl}`);
  console.log("=================================================");

  return { success: true, preview: resetUrl };
}
