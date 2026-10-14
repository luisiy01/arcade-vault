import { Resend } from "resend";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, msg } = body;

  if (!name || !email || !msg) {
    return Response.json(
      { error: "Todos los campos son requeridos." },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "El servicio de correo no está configurado." },
      { status: 500 }
    );
  }

  const resend = new Resend(apiKey);

  try {
    await resend.emails.send({
      from: "Arcade Vault <onboarding@resend.dev>",
      to: "luisnunez91@gmail.com",
      subject: `Mensaje de contacto de ${name}`,
      text: `Nombre: ${name}\nCorreo: ${email}\n\nMensaje:\n${msg}`,
    });

    return Response.json({ success: true });
  } catch {
    return Response.json(
      { error: "No se pudo enviar el mensaje. Intenta de nuevo más tarde." },
      { status: 500 }
    );
  }
}
