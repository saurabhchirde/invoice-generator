import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { InvoiceList } from '../components/InvoiceList';
import { Invoice } from '../components/InvoiceForm';
import { toast } from 'sonner';

export default function ListPage() {
  const { invoices, deleteInvoice } = useApp();
  const navigate = useNavigate();

  const handleDelete = (id: string) => {
    deleteInvoice(id);
    toast.success('Invoice deleted.');
  };

  const handleClone = (invoice: Invoice) => {
    navigate('/invoice/new', { state: { cloneFrom: invoice } });
  };

  return (
    <InvoiceList
      invoices={invoices}
      onEdit={(invoice: Invoice) => navigate(`/invoice/${invoice.id}`)}
      onDelete={handleDelete}
      onPreview={(invoice: Invoice) => navigate(`/invoice/${invoice.id}/preview`)}
      onClone={handleClone}
      onNew={() => navigate('/invoice/new')}
      onSettings={() => navigate('/settings')}
    />
  );
}
