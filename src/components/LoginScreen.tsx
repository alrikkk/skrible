import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Mail, Phone, Lock, CheckCircle2, Shield, Sparkles, ArrowRight, Smartphone, ChevronDown, Search, UserPlus } from "lucide-react";
import { motion } from "motion/react";
import { ScribbleLogo } from "./ScribbleLogo";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "../context/AuthContext";

export interface UserProfile {
  name: string;
  emailOrPhone: string;
  provider: "google" | "apple" | "phone" | "email" | "guest";
  avatar?: string;
}

interface CountryCodeOption {
  code: string;
  country: string;
  flag: string;
  example: string;
}

const COMMON_COUNTRY_CODES: CountryCodeOption[] = [
  { code: "+1", country: "United States / Canada", flag: "🇺🇸", example: "(555) 019-2834" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧", example: "07700 900123" },
  { code: "+91", country: "India", flag: "🇮🇳", example: "98765 43210" },
  { code: "+61", country: "Australia", flag: "🇦🇺", example: "0412 345 678" },
  { code: "+49", country: "Germany", flag: "🇩🇪", example: "0151 23456789" },
  { code: "+33", country: "France", flag: "🇫🇷", example: "06 12 34 56 78" },
  { code: "+81", country: "Japan", flag: "🇯🇵", example: "090-1234-5678" },
  { code: "+86", country: "China", flag: "🇨🇳", example: "138 0013 8000" },
  { code: "+55", country: "Brazil", flag: "🇧🇷", example: "(11) 98765-4321" },
  { code: "+52", country: "Mexico", flag: "🇲🇽", example: "55 1234 5678" },
  { code: "+34", country: "Spain", flag: "🇪🇸", example: "612 34 56 78" },
  { code: "+39", country: "Italy", flag: "🇮🇹", example: "312 345 6789" },
  { code: "+65", country: "Singapore", flag: "🇸🇬", example: "8123 4567" },
  { code: "+82", country: "South Korea", flag: "🇰🇷", example: "010-1234-5678" },
  { code: "+971", country: "UAE", flag: "🇦🇪", example: "50 123 4567" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦", example: "50 123 4567" },
  { code: "+27", country: "South Africa", flag: "🇿🇦", example: "082 123 4567" },
  { code: "+62", country: "Indonesia", flag: "🇮🇩", example: "0812-3456-7890" },
  { code: "+63", country: "Philippines", flag: "🇵🇭", example: "917 123 4567" },
  { code: "+84", country: "Vietnam", flag: "🇻🇳", example: "091 234 5678" },
  { code: "+20", country: "Egypt", flag: "🇪🇬", example: "0101 234 5678" },
  { code: "+234", country: "Nigeria", flag: "🇳🇬", example: "0803 123 4567" },
  { code: "+54", country: "Argentina", flag: "🇦🇷", example: "9 11 1234-5678" },
  { code: "+56", country: "Chile", flag: "🇨🇱", example: "9 1234 5678" },
  { code: "+64", country: "New Zealand", flag: "🇳🇿", example: "021 123 4567" },
  { code: "+41", country: "Switzerland", flag: "🇨🇭", example: "079 123 45 67" },
  { code: "+31", country: "Netherlands", flag: "🇳🇱", example: "06 12345678" },
  { code: "+46", country: "Sweden", flag: "🇸🇪", example: "070 123 45 67" },
  { code: "+47", country: "Norway", flag: "🇳🇴", example: "412 34 567" },
  { code: "+45", country: "Denmark", flag: "🇩🇰", example: "20 12 34 56" },
];

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  onBackToHome: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onBackToHome,
  isDark = false,
  onToggleTheme,
}) => {
  const {
    loginWithGoogle,
    loginWithEmail,
    signUpWithEmail,
    loginWithPhoneLocal,
    loginAsGuest,
    isSupabaseConfigured,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<"options" | "phone" | "email">("options");
  const [emailMode, setEmailMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Rate limit cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    };
    if (isCountryDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCountryDropdownOpen]);

  // Find country matching typed country code
  const formattedCode = countryCode.trim().startsWith("+")
    ? countryCode.trim()
    : "+" + countryCode.trim();

  const matchedCountry =
    COMMON_COUNTRY_CODES.find((c) => c.code === countryCode.trim()) ||
    COMMON_COUNTRY_CODES.find((c) => c.code === formattedCode);

  const currentFlag = matchedCountry ? matchedCountry.flag : "🌐";
  const phonePlaceholder = matchedCountry ? matchedCountry.example : "(555) 019-2834";

  // Filter country list based on user's manual typing
  const filteredCountries = COMMON_COUNTRY_CODES.filter((c) => {
    if (!countryCode.trim()) return true;
    const cleanSearch = countryCode.trim().toLowerCase().replace("+", "");
    const cleanCode = c.code.toLowerCase().replace("+", "");
    return (
      cleanCode.includes(cleanSearch) ||
      c.country.toLowerCase().includes(cleanSearch) ||
      c.code.includes(countryCode.trim())
    );
  });

  // Handle Google OAuth via Supabase
  const handleGoogleLoginClick = async () => {
    if (isLoading || cooldown > 0) return;
    setError("");
    setIsLoading(true);

    try {
      const { error: authError } = await loginWithGoogle();
      if (authError) {
        setError(authError.message || "Failed to initialize Google Sign In with Supabase.");
        setCooldown(4);
      }
    } catch {
      setError("An unexpected error occurred during Google Sign In.");
      setCooldown(4);
    } finally {
      setIsLoading(false);
    }
  };

  // Lightweight non-verified Phone Flow with input validation
  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || cooldown > 0) return;

    setError("");
    const cleanDigits = phoneNumber.replace(/[^0-9]/g, "");

    // Reasonable phone format check: 6 to 15 digits
    if (!cleanDigits || cleanDigits.length < 6 || cleanDigits.length > 15) {
      setError("Please enter a valid phone number (at least 6 digits)");
      setCooldown(3);
      return;
    }

    const fullPhone = `${formattedCode} ${phoneNumber.trim()}`;
    const displayName = `Student (${cleanDigits.slice(-4)})`;

    loginWithPhoneLocal(fullPhone, displayName);
    onLoginSuccess({
      name: displayName,
      emailOrPhone: fullPhone,
      provider: "phone",
    });
  };

  // Handle Email Auth with Input Validation & Supabase integration
  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || cooldown > 0) return;

    setError("");

    // Email format validation check
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError("Please enter a valid email address (e.g., student@university.edu)");
      setCooldown(3);
      return;
    }

    // Password validation check
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long");
      setCooldown(3);
      return;
    }

    setIsLoading(true);

    try {
      if (emailMode === "signin") {
        const { error: authError } = await loginWithEmail(email.trim(), password);
        if (authError) {
          setError(authError.message || "Invalid email or password.");
          setCooldown(4); // Rate-limit guard on failed attempt
        } else {
          const nameFromEmail = email.trim().split("@")[0].replace(".", " ");
          const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
          onLoginSuccess({
            name: formattedName,
            emailOrPhone: email.trim(),
            provider: "email",
          });
        }
      } else {
        const { error: authError } = await signUpWithEmail(email.trim(), password);
        if (authError) {
          setError(authError.message || "Could not create account.");
          setCooldown(4);
        } else {
          const nameFromEmail = email.trim().split("@")[0].replace(".", " ");
          const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
          onLoginSuccess({
            name: formattedName,
            emailOrPhone: email.trim(),
            provider: "email",
          });
        }
      }
    } catch {
      setError("An unexpected authentication error occurred.");
      setCooldown(4);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Guest Mode
  const handleGuestLoginClick = () => {
    loginAsGuest();
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
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-black/70 hover:text-black bg-white border border-black/15 rounded-lg shadow-2xs hover:border-black/30 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>

          <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
        </div>

        <button
          onClick={onBackToHome}
          className="flex items-center gap-2 cursor-pointer group"
          title="Back to home"
        >
          <ScribbleLogo className="h-9 sm:h-10 w-auto text-black group-hover:text-[#ec4899] transition-colors" />
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

          {cooldown > 0 && (
            <div className="mb-4 p-2 bg-amber-50 border border-amber-200 text-amber-700 text-[11px] rounded-lg text-center font-mono">
              Rate limit active: Please wait {cooldown}s before trying again
            </div>
          )}

          {/* MAIN LOGIN OPTIONS VIEW */}
          {activeTab === "options" && (
            <div className="space-y-3">
              {/* Google Button */}
              <button
                onClick={handleGoogleLoginClick}
                disabled={isLoading || cooldown > 0}
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
                <span>{isLoading ? "Connecting to Supabase..." : "Continue with Google"}</span>
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

          {/* PHONE FORM VIEW - Simplified Lightweight non-verified flow */}
          {activeTab === "phone" && (
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

              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-black uppercase mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="flex gap-2">
                      {/* Interactive Country Code Input & Dropdown Toggle */}
                      <div className="relative flex items-center bg-stone-100 border border-black/15 rounded-xl px-2.5 py-1 focus-within:ring-2 focus-within:ring-[#ec4899] focus-within:border-transparent transition-all shrink-0">
                        <span className="text-sm mr-1 select-none" title={matchedCountry ? matchedCountry.country : "Custom country code"}>
                          {currentFlag}
                        </span>
                        <input
                          type="text"
                          value={countryCode}
                          onChange={(e) => {
                            setCountryCode(e.target.value);
                            if (!isCountryDropdownOpen) setIsCountryDropdownOpen(true);
                          }}
                          onFocus={() => setIsCountryDropdownOpen(true)}
                          placeholder="+1"
                          className="w-14 bg-transparent text-xs font-mono font-bold text-black focus:outline-none py-1.5"
                          aria-label="Country Code"
                        />
                        <button
                          type="button"
                          onClick={() => setIsCountryDropdownOpen((prev) => !prev)}
                          className="p-1 hover:bg-black/10 rounded text-black/60 transition-colors cursor-pointer ml-0.5"
                          aria-label="Toggle country code menu"
                        >
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isCountryDropdownOpen ? "rotate-180 text-[#ec4899]" : ""}`} />
                        </button>
                      </div>

                      {/* Phone Number Input */}
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder={phonePlaceholder}
                        className="flex-1 min-w-0 px-3.5 py-2.5 border border-black/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4899] focus:border-transparent font-mono text-black bg-white"
                        required
                        autoFocus
                      />
                    </div>

                    {/* Country Code Dropdown Popup */}
                    {isCountryDropdownOpen && (
                      <div
                        ref={dropdownRef}
                        className="absolute top-full left-0 mt-1.5 z-50 w-[calc(100vw-3.5rem)] max-w-xs sm:max-w-sm sm:w-80 max-h-56 sm:max-h-64 overflow-y-auto overscroll-contain touch-pan-y rounded-xl border-2 border-black bg-white shadow-2xl p-1.5 text-xs divide-y divide-stone-100 animate-fadeIn"
                      >
                        <div className="p-2.5 font-mono text-[10px] text-black/60 uppercase font-bold sticky top-0 bg-white z-10 border-b border-stone-100 flex justify-between items-center shadow-2xs">
                          <span className="flex items-center gap-1.5 text-black">
                            <Search className="w-3.5 h-3.5 text-[#ec4899]" />
                            Type or Select Code
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsCountryDropdownOpen(false)}
                            className="px-2 py-0.5 bg-pink-50 hover:bg-pink-100 text-[#ec4899] font-bold rounded-md transition-colors cursor-pointer text-[11px]"
                          >
                            Done ✕
                          </button>
                        </div>
                        <div className="py-1 space-y-0.5">
                          {filteredCountries.length > 0 ? (
                            filteredCountries.map((c) => {
                              const isSelected =
                                c.code === countryCode.trim() ||
                                c.code === formattedCode;
                              return (
                                <button
                                  key={`${c.code}-${c.country}`}
                                  type="button"
                                  onClick={() => {
                                    setCountryCode(c.code);
                                    setIsCountryDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer active:scale-[0.99] ${
                                    isSelected
                                      ? "bg-pink-50 text-[#ec4899] font-bold border border-pink-200"
                                      : "hover:bg-stone-100 text-black active:bg-stone-200"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 truncate pr-2">
                                    <span className="text-lg leading-none shrink-0">{c.flag}</span>
                                    <div className="flex flex-col min-w-0">
                                      <span className="truncate text-xs font-semibold">{c.country}</span>
                                      <span className="text-[10px] text-black/50 font-mono">e.g. {c.example}</span>
                                    </div>
                                  </div>
                                  <span className="font-mono font-bold text-black/80 shrink-0 bg-stone-100 border border-black/10 px-2 py-0.5 rounded text-xs ml-1">
                                    {c.code}
                                  </span>
                                </button>
                              );
                            })
                          ) : (
                            <div className="p-4 text-center text-black/50 text-[11px]">
                              No country code matches "{countryCode}"
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || cooldown > 0}
                  className="w-full py-3 bg-black hover:bg-[#ec4899] text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  Continue with Phone
                </button>
              </form>
            </div>
          )}

          {/* EMAIL FORM VIEW */}
          {activeTab === "email" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    setActiveTab("options");
                    setError("");
                  }}
                  className="inline-flex items-center gap-1 text-xs text-black/60 hover:text-black cursor-pointer font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Other options</span>
                </button>

                {/* Toggle Sign In / Sign Up */}
                <div className="flex bg-stone-100 p-0.5 rounded-lg text-[11px] font-medium">
                  <button
                    type="button"
                    onClick={() => setEmailMode("signin")}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      emailMode === "signin"
                        ? "bg-white text-black font-bold shadow-2xs"
                        : "text-black/60 hover:text-black"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailMode("signup")}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      emailMode === "signup"
                        ? "bg-white text-black font-bold shadow-2xs"
                        : "text-black/60 hover:text-black"
                    }`}
                  >
                    Register
                  </button>
                </div>
              </div>

              <form onSubmit={handleEmailAuthSubmit} className="space-y-3.5">
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
                  {emailMode === "signup" && (
                    <p className="text-[10px] text-black/50 mt-1">Must be at least 6 characters</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || cooldown > 0}
                  className="w-full py-3 bg-black hover:bg-[#ec4899] text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isLoading
                    ? emailMode === "signin"
                      ? "Authenticating with Supabase..."
                      : "Creating Account..."
                    : cooldown > 0
                    ? `Please wait (${cooldown}s)`
                    : emailMode === "signin"
                    ? "Sign In with Email"
                    : "Create Supabase Account"}
                </button>
              </form>
            </div>
          )}

          {/* GUEST ACCESS OPTION */}
          <div className="mt-6 pt-4 border-t border-black/10 text-center">
            <button
              onClick={handleGuestLoginClick}
              className="text-xs font-semibold text-black/60 hover:text-[#ec4899] transition-colors cursor-pointer"
            >
              Skip for now → Continue as Guest
            </button>
          </div>
        </motion.div>

        {/* Security badge footer */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-black/40 mt-4">
          <Shield className="w-3.5 h-3.5 text-[#ec4899]" />
          <span>Supabase Auth Protected • SSL Encrypted</span>
        </div>
      </div>

      <div />
    </div>
  );
};
