import nodemailer from "nodemailer";

type DeveloperApprovalEmailInput = {
  to: string;
  firstName: string;
  companyName: string;
  registrationUrl: string;
  expiresAt: string | Date;
};

const globalForMailer = global as unknown as {
  appMailer?: nodemailer.Transporter;
};

function getMailer() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 465);
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("Configurația SMTP este incompletă.");
  }

  if (!globalForMailer.appMailer) {
    globalForMailer.appMailer = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  return globalForMailer.appMailer;
}

export async function sendDeveloperApprovalEmail({
  to,
  firstName,
  companyName,
  registrationUrl,
  expiresAt,
}: DeveloperApprovalEmailInput) {
  const transporter = getMailer();

  const from = process.env.MAIL_FROM || process.env.SMTP_USER!;
  const expiresAtText = new Date(expiresAt).toLocaleString("ro-RO");

  await transporter.sendMail({
    from,
    to,
    subject: "Cererea ta de developer a fost aprobată",
    text: [
      `Salut${firstName ? ` ${firstName}` : ""},`,
      ``,
      `Cererea ta pentru acces de developer a fost aprobată.`,
      `Companie: ${companyName}`,
      ``,
      `Pentru a-ți crea contul, accesează linkul de mai jos:`,
      `${registrationUrl}`,
      ``,
      `Linkul expiră la: ${expiresAtText}`,
      ``,
      `Dacă nu ai făcut tu această cerere, poți ignora acest mesaj.`,
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
        <h2 style="margin-bottom: 16px;">Cererea ta de developer a fost aprobată</h2>

        <p>Salut${firstName ? ` <strong>${firstName}</strong>` : ""},</p>

        <p>Cererea ta pentru acces de developer a fost aprobată.</p>

        <p>
          <strong>Companie:</strong> ${companyName}
        </p>

        <p>
          Pentru a-ți crea contul, apasă pe butonul de mai jos:
        </p>

        <p style="margin: 24px 0;">
          <a
            href="${registrationUrl}"
            style="
              background: #2563eb;
              color: white;
              text-decoration: none;
              padding: 12px 18px;
              border-radius: 8px;
              display: inline-block;
            "
          >
            Creează contul de developer
          </a>
        </p>

        <p>
          Sau folosește direct acest link:
        </p>

        <p>
          <a href="${registrationUrl}">${registrationUrl}</a>
        </p>

        <p>
          <strong>Linkul expiră la:</strong> ${expiresAtText}
        </p>

        <p style="color: #666; margin-top: 24px;">
          Dacă nu ai făcut tu această cerere, poți ignora acest mesaj.
        </p>
      </div>
    `,
  });
}
