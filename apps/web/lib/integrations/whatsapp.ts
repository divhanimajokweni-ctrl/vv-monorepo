export async function sendWhatsAppMessage(phone: string, message: string) {
  console.log(`Sending WhatsApp to ${phone}: ${message}`);
  return { success: true };
}