import { doc, setDoc, collection, writeBatch } from "firebase/firestore";
import { firestore } from "./firebase";
import type { Invoice } from "../components/InvoiceForm";
import type { BusinessSettings } from "../types/settings";

/**
 * Syncs local storage data (invoices + settings) to Firestore when user logs in.
 * This ensures guest data is preserved after sign-up.
 */
export async function syncLocalDataToFirestore(
  uid: string,
  invoices: Invoice[],
  settings: BusinessSettings,
): Promise<void> {
  if (!firestore) throw new Error("Firestore not initialized");

  try {
    const batch = writeBatch(firestore);

    // Sync all invoices
    const invoicesCol = collection(firestore, `users/${uid}/invoices`);
    for (const invoice of invoices) {
      const invoiceRef = doc(invoicesCol, invoice.id);
      batch.set(invoiceRef, invoice);
    }

    // Sync settings
    const settingsRef = doc(firestore, `users/${uid}/settings/default`);
    batch.set(settingsRef, settings);

    await batch.commit();
    console.log(
      `✓ Synced ${invoices.length} invoices and settings to Firestore`,
    );
  } catch (error) {
    console.error("Failed to sync local data to Firestore:", error);
    throw error;
  }
}
