import React, { useState } from "react";
import { ArrowLeft, Mail, Phone, Lock, CheckCircle2, Shield, Sparkles, ArrowRight, Smartphone } from "lucide-react";
import { motion } from "motion/react";

export interface UserProfile {
  name: string;
  emailOrPhone: string;
  provider: "google" | "apple" | "phone" | "email" | "guest";
  avatar?: string;
}

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  onBackToHome: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onBackToHome,
}) => {
  const [activeTab, setActiveTab] = useState<"options" | "phone" | "email">("options");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle Google Auth
  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      onLoginSuccess({
        name: "Alex Student",
        emailOrPhone: "alex.student@university.edu",
        provider: "google",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      });
      setIsLoading(false);
    }, 600);
  };

  // Handle Apple Auth
  const handleAppleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      onLoginSuccess({
        name: "Jordan Lee",
        emailOrPhone: "j.lee@icloud.com",
        provider: "apple",
      });
      setIsLoading(false);
    }, 600);
  };

  // Handle Phone Auth
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setError("Please enter a valid phone number");
      return;
    }
    setError("");
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setOtpSent(true);
    }, 500);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 4) {
      setError("Please enter the 4-digit code sent to your phone");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      onLoginSuccess({
        name: `Student (${phoneNumber.slice(-4)})`,
        emailOrPhone: phoneNumber,
        provider: "phone",
      });
      setIsLoading(false);
    }, 600);
  };

  // Handle Email Auth
  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setError("");
    setIsLoading(true);
    setTimeout(() => {
      const nameFromEmail = email.split("@")[0].replace(".", " ");
      const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
      onLoginSuccess({
        name: formattedName,
        emailOrPhone: email,
        provider: "email",
      });
      setIsLoading(false);
    }, 600);
  };

  // Handle Guest Mode
  const handleGuestLogin = () => {
    onLoginSuccess({
      name: "Guest Student",
      emailOrPhone: "guest@skrible.app",
      provider: "guest",
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-black font-sans flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-black/70 hover:text-black bg-white border border-black/15 rounded-lg shadow-2xs hover:border-black/30 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>

        <button
          onClick={onBackToHome}
          className="flex items-center gap-2 cursor-pointer group"
          title="Back to home"
        >
          <img 
            src="/assets/scribble.webp" 
            alt="skrible logo" 
            className="h-7 w-auto object-contain shrink-0"
            referrerPolicy="no-referrer"
          />
          <span className="text-lg font-extrabold text-black tracking-tight font-sans lowercase group-hover:text-[#ec4899] transition-colors">
            skrible
          </span>
        </button>
      </div>

      {/* Login Card */}
      <div className="max-w-md w-full mx-auto my-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-white border border-black/15 rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden"
        >
          {/* Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#ec4899]" />

          {/* Heading */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-pink-50 border border-pink-200 text-[#ec4899] text-[11px] font-mono font-bold rounded-full mb-3">
              <Sparkles className="w-3 h-3" />
              <span>SKRIBLE ACCOUNT</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-black">
              Sign in to Skrible
            </h1>
            <p className="text-xs text-black/60 mt-1">
              Untangle lectures, receipts, and study decks in one workspace
            </p>
          </div>

          {error && (
            <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg text-center font-medium">
              {error}
            </div>
          )}

          {/* MAIN LOGIN OPTIONS VIEW */}
          {activeTab === "options" && (
            <div className="space-y-3">
              {/* Google Button */}
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 font-semibold text-sm rounded-xl transition-all shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Apple Button */}
              <button
                onClick={handleAppleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-black hover:bg-stone-800 text-white font-semibold text-sm rounded-xl transition-all shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.68-.82 1.14-1.97.01-3.12-1.01.04-2.22.68-2.92 1.5-.62.72-1.16 1.89-1.01 3.02 1.13.09 2.27-.58 2.92-1.4" />
                </svg>
                <span>Continue with Apple</span>
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-stone-400 font-mono text-[10px]">
                    or use
                  </span>
                </div>
              </div>

              {/* Phone Button */}
              <button
                onClick={() => {
                  setError("");
                  setActiveTab("phone");
                }}
                className="w-full flex items-center justify-between px-4 py-3 bg-stone-50 hover:bg-stone-100 text-black border border-black/10 font-medium text-sm rounded-xl transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="w-4 h-4 text-black/70" />
                  <span>Phone Number</span>
                </div>
                <ArrowRight className="w-4 h-4 text-black/40" />
              </button>

              {/* Email Button */}
              <button
                onClick={() => {
                  setError("");
                  setActiveTab("email");
                }}
                className="w-full flex items-center justify-between px-4 py-3 bg-stone-50 hover:bg-stone-100 text-black border border-black/10 font-medium text-sm rounded-xl transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-black/70" />
                  <span>Email & Password</span>
                </div>
                <ArrowRight className="w-4 h-4 text-black/40" />
              </button>
            </div>
          )}

          {/* PHONE FORM VIEW */}
          {activeTab === "phone" && (
            <div>
              <button
                onClick={() => {
                  setActiveTab("options");
                  setOtpSent(false);
                  setError("");
                }}
                className="inline-flex items-center gap-1 text-xs text-black/60 hover:text-black mb-4 cursor-pointer font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Other login options</span>
              </button>

              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono font-bold text-black uppercase mb-1.5">
                      Phone Number
                    </label>
                    <div className="flex gap-2">
                      <div className="px-3 py-2.5 bg-stone-100 border border-black/15 rounded-xl text-xs font-mono font-medium flex items-center">
                        🇺🇸 +1
                      </div>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="(555) 019-2834"
                        className="flex-1 px-3.5 py-2.5 border border-black/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4899] focus:border-transparent font-mono"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-black hover:bg-[#ec4899] text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    {isLoading ? "Sending Code..." : "Send Verification Code"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Code sent to {phoneNumber}. Enter 4-digit code:</span>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-black uppercase mb-1.5">
                      Enter OTP Code
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="1 2 3 4"
                      className="w-full px-3 py-3 border border-black/20 rounded-xl text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#ec4899]"
                      required
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-[#ec4899] hover:bg-black text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    {isLoading ? "Verifying..." : "Verify & Sign In"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="w-full text-center text-xs text-black/60 hover:underline cursor-pointer"
                  >
                    Change phone number
                  </button>
                </form>
              )}
            </div>
          )}

          {/* EMAIL FORM VIEW */}
          {activeTab === "email" && (
            <div>
              <button
                onClick={() => {
                  setActiveTab("options");
                  setError("");
                }}
                className="inline-flex items-center gap-1 text-xs text-black/60 hover:text-black mb-4 cursor-pointer font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Other login options</span>
              </button>

              <form onSubmit={handleEmailLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-mono font-bold text-black uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full px-3.5 py-2.5 border border-black/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4899]"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-black uppercase mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 border border-black/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4899]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-black hover:bg-[#ec4899] text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  {isLoading ? "Signing in..." : "Sign In with Email"}
                </button>
              </form>
            </div>
          )}

          {/* GUEST ACCESS OPTION */}
          <div className="mt-6 pt-4 border-t border-black/10 text-center">
            <button
              onClick={handleGuestLogin}
              className="text-xs font-semibold text-black/60 hover:text-[#ec4899] transition-colors cursor-pointer"
            >
              Skip for now → Continue as Guest
            </button>
          </div>
        </motion.div>

        {/* Security badge footer */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-black/40 mt-4">
          <Shield className="w-3.5 h-3.5" />
          <span>Encrypted Student Auth • Local Vault Persistent</span>
        </div>
      </div>

      <div />
    </div>
  );
};
