import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Edit,
  Trash2,
  Eye,
  Plus,
  Settings,
  MoreVertical,
  Phone,
  BarChart2,
  X,
  Copy,
  LogOut,
  Loader2,
} from "lucide-react";
import { Invoice } from "./InvoiceForm";
import { loadSettings } from "@/types/settings";
import { PageHeader } from "./PageHeader";
import { isFirebaseEnabled } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { LoginModal } from "./LoginModal";

type FilterType = "all" | "paid" | "due" | "overdue";

interface InvoiceListProps {
  invoices: Invoice[];
  onEdit: (invoice: Invoice) => void;
  onDelete: (id: string) => void;
  onPreview: (invoice: Invoice) => void;
  onClone: (invoice: Invoice) => void;
  onNew: () => void;
  onSettings: () => void;
}

function InvoiceMenu({
  invoice,
  onPreview,
  onEdit,
  onClone,
  onDelete,
}: {
  invoice: Invoice;
  onPreview: () => void;
  onEdit: () => void;
  onClone: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete();
      setOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)}>
        <MoreVertical className="w-4 h-4" />
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-white border rounded-lg shadow-lg z-20 py-1 overflow-hidden">
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-left"
            onClick={() => {
              setOpen(false);
              onPreview();
            }}
          >
            <Eye className="w-4 h-4 text-gray-500" /> Preview
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-left"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            <Edit className="w-4 h-4 text-gray-500" /> Edit
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-left"
            onClick={() => {
              setOpen(false);
              onClone();
            }}
          >
            <Copy className="w-4 h-4 text-gray-500" /> Clone
          </button>
          <div className="border-t my-1" />
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 text-red-600 text-left disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Deleting…
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" /> Delete
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export function InvoiceList({
  invoices,
  onEdit,
  onDelete,
  onPreview,
  onClone,
  onNew,
  onSettings,
}: InvoiceListProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [statsOpen, setStatsOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const { currency } = loadSettings();
  const { signOut, user, isGuest } = useAuth();
  const statsRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statsRef.current && !statsRef.current.contains(e.target as Node))
        setStatsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const getStatus = (invoice: Invoice): "paid" | "overdue" | "due" => {
    if (invoice.dueAmount <= 0) return "paid";
    const diffDays = Math.ceil(
      (new Date(invoice.dueDate).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24),
    );
    return diffDays < 0 ? "overdue" : "due";
  };

  const formatCurrency = (amount: number) => {
    const symbol = currency === "USD" ? "$" : "₹";
    return `${symbol}${amount.toFixed(2)}`;
  };

  const getStatusBadge = (invoice: Invoice) => {
    const due = new Date(invoice.dueDate);
    const diffDays = Math.ceil(
      (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

    if (invoice.dueAmount <= 0) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300">
          Paid
        </Badge>
      );
    }
    if (diffDays < 0) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else if (diffDays <= 7) {
      return <Badge variant="secondary">Due Soon</Badge>;
    } else {
      return <Badge variant="outline">Active</Badge>;
    }
  };

  const filterPills: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "paid", label: "Paid" },
    { key: "due", label: "Due" },
    { key: "overdue", label: "Overdue" },
  ];

  const stats: {
    key: FilterType;
    label: string;
    count: number;
    amount: number;
    color: string;
    dot: string;
  }[] = [
    {
      key: "all",
      label: "Total",
      count: invoices.length,
      amount: invoices.reduce((s, i) => s + i.total, 0),
      color: "text-gray-700",
      dot: "bg-gray-400",
    },
    {
      key: "paid",
      label: "Paid",
      count: invoices.filter((i) => getStatus(i) === "paid").length,
      amount: invoices
        .filter((i) => getStatus(i) === "paid")
        .reduce((s, i) => s + i.total, 0),
      color: "text-green-600",
      dot: "bg-green-500",
    },
    {
      key: "due",
      label: "Due",
      count: invoices.filter((i) => getStatus(i) === "due").length,
      amount: invoices
        .filter((i) => getStatus(i) === "due")
        .reduce((s, i) => s + i.dueAmount, 0),
      color: "text-orange-500",
      dot: "bg-orange-400",
    },
    {
      key: "overdue",
      label: "Overdue",
      count: invoices.filter((i) => getStatus(i) === "overdue").length,
      amount: invoices
        .filter((i) => getStatus(i) === "overdue")
        .reduce((s, i) => s + i.dueAmount, 0),
      color: "text-red-600",
      dot: "bg-red-500",
    },
  ];

  return (
    <div>
      {/* Sticky: top bar */}
      <PageHeader
        ref={headerRef}
        title="Invoice Management"
        subtitle="Manage all your invoices in one place"
        className="bg-gray-50"
        actions={
          <>
            {isFirebaseEnabled && isGuest && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLoginModalOpen(true)}
                title="Sign in to sync to cloud"
              >
                Sign In
              </Button>
            )}
            {isFirebaseEnabled && user && !isGuest && (
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onSettings}>
              <Settings className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
            <Button size="sm" onClick={onNew}>
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">New Invoice</span>
            </Button>
          </>
        }
      />

      {/* Sticky filter pills bar */}
      {invoices.length > 0 && (
        <div className="sticky z-10" style={{ top: headerHeight }}>
          <div
            className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex gap-1.5 justify-end overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {filterPills.map(({ key, label }) => {
              const count =
                key === "all"
                  ? invoices.length
                  : invoices.filter((i) => getStatus(i) === key).length;
              const active = filter === key;
              return (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    active
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`text-[11px] tabular-nums ${active ? "text-gray-300" : "text-gray-400"}`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Invoice list */}
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4">
        {invoices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium">No invoices yet</h3>
                <p className="text-gray-600">
                  Create your first invoice to get started
                </p>
                <Button onClick={onNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {invoices.filter(
              (inv) => filter === "all" || getStatus(inv) === filter,
            ).length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No {filter} invoices.
              </p>
            ) : null}
            {invoices
              .filter((inv) => filter === "all" || getStatus(inv) === filter)
              .map((invoice) => (
                <Card
                  key={invoice.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onPreview(invoice)}
                >
                  <CardContent className="p-4 sm:p-5">
                    {/* Header row */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="text-base font-semibold truncate">
                          {invoice.invoiceNo}
                        </h3>
                        {getStatusBadge(invoice)}
                      </div>
                      <div
                        className="flex items-center gap-2 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {invoice.billTo.contact && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              (window.location.href = `tel:${invoice.billTo.contact}`)
                            }
                            title={`Call ${invoice.billTo.contact}`}
                          >
                            <Phone className="w-4 h-4" />
                          </Button>
                        )}
                        <InvoiceMenu
                          invoice={invoice}
                          onPreview={() => onPreview(invoice)}
                          onEdit={() => onEdit(invoice)}
                          onClone={() => onClone(invoice)}
                          onDelete={() => onDelete(invoice.id)}
                        />
                      </div>
                    </div>

                    {/* Details grid */}
                    <div className="border-t pt-3 grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-3 text-sm text-gray-600">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                          Business
                        </p>
                        <p className="truncate">{invoice.billTo.name}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                          Date
                        </p>
                        <p>{invoice.date}</p>
                      </div>
                      <div className="min-w-0 hidden md:block">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                          Due Date
                        </p>
                        <p>{invoice.dueDate}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                          Total
                        </p>
                        <p className="font-semibold text-black">
                          {formatCurrency(invoice.total)}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                          Due Amount
                        </p>
                        <p
                          className={`font-semibold ${invoice.dueAmount > 0 ? "text-red-600" : "text-green-600"}`}
                        >
                          {formatCurrency(invoice.dueAmount)}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                          <div
                            className="bg-green-500 h-1 rounded-full transition-all duration-300"
                            style={{
                              width: `${invoice.total > 0 ? Math.min((invoice.paidAmount / invoice.total) * 100, 100) : 0}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {invoice.total > 0
                            ? (
                                (invoice.paidAmount / invoice.total) *
                                100
                              ).toFixed(0)
                            : 0}
                          % paid
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>

      {/* Floating stats button */}
      {invoices.length > 0 && (
        <div ref={statsRef} className="fixed bottom-6 left-6 z-30">
          {/* Stats popup — always mounted, animated with CSS transitions */}
          <div
            className={`mb-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden origin-bottom-left transition-all duration-200 ease-out ${
              statsOpen
                ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                : "opacity-0 scale-95 translate-y-3 pointer-events-none"
            }`}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="text-sm font-semibold text-gray-800">
                Summary
              </span>
              <button
                onClick={() => setStatsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y">
              {stats.map(({ key, label, count, amount, color, dot }, i) => (
                <button
                  key={key}
                  onClick={() => {
                    setFilter(key);
                    setStatsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-all duration-300 hover:bg-gray-50 active:bg-gray-100 ${
                    filter === key ? "bg-gray-50" : ""
                  } ${statsOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}`}
                  style={{
                    transitionDelay: statsOpen ? `${i * 40 + 60}ms` : "0ms",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    <span className="text-sm text-gray-700">{label}</span>
                    <span className="text-xs text-gray-400 tabular-nums">
                      ({count})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold tabular-nums ${color}`}
                    >
                      {formatCurrency(amount)}
                    </span>
                    {filter === key && (
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-900" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* FAB */}
          <button
            onClick={() => setStatsOpen((o) => !o)}
            className={`w-12 h-12 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
              statsOpen
                ? "bg-gray-700 scale-95 shadow-md"
                : "bg-gray-900 hover:bg-gray-700 hover:scale-105 shadow-lg"
            }`}
            title="View Summary"
          >
            <BarChart2
              className={`w-5 h-5 transition-transform duration-200 ${statsOpen ? "rotate-12" : "rotate-0"}`}
            />
          </button>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </div>
  );
}
