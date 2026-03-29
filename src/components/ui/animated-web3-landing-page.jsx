"use client";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export function Web3HeroAnimated({ 
  showNav = true, 
  title, 
  description, 
  children 
}) {
  // Symmetric pillar heights (percent). Tall at edges, low at center.
  const pillars = [92, 84, 78, 70, 62, 54, 46, 34, 18, 34, 46, 54, 62, 70, 78, 84, 92];

  // State to trigger animations once the component is mounted.
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes subtlePulse {
            0%, 100% {
              opacity: 0.8;
              transform: scale(1);
            }
            50% {
              opacity: 1;
              transform: scale(1.03);
            }
          }
          
          .animate-fadeInUp {
            animation: fadeInUp 0.8s ease-out forwards;
          }
        `}
      </style>

      <section className="relative isolate h-screen overflow-hidden bg-background text-foreground">
        {/* ================== BACKGROUND ================== */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-30"
          style={{
            backgroundImage: [
              "radial-gradient(80% 55% at 50% 52%, rgba(252,166,154,0.45) 0%, rgba(214,76,82,0.46) 27%, rgba(61,36,47,0.38) 47%, rgba(39,38,67,0.45) 60%, rgba(8,8,12,0.92) 78%, rgba(0,0,0,1) 88%)",
              "radial-gradient(85% 60% at 14% 0%, rgba(255,193,171,0.65) 0%, rgba(233,109,99,0.58) 30%, rgba(48,24,28,0.0) 64%)",
              "radial-gradient(70% 50% at 86% 22%, rgba(88,112,255,0.40) 0%, rgba(16,18,28,0.0) 55%)",
              "linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0) 40%)",
            ].join(","),
            backgroundColor: "#000",
          }}
        />

        <div aria-hidden="true" className="absolute inset-0 -z-20 bg-[radial-gradient(140%_120%_at_50%_0%,transparent_60%,rgba(0,0,0,0.85))]" />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 mix-blend-screen opacity-30"
          style={{
            backgroundImage: [
              "repeating-linear-gradient(90deg, rgba(255,255,255,0.09) 0 1px, transparent 1px 96px)",
              "repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 24px)",
              "repeating-radial-gradient(80% 55% at 50% 52%, rgba(255,255,255,0.08) 0 1px, transparent 1px 120px)"
            ].join(","),
            backgroundBlendMode: "screen",
          }}
        />

        {/* ================== NAV ================== */}
        {showNav && (
          <header className="relative z-10">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 md:px-8">
              <Link to="/" className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-[#EC4E02]" />
                <span className="text-lg font-bold tracking-tighter">law<span className="text-[#EC4E02]">&</span>tech</span>
              </Link>

              <nav className="hidden items-center gap-8 text-[10px] font-black uppercase tracking-widest text-foreground/50 md:flex">
                {['Product','Docs','Analytics','Intelligence','Security','Pricing'].map((i)=>(
                  <a key={i} className="hover:text-foreground transition-colors" href="#">{i}</a>
                ))}
              </nav>

              <div className="hidden items-center gap-3 md:flex">
                <Link to="/login" className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground/50 hover:text-foreground transition-colors">Sign in</Link>
                <Link to="/register" className="rounded-full bg-primary px-6 py-2 text-[10px] font-black uppercase tracking-widest text-primary-foreground shadow-sm transition hover:bg-primary/90">Request Demo</Link>
              </div>

              <button className="md:hidden rounded-full bg-primary/10 px-3 py-2 text-xs font-bold uppercase tracking-widest">Menu</button>
            </div>
          </header>
        )}

        {/* ================== COPY ================== */}
        <div className="relative z-10 mx-auto grid w-full max-w-5xl place-items-center px-6 py-16 md:py-24 lg:py-28">
          <div className={`mx-auto text-center ${isMounted ? 'animate-fadeInUp' : 'opacity-0'}`}>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50 ring-1 ring-white/10 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[#EC4E02]" /> legal tech engineering
            </span>
            <h1 style={{ animationDelay: '200ms' }} className={`mt-6 text-4xl font-black tracking-tighter md:text-7xl ${isMounted ? 'animate-fadeInUp' : 'opacity-0'}`}>
               {title || <>Advanced Logic.<br/><span className="text-foreground/40">Engineered for Law.</span></>}
            </h1>
            <p style={{ animationDelay: '300ms' }} className={`mx-auto mt-6 max-w-2xl text-balance text-foreground/50 md:text-lg font-medium tracking-tight ${isMounted ? 'animate-fadeInUp' : 'opacity-0'}`}>
              {description || "The essential toolkit for modern firms—transforming static legal documents into high-performance computational assets."}
            </p>
            <div style={{ animationDelay: '400ms' }} className={`mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row ${isMounted ? 'animate-fadeInUp' : 'opacity-0'}`}>
              {children || (
                <>
                  <Link to="/register" className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-primary-foreground shadow transition hover:scale-105 active:scale-95">Get Started</Link>
                  <Link to="/login" className="inline-flex items-center justify-center rounded-full border border-border/50 px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80 backdrop-blur hover:border-white/40 transition-all">Read Documentation</Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ================== PARTNERS ================== */}
        <div className="relative z-10 mx-auto mt-10 w-full max-w-6xl px-6 pb-24">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-30">
            {["High Court", "Supreme Court", "Ministry of Justice", "Digital India", "AIBE", "Bar Council", "Legal AI Alliance"].map((brand) => (
              <div key={brand} className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">{brand}</div>
            ))}
          </div>
        </div>

        {/* ================== FOREGROUND ================== */}
        <div
          className="pointer-events-none absolute bottom-[128px] left-1/2 z-0 h-36 w-28 -translate-x-1/2 rounded-md bg-gradient-to-b from-white/75 via-rose-100/60 to-transparent"
          style={{ animation: 'subtlePulse 6s ease-in-out infinite' }}
        />

        {/* Stepped pillars silhouette */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[54vh]">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex h-full items-end gap-px px-[2px]">
            {pillars.map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-background transition-height duration-1000 ease-in-out"
                style={{
                  height: isMounted ? `${h}%` : '0%',
                  transitionDelay: `${Math.abs(i - Math.floor(pillars.length / 2)) * 60}ms`
                }}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
