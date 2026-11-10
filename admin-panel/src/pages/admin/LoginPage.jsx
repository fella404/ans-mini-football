import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FullPageSpinner from "@/components/ui/FullPageSpinner";
import { useAuthStore } from "@/stores/useAuthStore";

const validateEmail = (value) => {
  if (!value.trim()) return "Masukkan email.";
  if (!/^\S+@\S+\.\S+$/.test(value.trim())) return "Format email belum benar.";
  return "";
};

const validatePassword = (value) => (value ? "" : "Masukkan kata sandi.");

const FieldError = ({ id, children }) => (
  <p
    id={id}
    role="alert"
    className="min-h-[1lh] text-xs leading-snug text-destructive"
  >
    {children}
  </p>
);

const LoginPage = () => {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const login = useAuthStore((s) => s.login);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "", form: "" });
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  if (user) return <Navigate to="/" replace />;
  if (status === "idle" || status === "loading") return <FullPageSpinner />;

  const loading = status === "authenticating";

  const handleEmailChange = (event) => {
    const value = event.target.value;
    setEmail(value);
    setErrors((prev) => ({
      ...prev,
      email: prev.email ? validateEmail(value) : "",
      form: "",
    }));
  };

  const handlePasswordChange = (event) => {
    const value = event.target.value;
    setPassword(value);
    setErrors((prev) => ({
      ...prev,
      password: prev.password ? validatePassword(value) : "",
      form: "",
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const next = {
      email: validateEmail(email),
      password: validatePassword(password),
      form: "",
    };
    setErrors(next);

    if (next.email) {
      emailRef.current?.focus();
      return;
    }
    if (next.password) {
      passwordRef.current?.focus();
      return;
    }

    try {
      await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        form:
          error.response?.status === 401
            ? "Email atau kata sandi salah."
            : (error.response?.data?.message ??
              "Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi."),
      }));
      emailRef.current?.focus();
    }
  };

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-5 py-10">
      <div className="w-full max-w-sm">
        <section
          aria-labelledby="login-title"
          className="border border-border bg-card p-6 sm:p-8"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground text-center">
            Panel Admin
          </p>

          <img
            src="/admin/logo-ans.png"
            alt="ANS Mini Football"
            className="mx-auto mt-6 block size-24 object-contain"
          />

          <h1
            id="login-title"
            className="mt-4 font-heading text-2xl font-bold uppercase leading-tight tracking-tight text-balance text-center"
          >
            Masuk ke akun
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground text-center">
            Kelola pesanan dan jadwal lapangan.
          </p>

          <hr className="my-6 border-t border-border" />

          <form noValidate onSubmit={handleSubmit} className="grid gap-5">
            <div className="grid gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <Label
                  htmlFor="email"
                  className="text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground"
                >
                  Email
                </Label>
                <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Wajib
                </span>
              </div>
              <Input
                id="email"
                ref={emailRef}
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck="false"
                required
                disabled={loading}
                aria-required="true"
                aria-invalid={Boolean(errors.email) || undefined}
                aria-describedby={errors.email ? "email-error" : undefined}
                placeholder="nama@email.com"
                value={email}
                onChange={handleEmailChange}
                onBlur={() =>
                  setErrors((prev) => ({
                    ...prev,
                    email: validateEmail(email),
                  }))
                }
                className="h-10 text-sm md:text-sm"
              />
              <FieldError id="email-error">{errors.email}</FieldError>
            </div>

            <div className="grid gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <Label
                  htmlFor="password"
                  className="text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground"
                >
                  Kata sandi
                </Label>
                <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Wajib
                </span>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  ref={passwordRef}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  aria-required="true"
                  aria-invalid={Boolean(errors.password) || undefined}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() =>
                    setErrors((prev) => ({
                      ...prev,
                      password: validatePassword(password),
                    }))
                  }
                  className="h-10 pr-11 text-sm md:text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowPassword((value) => !value)}
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? "Sembunyikan kata sandi"
                      : "Tampilkan kata sandi"
                  }
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 my-auto mr-1 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" />
                  ) : (
                    <Eye aria-hidden="true" />
                  )}
                </Button>
              </div>
              <FieldError id="password-error">{errors.password}</FieldError>
            </div>

            {errors.form && (
              <div
                role="alert"
                className="flex items-start gap-2 border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs leading-snug text-destructive"
              >
                <TriangleAlert
                  aria-hidden="true"
                  className="mt-px size-3.5 shrink-0"
                />
                <p>{errors.form}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="h-10 w-full text-xs font-semibold uppercase tracking-[0.14em]"
            >
              {loading && (
                <span
                  aria-hidden="true"
                  className="size-3.5 animate-spin border-2 border-primary-foreground/30 border-t-primary-foreground motion-reduce:animate-none"
                />
              )}
              {loading ? "Memproses…" : "Masuk"}
            </Button>
          </form>
        </section>

        <p className="mt-4 text-center text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          ANS Mini Football
        </p>
      </div>
    </main>
  );
};

export default LoginPage;
