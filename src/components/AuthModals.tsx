import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PlusCircle, Mail, Lock, User, ArrowRight, Apple, Facebook, Twitter } from "lucide-react";
import { loginWithEmail, signupWithEmail, loginWithGoogle } from "../lib/firebase";

export function LoginModal({ isOpen, onClose, onSwitchToSignup }: { isOpen: boolean, onClose: () => void, onSwitchToSignup: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!email || !password) {
      setError("Email and Password are required.");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await loginWithEmail(email, password);
      onClose();
    } catch (err: any) {
      setError("Authentication failed: " + (err.message || "Please check your credentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[48px] w-full max-w-lg text-center relative shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-50 dark:border-white/5"
      >
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-500 dark:text-slate-300 hover:text-black dark:hover:text-white transition-all">
          <PlusCircle className="rotate-45" size={24} />
        </button>

        <h2 className="text-2xl md:text-3xl font-serif font-black mb-2 tracking-tighter text-slate-900 dark:text-white">
          Welcome Back
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm italic font-serif">
          Sign in to your account.
        </p>

        {/* Social Logins at the Top */}
        <div className="flex justify-center gap-4 mb-8">
          <button onClick={async () => { try { await loginWithGoogle(); onClose(); } catch (e: any) { setError(e.message); } }} className="w-12 h-12 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group">
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5 grayscale group-hover:grayscale-0 transition-all" alt="G" />
          </button>
          <button onClick={() => alert("Apple ID integration coming soon.")} className="w-12 h-12 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            <Apple size={20} className="text-slate-900 dark:text-white" />
          </button>
          <button onClick={() => alert("Facebook Login integration coming soon.")} className="w-12 h-12 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            <Facebook size={20} className="text-blue-600" />
          </button>
          <button onClick={() => alert("X (Twitter) integration coming soon.")} className="w-12 h-12 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            <Twitter size={20} className="text-black dark:text-white" />
          </button>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">or use email</span>
          <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
        </div>

        <div className="space-y-6 max-w-sm mx-auto mb-10">
          <div className="relative group">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input
              type="email"
              placeholder="Email Address"
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 px-12 py-4 rounded-2xl text-xs font-bold outline-none focus:ring-2 ring-indigo-500/20 dark:text-white transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div className="relative group">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 px-12 py-4 rounded-2xl text-xs font-bold outline-none focus:ring-2 ring-indigo-500/20 dark:text-white transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl">
              <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest leading-relaxed">{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            disabled={loading}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 dark:hover:bg-slate-200 transition-all disabled:opacity-50 shadow-xl shadow-black/10 flex items-center justify-center gap-3 group"
          >
            {loading ? "Synchronizing..." : (
              <>
                <span>Sign In Now</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400">
          Don't have an account? <button onClick={onSwitchToSignup} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Sign up</button>
        </p>
      </motion.div>
    </div>
  );
}

export function SignupModal({ isOpen, onClose, onSwitchToLogin }: { isOpen: boolean, onClose: () => void, onSwitchToLogin: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name || !email || !password) {
      setError("All fields are required.");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await signupWithEmail(email, password, name);
      onClose();
    } catch (err: any) {
      setError("Registration failed: " + (err.message || "Please try again"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[48px] w-full max-w-lg text-center relative shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-50 dark:border-white/5"
      >
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-500 dark:text-slate-300 hover:text-black dark:hover:text-white transition-all">
          <PlusCircle className="rotate-45" size={24} />
        </button>

        <h2 className="text-2xl md:text-3xl font-serif font-black mb-2 tracking-tighter text-slate-900 dark:text-white">
          Create Account
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm italic font-serif">
          Join our community.
        </p>

        {/* Social Signups at the Top */}
        <div className="flex justify-center gap-4 mb-8">
          <button onClick={async () => { try { await loginWithGoogle(); onClose(); } catch (e: any) { setError(e.message); } }} className="w-12 h-12 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group">
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5 grayscale group-hover:grayscale-0 transition-all" alt="G" />
          </button>
          <button onClick={() => alert("Apple ID integration coming soon.")} className="w-12 h-12 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            <Apple size={20} className="text-slate-900 dark:text-white" />
          </button>
          <button onClick={() => alert("Facebook Login integration coming soon.")} className="w-12 h-12 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            <Facebook size={20} className="text-blue-600" />
          </button>
          <button onClick={() => alert("X (Twitter) integration coming soon.")} className="w-12 h-12 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            <Twitter size={20} className="text-black dark:text-white" />
          </button>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">or use email</span>
          <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
        </div>

        <div className="space-y-6 max-w-sm mx-auto mb-10">
          <div className="relative group">
            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input
              type="text"
              placeholder="Full Name"
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 px-12 py-4 rounded-2xl text-xs font-bold outline-none focus:ring-2 ring-indigo-500/20 dark:text-white transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div className="relative group">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input
              type="email"
              placeholder="Email Address"
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 px-12 py-4 rounded-2xl text-xs font-bold outline-none focus:ring-2 ring-indigo-500/20 dark:text-white transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div className="relative group">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 px-12 py-4 rounded-2xl text-xs font-bold outline-none focus:ring-2 ring-indigo-500/20 dark:text-white transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl">
              <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest leading-relaxed">{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={loading}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 dark:hover:bg-slate-200 transition-all disabled:opacity-50 shadow-xl shadow-black/10 flex items-center justify-center gap-3 group"
          >
            {loading ? "Registering..." : (
              <>
                <span>Create Account</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400">
          Already have an account? <button onClick={onSwitchToLogin} className="text-black dark:text-white font-bold hover:underline">Log in</button>
        </p>
      </motion.div>
    </div>
  );
}
