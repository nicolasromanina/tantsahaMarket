import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Lock, User, Phone, ArrowLeft, Leaf, Eye, EyeOff } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Email invalide");
const passwordSchema = z.string().min(6, "Minimum 6 caractères");
const nameSchema = z.string().min(2, "Minimum 2 caractères");
const phoneSchema = z.string().regex(/^\+?[0-9]{9,15}$/, "Numéro invalide");

type AuthMode = "login" | "signup" | "phone" | "otp";

const Auth = () => {
  const navigate = useNavigate();
  const { user, signIn, signUp, signInWithPhone, verifyOtp } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const validateField = (field: string, value: string) => {
    try {
      switch (field) {
        case "email":
          emailSchema.parse(value);
          break;
        case "password":
          passwordSchema.parse(value);
          break;
        case "fullName":
          nameSchema.parse(value);
          break;
        case "phone":
          phoneSchema.parse(value);
          break;
      }
      setErrors((prev) => ({ ...prev, [field]: "" }));
      return true;
    } catch (error: any) {
      setErrors((prev) => ({ ...prev, [field]: error.errors[0].message }));
      return false;
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailValid = validateField("email", email);
    const passwordValid = validateField("password", password);
    
    if (mode === "signup") {
      const nameValid = validateField("fullName", fullName);
      if (!emailValid || !passwordValid || !nameValid) return;
    } else {
      if (!emailValid || !passwordValid) return;
    }

    setLoading(true);
    
    if (mode === "signup") {
      await signUp(email, password, fullName);
    } else {
      await signIn(email, password);
    }
    
    setLoading(false);
  };

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateField("phone", phone)) return;
    
    setLoading(true);
    const { error } = await signInWithPhone(phone);
    setLoading(false);
    
    if (!error) {
      setMode("otp");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      setErrors((prev) => ({ ...prev, otp: "Le code doit avoir 6 chiffres" }));
      return;
    }
    
    setLoading(true);
    await verifyOtp(phone, otp);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-earth flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-glow">
              <Leaf className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Tantsaha<span className="text-primary">Market</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            {mode === "login" && "Connectez-vous à votre compte"}
            {mode === "signup" && "Créez votre compte gratuitement"}
            {mode === "phone" && "Connexion par téléphone"}
            {mode === "otp" && "Entrez le code reçu"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-3xl p-8 shadow-card animate-scale-in">
          {/* Email/Password Auth */}
          {(mode === "login" || mode === "signup") && (
            <form onSubmit={handleEmailAuth} className="space-y-5">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Anarana feno</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Rakoto Jean"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-12 h-12"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-destructive text-sm">{errors.fullName}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12"
                  />
                </div>
                {errors.email && (
                  <p className="text-destructive text-sm">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Teny miafina</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-destructive text-sm">{errors.password}</p>
                )}
              </div>

              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                {loading ? "Mahandrasa..." : mode === "login" ? "Hiditra" : "Hisoratra anarana"}
              </Button>
            </form>
          )}

          {/* Phone Auth */}
          {mode === "phone" && (
            <form onSubmit={handlePhoneAuth} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="phone">Laharana finday</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+261 34 00 000 00"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-12 h-12"
                  />
                </div>
                {errors.phone && (
                  <p className="text-destructive text-sm">{errors.phone}</p>
                )}
              </div>

              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                {loading ? "Mandefa..." : "Handefa code OTP"}
              </Button>
            </form>
          )}

          {/* OTP Verification */}
          {mode === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center mb-4">
                <p className="text-muted-foreground">
                  Code nalefa tamin'ny <span className="font-semibold text-foreground">{phone}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">Code OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-14 text-center text-2xl tracking-[0.5em] font-mono"
                  maxLength={6}
                />
                {errors.otp && (
                  <p className="text-destructive text-sm text-center">{errors.otp}</p>
                )}
              </div>

              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                {loading ? "Manamarina..." : "Hanamarina"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setMode("phone")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Hiverina
              </Button>
            </form>
          )}

          {/* Divider */}
          {(mode === "login" || mode === "signup") && (
            <>
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-sm text-muted-foreground">na</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full gap-2"
                onClick={() => setMode("phone")}
              >
                <Phone className="w-5 h-5" />
                Hiditra amin'ny finday
              </Button>
            </>
          )}

          {/* Toggle Mode */}
          {(mode === "login" || mode === "signup") && (
            <p className="text-center mt-6 text-muted-foreground">
              {mode === "login" ? (
                <>
                  Tsy mbola manana kaonty?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="text-primary font-semibold hover:underline"
                  >
                    Hisoratra anarana
                  </button>
                </>
              ) : (
                <>
                  Efa manana kaonty?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-primary font-semibold hover:underline"
                  >
                    Hiditra
                  </button>
                </>
              )}
            </p>
          )}

          {mode === "phone" && (
            <Button
              type="button"
              variant="ghost"
              className="w-full mt-4"
              onClick={() => setMode("login")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Hiverina amin'ny email
            </Button>
          )}
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Hiverina any amin'ny fandraisana
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
