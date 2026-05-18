import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { isValidEmail, isValidPhone, sanitizePhoneInput } from '../../utils/validators';

export function InteractiveDemo() {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [desc, setDesc] = useState('');
  const [caseId, setCaseId] = useState('');
  const [focused, setFocused] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formError, setFormError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const MAX_CHARS = 200;
  const progress = Math.min((desc.length / MAX_CHARS) * 100, 100);
  const circumference = 2 * Math.PI * 18; // r=18
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clientEmail.trim() && !isValidEmail(clientEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (clientPhone.trim() && !isValidPhone(clientPhone)) {
      setFormError('Phone must contain 10-15 digits.');
      return;
    }
    setFormError('');
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/client/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: clientName,
          client_email: clientEmail,
          client_phone: clientPhone,
          description: desc,
        }),
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setCaseId(data.case_id);
        setIsSuccess(true);
        fireConfetti();
      } else {
        console.error('Intake submission failed');
      }
    } catch (error) {
      console.error('Error submitting intake:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fireConfetti = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    let particles: any[] = [];
    const colors = ['#ff6b35', '#1a1a1a', '#f5f1e8'];

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: canvasRef.current.width / 2,
        y: canvasRef.current.height / 2,
        r: Math.random() * 4 + 2,
        dx: Math.random() * 10 - 5,
        dy: Math.random() * 10 - 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 100
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      particles.forEach((p, i) => {
        p.x += p.dx;
        p.y += p.dy;
        p.life--;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        if (p.life <= 0) particles.splice(i, 1);
      });
      if (particles.length > 0) requestAnimationFrame(animate);
    };
    animate();
  };

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = canvasRef.current.offsetWidth;
      canvasRef.current.height = canvasRef.current.offsetHeight;
    }
  }, []);

  return (
    <section id="demo" className="py-32 bg-[#1a1a1a] text-[#f5f1e8] relative border-t border-[#f5f1e8]/10">
      <div className="container mx-auto px-6 max-w-6xl grid md:grid-cols-2 gap-16 items-center">
        
        <div>
          <h2 className="font-['Playfair_Display'] text-5xl md:text-6xl font-semibold italic mb-8">
            Experience the Engine
          </h2>
          <p className="font-['Space_Grotesk'] text-[#f5f1e8]/60 text-lg max-w-md mb-12">
            Submit a matter the same way a client would. It lands with the firm admin and returns a live tracking code instantly.
          </p>
          
          <ul className="space-y-6 font-['Space_Grotesk'] text-sm uppercase tracking-widest text-[#ff6b35]">
            <li className="flex items-center gap-4">
              <span className="w-8 h-[1px] bg-[#ff6b35]" /> Routed To Firm Admin
            </li>
            <li className="flex items-center gap-4">
              <span className="w-8 h-[1px] bg-[#ff6b35]" /> Client Tracking Code
            </li>
            <li className="flex items-center gap-4">
              <span className="w-8 h-[1px] bg-[#ff6b35]" /> Immediate Triage
            </li>
          </ul>
        </div>

        <div className="relative">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-50" />
          
          <div className="bg-[#f5f1e8] p-8 md:p-12 text-[#1a1a1a] shadow-2xl relative z-10 border-l-4 border-[#ff6b35]">
            {isSuccess ? (
              <div className="text-center py-12">
                <svg width="60" height="60" viewBox="0 0 100 100" className="mx-auto mb-6 text-[#ff6b35]">
                  <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M30 50 L45 65 L70 35" fill="none" stroke="currentColor" strokeWidth="4" />
                </svg>
                <h3 className="font-['Playfair_Display'] text-3xl font-semibold italic mb-2">Matter Received</h3>
                <p className="font-['Space_Grotesk'] text-sm uppercase tracking-[0.2em] text-[#ff6b35] font-bold mb-6">
                  <p className="mt-2 text-xs uppercase tracking-[0.3em] text-white/30">Reference ID</p>
                  <p className="text-xl font-mono font-bold text-emerald-300 mt-1">{caseId}</p>
                </p>
                <div className="flex flex-col items-center gap-4">
                  <p className="font-['Space_Grotesk'] text-xs text-[#1a1a1a]/60 leading-relaxed max-w-[280px] mx-auto uppercase tracking-wider">
                    The intake is now visible to the firm admin and can be tracked right away.
                  </p>
                  <button
                    type="button"
                    onClick={() => { window.location.href = `/track?id=${encodeURIComponent(caseId)}`; }}
                    className="bg-[#1a1a1a] px-5 py-3 text-[#f5f1e8] text-xs uppercase tracking-[0.22em] transition-colors hover:bg-[#ff6b35]"
                  >
                    Open Tracking View
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8 font-['Space_Grotesk']">
                <h3 className="text-xl font-medium uppercase tracking-widest border-b border-[#1a1a1a]/10 pb-4 mb-8">
                  New Case Intake
                </h3>

                <div className="relative">
                  <input 
                    type="text" 
                    id="client"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    onFocus={() => setFocused('client')}
                    onBlur={(e) => setFocused(e.target.value ? 'client' : '')}
                    className="w-full bg-transparent border-b border-[#1a1a1a]/20 py-2 focus:outline-none focus:border-[#ff6b35] transition-colors peer"
                  />
                  <label 
                    htmlFor="client"
                    className={`absolute left-0 transition-all duration-300 pointer-events-none ${
                      focused === 'client' || clientName ? '-top-5 text-xs text-[#ff6b35]' : 'top-2 text-[#1a1a1a]/50'
                    }`}
                  >
                    Client Name
                  </label>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      onFocus={() => setFocused('email')}
                      onBlur={(e) => setFocused(e.target.value ? 'email' : '')}
                      maxLength={120}
                      className="w-full bg-transparent border-b border-[#1a1a1a]/20 py-2 focus:outline-none focus:border-[#ff6b35] transition-colors"
                    />
                    <label
                      htmlFor="email"
                      className={`absolute left-0 transition-all duration-300 pointer-events-none ${
                        focused === 'email' || clientEmail ? '-top-5 text-xs text-[#ff6b35]' : 'top-2 text-[#1a1a1a]/50'
                      }`}
                    >
                      Email
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      type="tel"
                      inputMode="tel"
                      maxLength={16}
                      id="phone"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(sanitizePhoneInput(e.target.value))}
                      onFocus={() => setFocused('phone')}
                      onBlur={(e) => setFocused(e.target.value ? 'phone' : '')}
                      className="w-full bg-transparent border-b border-[#1a1a1a]/20 py-2 focus:outline-none focus:border-[#ff6b35] transition-colors"
                    />
                    <label
                      htmlFor="phone"
                      className={`absolute left-0 transition-all duration-300 pointer-events-none ${
                        focused === 'phone' || clientPhone ? '-top-5 text-xs text-[#ff6b35]' : 'top-2 text-[#1a1a1a]/50'
                      }`}
                    >
                      Phone
                    </label>
                  </div>
                </div>

                <div className="relative">
                  <textarea 
                    id="desc"
                    required
                    rows={3}
                    maxLength={MAX_CHARS}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    onFocus={() => setFocused('desc')}
                    onBlur={(e) => setFocused(e.target.value ? 'desc' : '')}
                    className="w-full bg-transparent border-b border-[#1a1a1a]/20 py-2 focus:outline-none focus:border-[#ff6b35] transition-colors resize-none peer"
                  />
                  <label 
                    htmlFor="desc"
                    className={`absolute left-0 transition-all duration-300 pointer-events-none ${
                      focused === 'desc' || desc ? '-top-5 text-xs text-[#ff6b35]' : 'top-2 text-[#1a1a1a]/50'
                    }`}
                  >
                    Case Description
                  </label>
                  
                  {/* Progress Ring */}
                  <div className="absolute right-0 bottom-2 w-10 h-10 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="20" cy="20" r="18" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeOpacity="0.1" />
                      <circle 
                        cx="20" cy="20" r="18" fill="none" stroke={progress > 90 ? '#ef4444' : '#ff6b35'} strokeWidth="2"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-300 ease-out"
                      />
                    </svg>
                    <span className="absolute text-[9px] font-medium">{desc.length}</span>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#1a1a1a] text-[#f5f1e8] py-4 uppercase tracking-widest text-sm font-medium hover:bg-[#ff6b35] transition-colors disabled:opacity-50"
                  data-cursor-interactive
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Matter'}
                </button>
                {formError && (
                  <p className="text-xs text-red-500 uppercase tracking-wider">{formError}</p>
                )}
              </form>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
