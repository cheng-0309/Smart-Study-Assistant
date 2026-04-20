import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { BookOpenText, UserPlus, Spinner, WarningCircle } from "@phosphor-icons/react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

function formatError(detail) {
  if (!detail) return "Something went wrong.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => e?.msg || JSON.stringify(e)).join(" ");
  return String(detail);
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError("Email and password required"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    setError("");
    try {
      await register(email.trim(), password, name.trim());
      navigate("/");
    } catch (err) {
      setError(formatError(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" data-testid="register-page">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
              <BookOpenText weight="bold" className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight gradient-text" style={{ fontFamily: "var(--font-heading)" }}>StudyForge</span>
          </div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>Create account</h1>
          <p className="text-sm text-muted-foreground mt-1">Start your study journey</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4" data-testid="register-form">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input data-testid="register-name" id="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input data-testid="register-email" id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input data-testid="register-password" id="password" type="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-lg h-11" />
          </div>
          {error && (
            <div data-testid="register-error" className="flex items-center gap-2 text-destructive text-sm p-2.5 bg-destructive/5 border border-destructive/20 rounded-lg">
              <WarningCircle weight="bold" className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          <Button data-testid="register-submit" type="submit" disabled={loading} className="w-full rounded-lg h-11 gradient-btn">
            {loading ? <Spinner className="w-4 h-4 animate-spin" /> : <><UserPlus weight="bold" className="w-4 h-4 mr-2" /> Create Account</>}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account? <Link to="/login" className="text-[hsl(var(--primary))] font-medium hover:underline" data-testid="login-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
