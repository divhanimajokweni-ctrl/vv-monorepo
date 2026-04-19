export async function sendResendChat(userId: string, message: string) {
  console.log(`Sending resend chat to ${userId}: ${message}`);
  return { success: true };
}