import type { Invoice } from "../components/InvoiceForm";
import {
  BusinessSettings,
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
} from "../types/settings";

export interface StorageAdapter {
  loadInvoices(): Promise<Invoice[]>;
  saveInvoice(invoice: Invoice): Promise<"created" | "updated">;
  deleteInvoice(id: string): Promise<void>;
  loadSettings(): Promise<BusinessSettings>;
  persistSettings(settings: BusinessSettings): Promise<void>;
}

export class LocalStorageAdapter implements StorageAdapter {
  async loadInvoices(): Promise<Invoice[]> {
    try {
      return JSON.parse(localStorage.getItem("invoices") || "[]");
    } catch {
      return [];
    }
  }

  async saveInvoice(invoice: Invoice): Promise<"created" | "updated"> {
    const invoices = await this.loadInvoices();
    const idx = invoices.findIndex((i) => i.id === invoice.id);
    if (idx >= 0) {
      invoices[idx] = invoice;
      localStorage.setItem("invoices", JSON.stringify(invoices));
      return "updated";
    }
    invoices.push(invoice);
    localStorage.setItem("invoices", JSON.stringify(invoices));
    return "created";
  }

  async deleteInvoice(id: string): Promise<void> {
    const invoices = await this.loadInvoices();
    localStorage.setItem(
      "invoices",
      JSON.stringify(invoices.filter((i) => i.id !== id)),
    );
  }

  async loadSettings(): Promise<BusinessSettings> {
    return loadSettings();
  }

  async persistSettings(settings: BusinessSettings): Promise<void> {
    saveSettings(settings);
  }
}

// Re-export DEFAULT_SETTINGS for convenience
export { DEFAULT_SETTINGS };
