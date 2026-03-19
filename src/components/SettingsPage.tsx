import { useRef, useState } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { BusinessSettings } from '@/types/settings';
import { Upload, X, Loader2 } from 'lucide-react';

interface SettingsPageProps {
  settings: BusinessSettings;
  onUpdate: (patch: Partial<BusinessSettings>) => void;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export function SettingsPage({ settings, onUpdate: update }: SettingsPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);
  const [logoLoading, setLogoLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      update({ logo: reader.result as string });
      setLogoLoading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      update({ qrCode: reader.result as string });
      setQrLoading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Business Info */}
        <Card className="flex flex-col gap-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Business Information</CardTitle>
            <p className="text-sm text-gray-500">Shown on every invoice you generate.</p>
          </CardHeader>
          <CardContent className="space-y-5 pt-4 flex-1">

            <Field label="Company Logo" hint="Keep under 500 KB for best performance.">
              {logoLoading ? (
                <div className="flex items-center justify-center gap-2 w-full h-24 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 bg-gray-50">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading…
                </div>
              ) : settings.logo ? (
                <div className="flex flex-col items-center gap-3 border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <img
                    src={settings.logo}
                    alt="Company logo"
                    className="h-14 w-auto max-w-[160px] object-contain"
                  />
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="w-3.5 h-3.5 mr-1.5" /> Change
                    </Button>
                    <Button
                      type="button" variant="outline" size="sm"
                      onClick={() => update({ logo: '' })}
                      className="text-red-500 hover:text-red-600 hover:border-red-200"
                    >
                      <X className="w-3.5 h-3.5 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 w-full h-24 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span>Upload logo <span className="text-gray-400">(PNG, JPG, SVG)</span></span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp" className="hidden" onChange={handleLogoUpload} />
            </Field>

            <Field label="Business Name">
              <Input
                value={settings.businessName}
                onChange={e => update({ businessName: e.target.value })}
                placeholder="Your Business Name"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Email">
                <Input
                  type="email"
                  value={settings.email}
                  onChange={e => update({ email: e.target.value })}
                  placeholder="you@example.com"
                />
              </Field>
              <Field label="Phone">
                <Input
                  value={settings.contact}
                  onChange={e => update({ contact: e.target.value })}
                  placeholder="+1 000 000 0000"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Website">
                <Input
                  value={settings.website}
                  onChange={e => update({ website: e.target.value })}
                  placeholder="www.yoursite.com"
                />
              </Field>
              <Field label="Currency">
                <select
                  className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm bg-white"
                  value={settings.currency}
                  onChange={e => update({ currency: e.target.value as BusinessSettings['currency'] })}
                >
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </Field>
            </div>

            <Field label="Address">
              <Textarea
                value={settings.address}
                onChange={e => update({ address: e.target.value })}
                placeholder="Street, City, Country"
                rows={2}
              />
            </Field>

          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card className="flex flex-col gap-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Payment Details</CardTitle>
            <p className="text-sm text-gray-500">Bank account, instructions and QR shown on invoices.</p>
          </CardHeader>
          <CardContent className="space-y-5 pt-4 flex-1">
            <Field label="Bank Name">
              <Input
                value={settings.bankName}
                onChange={e => update({ bankName: e.target.value })}
                placeholder="e.g. HDFC Bank"
              />
            </Field>
            <Field label="Account Number">
              <Input
                value={settings.accountNumber}
                onChange={e => update({ accountNumber: e.target.value })}
                placeholder="e.g. 1234567890"
              />
            </Field>
            <Field label="IFSC / SWIFT / Routing Code">
              <Input
                value={settings.ifscCode}
                onChange={e => update({ ifscCode: e.target.value })}
                placeholder="e.g. HDFC0001234"
              />
            </Field>

            <div className="border-t border-gray-100 pt-5 space-y-5">

            <Field label="Instructions">
              <Textarea
                value={settings.paymentInstructions}
                onChange={e => update({ paymentInstructions: e.target.value })}
                placeholder="e.g. Payment can be made via bank transfer or the link below."
                rows={3}
              />
            </Field>

            <Field label="Payment Method Label">
              <Input
                value={settings.paymentLabel}
                onChange={e => update({ paymentLabel: e.target.value })}
                placeholder="e.g. Pay Online, Wire Transfer…"
              />
            </Field>

            <Field label="Payment QR Code" hint="UPI / GPay / PhonePe QR — shown on every invoice.">
              {qrLoading ? (
                <div className="flex items-center justify-center gap-2 w-full h-24 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 bg-gray-50">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading…
                </div>
              ) : settings.qrCode ? (
                <div className="flex flex-col items-center gap-3 border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <img
                    src={settings.qrCode}
                    alt="Payment QR code"
                    className="h-24 w-24 object-contain"
                  />
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => qrInputRef.current?.click()}>
                      <Upload className="w-3.5 h-3.5 mr-1.5" /> Change
                    </Button>
                    <Button
                      type="button" variant="outline" size="sm"
                      onClick={() => update({ qrCode: '' })}
                      className="text-red-500 hover:text-red-600 hover:border-red-200"
                    >
                      <X className="w-3.5 h-3.5 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => qrInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 w-full h-24 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span>Upload QR code <span className="text-gray-400">(PNG, JPG)</span></span>
                </button>
              )}
              <input ref={qrInputRef} type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" onChange={handleQrUpload} />
            </Field>

            </div>
          </CardContent>
        </Card>

        {/* Terms & Conditions */}
        <Card className="flex flex-col gap-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Terms &amp; Conditions</CardTitle>
            <p className="text-sm text-gray-500">Printed at the bottom of every invoice.</p>
          </CardHeader>
          <CardContent className="space-y-5 pt-4 flex-1">

            <Field label="Section Title">
              <Input
                value={settings.termsTitle}
                onChange={e => update({ termsTitle: e.target.value })}
                placeholder="TERMS AND CONDITIONS"
              />
            </Field>

            <Field label="Terms Text">
              <Textarea
                value={settings.terms}
                onChange={e => update({ terms: e.target.value })}
                placeholder="e.g. Payment is due within 30 days of invoice date. Late payments incur a 2% monthly fee."
                rows={6}
              />
            </Field>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
