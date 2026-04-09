import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBasicEmail() {
  const result = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: 'divhanimajokweni@gmail.com',
    subject: 'Hello World',
    html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
  });

  return result;
}