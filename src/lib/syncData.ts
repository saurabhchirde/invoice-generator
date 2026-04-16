import {
  doc,
  collection,
  writeBatch,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
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
  userProfile?: { displayName: string | null; email: string | null },
): Promise<void> {
  if (!firestore) throw new Error("Firestore not initialized");

  try {
    const batch = writeBatch(firestore);

    // Upsert user profile document at users/{uid}
    if (userProfile) {
      const userRef = doc(firestore, `users/${uid}`);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        batch.set(
          userRef,
          { displayName: userProfile.displayName, email: userProfile.email },
          { merge: true },
        );
      } else {
        batch.set(userRef, {
          displayName: userProfile.displayName,
          email: userProfile.email,
          createdAt: serverTimestamp(),
        });
      }
    }

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
