import { useState, useEffect, useCallback } from "react";
import { invalidateSettingsCache } from "@/hooks/use-store-settings";
import { invalidateSEOCache } from "@/components/SEOHead";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Bell, CreditCard, Heart, Shield, Store, Save, Eye, EyeOff, Plus, Trash2, RefreshCw, Mail, SendHorizonal, CheckCircle2, XCircle, MessageCircle, Send, Globe } from "lucide-react";

const API = "/api";

interface StoreSettings {
  storeName: string;
  contactEmail: string;
  phone: string;
  address: string;
  notificationEmail: string;
  notifyOnOrder: string;
  notifyOnAdoption: string;
  notifyOnDonation: string;
  stripePublishableKey: string;
  stripeSecretKey: string;
  paystackPublicKey: string;
  paystackSecretKey: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  smtpFromName: string;
  smtpFromEmail: string;
  checkoutMethod: string;
  whatsappNumber: string;
  telegramUsername: string;
  donationMethod: string;
  paypalLink: string;
  gofundmeLink: string;
  donationWhatsappNumber: string;
  donationStripeEnabled: string;
  donationWhatsappEnabled: string;
  donationPaypalEnabled: string;
  donationGofundmeEnabled: string;
  donationTelegramEnabled: string;
  donationTelegramUsername: string;
  donationCryptoEnabled: string;
  donationCryptoAddress: string;
  donationCryptoNetwork: string;
  donationCryptoCoin: string;
  seoMetaTitle: string;
  seoMetaDescription: string;
  seoKeywords: string;
  seoOgTitle: string;
  seoOgDescription: string;
  seoOgImage: string;
  seoCanonicalUrl: string;
  seoTwitterCard: string;
}

const DEFAULTS: StoreSettings = {
  storeName: "EuthList",
  contactEmail: "hello@euthlist.com",
  phone: "+1 800 000 0000",
  address: "Global",
  notificationEmail: "admin@euthlist.com",
  notifyOnOrder: "true",
  notifyOnAdoption: "true",
  notifyOnDonation: "true",
  stripePublishableKey: "",
  stripeSecretKey: "",
  paystackPublicKey: "",
  paystackSecretKey: "",
  smtpHost: "",
  smtpPort: "587",
  smtpUser: "",
  smtpPassword: "",
  smtpFromName: "EuthList",
  smtpFromEmail: "",
  checkoutMethod: "stripe",
  whatsappNumber: "",
  telegramUsername: "",
  donationMethod: "stripe",
  paypalLink: "",
  gofundmeLink: "",
  donationWhatsappNumber: "",
  donationStripeEnabled: "false",
  donationWhatsappEnabled: "false",
  donationPaypalEnabled: "false",
  donationGofundmeEnabled: "false",
  donationTelegramEnabled: "false",
  donationTelegramUsername: "",
  donationCryptoEnabled: "false",
  donationCryptoAddress: "",
  donationCryptoNetwork: "Bitcoin",
  donationCryptoCoin: "BTC",
  seoMetaTitle: "",
  seoMetaDescription: "",
  seoKeywords: "",
  seoOgTitle: "",
  seoOgDescription: "",
  seoOgImage: "",
  seoCanonicalUrl: "https://euthlist.com",
  seoTwitterCard: "summary_large_image",
};

async function fetchSettings(): Promise<StoreSettings> {
  const res = await fetch(`${API}/settings`);
  if (!res.ok) throw new Error("Failed to load settings");
  const data = await res.json();
  return { ...DEFAULTS, ...data };
}

async function saveSettingsApi(updates: Partial<StoreSettings>): Promise<void> {
  const res = await fetch(`${API}/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to save settings");
}

export default function AdminSettings() {
  const { currentAdmin, admins, updateAdmin, deleteAdmin } = useAdminAuth();
  const { toast } = useToast();

  const [settings, setSettings] = useState<StoreSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const [showPwd, setShowPwd] = useState(false);
  const [showStripeSecret, setShowStripeSecret] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdError, setPwdError] = useState("");

  const [stripeStatus, setStripeStatus] = useState<{ connected: boolean; source: string } | null>(null);
  const [smtpStatus, setSmtpStatus] = useState<{ configured: boolean; source: string; host: string; user: string } | null>(null);

  const [testEmailTo, setTestEmailTo] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [testError, setTestError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchSettings();
      if (data.checkoutMethod === "whatsapp" || data.checkoutMethod === "telegram") {
        data.checkoutMethod = "messaging";
      }
      setSettings(data);
    } catch {
      toast({ title: "Could not load settings", description: "Using defaults.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStripeStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API}/settings/stripe-status`);
      if (res.ok) {
        const data = await res.json();
        setStripeStatus(data.stripe);
      }
    } catch {}
  }, []);

  const loadSmtpStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API}/settings/smtp-status`);
      if (res.ok) {
        const data = await res.json();
        setSmtpStatus(data.smtp ?? data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    load();
    loadStripeStatus();
    loadSmtpStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (section: string, updates: Partial<StoreSettings>) => {
    setSaving(section);
    try {
      await saveSettingsApi(updates);
      invalidateSettingsCache();
      invalidateSEOCache();
      toast({ title: "Settings saved", description: "Your changes have been applied." });
      if (section === "stripe") {
        await loadStripeStatus();
        setSettings(s => ({
          ...s,
          stripeSecretKey: updates.stripeSecretKey ? "••••••••" : s.stripeSecretKey,
        }));
      }
      if (section === "smtp") {
        await loadSmtpStatus();
        setSettings(s => ({
          ...s,
          smtpPassword: updates.smtpPassword ? "••••••••" : s.smtpPassword,
        }));
      }
    } catch {
      toast({ title: "Save failed", description: "Please check your connection and try again.", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailTo) return;
    setSendingTest(true);
    setTestResult(null);
    setTestError("");
    try {
      const res = await fetch(`${API}/settings/test-smtp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmailTo }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult("success");
        toast({ title: "Test email sent!", description: `Check the inbox for ${testEmailTo}.` });
      } else {
        setTestResult("error");
        setTestError(data.error || "Failed to send test email.");
        toast({ title: "Test failed", description: data.error || "Failed to send test email.", variant: "destructive" });
      }
    } catch {
      setTestResult("error");
      setTestError("Network error. Please try again.");
    } finally {
      setSendingTest(false);
    }
  };

  const handleChangePassword = async () => {
    setPwdError("");
    if (!currentAdmin) return;
    if (currentPwd !== currentAdmin.password) {
      setPwdError("Current password is incorrect.");
      return;
    }
    if (newPwd.length < 8) {
      setPwdError("New password must be at least 8 characters.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError("New passwords do not match.");
      return;
    }
    const result = updateAdmin(currentAdmin.id, { password: newPwd });
    if (result.success) {
      toast({ title: "Password changed", description: "Your password has been updated." });
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } else {
      setPwdError(result.error ?? "Failed to update password.");
    }
  };

  const handleDeleteAdmin = (id: string, email: string) => {
    if (!confirm(`Remove ${email} from admin accounts?`)) return;
    const result = deleteAdmin(id);
    if (result.success) {
      toast({ title: "Admin removed", description: `${email} has been removed.` });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading settings…
        </div>
      </AdminLayout>
    );
  }

  const stripeConnected = stripeStatus?.connected;
  const stripeSource = stripeStatus?.source;

  return (
    <AdminLayout>
      <div className="p-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your store, payments, email, and account</p>
        </div>

        <div className="space-y-8">

          {/* Store Information */}
          <section className="bg-background border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Store className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Store Information</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Store Name</label>
                <Input
                  value={settings.storeName}
                  onChange={e => setSettings(s => ({ ...s, storeName: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Contact Email</label>
                <Input
                  type="email"
                  value={settings.contactEmail}
                  onChange={e => setSettings(s => ({ ...s, contactEmail: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Phone</label>
                <Input
                  value={settings.phone}
                  onChange={e => setSettings(s => ({ ...s, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Address</label>
                <Input
                  value={settings.address}
                  onChange={e => setSettings(s => ({ ...s, address: e.target.value }))}
                />
              </div>
            </div>
            <Button
              onClick={() => save("store", { storeName: settings.storeName, contactEmail: settings.contactEmail, phone: settings.phone, address: settings.address })}
              disabled={saving === "store"}
              className="mt-5 gap-2"
            >
              {saving === "store" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
          </section>

          {/* Email Notifications */}
          <section className="bg-background border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Notification Preferences</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Notification Email</label>
                <Input
                  type="email"
                  value={settings.notificationEmail}
                  onChange={e => setSettings(s => ({ ...s, notificationEmail: e.target.value }))}
                  placeholder="alerts@euthlist.com"
                />
                <p className="text-xs text-muted-foreground">Email address that receives store notification alerts.</p>
              </div>
              <div className="space-y-3 pt-2">
                {([
                  { key: "notifyOnOrder" as const, label: "New order placed", desc: "Get notified when a customer completes checkout" },
                  { key: "notifyOnAdoption" as const, label: "Adoption inquiry", desc: "Get notified when someone submits an adoption request" },
                  { key: "notifyOnDonation" as const, label: "Donation received", desc: "Get notified when a donation is made" },
                ] as const).map(({ key, label, desc }) => (
                  <label key={key} className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[key] === "true"}
                      onChange={e => setSettings(s => ({ ...s, [key]: String(e.target.checked) }))}
                      className="mt-1 w-4 h-4 rounded accent-primary"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <Button
              onClick={() => save("notifications", {
                notificationEmail: settings.notificationEmail,
                notifyOnOrder: settings.notifyOnOrder,
                notifyOnAdoption: settings.notifyOnAdoption,
                notifyOnDonation: settings.notifyOnDonation,
              })}
              disabled={saving === "notifications"}
              className="mt-5 gap-2"
            >
              {saving === "notifications" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Notifications
            </Button>
          </section>

          {/* SMTP Email Settings */}
          <section className="bg-background border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">SMTP Email Settings</h2>
              </div>
              {smtpStatus !== null && (
                smtpStatus.configured ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Configured
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                    <XCircle className="w-3.5 h-3.5" />
                    Not configured
                  </span>
                )
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">SMTP Host</label>
                <Input
                  value={settings.smtpHost}
                  onChange={e => setSettings(s => ({ ...s, smtpHost: e.target.value }))}
                  placeholder="smtp.mail.me.com"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Port</label>
                <Input
                  value={settings.smtpPort}
                  onChange={e => setSettings(s => ({ ...s, smtpPort: e.target.value }))}
                  placeholder="587"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">587 (TLS) or 465 (SSL)</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Username / Email</label>
                <Input
                  value={settings.smtpUser}
                  onChange={e => setSettings(s => ({ ...s, smtpUser: e.target.value }))}
                  placeholder="you@example.com"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Input
                    type={showSmtpPassword ? "text" : "password"}
                    value={settings.smtpPassword}
                    onChange={e => setSettings(s => ({ ...s, smtpPassword: e.target.value }))}
                    placeholder="App-specific password"
                    className="font-mono text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSmtpPassword(v => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground"
                  >
                    {showSmtpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">iCloud users: use an app-specific password from appleid.apple.com</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">From Name</label>
                <Input
                  value={settings.smtpFromName}
                  onChange={e => setSettings(s => ({ ...s, smtpFromName: e.target.value }))}
                  placeholder="EuthList"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">From Email</label>
                <Input
                  type="email"
                  value={settings.smtpFromEmail}
                  onChange={e => setSettings(s => ({ ...s, smtpFromEmail: e.target.value }))}
                  placeholder="noreply@example.com"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-5">
              <Button
                onClick={() => save("smtp", {
                  smtpHost: settings.smtpHost,
                  smtpPort: settings.smtpPort,
                  smtpUser: settings.smtpUser,
                  smtpPassword: settings.smtpPassword.startsWith("••") ? undefined : settings.smtpPassword,
                  smtpFromName: settings.smtpFromName,
                  smtpFromEmail: settings.smtpFromEmail,
                })}
                disabled={saving === "smtp"}
                className="gap-2"
              >
                {saving === "smtp" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save SMTP Settings
              </Button>
            </div>

            {/* Test email */}
            <div className="mt-6 pt-5 border-t border-border">
              <p className="text-sm font-medium text-foreground mb-3">Send a test email</p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="recipient@example.com"
                  value={testEmailTo}
                  onChange={e => { setTestEmailTo(e.target.value); setTestResult(null); }}
                  className="max-w-xs"
                />
                <Button
                  variant="outline"
                  onClick={handleSendTestEmail}
                  disabled={sendingTest || !testEmailTo}
                  className="gap-2 shrink-0"
                >
                  {sendingTest
                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> Sending…</>
                    : <><SendHorizonal className="w-4 h-4" /> Send Test</>
                  }
                </Button>
              </div>
              {testResult === "success" && (
                <p className="mt-2 text-sm text-green-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Test email sent successfully!
                </p>
              )}
              {testResult === "error" && (
                <p className="mt-2 text-sm text-destructive flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" /> {testError}
                </p>
              )}
            </div>
          </section>

          {/* Checkout Method */}
          <section className="bg-background border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Checkout Method</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Choose how customers pay. Stripe processes card payments automatically. Messaging mode lets customers choose between WhatsApp <em>and</em> Telegram — both buttons appear on checkout.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {/* Stripe */}
              <button
                type="button"
                onClick={() => setSettings(s => ({ ...s, checkoutMethod: "stripe" }))}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  settings.checkoutMethod === "stripe"
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-[#635BFF]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[#635BFF] font-bold text-base">S</span>
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">Stripe Card Payment</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Online card checkout — automatic</p>
                  {settings.checkoutMethod === "stripe" && (
                    <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Active
                    </span>
                  )}
                </div>
              </button>
              {/* Messaging */}
              <button
                type="button"
                onClick={() => setSettings(s => ({ ...s, checkoutMethod: "messaging" }))}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  settings.checkoutMethod === "messaging"
                    ? "border-[#25D366] bg-gradient-to-br from-[#25D366]/8 to-[#229ED9]/8 shadow-sm"
                    : "border-border hover:border-[#25D366]/40"
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#25D366]/20 to-[#229ED9]/20 flex items-center justify-center shrink-0 mt-0.5 gap-0.5">
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <Send className="w-3.5 h-3.5 text-[#229ED9]" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">WhatsApp + Telegram</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Customers pick WhatsApp or Telegram</p>
                  {settings.checkoutMethod === "messaging" && (
                    <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-[#25D366]/15 text-[#25D366]">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Active
                    </span>
                  )}
                </div>
              </button>
            </div>

            {settings.checkoutMethod === "messaging" && (
              <div className="space-y-4 mb-5 p-4 bg-muted/30 rounded-xl border border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact Details</p>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" /> WhatsApp Business Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#25D366] font-bold text-sm select-none">+</span>
                    <Input
                      value={settings.whatsappNumber}
                      onChange={e => setSettings(s => ({ ...s, whatsappNumber: e.target.value }))}
                      placeholder="447700900000"
                      className="pl-7 font-mono text-sm"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Digits only with country code (e.g. 447700900000)</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-[#229ED9]" /> Telegram Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#229ED9] font-bold text-sm select-none">@</span>
                    <Input
                      value={settings.telegramUsername}
                      onChange={e => setSettings(s => ({ ...s, telegramUsername: e.target.value.replace(/^@/, "") }))}
                      placeholder="euthlist_store"
                      className="pl-7 font-mono text-sm"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Without the @ sign. Leave blank to hide Telegram button.</p>
                </div>
              </div>
            )}

            <Button
              onClick={() => save("checkoutMethod", {
                checkoutMethod: settings.checkoutMethod,
                whatsappNumber: settings.whatsappNumber,
                telegramUsername: settings.telegramUsername,
              })}
              disabled={saving === "checkoutMethod"}
              className="gap-2"
            >
              {saving === "checkoutMethod" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Checkout Method
            </Button>
          </section>

          {/* Donation Methods */}
          <section className="bg-background border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-semibold text-foreground">Donation Methods</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Toggle each method on or off and set the credentials. Multiple methods can be active at once — all enabled methods will appear on the Donate page.
            </p>

            <div className="space-y-4">

              {/* ── Stripe ── */}
              <div className={`rounded-xl border-2 transition-all ${settings.donationStripeEnabled === "true" ? "border-[#635BFF] bg-[#635BFF]/5" : "border-border"}`}>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#635BFF]/10 flex items-center justify-center shrink-0">
                      <span className="text-[#635BFF] font-extrabold text-lg">S</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">Stripe</p>
                      <p className="text-xs text-muted-foreground">Accept card payments securely via Stripe</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings(s => ({ ...s, donationStripeEnabled: s.donationStripeEnabled === "true" ? "false" : "true" }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings.donationStripeEnabled === "true" ? "bg-[#635BFF]" : "bg-muted-foreground/30"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${settings.donationStripeEnabled === "true" ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                {settings.donationStripeEnabled === "true" && (
                  <div className="px-4 pb-4 border-t border-[#635BFF]/20 pt-3">
                    <p className="text-xs text-muted-foreground">
                      Stripe will use the publishable &amp; secret keys configured in <strong>Payment Settings</strong> below. Donors are redirected to a secure Stripe checkout page.
                    </p>
                  </div>
                )}
              </div>

              {/* ── WhatsApp ── */}
              <div className={`rounded-xl border-2 transition-all ${settings.donationWhatsappEnabled === "true" ? "border-[#25D366] bg-[#25D366]/5" : "border-border"}`}>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#25D366]/15 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5 text-[#25D366]" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">WhatsApp</p>
                      <p className="text-xs text-muted-foreground">Donors send their pledge via WhatsApp</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings(s => ({ ...s, donationWhatsappEnabled: s.donationWhatsappEnabled === "true" ? "false" : "true" }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings.donationWhatsappEnabled === "true" ? "bg-[#25D366]" : "bg-muted-foreground/30"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${settings.donationWhatsappEnabled === "true" ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                {settings.donationWhatsappEnabled === "true" && (
                  <div className="px-4 pb-4 space-y-1.5 border-t border-[#25D366]/20 pt-3">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">WhatsApp Number (with country code)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#25D366] font-bold text-sm select-none">+</span>
                      <Input
                        value={settings.donationWhatsappNumber}
                        onChange={e => setSettings(s => ({ ...s, donationWhatsappNumber: e.target.value }))}
                        placeholder="447700900000"
                        className="pl-7 font-mono text-sm"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Digits only, no spaces or dashes. Example: 447700900000</p>
                  </div>
                )}
              </div>

              {/* ── PayPal ── */}
              <div className={`rounded-xl border-2 transition-all ${settings.donationPaypalEnabled === "true" ? "border-[#003087] bg-[#003087]/5" : "border-border"}`}>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#003087]/10 flex items-center justify-center shrink-0">
                      <span className="font-extrabold text-sm"><span className="text-[#009cde]">Pay</span><span className="text-[#003087]">Pal</span></span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">PayPal</p>
                      <p className="text-xs text-muted-foreground">Link to your PayPal donation page</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings(s => ({ ...s, donationPaypalEnabled: s.donationPaypalEnabled === "true" ? "false" : "true" }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings.donationPaypalEnabled === "true" ? "bg-[#003087]" : "bg-muted-foreground/30"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${settings.donationPaypalEnabled === "true" ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                {settings.donationPaypalEnabled === "true" && (
                  <div className="px-4 pb-4 space-y-1.5 border-t border-[#003087]/20 pt-3">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">PayPal Donation Link</label>
                    <Input
                      value={settings.paypalLink}
                      onChange={e => setSettings(s => ({ ...s, paypalLink: e.target.value }))}
                      placeholder="https://www.paypal.com/donate?hosted_button_id=..."
                      className="font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground">Paste your PayPal.me or Donate button link here.</p>
                  </div>
                )}
              </div>

              {/* ── GoFundMe ── */}
              <div className={`rounded-xl border-2 transition-all ${settings.donationGofundmeEnabled === "true" ? "border-[#02a95c] bg-[#02a95c]/5" : "border-border"}`}>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#02a95c]/10 flex items-center justify-center shrink-0">
                      <span className="font-extrabold text-xs text-[#02a95c]">GFM</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">GoFundMe</p>
                      <p className="text-xs text-muted-foreground">Link to your GoFundMe campaign</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings(s => ({ ...s, donationGofundmeEnabled: s.donationGofundmeEnabled === "true" ? "false" : "true" }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings.donationGofundmeEnabled === "true" ? "bg-[#02a95c]" : "bg-muted-foreground/30"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${settings.donationGofundmeEnabled === "true" ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                {settings.donationGofundmeEnabled === "true" && (
                  <div className="px-4 pb-4 space-y-1.5 border-t border-[#02a95c]/20 pt-3">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">GoFundMe Campaign Link</label>
                    <Input
                      value={settings.gofundmeLink}
                      onChange={e => setSettings(s => ({ ...s, gofundmeLink: e.target.value }))}
                      placeholder="https://www.gofundme.com/f/your-campaign"
                      className="font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground">Paste your GoFundMe campaign URL here.</p>
                  </div>
                )}
              </div>

              {/* ── Telegram ── */}
              <div className={`rounded-xl border-2 transition-all ${settings.donationTelegramEnabled === "true" ? "border-[#229ED9] bg-[#229ED9]/5" : "border-border"}`}>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#229ED9]/10 flex items-center justify-center shrink-0">
                      <Send className="w-5 h-5 text-[#229ED9]" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">Telegram</p>
                      <p className="text-xs text-muted-foreground">Donors message you on Telegram</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings(s => ({ ...s, donationTelegramEnabled: s.donationTelegramEnabled === "true" ? "false" : "true" }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings.donationTelegramEnabled === "true" ? "bg-[#229ED9]" : "bg-muted-foreground/30"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${settings.donationTelegramEnabled === "true" ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                {settings.donationTelegramEnabled === "true" && (
                  <div className="px-4 pb-4 space-y-1.5 border-t border-[#229ED9]/20 pt-3">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Telegram Username</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#229ED9] font-bold text-sm select-none">@</span>
                      <Input
                        value={settings.donationTelegramUsername.replace(/^@/, "")}
                        onChange={e => setSettings(s => ({ ...s, donationTelegramUsername: e.target.value.replace(/^@/, "") }))}
                        placeholder="euthlist"
                        className="pl-7 font-mono text-sm"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Without the @ symbol. Donors will be linked to t.me/username.</p>
                  </div>
                )}
              </div>

              {/* ── Crypto ── */}
              <div className={`rounded-xl border-2 transition-all ${settings.donationCryptoEnabled === "true" ? "border-amber-500 bg-amber-500/5" : "border-border"}`}>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <span className="text-amber-600 font-extrabold text-sm">₿</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">Crypto</p>
                      <p className="text-xs text-muted-foreground">Accept Bitcoin, ETH, USDT, etc.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings(s => ({ ...s, donationCryptoEnabled: s.donationCryptoEnabled === "true" ? "false" : "true" }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings.donationCryptoEnabled === "true" ? "bg-amber-500" : "bg-muted-foreground/30"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${settings.donationCryptoEnabled === "true" ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                {settings.donationCryptoEnabled === "true" && (
                  <div className="px-4 pb-4 space-y-3 border-t border-amber-500/20 pt-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Coin / Token</label>
                        <select
                          value={settings.donationCryptoCoin}
                          onChange={e => {
                            const coin = e.target.value;
                            const network = coin === "BTC" ? "Bitcoin" : coin === "ETH" ? "Ethereum" : coin === "USDT" ? "USDT TRC-20" : coin === "USDC" ? "Ethereum" : coin === "SOL" ? "Solana" : coin === "BNB" ? "BNB Smart Chain" : "Other";
                            setSettings(s => ({ ...s, donationCryptoCoin: coin, donationCryptoNetwork: network }));
                          }}
                          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm font-mono"
                        >
                          <option value="BTC">BTC — Bitcoin</option>
                          <option value="ETH">ETH — Ethereum</option>
                          <option value="USDT">USDT — Tether TRC-20</option>
                          <option value="USDC">USDC — USD Coin</option>
                          <option value="SOL">SOL — Solana</option>
                          <option value="BNB">BNB — BNB Chain</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Network</label>
                        <Input
                          value={settings.donationCryptoNetwork}
                          onChange={e => setSettings(s => ({ ...s, donationCryptoNetwork: e.target.value }))}
                          placeholder="Bitcoin"
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Wallet Address</label>
                      <Input
                        value={settings.donationCryptoAddress}
                        onChange={e => setSettings(s => ({ ...s, donationCryptoAddress: e.target.value }))}
                        placeholder="1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2"
                        className="font-mono text-xs"
                      />
                      <p className="text-xs text-muted-foreground">Double-check this address — crypto donations cannot be reversed.</p>
                    </div>
                  </div>
                )}
              </div>

            </div>

            <div className="mt-5">
              <Button
                onClick={() => save("donationMethods", {
                  donationStripeEnabled: settings.donationStripeEnabled,
                  donationWhatsappEnabled: settings.donationWhatsappEnabled,
                  donationWhatsappNumber: settings.donationWhatsappNumber,
                  donationPaypalEnabled: settings.donationPaypalEnabled,
                  paypalLink: settings.paypalLink,
                  donationGofundmeEnabled: settings.donationGofundmeEnabled,
                  gofundmeLink: settings.gofundmeLink,
                  donationTelegramEnabled: settings.donationTelegramEnabled,
                  donationTelegramUsername: settings.donationTelegramUsername,
                  donationCryptoEnabled: settings.donationCryptoEnabled,
                  donationCryptoAddress: settings.donationCryptoAddress,
                  donationCryptoNetwork: settings.donationCryptoNetwork,
                  donationCryptoCoin: settings.donationCryptoCoin,
                })}
                disabled={saving === "donationMethods"}
                className="gap-2"
              >
                {saving === "donationMethods" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Donation Methods
              </Button>
            </div>
          </section>

          {/* Payment Settings */}
          <section className="bg-background border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <CreditCard className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Payment Settings</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#635BFF]/10 rounded-md flex items-center justify-center">
                    <span className="text-[#635BFF] font-bold text-sm">S</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Stripe</p>
                    <p className="text-xs text-muted-foreground">International card payments (USD, EUR, GBP)</p>
                  </div>
                </div>
                {stripeConnected ? (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400">
                    {stripeSource === "custom" ? "Custom keys" : "Replit connected"}
                  </span>
                ) : (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                    Not connected
                  </span>
                )}
              </div>

              <div className="pl-11 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Publishable Key</label>
                  <Input
                    value={settings.stripePublishableKey}
                    onChange={e => setSettings(s => ({ ...s, stripePublishableKey: e.target.value }))}
                    placeholder="pk_test_… or pk_live_…"
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Secret Key</label>
                  <div className="relative">
                    <Input
                      type={showStripeSecret ? "text" : "password"}
                      value={settings.stripeSecretKey}
                      onChange={e => setSettings(s => ({ ...s, stripeSecretKey: e.target.value }))}
                      placeholder="sk_test_… or sk_live_…"
                      className="font-mono text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStripeSecret(v => !v)}
                      className="absolute inset-y-0 right-3 flex items-center text-muted-foreground"
                    >
                      {showStripeSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Custom keys override the Replit-connected integration. Leave blank to use the Replit connector.
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => save("stripe", {
                stripePublishableKey: settings.stripePublishableKey,
                stripeSecretKey: settings.stripeSecretKey,
              })}
              className="mt-5 gap-2"
            >
              {saving === "stripe" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Payment Keys
            </Button>
          </section>

          {/* SEO Settings */}
          <section className="bg-background border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">SEO Settings</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Control how your site appears in Google, Bing, and social media previews. Leave blank to use the built-in defaults.
            </p>
            <div className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Site / Page Title</label>
                  <Input
                    value={settings.seoMetaTitle}
                    onChange={e => setSettings(s => ({ ...s, seoMetaTitle: e.target.value }))}
                    placeholder="EuthList — Urgent Pet Rescue"
                  />
                  <p className="text-xs text-muted-foreground">{settings.seoMetaTitle.length}/60 chars (keep under 60)</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Canonical URL</label>
                  <Input
                    value={settings.seoCanonicalUrl}
                    onChange={e => setSettings(s => ({ ...s, seoCanonicalUrl: e.target.value }))}
                    placeholder="https://euthlist.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Meta Description</label>
                <textarea
                  value={settings.seoMetaDescription}
                  onChange={e => setSettings(s => ({ ...s, seoMetaDescription: e.target.value }))}
                  placeholder="EuthList helps rescue pets from euthanasia. Adopt a dog or cat, shop pet supplies, and donate to animal rescue operations worldwide."
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
                <p className="text-xs text-muted-foreground">{settings.seoMetaDescription.length}/160 chars (keep under 160)</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Keywords</label>
                <Input
                  value={settings.seoKeywords}
                  onChange={e => setSettings(s => ({ ...s, seoKeywords: e.target.value }))}
                  placeholder="pet rescue, adopt a dog, animal rescue, euthanasia list, donate pet rescue"
                />
                <p className="text-xs text-muted-foreground">Comma-separated keywords. Focus on 5–10 highly relevant terms.</p>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-sm font-semibold text-foreground mb-3">Social Media (Open Graph)</p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">OG / Social Title</label>
                    <Input
                      value={settings.seoOgTitle}
                      onChange={e => setSettings(s => ({ ...s, seoOgTitle: e.target.value }))}
                      placeholder="Leave blank to use Site Title above"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">OG / Social Description</label>
                    <textarea
                      value={settings.seoOgDescription}
                      onChange={e => setSettings(s => ({ ...s, seoOgDescription: e.target.value }))}
                      placeholder="Leave blank to use Meta Description above"
                      rows={2}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">OG Image URL</label>
                    <Input
                      value={settings.seoOgImage}
                      onChange={e => setSettings(s => ({ ...s, seoOgImage: e.target.value }))}
                      placeholder="https://euthlist.com/og-image.jpg (1200×630px)"
                    />
                    <p className="text-xs text-muted-foreground">Recommended: 1200×630 px. Use a hosted image URL (e.g. Cloudinary, Postimages).</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Twitter Card Type</label>
                    <select
                      value={settings.seoTwitterCard}
                      onChange={e => setSettings(s => ({ ...s, seoTwitterCard: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="summary_large_image">Summary with Large Image (recommended)</option>
                      <option value="summary">Summary (small image)</option>
                    </select>
                  </div>
                </div>
              </div>

              {settings.seoMetaTitle || settings.seoMetaDescription || settings.seoKeywords ? (
                <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Google Preview</p>
                  <p className="text-blue-600 font-medium text-base leading-tight truncate">
                    {settings.seoMetaTitle || "EuthList — Urgent Pet Rescue | euthlist.com"}
                  </p>
                  <p className="text-green-700 text-xs mt-0.5">{settings.seoCanonicalUrl || "https://euthlist.com"}</p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {settings.seoMetaDescription || "EuthList helps rescue pets from euthanasia. Adopt a dog or cat, shop pet supplies, and donate to animal rescue operations worldwide."}
                  </p>
                </div>
              ) : null}
            </div>

            <Button
              onClick={() => save("seo", {
                seoMetaTitle: settings.seoMetaTitle,
                seoMetaDescription: settings.seoMetaDescription,
                seoKeywords: settings.seoKeywords,
                seoOgTitle: settings.seoOgTitle,
                seoOgDescription: settings.seoOgDescription,
                seoOgImage: settings.seoOgImage,
                seoCanonicalUrl: settings.seoCanonicalUrl,
                seoTwitterCard: settings.seoTwitterCard,
              })}
              disabled={saving === "seo"}
              className="mt-5 gap-2"
            >
              {saving === "seo" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save SEO Settings
            </Button>
          </section>

          {/* Security / Password */}
          <section className="bg-background border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Security</h2>
            </div>
            <div className="space-y-4 max-w-sm">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Current Password</label>
                <div className="relative">
                  <Input
                    type={showPwd ? "text" : "password"}
                    value={currentPwd}
                    onChange={e => setCurrentPwd(e.target.value)}
                    placeholder="Enter current password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">New Password</label>
                <Input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="At least 8 characters" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Confirm New Password</label>
                <Input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Repeat new password" />
              </div>
              {pwdError && <p className="text-sm text-destructive">{pwdError}</p>}
              <Button onClick={handleChangePassword} variant="outline" className="gap-2">
                <Shield className="w-4 h-4" /> Change Password
              </Button>
            </div>
          </section>

          {/* Admin Users */}
          {currentAdmin?.role === "super" && (
            <section className="bg-background border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Admin Users</h2>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => window.location.href = "/admin/signup"}
                >
                  <Plus className="w-4 h-4" /> Add Admin
                </Button>
              </div>
              <div className="space-y-3">
                {admins.map(admin => (
                  <div key={admin.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-foreground">{admin.name}</p>
                      <p className="text-xs text-muted-foreground">{admin.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${admin.role === "super" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {admin.role === "super" ? "Super Admin" : "Admin"}
                      </span>
                      {admin.id !== currentAdmin?.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </AdminLayout>
  );
}
