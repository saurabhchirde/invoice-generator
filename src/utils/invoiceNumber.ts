import type { Invoice } from "../components/InvoiceForm";
import type { BusinessSettings } from "../types/settings";

/**
 * Replaces {YYYY} in the prefix with the current year.
 * e.g. "INV-{YYYY}-" → "INV-2026-"
 */
function resolvePrefix(raw: string): string {
  return raw.replace(/\{YYYY\}/gi, String(new Date().getFullYear()));
}

/**
 * Generates the next invoice number based on settings and existing invoices.
 * Supports prefixes with year placeholders: e.g. "INV-{YYYY}-"
 * Extracts the trailing number from existing invoices to determine the next.
 */
export function getNextInvoiceNumber(
  invoices: Invoice[],
  settings: Pick<BusinessSettings, "invoicePrefix" | "invoiceStartNumber">,
): string {
  const prefix = resolvePrefix(settings.invoicePrefix || "#");
  const startNum = settings.invoiceStartNumber || 1;

  let maxNum = 0;
  for (const inv of invoices) {
    const no: string = inv.invoiceNo || "";
    // Extract the last sequence of digits from the invoice number
    const matches = no.match(/(\d+)/g);
    if (matches) {
      const lastNum = parseInt(matches[matches.length - 1], 10);
      maxNum = Math.max(maxNum, lastNum);
    }
  }

  const nextNum = maxNum >= startNum ? maxNum + 1 : startNum;
  return `${prefix}${nextNum}`;
}
