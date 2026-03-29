import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';

const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', firmName: '', firmId: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setError('All fields are required');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!formData.firmId.trim()) {
      setError('Firm ID is required to join a workspace');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const role = 'user';
      const plan = 'professional';
      const result = await register(
        formData.name, formData.email, formData.password, plan,
        '', formData.firmId, role
      );
      navigate('/login', { state: { message: 'Registration successful. Please log in.' } });
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-foreground flex overflow-hidden">
      
      {/* LEFT PANEL */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}
        className="hidden lg:flex lg:w-[40%] relative flex-col justify-center p-16 border-r border-white/5"
      >
        <div className="max-w-md space-y-12">
          <div>
            <div className="w-12 h-12 rounded-xl bg-primary/5 border border-border flex items-center justify-center mb-8">
              <ShieldCheck className="h-6 w-6 text-foreground" />
            </div>
            <h2 className="text-5xl font-black tracking-tighter text-foreground leading-tight mb-8 italic">
              Secure Intelligence<br />Enclave.
            </h2>
              Join the Darwin Legal workspace with the firm code provided by your administrator.
          </div>
          
          <div className="space-y-6 pt-12 border-t border-white/5">
            {[
              "End-to-end encrypted research streams",
              "Private vector embeddings for firm knowledge",
              "Enterprise-grade administrative controls"
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-foreground/60">
                <div className="w-1.5 h-1.5 rounded-full bg-primary opacity-20" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-[60%] flex items-center justify-center relative p-8 sm:p-16 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="w-full max-w-lg"
        >
          <div className="mb-12">
            <h1 className="text-4xl font-black tracking-tighter text-foreground mb-2 italic uppercase">Join Workspace</h1>
            <p className="text-foreground/40 font-bold text-xs uppercase tracking-widest">Attorney onboarding for Darwin Legal</p>
          </div>

          <div className="space-y-6" onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] pl-1">Legal Name</label>
                <input required name="name" value={formData.name} onChange={handleChange} className="w-full h-12 bg-[#050505] border border-border rounded-xl px-4 text-sm focus:outline-none focus:border-white/30 transition-all placeholder:text-foreground/10 italic font-bold" placeholder="C. DARWIN" />
              </div>

              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-2">
                <label className="text-[10px] font-black text-foreground tracking-[0.2em] pl-1">Firm ID</label>
                <input required name="firmId" value={formData.firmId} onChange={handleChange} className="w-full h-12 bg-primary/5 border border-border/50 rounded-xl px-4 text-sm focus:outline-none focus:border-white/50 transition-all font-mono font-black text-foreground" placeholder="JA-DARWIN" />
                <p className="text-[10px] leading-5 text-foreground/40">
                  Joining with the firm ID adds this attorney directly to the lawyers roster and case assignment list under Darwin Legal.
                </p>
              </motion.div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] pl-1">Corporate Email</label>
              <input type="email" required name="email" value={formData.email} onChange={handleChange} className="w-full h-12 bg-[#050505] border border-border rounded-xl px-4 text-sm focus:outline-none focus:border-white/30 transition-all placeholder:text-foreground/10 italic font-bold" placeholder="JANE@FIRM.COM" />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] pl-1">Passphrase</label>
                <input type="password" required name="password" value={formData.password} onChange={handleChange} className="w-full h-12 bg-[#050505] border border-border rounded-xl px-4 text-sm focus:outline-none focus:border-white/30 transition-all placeholder:text-foreground/10" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] pl-1">Verification</label>
                <input type="password" required name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full h-12 bg-[#050505] border border-border rounded-xl px-4 text-sm focus:outline-none focus:border-white/30 transition-all placeholder:text-foreground/10" placeholder="••••••••" />
              </div>
            </div>

            {error && (
              <div className="bg-primary/5 border border-border text-foreground/60 text-[10px] font-black uppercase tracking-widest p-4 rounded-xl flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary opacity-40 animate-pulse" />
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full h-14 bg-primary text-primary-foreground rounded-xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-primary/90 transition-all flex items-center justify-center gap-3 mt-10 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>AUTHENTICATE & JOIN <ArrowRight className="h-4 w-4" /></>
              )}
            </button>

            <div className="text-center pt-8 border-t border-white/5 mt-10">
              <p className="text-sm text-foreground/30 font-medium">
                Already registered? <Link to="/login" className="text-foreground hover:underline transition-colors font-black uppercase tracking-widest text-xs">Authenticate</Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
