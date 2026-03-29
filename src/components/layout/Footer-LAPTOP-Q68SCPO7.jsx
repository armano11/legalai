import React from 'react';
import { Link } from 'react-router-dom';
import { Scale } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full py-10 mt-auto" style={{ backgroundColor: '#0a0e1a', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4" style={{ color: '#00F0FF' }} />
            <span className="text-sm font-bold text-foreground tracking-tight">JurisAI</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-[12px] text-[#3a4558]">
            <Link to="/about" className="hover:text-foreground transition-colors">About JurisAI</Link>
            <span className="hover:text-foreground transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-foreground transition-colors cursor-pointer">Terms of Service</span>
            <span className="hover:text-foreground transition-colors cursor-pointer">Security</span>
            <span className="hover:text-foreground transition-colors cursor-pointer">Support</span>
          </div>
        </div>
        <div className="mt-8 text-center text-[11px] text-[#2a3243]">
          &copy; {new Date().getFullYear()} JurisAI Intelligence Systems. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
