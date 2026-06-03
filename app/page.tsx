"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { 
  Coins, 
  QrCode, 
  CheckCircle, 
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Copy,
  ChevronRight,
  Loader2,
  Lock,
  ArrowRight,
  Flame,
  Star
} from "lucide-react";
import Link from "next/link";

interface RatePackage {
  id: number;
  currency: string;
  coins: number;
  price: number;
}

interface PaymentSetting {
  id: number;
  type: string;
  details: string;
  qrImageUrl: string | null;
}

export default function Home() {
  // Navigation states
  const [activeNav, setActiveNav] = useState("home");
  
  // User Authentication States
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [testMailUrl, setTestMailUrl] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Checkout Form States
  const [whatsapp, setWhatsapp] = useState("");
  const [chametId, setChametId] = useState("");
  const [currency, setCurrency] = useState<"INR" | "AED">("INR");
  const [packages, setPackages] = useState<RatePackage[]>([]);
  const [settings, setSettings] = useState<PaymentSetting[]>([]);
  const [announcement, setAnnouncement] = useState<string>("");
  const [selectedPackage, setSelectedPackage] = useState<RatePackage | null>(null);
  const [paymentMode, setPaymentMode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  // Typewriter effect state
  const words = ["Chamet Live", "Diamonds", "Coins", "Entertainment"];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(150);

  // Stats values
  const stats = [
    { label: "Happy Customers", val: "50,000+" },
    { label: "Transactions Done", val: "100,000+" },
    { label: "Success Rate", val: "99.9%" },
    { label: "Fast Delivery", val: "5-15 Mins" }
  ];

  // Fetch session, rates, settings, and announcements
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessionRes, ratesRes, settingsRes, announcementRes] = await Promise.all([
          axios.get("/api/auth/check"),
          axios.get("/api/rates"),
          axios.get("/api/settings"),
          axios.get("/api/announcements")
        ]);
        
        if (sessionRes.data.authenticated) {
          setUserEmail(sessionRes.data.email);
        }
        
        setPackages(ratesRes.data);
        setSettings(settingsRes.data);
        if (announcementRes.data && announcementRes.data.isActive) {
          setAnnouncement(announcementRes.data.message);
        }
      } catch (err) {
        toast.error("Error loading application data");
      } finally {
        setCheckingAuth(false);
      }
    };
    fetchData();
  }, []);

  // Typewriter loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const handleTyping = () => {
      const fullWord = words[currentWordIndex];
      if (!isDeleting) {
        setCurrentText(fullWord.substring(0, currentText.length + 1));
        setTypingSpeed(150);
        if (currentText === fullWord) {
          timer = setTimeout(() => setIsDeleting(true), 1500);
          return;
        }
      } else {
        setCurrentText(fullWord.substring(0, currentText.length - 1));
        setTypingSpeed(75);
        if (currentText === "") {
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }
      }
      timer = setTimeout(handleTyping, typingSpeed);
    };

    timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentWordIndex]);

  // Filter packages based on selected currency
  const filteredPackages = packages.filter((pkg) => pkg.currency === currency);

  // Set default payment mode when currency changes
  useEffect(() => {
    if (currency === "INR") {
      setPaymentMode("UPI");
    } else {
      setPaymentMode("BotimPay");
    }
    setSelectedPackage(null);
  }, [currency]);

  // Find setting by type
  const getSetting = (type: string) => {
    return settings.find((s) => s.type === type);
  };

  const handleCopy = (text: string, title: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${title} copied to clipboard!`);
  };

  // OTP handlers
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim()) {
      return toast.error("Gmail address is required!");
    }
    if (!authEmail.trim().toLowerCase().endsWith("@gmail.com")) {
      return toast.error("Only Gmail (@gmail.com) addresses are allowed!");
    }

    setAuthLoading(true);
    setTestMailUrl(null);
    try {
      const res = await axios.post("/api/auth/send-otp", { email: authEmail });
      toast.success(res.data.message);
      setOtpSent(true);
      if (res.data.previewUrl) {
        setTestMailUrl(res.data.previewUrl);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to send OTP. Try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      return toast.error("Please enter a 6-digit OTP code.");
    }

    setAuthLoading(true);
    try {
      const res = await axios.post("/api/auth/verify-otp", { email: authEmail, otp });
      toast.success("Login successful!");
      setUserEmail(res.data.email);
      setOtp("");
      setOtpSent(false);
      setTestMailUrl(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "OTP verification failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleUserLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
      setUserEmail(null);
      toast.success("Logged out successfully.");
    } catch (err) {
      toast.error("Logout failed.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userEmail) {
      return toast.error("Please log in with Gmail first!");
    }
    if (!whatsapp.trim()) {
      return toast.error("WhatsApp number is required!");
    }
    if (!chametId.trim()) {
      return toast.error("Chamet User ID is required!");
    }
    if (!selectedPackage) {
      return toast.error("Please select a coin package!");
    }
    if (!paymentMode) {
      return toast.error("Please select a payment method!");
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("whatsapp", whatsapp);
    formData.append("chametId", chametId);
    formData.append("currency", currency);
    formData.append("selectedPackageId", selectedPackage.id.toString());
    // screenshotUrl is optional, so we do not append screenshot files

    try {
      const res = await axios.post("/api/orders", formData);
      setOrderSuccess(res.data);
      toast.success("Order Placed Successfully!");
      
      // Reset form fields
      setWhatsapp("");
      setChametId("");
      setSelectedPackage(null);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Order submission failed.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const formatCoins = (coins: number) => {
    if (coins >= 1000000) {
      return (coins / 1000000).toFixed(2).replace(/\.00$/, "") + "M";
    }
    if (coins >= 1000) {
      return (coins / 1000).toFixed(0) + "K";
    }
    return coins.toLocaleString();
  };

  const upiSetting = getSetting("UPI");
  const botimSetting = getSetting("BotimPay");
  const duPaySetting = getSetting("duPay");
  const eMoneySetting = getSetting("eMoney");

  return (
    <div className="min-h-screen bg-[#050816] text-slate-100 font-sans antialiased overflow-x-hidden flex flex-col relative">
      
      {/* Background Orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[130px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[10%] right-[5%] w-[500px] h-[500px] rounded-full bg-cyan-500/8 blur-[140px] animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute top-[50%] left-[40%] w-[350px] h-[350px] rounded-full bg-pink-500/5 blur-[120px]" />
      </div>

      {/* Scrolling Announcement Marquee */}
      {announcement && (
        <div className="bg-gradient-to-r from-violet-900/95 via-indigo-900/95 to-violet-900/95 border-b border-violet-800/40 text-sm text-violet-100 py-2.5 px-4 shadow-lg overflow-hidden relative z-50">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-violet-400 shrink-0 animate-pulse" />
            <div className="relative w-full overflow-hidden h-5 flex items-center">
              <div className="absolute whitespace-nowrap animate-marquee flex gap-10 hover:[animation-play-state:paused] cursor-pointer">
                <span>{announcement}</span>
                <span>{announcement}</span>
                <span>{announcement}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <header className="sticky top-0 left-0 right-0 z-40 bg-[#050816]/80 backdrop-blur-md border-b border-white/5 transition-all duration-300">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 md:h-20">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Coins className="w-5.5 h-5.5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-sm sm:text-base lg:text-lg text-white tracking-wide">
                MANSI DIAMOND AGENCY
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <ul className="hidden md:flex items-center gap-1.5 text-slate-300">
            {["home", "about", "services", "contact"].map((nav) => (
              <li key={nav}>
                <a
                  href={`#${nav}`}
                  onClick={() => setActiveNav(nav)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 hover:text-white ${
                    activeNav === nav 
                      ? "text-violet-400 bg-white/5" 
                      : "text-slate-400 hover:bg-white/5"
                  }`}
                >
                  {nav}
                </a>
              </li>
            ))}
          </ul>

          {/* Right Action buttons */}
          <div className="flex items-center gap-3">
            <Link 
              href="/admin" 
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 transition-colors hover:border-white/20 hover:text-white"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </Link>
            <a 
              href="#checkout" 
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition duration-200 flex items-center gap-1 shadow-md shadow-violet-500/10 border border-violet-500/25"
            >
              <span>Top Up Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative z-10 min-h-[80vh] flex items-center py-16 overflow-hidden max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
          
          {/* Left Text */}
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/5 text-xs font-bold text-violet-300">
              <Flame className="w-3.5 h-3.5 text-violet-400" />
              <span>Official Chamet Diamond Dealer</span>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-white font-heading">
              Power Up Your <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400">
                {currentText}
              </span>
              <span className="text-violet-400 cursor-blink font-light">|</span> <br />
              Experience Instantly
            </h2>

            <p className="text-slate-400 text-base max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Buy Chamet coins and diamonds securely at the lowest market rates. Instant transfers delivered in minutes. Verified and trusted by users across India and the UAE.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a 
                href="#checkout" 
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold px-8 py-4 rounded-xl shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 transition duration-300 flex items-center justify-center gap-2 border border-violet-500/25"
              >
                <Coins className="w-5 h-5" />
                <span>Start Top-Up Now</span>
              </a>
              <a 
                href="https://wa.me/919876543210" 
                target="_blank" 
                rel="noreferrer"
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold px-8 py-4 rounded-xl transition duration-200 flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-5 h-5 text-cyan-400" />
                <span>Contact 24/7 Support</span>
              </a>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-5 justify-center lg:justify-start pt-6 border-t border-slate-900">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>100% Safe Payments</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Instant Delivery</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Zero Verification Extra Fees</span>
              </div>
            </div>
          </div>

          {/* Right Floating Showcase Card */}
          <div className="relative flex justify-center items-center lg:h-[450px]">
            {/* Glow backdrop */}
            <div className="absolute inset-0 rounded-3xl" style={{ background: "radial-gradient(ellipse 65% 65% at 50% 50%, rgba(139,92,246,0.12), transparent)" }} />
            
            <div className="bg-[#0b1021]/80 backdrop-blur-lg border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-violet-500/40 hover:shadow-violet-500/5 group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <Coins className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-white text-lg">Chamet Coins</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs text-slate-400 font-semibold tracking-wide">Live Support Active</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <span className="text-xs text-slate-400 font-medium">Starting Price (India)</span>
                  <span className="font-extrabold text-cyan-400">₹280</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <span className="text-xs text-slate-400 font-medium">Starting Price (UAE)</span>
                  <span className="font-extrabold text-cyan-400">AED 12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Average Processing</span>
                  <span className="font-extrabold text-emerald-400">5-10 Mins</span>
                </div>
              </div>

              <div className="flex bg-slate-950/60 rounded-xl p-3 border border-slate-900 mb-6 items-center gap-3">
                <div className="flex text-amber-400 gap-0.5 shrink-0">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <span className="text-[10px] text-slate-400 font-bold">5.0 Star Rating by 2,400+ Users</span>
              </div>

              <a 
                href="#checkout" 
                className="w-full py-3 bg-slate-950 border border-slate-800 hover:border-violet-500/50 text-slate-300 hover:text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition duration-200 uppercase tracking-wider"
              >
                <span>Purchase Coins</span>
                <ChevronRight className="w-4 h-4 text-violet-400" />
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* Stats Counter Bar */}
      <section className="border-y border-white/5 bg-slate-950/40 relative z-10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center space-y-1.5">
                <span className="text-2xl sm:text-3xl font-black text-violet-400 tracking-tight">{stat.val}</span>
                <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Checkout/Form section */}
      <section id="checkout" className="relative z-10 py-24 px-4 max-w-4xl mx-auto w-full">
        <div className="text-center mb-12">
          <span className="px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-xs font-bold text-cyan-300 tracking-wide uppercase">Place Order</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading mt-3">
            Instant <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-300">Top-Up Checkout</span>
          </h2>
          <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
            Fill in your account details, choose your coins, make payment and click submit to trigger delivery.
          </p>
        </div>

        {/* Success message card */}
        {checkingAuth ? (
          <div className="bg-[#0b1021]/50 backdrop-blur-md border border-slate-800/80 rounded-3xl p-10 flex flex-col items-center gap-3 max-w-md mx-auto shadow-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase animate-pulse">Checking Session...</span>
          </div>
        ) : orderSuccess ? (
          <div className="bg-[#0b1b24]/80 backdrop-blur-md border border-emerald-500/20 rounded-3xl p-8 text-center space-y-5 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-white">Top-Up Details Submitted!</h3>
            <p className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
              Thank you! Your request for Chamet Coins has been logged under ID <code className="font-mono text-cyan-400 font-extrabold">{orderSuccess.id}</code>. 
              Top-up will complete inside 5-15 minutes.
            </p>
            <div className="bg-slate-950/80 border border-slate-900 rounded-2xl p-4 max-w-sm mx-auto text-left space-y-2.5 text-xs">
              <div className="flex justify-between"><span className="text-slate-400">Customer Gmail</span><span className="text-white font-bold">{userEmail}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Chamet User ID</span><span className="text-white font-bold">{orderSuccess.chametId}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">WhatsApp Contact</span><span className="text-white font-bold">+{orderSuccess.whatsapp}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Order Status</span><span className="text-cyan-400 font-bold uppercase">{orderSuccess.status}</span></div>
            </div>
            <button
              onClick={() => setOrderSuccess(null)}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold py-3 px-6 rounded-xl transition duration-200 uppercase tracking-wider cursor-pointer"
            >
              Place Another Order
            </button>
          </div>
        ) : !userEmail ? (
          <div className="bg-[#0b1021]/50 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 max-w-md mx-auto relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center mx-auto shadow-lg shadow-violet-500/20">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-heading font-black text-white">Gmail Verification</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Verify your Gmail ID to proceed with your top-up order. Safe, secure, and instant.
              </p>
            </div>

            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label htmlFor="authEmail" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Gmail Address</label>
                  <input
                    type="email"
                    id="authEmail"
                    placeholder="yourname@gmail.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-700 text-sm transition outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-850 disabled:to-slate-850 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg shadow-violet-600/10 hover:shadow-violet-600/20 border border-violet-500/20 transition duration-200 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider font-semibold"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send 6-Digit OTP</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="bg-violet-950/20 border border-violet-900/40 rounded-xl p-3 text-[11px] text-violet-300 text-center leading-relaxed">
                  OTP code has been sent to <span className="font-bold text-white block">{authEmail}</span> Please enter it below.
                </div>
                
                <div>
                  <label htmlFor="otp" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">6-Digit OTP Code</label>
                  <input
                    type="text"
                    id="otp"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-full bg-slate-950 border border-slate-900 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-700 text-lg font-mono font-bold tracking-[8px] text-center transition outline-none"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="px-4 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white font-bold text-xs rounded-xl transition duration-200 shrink-0 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-850 disabled:to-slate-850 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg shadow-violet-600/10 hover:shadow-violet-600/20 border border-violet-500/20 transition duration-200 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                  >
                    {authLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <span>Verify & Access Checkout</span>
                    )}
                  </button>
                </div>

                {testMailUrl && (
                  <div className="pt-2 text-center">
                    <a
                      href={testMailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] text-cyan-400 hover:text-cyan-300 font-extrabold hover:underline"
                    >
                      <span>Open Ethereal Test Inbox ✉️</span>
                    </a>
                  </div>
                )}
              </form>
            )}
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handleSubmit} className="bg-[#0b1021]/50 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
            
            {/* Logged In Info Banner */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-violet-950/20 border border-violet-900/30 rounded-2xl p-4 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300 font-medium">Logged in as:</span>
                <span className="text-white font-bold">{userEmail}</span>
              </div>
              <button
                type="button"
                onClick={handleUserLogout}
                className="text-violet-400 hover:text-violet-300 font-bold hover:underline cursor-pointer"
              >
                Change Gmail Account / Logout
              </button>
            </div>

            {/* Step 1: Coin Package selection */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded bg-violet-600/20 text-violet-400 flex items-center justify-center text-xs font-black">1</span>
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider">Select Coin Package</h3>
                </div>
                
                {/* Currency Switcher */}
                <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setCurrency("INR")}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition duration-200 cursor-pointer ${
                      currency === "INR" 
                        ? "bg-violet-600 text-white shadow-md" 
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span>🇮🇳</span> INR (₹)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency("AED")}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition duration-200 cursor-pointer ${
                      currency === "AED" 
                        ? "bg-violet-600 text-white shadow-md" 
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span>🇦🇪</span> AED (Dhs)
                  </button>
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                {filteredPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`relative border rounded-xl p-4 cursor-pointer transition duration-300 flex items-center justify-between group ${
                      selectedPackage?.id === pkg.id
                        ? "bg-violet-600/10 border-violet-500 shadow-md ring-1 ring-violet-500/30"
                        : "bg-slate-950/60 border-slate-900 hover:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg transition duration-300 ${
                        selectedPackage?.id === pkg.id ? "bg-violet-600/20 text-violet-400" : "bg-slate-900 text-slate-400 group-hover:text-violet-400"
                      }`}>
                        <Coins className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-extrabold text-white text-sm">
                          {formatCoins(pkg.coins)}
                        </div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider">Chamet Coins</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-cyan-400">
                        {currency === "INR" ? "₹" : "AED "} {pkg.price.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Account Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded bg-violet-600/20 text-violet-400 flex items-center justify-center text-xs font-black">2</span>
                <h3 className="text-base font-extrabold text-white uppercase tracking-wider">Chamet ID & Contact</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="whatsapp" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">WhatsApp Number</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm font-bold">+</span>
                    <input
                      type="tel"
                      id="whatsapp"
                      placeholder="919876543210"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value.replace(/[^0-9]/g, ""))}
                      className="w-full bg-slate-950 border border-slate-900 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl pl-8 pr-4 py-2.5 text-slate-200 placeholder-slate-700 text-xs transition outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="chametId" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Chamet User ID</label>
                  <input
                    type="text"
                    id="chametId"
                    placeholder="Enter Chamet User ID"
                    value={chametId}
                    onChange={(e) => setChametId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-700 text-xs transition outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Payment Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded bg-violet-600/20 text-violet-400 flex items-center justify-center text-xs font-black">3</span>
                <h3 className="text-base font-extrabold text-white uppercase tracking-wider">Payment Instructions</h3>
              </div>

              {currency === "INR" ? (
                /* INR - Payment Methods */
                <div className="space-y-4">
                  {/* Select Payment Mode */}
                  <div className="grid grid-cols-2 gap-3">
                    <div 
                      onClick={() => setPaymentMode("UPI")}
                      className={`p-4 border rounded-xl cursor-pointer text-center font-bold text-xs transition duration-200 ${
                        paymentMode === "UPI" ? "bg-violet-600/10 border-violet-500 text-white" : "bg-slate-950/40 border-slate-900 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      UPI Transfer (Direct VPA)
                    </div>
                    <div 
                      onClick={() => setPaymentMode("ONLINE")}
                      className={`p-4 border rounded-xl cursor-pointer text-center font-bold text-xs transition duration-200 ${
                        paymentMode === "ONLINE" ? "bg-violet-600/10 border-violet-500 text-white" : "bg-slate-950/40 border-slate-900 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Online Gateway (NetBanking/Cards)
                    </div>
                  </div>

                  {paymentMode === "UPI" ? (
                    upiSetting && (
                      <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="space-y-2 flex-1 text-center sm:text-left">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Transfer directly to UPI Address</span>
                          <span className="text-sm font-extrabold text-white select-all block">{upiSetting.details}</span>
                          <span className="text-[10px] text-slate-500 block leading-relaxed">Copy this VPA ID, pay using any UPI App (GPay, PhonePe, Paytm), and submit this form immediately.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(upiSetting.details, "UPI VPA ID")}
                          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-extrabold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 transition duration-200 shrink-0 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy VPA ID</span>
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-5 text-center text-xs text-slate-500">
                      🔒 Gateway Mode: You will be redirected to payment verification upon submission.
                    </div>
                  )}
                </div>
              ) : (
                /* AED - UAE Details */
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Select UAE Payment Account</div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {botimSetting && botimSetting.details && (
                      <div 
                        onClick={() => setPaymentMode("BotimPay")}
                        className={`p-4 border rounded-xl cursor-pointer text-center transition duration-200 ${
                          paymentMode === "BotimPay" ? "bg-violet-600/10 border-violet-500 text-white" : "bg-slate-950/40 border-slate-900 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <span className="text-xs font-bold block">Botim Pay</span>
                      </div>
                    )}
                    {duPaySetting && duPaySetting.details && (
                      <div 
                        onClick={() => setPaymentMode("duPay")}
                        className={`p-4 border rounded-xl cursor-pointer text-center transition duration-200 ${
                          paymentMode === "duPay" ? "bg-violet-600/10 border-violet-500 text-white" : "bg-slate-950/40 border-slate-900 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <span className="text-xs font-bold block">duPay Mobile</span>
                      </div>
                    )}
                    {eMoneySetting && eMoneySetting.details && (
                      <div 
                        onClick={() => setPaymentMode("eMoney")}
                        className={`p-4 border rounded-xl cursor-pointer text-center transition duration-200 ${
                          paymentMode === "eMoney" ? "bg-violet-600/10 border-violet-500 text-white" : "bg-slate-950/40 border-slate-900 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <span className="text-xs font-bold block">e& money</span>
                      </div>
                    )}
                  </div>

                  {/* Render payment details according to mode */}
                  {settings.filter(s => s.type === paymentMode).map(s => (
                    <div key={s.id} className="bg-slate-950/80 border border-slate-900 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="space-y-2 flex-1 text-center sm:text-left">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Transfer directly to UAE number</span>
                        <span className="text-sm font-extrabold text-white select-all block">{s.details}</span>
                        <span className="text-[10px] text-slate-500 block leading-relaxed">Pay {s.type} amount and submit this form immediately for delivery verification.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(s.details, `${s.type} Number`)}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-extrabold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 transition duration-200 shrink-0 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Number</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submission pricing block & Action */}
            <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                {selectedPackage ? (
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Amount</span>
                    <span className="text-2xl font-black text-cyan-400">
                      {currency === "INR" ? "₹" : "AED "} {selectedPackage.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 block mt-0.5">for {formatCoins(selectedPackage.coins)} Chamet Coins</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500">Please choose a coin package above.</span>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-850 disabled:to-slate-850 text-white font-extrabold text-sm py-4 px-8 rounded-xl shadow-lg shadow-violet-600/10 hover:shadow-violet-600/20 border border-violet-500/20 transition duration-200 flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>SUBMITTING ORDER...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4.5 h-4.5" />
                    <span>CONFIRM & PLACE ORDER</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}
      </section>

      {/* Footer Section */}
      <footer className="w-full bg-[#050816] border-t border-white/5 py-12 text-xs text-slate-500 z-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center shadow">
              <Coins className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-heading font-extrabold text-sm text-white">MANSI DIAMOND AGENCY</span>
          </div>
          
          <div className="flex items-center gap-6">
            <span>&copy; {new Date().getFullYear()} Mansi Diamond Agency. All rights reserved.</span>
            <a 
              href="https://wa.me/919876543210" 
              target="_blank" 
              rel="noreferrer" 
              className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition duration-200"
            >
              <MessageSquare className="w-4.5 h-4.5" />
              <span>Contact Live Support</span>
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
