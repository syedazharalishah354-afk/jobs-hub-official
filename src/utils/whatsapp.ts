/**
 * Formats a raw phone number into a valid WhatsApp web/app URL with prefilled text.
 */
export function getWhatsAppUrl(rawPhone?: string | null, refNo?: string, jobTitle?: string): string {
  const phone = (rawPhone || '0301-8899771').replace(/\D/g, '');
  let formatted = phone;
  
  if (formatted.startsWith('0')) {
    formatted = '92' + formatted.slice(1);
  } else if (!formatted.startsWith('92') && formatted.length === 10) {
    formatted = '92' + formatted;
  }

  const message = refNo
    ? `Hello JobsHub Support, I need assistance regarding my submitted application (Ref #: ${refNo}${jobTitle ? ` - ${jobTitle}` : ''}).`
    : `Hello JobsHub Support, I need assistance regarding my application.`;

  return `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
}
