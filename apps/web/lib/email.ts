export async function sendEmail(to: string, subject: string, body: string) {
  console.log(`Sending email to ${to}: ${subject}`);
  return { success: true };
}