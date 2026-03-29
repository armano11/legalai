import React from 'react';
import { Link } from 'react-router-dom';
import { Scale } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/5 bg-[#000000] py-14 mt-auto">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <Scale className="h-5 w-5 text-foreground/20" />
            <span className="font-black text-lg text-foreground tracking-tighter">
              law<span className="text-[#EC4E02]">&</span>tech
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30">
            <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link to="#" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="#" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="#" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
        <div className="mt-14 pt-8 border-t border-white/[0.02] text-center text-[10px] font-black text-foreground/10 uppercase tracking-[0.3em]">
          &copy; {new Date().getFullYear()} LAW&TECH INTELLECTUAL PROPERTY. FOR PROFESSIONAL USE ONLY.
        </div>
      </div>
    </footer>
  );
}
