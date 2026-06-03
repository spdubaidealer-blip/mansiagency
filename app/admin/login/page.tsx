"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Lock, User, Loader2, Coins, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminLogin() {
  const router = useRouter();

  // Redirect to admin immediately since login is bypassed
  useEffect(() => {
    router.push("/admin");
  }, [router]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      return toast.error("Please fill in all fields.");
    }

    setLoading(true);
    try {
      await axios.post("/api/admin/login", { username, password });
      toast.success("Authentication successful!");
      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Invalid username or password.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] bg-gradient-to-br from-[#070b13] via-[#0d1527] to-[#080d1a] relative overflow-hidden flex flex-col justify-center items-center px-4 font-sans">
      
      {/* Background blur blobs */}
      <div className="absolute top-[20%] left-[20%] w-[350px] h-[350px] rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />
      
      {/* Back button */}
      <Link 
        href="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-300 transition duration-200"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Homepage</span>
      </Link>

      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-8 shadow-2xl relative z-10">
        
        {/* Brand/Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 mb-3">
            <Coins className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-wide">
            MANSI DIAMOND AGENCY
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wider">Control Panel Authentication</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="username">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-500">
                <User className="w-4.5 h-4.5" />
              </span>
              <input
                id="username"
                type="text"
                placeholder="Enter admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl pl-10 pr-4 py-2.5 text-slate-200 placeholder-slate-650 text-sm transition duration-200 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-500">
                <Lock className="w-4.5 h-4.5" />
              </span>
              <input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl pl-10 pr-4 py-2.5 text-slate-200 placeholder-slate-650 text-sm transition duration-200 outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 text-white font-extrabold text-sm py-3 px-4 rounded-xl shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 transition duration-300 flex items-center justify-center gap-2 cursor-pointer border border-violet-500/20 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>AUTHENTICATING...</span>
              </>
            ) : (
              <span>SIGN IN TO DASHBOARD</span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
