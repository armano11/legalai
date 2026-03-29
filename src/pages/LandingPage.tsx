import React from 'react';
import GlobeScrollDemo from '../components/ui/landing-page';
import { TestimonialsColumn } from '../components/ui/testimonials-columns-1';
import { motion } from 'framer-motion';

const testimonials = [
  {
    text: "JurisCore transformed how we manage litigation. Case tracking, daily updates, and research — all in one place. Our efficiency improved by 40%.",
    image: "https://randomuser.me/api/portraits/women/1.jpg",
    name: "Priya Sharma",
    role: "Managing Partner, Sharma & Associates",
  },
  {
    text: "The case assignment workflow is seamless. I assign cases to associates, track their progress daily, and get real-time updates on research milestones.",
    image: "https://randomuser.me/api/portraits/men/2.jpg",
    name: "Rajesh Patel",
    role: "Senior Partner, Patel Legal Group",
  },
  {
    text: "AI-powered legal research cut our document review time in half. The contract analyzer flags risks we used to miss manually.",
    image: "https://randomuser.me/api/portraits/women/3.jpg",
    name: "Anika Desai",
    role: "Head of Litigation, TechLaw India",
  },
  {
    text: "As an associate, the daily update system keeps me accountable and my partners informed. No more missed deadlines or status meetings.",
    image: "https://randomuser.me/api/portraits/men/4.jpg",
    name: "Vikram Singh",
    role: "Associate Attorney, Singh & Partners",
  },
  {
    text: "The admin dashboard gives me complete visibility across all firm operations. User management, activity logs, and analytics — absolutely enterprise-grade.",
    image: "https://randomuser.me/api/portraits/women/5.jpg",
    name: "Meera Kapoor",
    role: "COO, Kapoor Legal Solutions",
  },
  {
    text: "Draft generation is a game changer. We produce court-ready documents in minutes instead of hours. Our clients are impressed by the turnaround.",
    image: "https://randomuser.me/api/portraits/women/6.jpg",
    name: "Fatima Khan",
    role: "Corporate Counsel, Khan Industries",
  },
  {
    text: "The firm directory with workload indicators helps us balance case distribution. No lawyer is overloaded, and deadlines are always met.",
    image: "https://randomuser.me/api/portraits/men/7.jpg",
    name: "Arjun Mehta",
    role: "HR Director, LegalFirst LLP",
  },
  {
    text: "Switching from spreadsheets to JurisCore was the best decision. The case dashboard alone saved us 15 hours per week in status reporting.",
    image: "https://randomuser.me/api/portraits/women/8.jpg",
    name: "Sunita Reddy",
    role: "Operations Manager, Reddy & Co. Law",
  },
  {
    text: "The analytics module provides insights we never had before. We can now forecast workloads and plan resources months in advance.",
    image: "https://randomuser.me/api/portraits/men/9.jpg",
    name: "Hassan Ali",
    role: "Strategy Director, Ali Legal Advisors",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

function Testimonials() {
  return (
    <section className="py-20 relative bg-background">
      <div className="container z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-primary/5">
            <span className="text-[10px] font-black text-foreground/60 uppercase tracking-[0.2em]">Client Reviews</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-foreground mt-5 text-center">
            Trusted by Leading Law Firms
          </h2>
          <p className="text-center mt-3 text-foreground/50 text-sm">
            See how legal professionals are transforming their practice with JurisCore™.
          </p>
        </motion.div>

        <div className="flex justify-center gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-background min-h-screen selection:bg-[#EC4E02]/30 selection:text-foreground">
      <GlobeScrollDemo />
      <Testimonials />
    </div>
  );
}
