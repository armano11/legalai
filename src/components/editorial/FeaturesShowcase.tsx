import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const FEATURES = [
  {
    id: '01',
    title: 'Intelligent Case Management',
    desc: 'Seamlessly track matters from Intake to Judgment. Assign counsel and manage deadlines with precision.',
    details: ['Automated Stage Progression', 'Role-based Document Access', 'Integrated Calendar & Deadlines']
  },
  {
    id: '02',
    title: 'AI-Powered Discovery',
    desc: 'Synthesize case facts and surface critical legal precedents using our intelligent search engine.',
    details: ['Semantic Document Parsing', 'Fact-to-Precedent Matching', 'Automated Brief Summarization']
  },
  {
    id: '03',
    title: 'Client Portal Transparency',
    desc: 'Provide clients with secure, read-only portals to track progress without exposing internal notes.',
    details: ['Custom Branded Interface', 'Granular Permission Settings', 'Encrypted Message Relay']
  },
  {
    id: '04',
    title: 'Firm-Wide Analytics',
    desc: 'Monitor lawyer bandwidth, SLA deadlines, and resolution velocities across the entire firm.',
    details: ['Custom Reporting Engine', 'Real-time Velocity Metrics', 'Historical Win-rate Analysis']
  }
];

export function FeaturesShowcase() {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const rows = containerRef.current.querySelectorAll('.feature-row');
    rows.forEach((row) => {
      gsap.fromTo(row,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: row,
            start: 'top 85%',
          }
        }
      );
    });
  }, []);

  return (
    <section ref={containerRef} className="bg-[#f5f1e8] py-32 relative overflow-hidden border-t border-[#1a1a1a]/10">
      <div className="container mx-auto px-6 lg:px-12 max-w-6xl">
        
        <div className="mb-24 md:w-2/3">
          <h2 className="font-['Playfair_Display'] text-4xl md:text-5xl lg:text-6xl font-semibold italic text-[#1a1a1a] mb-6 tracking-tight">
            Structured Capabilities
          </h2>
          <p className="font-['Space_Grotesk'] text-[#1a1a1a]/70 text-lg leading-relaxed">
            We discarded unnecessary abstractions to focus on what matters: structured informational hierarchy, absolute data integrity, and operational velocity.
          </p>
        </div>

        <div className="flex flex-col border-t border-[#1a1a1a]">
          {FEATURES.map((feature, i) => (
            <div 
              key={feature.id} 
              className="feature-row group grid grid-cols-1 md:grid-cols-12 gap-8 py-12 border-b border-[#1a1a1a]/20 hover:bg-[#1a1a1a]/5 transition-colors duration-300"
            >
              <div className="md:col-span-2 font-['Space_Grotesk'] text-lg font-medium text-[#ff6b35]">
                {feature.id}
              </div>
              
              <div className="md:col-span-4">
                <h3 className="font-['Playfair_Display'] text-3xl font-semibold mb-4 text-[#1a1a1a]">
                  {feature.title}
                </h3>
                <p className="font-['Space_Grotesk'] text-[#1a1a1a]/70 text-sm leading-relaxed max-w-sm">
                  {feature.desc}
                </p>
              </div>

              <div className="md:col-span-6 md:pl-12 md:border-l border-[#1a1a1a]/10 flex flex-col justify-center">
                <ul className="space-y-4 font-['Space_Grotesk'] text-sm tracking-wide text-[#1a1a1a]">
                  {feature.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-4">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#ff6b35] shrink-0 mt-0.5">
                        <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="2" />
                      </svg>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
