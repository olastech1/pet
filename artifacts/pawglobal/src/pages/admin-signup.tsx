import { useState } from "react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PawPrint, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function AdminSignup() {
  const { isAuthenticated, createAdmin, login } = useAdminAuth();
  const [, setLocation] = useLocation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const INVITE_CODE = "euthlist-invite";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!isAuthenticated && inviteCode !== INVITE_CODE) {
      setError("Invalid invite code. Please contact your administrator.");
      return;
    }

    setIsLoading(true);
    const result = createAdmin({ email, name, password, role: isAuthenticated ? "admin" : "admin" });
    setIsLoading(false);

    if (!result.success) {
      setError(result.error ?? "Failed to create account.");
      return;
    }

    if (!isAuthenticated) {
      const didLogin = login(email, password);
      if (didLogin) {
        setLocation("/admin");
        return;
      }
    }

    setLocation(isAuthenticated ? "/admin/settings" : "/admin/login");
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl border border-border shadow-lg p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <PawPrint className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Create Admin Account</h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            {isAuthenticated
              ? "Add a new administrator to your team"
              : "Register with your invite code"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-foreground flex items-center gap-2">
              <User className="w-3.5 h-3.5" />
              Full Name
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jane Doe"
              className="h-11"
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" />
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jane@euthlist.com"
              className="h-11"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" />
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="h-11"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm" className="text-sm font-medium text-foreground flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" />
              Confirm Password
            </label>
            <Input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              className="h-11"
              required
            />
          </div>

          {!isAuthenticated && (
            <div className="space-y-2">
              <label htmlFor="invite" className="text-sm font-medium text-foreground flex items-center gap-2">
                <Lock className="w-3.5 h-3.5" />
                Invite Code
              </label>
              <Input
                id="invite"
                type="text"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
                placeholder="Enter invite code"
                className="h-11"
                required
              />
              <p className="text-xs text-muted-foreground">
                Hint: <span className="font-medium">euthlist-invite</span>
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full h-11"
            disabled={isLoading || !name || !email || !password || !confirmPassword}
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/admin/login" className="text-xs text-primary hover:underline flex items-center justify-center gap-1">
            <ArrowLeft className="w-3 h-3" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
