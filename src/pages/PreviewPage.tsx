import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { InvoiceForm, Invoice } from '../components/InvoiceForm';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/ui/button';
import { Edit, Printer } from 'lucide-react';

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { invoices } = useApp();

  const fromState = !!(location.state as { invoice?: Invoice })?.invoice;
  const invoice: Invoice | undefined =
    (location.state as { invoice?: Invoice })?.invoice ??
    invoices.find(inv => inv.id === id);

  return (
    <div className="print:bg-transparent">
      <PageHeader
        onBack={() => navigate(-1)}
        printHidden
        actions={
          <>
            {id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/invoice/${id}`, { state: fromState ? { editData: invoice } : undefined })}
              >
                <Edit className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Edit Invoice</span>
              </Button>
            )}
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Print Invoice</span>
            </Button>
          </>
        }
      />
      <InvoiceForm invoice={invoice} isPreview={true} />
    </div>
  );
}
