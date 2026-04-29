import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Loader2, Mail, ArrowRight, User, Lock, Key } from 'lucide-react';
import { auth, signInWithCustomToken } from '../lib/firebase';

const Login = () => {
  useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginType, setLoginType] = useState<'guest' | 'admin'>('guest');
  
  // Guest States
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Admin States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send OTP');
      setOtpSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Invalid OTP');
      
      await signInWithCustomToken(auth, data.customToken);
      const from = (location.state as { from?: string })?.from || '/';
      navigate(from);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Invalid admin credentials');
      
      await signInWithCustomToken(auth, data.customToken);
      const from = (location.state as { from?: string })?.from || '/';
      navigate(from);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-brand-pink/10 p-8 border border-gray-100"
      >
        {/* Tabs */}
        <div className="flex bg-gray-50 p-1 rounded-2xl mb-8">
          <button 
            onClick={() => { setLoginType('guest'); setError(null); }}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${loginType === 'guest' ? 'bg-white text-brand-brown shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Guest Login
          </button>
          <button 
            onClick={() => { setLoginType('admin'); setError(null); }}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${loginType === 'admin' ? 'bg-white text-brand-brown shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Admin Access
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-soft border border-brand-pink/20 text-brand-brown rounded-2xl flex items-center justify-center mx-auto mb-4">
            {loginType === 'guest' ? <Mail size={32} /> : <ShieldCheck size={32} />}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {loginType === 'guest' ? 'Welcome Back' : 'Admin Portal'}
          </h1>
          <p className="text-gray-500 text-sm">
            {loginType === 'guest' ? 'Sign in with a 6-digit OTP code' : 'Enter your system credentials'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl font-medium border border-red-100">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {loginType === 'guest' ? (
            <motion.div
              key="guest-form"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-brand-brown focus:bg-white transition-all rounded-2xl outline-none font-medium"
                      />
                    </div>
                  </div>

                  <button
                    disabled={loading || !email}
                    type="submit"
                    className="w-full py-4 bg-brand-brown text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#523f36] disabled:opacity-50 transition-all shadow-lg"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <><span>Send OTP Code</span><ArrowRight size={18} /></>}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="text-center mb-6">
                    <p className="text-sm text-gray-500">We've sent a 6-digit code to <b>{email}</b></p>
                    <button type="button" onClick={() => setOtpSent(false)} className="text-xs text-brand-brown font-bold mt-2 underline">Change Email</button>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">6-Digit Code</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="123456"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-brand-brown focus:bg-white transition-all rounded-2xl outline-none font-bold tracking-[0.5em] text-center text-xl"
                      />
                    </div>
                  </div>

                  <button
                    disabled={loading || otp.length < 6}
                    type="submit"
                    className="w-full py-4 bg-brand-brown text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#523f36] disabled:opacity-50 transition-all shadow-lg"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <><span>Verify & Login</span><ArrowRight size={18} /></>}
                  </button>
                </form>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="admin-form"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <form onSubmit={handleAdminLogin} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Username</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Admin Username"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-brand-brown focus:bg-white transition-all rounded-2xl outline-none font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-brand-brown focus:bg-white transition-all rounded-2xl outline-none font-medium"
                    />
                  </div>
                </div>

                <button
                  disabled={loading || !username || !password}
                  type="submit"
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black disabled:opacity-50 transition-all shadow-lg"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <><span>Login to Dashboard</span><ArrowRight size={18} /></>}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-[10px] text-gray-400 font-medium mt-8 leading-relaxed">
          {loginType === 'guest' 
            ? 'OTP codes are valid for 10 minutes. Check your inbox for the verification code.'
            : 'Access restricted to authorized Sunnydays personnel only.'}
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
