import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "./firebase";
import type { StorageAdapter } from "./storageAdapter";
import type { Invoice } from "../components/InvoiceForm";
import type { BusinessSettings } from "../types/settings";
import { DEFAULT_SETTINGS } from "../types/settings";

export class FirestoreAdapter implements StorageAdapter {
  private uid: string;

  constructor(uid: string) {
    this.uid = uid;
  }

  async upsertUserProfile(profile: {
    displayName: string | null;
    email: string | null;
  }): Promise<void> {
    const userRef = doc(firestore!, `users/${this.uid}`);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      // Update mutable fields only; preserve original createdAt
      await setDoc(
        userRef,
        {
          displayName: profile.displayName,
          email: profile.email,
          lastLoginAt: serverTimestamp(),
        },
        { merge: true },
      );
    } else {
      await setDoc(userRef, {
        displayName: profile.displayName,
        email: profile.email,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
    }
  }

  private invoicesCol() {
    return collection(firestore!, `users/${this.uid}/invoices`);
  }

  private settingsDoc() {
    return doc(firestore!, `users/${this.uid}/settings/default`);
  }

  async loadInvoices(): Promise<Invoice[]> {
    const snap = await getDocs(this.invoicesCol());
    return snap.docs.map((d) => d.data() as Invoice);
  }

  async saveInvoice(invoice: Invoice): Promise<"created" | "updated"> {
    const ref = doc(this.invoicesCol(), invoice.id);
    const existing = await getDoc(ref);
    await setDoc(ref, invoice);
    return existing.exists() ? "updated" : "created";
  }

  async deleteInvoice(id: string): Promise<void> {
    await deleteDoc(doc(this.invoicesCol(), id));
  }

  async loadSettings(): Promise<BusinessSettings> {
    const snap = await getDoc(this.settingsDoc());
    if (snap.exists()) {
      return {
        ...DEFAULT_SETTINGS,
        ...(snap.data() as Partial<BusinessSettings>),
      };
    }
    return { ...DEFAULT_SETTINGS };
  }

  async persistSettings(settings: BusinessSettings): Promise<void> {
    // Warn if settings document may exceed Firestore's 1 MiB limit (base64 images can be large)
    if (JSON.stringify(settings).length > 900_000) {
      console.warn(
        "Invoice Generator: Settings document is large (>900 KB). " +
          "Consider using smaller logo/QR code images to avoid Firestore upload failures.",
      );
    }
    await setDoc(this.settingsDoc(), settings);
  }
}
