import { useState } from "react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PawPrint, Mail, Lock } from "lucide-react";

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const success = login(email, password);
    if (success) {
      setLocation("/admin");
    } else {
      setError("Incorrect email or password. Please try again.");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl border border-border shadow-lg p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <PawPrint className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Admin Access</h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            Sign in to manage EuthList
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Enter your email"
              className="h-11"
              data-testid="input-admin-email"
              autoFocus
              autoComplete="email"
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
              placeholder="Enter your password"
              className="h-11"
              data-testid="input-admin-password"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive font-medium" data-testid="text-login-error">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full h-11"
            disabled={isLoading || !email || !password}
            data-testid="button-admin-login"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

      </div>
    </div>
  );
}
