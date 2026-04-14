import { useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  InvoiceForm,
  InvoiceFormHandle,
  Invoice,
} from "../components/InvoiceForm";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/button";
import { Eye, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function FormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { invoices, saveInvoice } = useApp();
  const formRef = useRef<InvoiceFormHandle>(null);
  const [saving, setSaving] = useState(false);

  const cloneSource = (location.state as { cloneFrom?: Invoice } | null)
    ?.cloneFrom;
  const editData = (location.state as { editData?: Invoice } | null)?.editData;
  const savedInvoice =
    id && id !== "new" ? invoices.find((inv) => inv.id === id) : undefined;
  const invoice = cloneSource
    ? { ...cloneSource, id: Date.now().toString() }
    : (editData ?? savedInvoice);
  const isNew = !id || id === "new";

  const handleSave = async () => {
    setSaving(true);
    try {
      const inv = formRef.current?.getFormData();
      if (!inv) return;
      const result = await saveInvoice(inv);
      toast.success(
        result === "updated" ? "Invoice updated!" : "Invoice created!",
      );
      navigate("/");
    } catch (error) {
      console.error("Failed to save invoice:", error);
      toast.error("Failed to save invoice. Check your connection.");
      setSaving(false);
    }
  };

  const handlePreview = () => {
    const inv = formRef.current?.getFormData();
    if (!inv) return;
    navigate(`/invoice/${inv.id}/preview`, { state: { invoice: inv } });
  };

  return (
    <div className="bg-white min-h-screen">
      <PageHeader
        onBack={() => navigate("/")}
        title={isNew ? "New Invoice" : "Edit Invoice"}
        className="z-20"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              disabled={saving}
            >
              <Eye className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Preview</span>
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
                  <span className="hidden sm:inline">Saving…</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Save Invoice</span>
                </>
              )}
            </Button>
          </>
        }
      />
      <InvoiceForm ref={formRef} invoice={invoice} isPreview={false} />
    </div>
  );
}
