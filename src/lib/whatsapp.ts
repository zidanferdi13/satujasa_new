/**
 * The public WhatsApp number, in one place. A20 / A21: the customer writes the payment code in
 * the transfer note, and the WhatsApp path is the fallback when a receipt cannot be uploaded.
 *
 * The number is the one the client confirmed (`6281319535441`). If the CEO rules that
 * `0813-1953-5441` is canonical, this constant changes and every surface follows — nothing else
 * types the digits.
 */
export const WHATSAPP_NUMBER = "6281319535441";

function waUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/** §15 state B: "Konfirmasi lewat WhatsApp" — code, plan and amount are already in the message. */
export function paymentWhatsAppUrl(code: string, planName: string, amount: string): string {
  return waUrl(`Halo, saya sudah transfer untuk paket ${planName} sebesar ${amount} dengan kode ${code}.`);
}

/** §15 state D: "Tanya lewat WhatsApp" about a rejected proof. */
export function rejectionWhatsAppUrl(code: string): string {
  return waUrl(`Halo, bukti transfer saya dengan kode ${code} belum bisa diterima. Mohon dibantu.`);
}
