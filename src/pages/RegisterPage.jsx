import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { isStrongPassword, isValidEmail, isValidPhone, sanitizePhoneInput } from '../utils/validators';

const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function RegisterPage() {
  const [mode, setMode] = useState('create');
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '', firmName: '', firmId: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'phone' ? sanitizePhoneInput(value) : value;
    setFormData({ ...formData, [name]: nextValue });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.password) {
      setError('All fields are required');
      return;
    }
    if (!isValidEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!isValidPhone(formData.phone)) {
      setError('Please enter a valid phone number (10-15 digits).');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!isStrongPassword(formData.password, 10)) {
      setError('Password must be at least 10 characters');
      return;
    }
    if (mode === 'create' && !formData.firmName.trim()) {
      setError('Workspace or firm name is required');
      return;
    }
    if (mode === 'join' && !formData.firmId.trim()) {
      setError('Firm code is required to join a workspace');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const role = mode === 'join' ? 'lawyer' : 'admin';
      const plan = 'professional';
      const normalizedFirmId = formData.firmId.trim().toUpperCase();
      const result = await register(
        formData.name, formData.email, formData.password, plan,
        formData.firmName, normalizedFirmId, role
      );
      const message = mode === 'join'
        ? `You have joined ${result.firm_name || 'the workspace'} (${result.firm_id}). Please log in.`
        : `Workspace created. Firm ID: ${result.firm_id}. Please log in.`;
      navigate('/login', { state: { message } });
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      
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
              Build Your Legal<br />Workspace.
            </h2>
              Create the admin workspace for your firm. Lawyer accounts can then be added from the admin console.
          </div>
          
          <div className="space-y-6 pt-12 border-t border-white/5">
            {[
              "End-to-end encrypted research streams",
              "Firm-scoped matter operations and analytics",
              "Managed AI with retrieval-backed legal workflows"
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
            <h1 className="text-4xl font-black tracking-tighter text-foreground mb-2 italic uppercase">
              {mode === 'join' ? 'Join Workspace' : 'Create Workspace'}
            </h1>
            <p className="text-foreground/40 font-bold text-xs uppercase tracking-widest">
              {mode === 'join' ? 'Lawyer onboarding with workspace code' : 'Admin onboarding for a new firm workspace'}
            </p>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-[#050505] p-2">
            <button
              type="button"
              onClick={() => { setMode('create'); setError(''); }}
              className={`h-10 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                mode === 'create' ? 'bg-primary text-primary-foreground shadow' : 'text-foreground/85 hover:text-foreground hover:bg-white/5'
              }`}
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => { setMode('join'); setError(''); }}
              className={`h-10 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                mode === 'join' ? 'bg-primary text-primary-foreground shadow' : 'text-foreground/85 hover:text-foreground hover:bg-white/5'
              }`}
            >
              Join With Code
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] pl-1">Legal Name</label>
                <input required name="name" value={formData.name} onChange={handleChange} className="w-full h-12 bg-card border border-border rounded-xl px-4 text-sm focus:outline-none focus:border-primary/40 transition-all placeholder:text-muted-foreground/40 italic font-bold" placeholder="A. SHARMA" />
              </div>

              {mode === 'create' ? (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-2">
                  <label className="text-[10px] font-black text-foreground tracking-[0.2em] pl-1">Workspace Name</label>
                  <input required name="firmName" value={formData.firmName} onChange={handleChange} className="w-full h-12 bg-primary/5 border border-border/50 rounded-xl px-4 text-sm focus:outline-none focus:border-white/50 transition-all font-black text-foreground" placeholder="Sharma Litigation Partners" />
                  <p className="text-[10px] leading-5 text-foreground/40">
                    A firm ID will be generated automatically and used when you add lawyers to this workspace.
                  </p>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-2">
                  <label className="text-[10px] font-black text-foreground tracking-[0.2em] pl-1">Firm Code</label>
                  <input required name="firmId" value={formData.firmId} onChange={handleChange} className="w-full h-12 bg-primary/5 border border-border/50 rounded-xl px-4 text-sm focus:outline-none focus:border-white/50 transition-all font-black text-foreground uppercase" placeholder="JA-ABC123" />
                  <p className="text-[10px] leading-5 text-foreground/40">
                    Enter the code shared by your workspace admin.
                  </p>
                </motion.div>
              )}
            </div>

            <div className="space-y-2">
            
              <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] pl-1">Corporate Email</label>
              <input type="email" required name="email" value={formData.email} onChange={handleChange} className="w-full h-12 bg-card border border-border rounded-xl px-4 text-sm focus:outline-none focus:border-primary/40 transition-all placeholder:text-muted-foreground/40 italic font-bold" placeholder="JANE@FIRM.COM" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] pl-1">Phone Number</label>
              <input type="tel" inputMode="tel" maxLength={16} required name="phone" value={formData.phone} onChange={handleChange} className="w-full h-12 bg-card border border-border rounded-xl px-4 text-sm focus:outline-none focus:border-primary/40 transition-all placeholder:text-muted-foreground/40 italic font-bold" placeholder="+91 9876543210" />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] pl-1">Passphrase</label>
                <input type="password" required name="password" value={formData.password} onChange={handleChange} className="w-full h-12 bg-card border border-border rounded-xl px-4 text-sm focus:outline-none focus:border-primary/40 transition-all placeholder:text-muted-foreground/40" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] pl-1">Verification</label>
                <input type="password" required name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full h-12 bg-card border border-border rounded-xl px-4 text-sm focus:outline-none focus:border-primary/40 transition-all placeholder:text-muted-foreground/40" placeholder="••••••••" />
              </div>
            </div>

            {error && (
              <div className="bg-primary/5 border border-border text-foreground/60 text-[10px] font-black uppercase tracking-widest p-4 rounded-xl flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary opacity-40 animate-pulse" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-primary text-primary-foreground rounded-xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-primary/90 transition-all flex items-center justify-center gap-3 mt-10 disabled:opacity-50 shadow-lg shadow-primary/25"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>{mode === 'join' ? 'JOIN WORKSPACE' : 'CREATE ADMIN WORKSPACE'} <ArrowRight className="h-4 w-4" /></>
              )}
            </button>

            <div className="text-center pt-8 border-t border-white/5 mt-10">
              <p className="text-sm text-foreground/30 font-medium">
                Already registered? <Link to="/login" className="text-foreground hover:underline transition-colors font-black uppercase tracking-widest text-xs">Authenticate</Link>
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
