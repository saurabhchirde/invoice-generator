import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

const toInputDate = (d: Date) => d.toISOString().slice(0, 10);
const formatDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const numberToWords = (num: number): string => {
  if (num === 0) return 'Zero Only';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const toWords = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + toWords(n % 100) : '');
    if (n < 100000) return toWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + toWords(n % 1000) : '');
    if (n < 10000000) return toWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + toWords(n % 100000) : '');
    return toWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + toWords(n % 10000000) : '');
  };
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let result = toWords(rupees);
  if (paise > 0) result += ' and ' + toWords(paise) + ' Paise';
  return result + ' Only';
};
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Trash2, Plus, Settings } from 'lucide-react';
import { Switch } from './ui/switch';
import { loadSettings } from '@/types/settings';
import type { Currency } from '@/types/settings';
import { getNextInvoiceNumber } from '@/utils/invoiceNumber';

export interface LineItem {
  id: string;
  description: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export type { Currency };

export interface VisibleFields {
  companyInfo: boolean;
  clientInfo: boolean;
  invoiceNumber: boolean;
  issueDate: boolean;
  dueDate: boolean;
  discount: boolean;
  sgst: boolean;
  cgst: boolean;
  payment: boolean;
  terms: boolean;
  bankDetails: boolean;
  authorizedSignatory: boolean;
  website: boolean;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  dueDate: string;
  billTo: {
    name: string;
    contactName: string;
    contact: string;
    email: string;
    address: string;
  };
  paymentMethod: {
    name: string;
    email: string;
    address: string;
    bankDetails: string;
    contact: string;
  };
  lineItems: LineItem[];
  discount: number;
  sgst: number;
  cgst: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  notes: string;
  paymentInstructions: string;
  paymentLabel: string;
  termsTitle: string;
  currency: Currency;
  visibleFields: VisibleFields;
}

export interface InvoiceFormHandle {
  getFormData: () => Invoice;
}

interface InvoiceFormProps {
  invoice?: Invoice;
  isPreview: boolean;
}

export const InvoiceForm = forwardRef<InvoiceFormHandle, InvoiceFormProps>(
  function InvoiceForm({ invoice, isPreview }, ref) {
    const [formData, setFormData] = useState<Invoice>(() => {
      const s = loadSettings();
      return {
        id: invoice?.id || Date.now().toString(),
        invoiceNo: invoice?.invoiceNo || getNextInvoiceNumber(),
        date: invoice?.date || toInputDate(new Date()),
        dueDate: invoice?.dueDate || toInputDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        billTo: {
          name: invoice?.billTo?.name ?? '',
          contactName: invoice?.billTo?.contactName ?? '',
          contact: invoice?.billTo?.contact ?? '',
          email: invoice?.billTo?.email ?? '',
          address: invoice?.billTo?.address ?? '',
        },
        paymentMethod: invoice?.paymentMethod || {
          name: s.businessName,
          email: s.email,
          address: s.address,
          bankDetails: [
            s.bankName && `Bank Name: ${s.bankName}`,
            s.accountName && `Account Name: ${s.accountName}`,
            s.accountNumber && `Account: ${s.accountNumber}`,
            s.ifscCode && `IFSC: ${s.ifscCode}`,
          ].filter(Boolean).join('\n'),
          contact: s.contact,
        },
        lineItems: invoice?.lineItems || [{ id: '1', description: '', price: 0, quantity: 1, subtotal: 0 }],
        discount: invoice?.discount ?? 0,
        sgst: invoice?.sgst ?? 0,
        cgst: invoice?.cgst ?? 0,
        total: invoice?.total ?? 0,
        paidAmount: invoice?.paidAmount ?? 0,
        dueAmount: invoice?.dueAmount ?? 0,
        notes: invoice?.notes ?? s.terms,
        paymentInstructions: invoice?.paymentInstructions ?? s.paymentInstructions,
        paymentLabel: invoice?.paymentLabel ?? s.paymentLabel,
        termsTitle: invoice?.termsTitle ?? s.termsTitle,
        currency: invoice?.currency ?? s.currency,
        visibleFields: invoice?.visibleFields || {
          companyInfo: true,
          clientInfo: true,
          invoiceNumber: true,
          issueDate: true,
          dueDate: true,
          discount: true,
          sgst: true,
          cgst: true,
          payment: true,
          terms: true,
          bankDetails: true,
          authorizedSignatory: true,
          website: true,
        },
      };
    });

    const getCurrencySymbol = (currency: Currency) => {
      return currency === 'USD' ? '$' : '₹';
    };

    const formatCurrency = (amount: number, currency: Currency) => {
      const symbol = getCurrencySymbol(currency);
      return `${symbol}${amount.toFixed(2)}`;
    };

    const calculateTotals = () => {
      const subtotal = formData.lineItems.reduce((sum, item) => sum + item.subtotal, 0);
      const discountAmount = (subtotal * formData.discount) / 100;
      const afterDiscount = subtotal - discountAmount;
      const sgstAmount = (afterDiscount * formData.sgst) / 100;
      const cgstAmount = (afterDiscount * formData.cgst) / 100;
      const total = afterDiscount + sgstAmount + cgstAmount;
      const dueAmount = total - formData.paidAmount;

      setFormData(prev => ({ ...prev, total, dueAmount }));
    };

    useEffect(() => {
      calculateTotals();
    }, [formData.lineItems, formData.discount, formData.sgst, formData.cgst, formData.paidAmount]);

    const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
      setFormData(prev => ({
        ...prev,
        lineItems: prev.lineItems.map(item => {
          if (item.id === id) {
            const updated = { ...item, [field]: value };
            if (field === 'price' || field === 'quantity') {
              updated.subtotal = updated.price * updated.quantity;
            }
            return updated;
          }
          return item;
        })
      }));
    };

    const addLineItem = () => {
      const newItem: LineItem = {
        id: Date.now().toString(),
        description: '',
        price: 0,
        quantity: 1,
        subtotal: 0
      };
      setFormData(prev => ({
        ...prev,
        lineItems: [...prev.lineItems, newItem]
      }));
    };

    const removeLineItem = (id: string) => {
      setFormData(prev => ({
        ...prev,
        lineItems: prev.lineItems.filter(item => item.id !== id)
      }));
    };

    useImperativeHandle(ref, () => ({ getFormData: () => formData }), [formData]);

    const previewRef = useRef<HTMLDivElement>(null);
    const [pageBreaks, setPageBreaks] = useState<number[]>([]);
    const [pageHeight, setPageHeight] = useState(0);
    const [pageWidthPx, setPageWidthPx] = useState(0);
    const [scale, setScale] = useState(1);
    const savedSettings = React.useMemo(() => loadSettings(), []);

    useEffect(() => {
      if (!isPreview || !previewRef.current) return;

      const calculate = () => {
        if (!previewRef.current) return;
        const w = previewRef.current.offsetWidth;
        const ph = w * (297 / 210);
        const marginPx = w * (14 / 210); // 14mm top/bottom margin per page

        // Content-aware page breaking: measure each child element
        // and break between elements instead of slicing through them
        const children = Array.from(previewRef.current.children) as HTMLElement[];
        const breaks: number[] = [];
        let pageBottom = ph - marginPx; // first page (top margin is built into pt-14mm)

        for (const child of children) {
          const childBottom = child.offsetTop + child.offsetHeight;
          if (childBottom > pageBottom) {
            // This child overflows — break before it
            const breakPoint = child.offsetTop;
            const lastBreak = breaks.length ? breaks[breaks.length - 1] : 0;
            if (breakPoint > lastBreak + 4) {
              breaks.push(breakPoint);
              pageBottom = breakPoint + (ph - 2 * marginPx);
            }
            // If child is taller than usable page, allow it and move on
            if (childBottom > pageBottom) {
              pageBottom = childBottom + marginPx;
            }
          }
        }

        setPageBreaks(breaks);
        setPageHeight(ph);
        setPageWidthPx(w);
        const vw = window.innerWidth;
        const hPad = vw < 640 ? 32 : 64;
        const vPad = 57 + (vw < 640 ? 32 : 64); // sticky header + outer padding
        const scaleByW = (vw - hPad) / w;
        const scaleByH = (window.innerHeight - vPad) / ph;
        setScale(Math.min(1, scaleByW, scaleByH));
      };

      calculate();
      const ro = new ResizeObserver(calculate);
      ro.observe(previewRef.current);
      window.addEventListener('resize', calculate);
      return () => { ro.disconnect(); window.removeEventListener('resize', calculate); };
    }, [isPreview]);

    if (isPreview) {
      const { logo, qrCode, website } = savedSettings;
      const subtotal = formData.lineItems.reduce((s, i) => s + i.subtotal, 0);
      const discountAmt = (subtotal * formData.discount) / 100;
      const afterDiscount = subtotal - discountAmt;
      const sgstAmt = (afterDiscount * formData.sgst) / 100;
      const cgstAmt = (afterDiscount * formData.cgst) / 100;

      // All invoice content — rendered once in the hidden measurement div,
      // and once per visible page card (clipped by overflow:hidden + translateY)
      const pageContent = (
        <>
          {/* ── Header: logo left · company info right ── */}
          <div className="flex items-center justify-between mb-5">
            <div className="shrink-0">
              {logo && <img src={logo} alt="logo" className="h-14 w-auto max-w-[140px] object-contain" />}
            </div>
            {formData.visibleFields.companyInfo && (
              <div className="text-right text-sm leading-6">
                <p className="font-bold text-lg">{formData.paymentMethod.name}</p>
                {formData.paymentMethod.address && <p className="text-gray-700">{formData.paymentMethod.address}</p>}
                {formData.paymentMethod.email && (
                  <p className="text-gray-700">
                    <span className="font-bold">Email:</span> {formData.paymentMethod.email}
                    {formData.paymentMethod.contact && <span className="ml-2"><span className="font-bold ml-1">Phone:</span> {formData.paymentMethod.contact}</span>}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-gray-300 mb-6" />

          {/* ── Bill To + Invoice Meta ── */}
          <div className="flex justify-between gap-8 mb-6">
            {formData.visibleFields.clientInfo && (
              <div className="text-sm leading-6">
                <p className="font-bold">Bill to:</p>
                <p>{formData.billTo.name}</p>
                {formData.billTo.address && <p className="text-gray-600 whitespace-pre-line">{formData.billTo.address}</p>}
                {formData.billTo.email && <p className="text-gray-600">{formData.billTo.email}</p>}
              </div>
            )}
            <div className="text-sm shrink-0">
              <table><tbody>
                <tr><td className="font-bold pr-8 pb-2">Invoice:</td><td className="text-right pb-2">{formData.invoiceNo}</td></tr>
                {formData.visibleFields.issueDate && (
                  <tr><td className="font-bold pr-8 pb-2">Invoice Date:</td><td className="text-right pb-2">{formatDate(formData.date)}</td></tr>
                )}
                {formData.visibleFields.dueDate && formData.dueDate && (
                  <tr><td className="font-bold pr-8 pb-2">Due Date:</td><td className="text-right pb-2">{formatDate(formData.dueDate)}</td></tr>
                )}
                {formData.billTo.contactName && (
                  <tr><td className="font-bold pr-8 pb-2">Contact:</td><td className="text-right pb-2">{formData.billTo.contactName}</td></tr>
                )}
                {formData.billTo.contact && (
                  <tr><td className="font-bold pr-8">Mobile:</td><td className="text-right">{formData.billTo.contact}</td></tr>
                )}
              </tbody></table>
            </div>
          </div>

          {/* ── Line Items Table ── */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-b border-gray-300">
                <th className="text-left font-semibold py-3 pr-4">Description</th>
                <th className="text-center font-semibold py-3 w-20">Quantity</th>
                <th className="text-right font-semibold py-3 w-28">Price</th>
                <th className="text-right font-semibold py-3 w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {formData.lineItems.map((item, _, list) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className={`py-${list.length > 2 ? 3 : 3} pr-4`}>{item.description}</td>
                  <td className={`py-${list.length > 2 ? 3 : 3} text-center text-gray-600`}>{item.quantity}</td>
                  <td className={`py-${list.length > 2 ? 3 : 3} text-right text-gray-600`}>{formatCurrency(item.price, formData.currency)}</td>
                  <td className={`py-${list.length > 2 ? 3 : 3} text-right`}>{formatCurrency(item.subtotal, formData.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── Totals + Terms ── */}
          {(() => {
            const singleItem = formData.lineItems.length <= 1;
            const termsBlock = formData.visibleFields.terms && formData.notes && (
              <div className="text-xs pt-2">
                <p className="font-semibold mb-1">{formData.termsTitle}</p>
                <p className="text-gray-600 leading-5 whitespace-pre-line">{formData.notes}</p>
              </div>
            );
            const totalsBlock = (
              <table className="text-sm w-64 shrink-0">
                <tbody>
                  {formData.visibleFields.discount && formData.discount > 0 && (
                    <tr><td className={`py-${formData.lineItems.length > 2 ? 1.5 : 2} pr-6 text-gray-600`}>Discount {formData.discount}%</td><td className={`py-${formData.lineItems.length > 2 ? 1.5 : 2} text-right`}>-{formatCurrency(discountAmt, formData.currency)}</td></tr>
                  )}
                  <tr><td className={`py-${formData.lineItems.length > 2 ? 1.5 : 2} pr-6 text-gray-600`}>Subtotal without Tax</td><td className={`py-${formData.lineItems.length > 2 ? 1.5 : 2} text-right`}>{formatCurrency(afterDiscount, formData.currency)}</td></tr>
                  {formData.visibleFields.sgst && formData.sgst > 0 && (
                    <tr><td className={`py-${formData.lineItems.length > 2 ? 1.5 : 2} pr-6 text-gray-600`}>SGST {formData.sgst}%</td><td className={`py-${formData.lineItems.length > 2 ? 1.5 : 2} text-right`}>{formatCurrency(sgstAmt, formData.currency)}</td></tr>
                  )}
                  {formData.visibleFields.cgst && formData.cgst > 0 && (
                    <tr><td className={`py-1 pr-6 text-gray-600`}>CGST {formData.cgst}%</td><td className={`py-1 text-right`}>{formatCurrency(cgstAmt, formData.currency)}</td></tr>
                  )}
                  <tr className="border-t border-b border-gray-300">
                    <td className={`py-2 pr-6 font-bold ${formData.paidAmount <= 0 ? 'text-base' : ''}`}>Total</td>
                    <td className={`py-2 text-right font-bold ${formData.paidAmount <= 0 ? 'text-base' : ''}`}>{formatCurrency(formData.total, formData.currency)}</td>
                  </tr>
                  {formData.paidAmount > 0 && (
                    <>
                      <tr><td className="py-1 pr-6 text-gray-600">Amount Paid</td><td className="py-1 text-right">{formatCurrency(formData.paidAmount, formData.currency)}</td></tr>
                      <tr className="border-t border-gray-300">
                        <td className="pt-2 pr-6 font-bold text-base">Amount Due ({formData.currency})</td>
                        <td className="pt-2 text-right font-bold text-base">{formatCurrency(formData.dueAmount, formData.currency)}</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            );

            const totalInWordsBlock = (
              <div className="text-xs text-gray-500 mt-1 w-64 text-right">
                <span className="font-medium text-gray-700">{numberToWords(formData.total)}</span>
              </div>
            );

            return singleItem ? (
              <div className="mt-2 mb-8">
                <div className="flex flex-col items-end">
                  {totalsBlock}
                  {totalInWordsBlock}
                </div>
                {termsBlock && <div className="mt-4">{termsBlock}</div>}
              </div>
            ) : (
              <div className="mt-2 mb-8">
                <div className="flex justify-between gap-8">
                  <div className="flex-1 min-w-0">{termsBlock}</div>
                  <div className="flex flex-col items-end">
                    {totalsBlock}
                    {totalInWordsBlock}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── Payment / Bank Details ── */}
          {formData.visibleFields.payment && (
            <div>
              <div className="border-t border-gray-300 mb-5" />
              {formData.paymentLabel && <p className="font-bold text-gray-800 mb-1">{formData.paymentLabel}</p>}
              <div className="flex items-center justify-between gap-6">
                <div className="text-sm text-gray-600 leading-6 mt-2">
                  {formData.paymentInstructions && <p className="mb-2">{formData.paymentInstructions}</p>}
                  {formData.visibleFields.bankDetails && formData.paymentMethod.bankDetails && (
                    <table className="mt-1 text-sm">
                      <tbody>
                        {formData.paymentMethod.bankDetails.split('\n').filter(Boolean).map((line, idx) => {
                          const labels = ['Bank Name', 'Account Name', 'Account', 'IFSC'];
                          const hasLabel = line.includes(':');
                          const labelText = hasLabel ? line.split(':')[0] : (labels[idx] || '');
                          const value = hasLabel ? line.slice(line.indexOf(':') + 1).trim() : line;
                          return (
                            <tr key={idx}>
                              <td className="font-semibold text-gray-700 pr-6 py-0.5 whitespace-nowrap">{labelText}</td>
                              <td className="text-gray-600 py-0.5">{value}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
                {qrCode && (
                  <div className="shrink-0 flex flex-col items-center gap-2 -mt-4">
                    <img src={qrCode} alt="Payment QR" className="w-28 h-28 object-contain border border-gray-200 rounded p-1" />
                    <p className="text-[10px] text-gray-500 text-center leading-tight">Pay via GPay, PhonePe &amp; more</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </>
      );

      const totalPages = pageBreaks.length + 1;

      return (
        <div className="relative">
          <style>{`
            @page { size: A4; margin: 0; }
            @media print {
              .invoice-measurement { display: none !important; }
              .invoice-outer { background: transparent !important; padding: 0 !important; gap: 0 !important; }
              .invoice-page-wrapper { width: 210mm !important; height: 297mm !important; min-height: 0 !important; }
              .invoice-page { width: 210mm !important; height: 297mm !important; transform: none !important; box-shadow: none !important; break-after: page; }
              .invoice-page:last-child { break-after: auto; }
              .invoice-website { position: fixed; bottom: 14mm; left: 20mm; }
            }
          `}</style>

          {/* Hidden measurement div */}
          <div className="invoice-measurement" style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none', width: '210mm', top: 0, left: 0, zIndex: -1 }} aria-hidden="true">
            <div ref={previewRef} className={`pl-[20mm] pr-[14mm] pt-[14mm] ${formData.visibleFields.authorizedSignatory ? 'pb-[32mm]' : 'pb-[20mm]'}`}>
              {pageContent}
            </div>
          </div>

          {/* Page cards */}
          <div className="invoice-outer bg-gray-200 p-4 sm:p-8 print:bg-white print:p-0 flex flex-col items-center gap-6 print:gap-0 min-h-[calc(100vh-4rem)]">
            {Array.from({ length: totalPages }, (_, i) => {
              const naturalW = pageWidthPx || undefined;
              const naturalH = pageHeight || undefined;
              return (
                <div
                  key={i}
                  className="invoice-page-wrapper"
                  style={{
                    width: naturalW ? naturalW * scale : undefined,
                    height: naturalH ? naturalH * scale : undefined,
                    minHeight: !naturalH ? '297mm' : undefined,
                    flexShrink: 0,
                  }}
                >
                  <div
                    className="invoice-page relative bg-white shadow-sm overflow-hidden"
                    style={{
                      width: naturalW ?? '210mm',
                      height: naturalH ?? '297mm',
                      transform: scale < 1 ? `scale(${scale})` : undefined,
                      transformOrigin: 'top left',
                    }}
                  >
                    {(() => {
                      const marginPx = (pageWidthPx || 0) * (14 / 210);
                      const ph = pageHeight || 0;
                      const translateY = i > 0 ? -(pageBreaks[i - 1] - marginPx) : 0;

                      // Calculate bottom mask height: cover from break point to page bottom
                      let bottomMaskH = marginPx; // default for last page
                      if (i < totalPages - 1 && pageBreaks[i] !== undefined) {
                        // Break point in page coordinates
                        const breakInPage = pageBreaks[i] + translateY;
                        bottomMaskH = Math.max(marginPx, ph - breakInPage);
                      }

                      return (
                        <>
                          <div
                            className={`pl-[20mm] pr-[14mm] pt-[14mm] ${formData.visibleFields.authorizedSignatory ? 'pb-[32mm]' : 'pb-[20mm]'}`}
                            style={translateY ? { transform: `translateY(${translateY}px)` } : undefined}
                          >
                            {pageContent}
                          </div>
                          {/* Bottom margin mask — covers from break point to page edge */}
                          <div className="absolute bottom-0 left-0 right-0 bg-white z-10" style={{ height: bottomMaskH }} />
                          {/* Top margin mask for continuation pages */}
                          {i > 0 && <div className="absolute top-0 left-0 right-0 bg-white z-10" style={{ height: marginPx }} />}
                        </>
                      );
                    })()}
                    {formData.visibleFields.authorizedSignatory && i === totalPages - 1 && (
                      <div className="absolute bottom-[14mm] right-[14mm] text-center text-sm z-20">
                        <div className="w-36 border-t border-gray-400 mb-1 mx-auto" />
                        <p className="text-gray-600">Authorized Signatory</p>
                        <p className="font-semibold text-gray-800">{formData.paymentMethod.name}</p>
                      </div>
                    )}
                    {website && formData.visibleFields.website && i === totalPages - 1 && (
                      <div className="invoice-website absolute bottom-[14mm] left-[20mm] z-20">
                        <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">
                          {website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Currency Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Currency Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    className="w-full h-10 px-3 border border-gray-200 rounded-md"
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value as Currency }))}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
                <div className="text-sm text-gray-500">
                  Selected currency will be applied to all amounts in the invoice.
                </div>
              </CardContent>
            </Card>

            {/* Field Visibility Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Field Visibility
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="companyInfo" className="cursor-pointer">Company Info</Label>
                  <Switch
                    id="companyInfo"
                    checked={formData.visibleFields.companyInfo}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      visibleFields: { ...prev.visibleFields, companyInfo: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="clientInfo" className="cursor-pointer">Client Info</Label>
                  <Switch
                    id="clientInfo"
                    checked={formData.visibleFields.clientInfo}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      visibleFields: { ...prev.visibleFields, clientInfo: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="issueDate" className="cursor-pointer">Issue Date</Label>
                  <Switch
                    id="issueDate"
                    checked={formData.visibleFields.issueDate}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      visibleFields: { ...prev.visibleFields, issueDate: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="payment" className="cursor-pointer">Payment Section</Label>
                  <Switch
                    id="payment"
                    checked={formData.visibleFields.payment}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      visibleFields: { ...prev.visibleFields, payment: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="bankDetails" className="cursor-pointer">Bank Details</Label>
                  <Switch
                    id="bankDetails"
                    checked={formData.visibleFields.bankDetails}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      visibleFields: { ...prev.visibleFields, bankDetails: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="terms" className="cursor-pointer">Terms & Conditions</Label>
                  <Switch
                    id="terms"
                    checked={formData.visibleFields.terms}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      visibleFields: { ...prev.visibleFields, terms: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="authorizedSignatory" className="cursor-pointer">Authorized Signatory</Label>
                  <Switch
                    id="authorizedSignatory"
                    checked={formData.visibleFields.authorizedSignatory}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      visibleFields: { ...prev.visibleFields, authorizedSignatory: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="website" className="cursor-pointer">Website</Label>
                  <Switch
                    id="website"
                    checked={formData.visibleFields.website}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      visibleFields: { ...prev.visibleFields, website: checked }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Invoice Details */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="invoiceNo">Invoice Number</Label>
                    <Input
                      id="invoiceNo"
                      value={formData.invoiceNo}
                      onChange={(e) => setFormData(prev => ({ ...prev, invoiceNo: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Bill To */}
            <Card>
              <CardHeader>
                <CardTitle>Bill To</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={formData.billTo.name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      billTo: { ...prev.billTo, name: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="clientEmail">Email</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={formData.billTo.email}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      billTo: { ...prev.billTo, email: e.target.value }
                    }))}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientContactName">Contact Person</Label>
                    <Input
                      id="clientContactName"
                      value={formData.billTo.contactName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        billTo: { ...prev.billTo, contactName: e.target.value }
                      }))}
                      placeholder="Contact name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientContact">Mobile Number</Label>
                    <Input
                      id="clientContact"
                      type="tel"
                      value={formData.billTo.contact}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        billTo: { ...prev.billTo, contact: e.target.value }
                      }))}
                      placeholder="+91 00000 00000"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="clientAddress">Address</Label>
                  <Textarea
                    id="clientAddress"
                    value={formData.billTo.address}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      billTo: { ...prev.billTo, address: e.target.value }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="paymentName">Your Name</Label>
                  <Input
                    id="paymentName"
                    value={formData.paymentMethod.name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      paymentMethod: { ...prev.paymentMethod, name: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="paymentEmail">Your Email</Label>
                  <Input
                    id="paymentEmail"
                    type="email"
                    value={formData.paymentMethod.email}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      paymentMethod: { ...prev.paymentMethod, email: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="paymentAddress">Address</Label>
                  <Textarea
                    id="paymentAddress"
                    value={formData.paymentMethod.address}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      paymentMethod: { ...prev.paymentMethod, address: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="bankDetails">Bank Details</Label>
                  <Textarea
                    id="bankDetails"
                    value={formData.paymentMethod.bankDetails}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      paymentMethod: { ...prev.paymentMethod, bankDetails: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="contact">Contact</Label>
                  <Input
                    id="contact"
                    value={formData.paymentMethod.contact}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      paymentMethod: { ...prev.paymentMethod, contact: e.target.value }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tax Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Tax & Discount</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="sgst">SGST (%)</Label>
                  <Input
                    id="sgst"
                    type="number"
                    min="0"
                    value={formData.sgst}
                    onChange={(e) => setFormData(prev => ({ ...prev, sgst: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="cgst">CGST (%)</Label>
                  <Input
                    id="cgst"
                    type="number"
                    min="0"
                    value={formData.cgst}
                    onChange={(e) => setFormData(prev => ({ ...prev, cgst: Number(e.target.value) }))}
                  />
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Invoice Items</CardTitle>
                <Button onClick={addLineItem} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formData.lineItems.map((item, index) => (
                  <div key={item.id} className="space-y-3 border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <Label htmlFor={`desc-${item.id}`}>Description</Label>
                        <Input
                          id={`desc-${item.id}`}
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                          placeholder="Item description"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-6 shrink-0"
                        onClick={() => removeLineItem(item.id)}
                        disabled={formData.lineItems.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor={`price-${item.id}`}>Price ({getCurrencySymbol(formData.currency)})</Label>
                        <Input
                          id={`price-${item.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => updateLineItem(item.id, 'price', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`qty-${item.id}`}>Quantity</Label>
                        <Input
                          id={`qty-${item.id}`}
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Subtotal</Label>
                        <div className="h-10 flex items-center font-medium text-sm">
                          {formatCurrency(item.subtotal, formData.currency)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="paymentInstructions">Payment Instructions</Label>
                <Textarea
                  id="paymentInstructions"
                  value={formData.paymentInstructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentInstructions: e.target.value }))}
                  placeholder="Payment can be done using the provided link below (email)"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="paymentLabel">Payment Method Label</Label>
                <Input
                  id="paymentLabel"
                  value={formData.paymentLabel}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentLabel: e.target.value }))}
                  placeholder="e.g., Pay Online, Wire Transfer, etc."
                />
              </div>
            </CardContent>
          </Card>

          {/* Terms and Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="termsTitle">Section Title</Label>
                <Input
                  id="termsTitle"
                  value={formData.termsTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, termsTitle: e.target.value }))}
                  placeholder="e.g., TERMS AND CONDITIONS, NOTES, etc."
                />
              </div>
              <div>
                <Label htmlFor="notes">Terms & Conditions</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes, terms, or payment conditions..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="paidAmount">Paid Amount ({getCurrencySymbol(formData.currency)})</Label>
                <Input
                  id="paidAmount"
                  type="number"
                  min="0"
                  max={formData.total}
                  step="0.01"
                  value={formData.paidAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, paidAmount: Number(e.target.value) }))}
                />
              </div>
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Total Amount:</span>
                  <span>{formatCurrency(formData.total, formData.currency)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span className="font-medium">Paid Amount:</span>
                  <span>{formatCurrency(formData.paidAmount, formData.currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-red-600 border-t pt-2">
                  <span>Due Amount:</span>
                  <span>{formatCurrency(formData.dueAmount, formData.currency)}</span>
                </div>
                <div className="mt-2">
                  <div className="text-sm text-gray-600 mb-1">Payment Progress</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${formData.total > 0 ? Math.min((formData.paidAmount / formData.total) * 100, 100) : 0}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formData.total > 0 ? ((formData.paidAmount / formData.total) * 100).toFixed(1) : '0.0'}% paid
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 w-full sm:max-w-sm sm:ml-auto">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(formData.lineItems.reduce((sum, item) => sum + item.subtotal, 0), formData.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount ({formData.discount}%):</span>
                  <span>-{formatCurrency((formData.lineItems.reduce((sum, item) => sum + item.subtotal, 0) * formData.discount) / 100, formData.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST ({formData.sgst}%):</span>
                  <span>{formatCurrency(((formData.lineItems.reduce((sum, item) => sum + item.subtotal, 0) - (formData.lineItems.reduce((sum, item) => sum + item.subtotal, 0) * formData.discount) / 100) * formData.sgst) / 100, formData.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CGST ({formData.cgst}%):</span>
                  <span>{formatCurrency(((formData.lineItems.reduce((sum, item) => sum + item.subtotal, 0) - (formData.lineItems.reduce((sum, item) => sum + item.subtotal, 0) * formData.discount) / 100) * formData.cgst) / 100, formData.currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(formData.total, formData.currency)}</span>
                </div>
                <div className="flex justify-between text-green-600 mt-2">
                  <span className="font-medium">Paid:</span>
                  <span>{formatCurrency(formData.paidAmount, formData.currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-xl text-red-600 border-t pt-2 mt-2">
                  <span>Due:</span>
                  <span>{formatCurrency(formData.dueAmount, formData.currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  });