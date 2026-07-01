/**
 * design-tokens.ts
 * Centralized Framer Motion animation presets for LegalForge premium UI.
 * Import these across all modules for consistent, controlled motion.
 */

// ─── Page-level entrance ─────────────────────────
export const pageTransition = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.4, ease: "easeOut" },
};

// ─── Stagger container (wrap around lists/grids) ──
export const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

// ─── Individual child fade-up ─────────────────────
export const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

// ─── Card hover (use with whileHover) ─────────────
export const cardHover = {
  y: -3,
  scale: 1.01,
  transition: { type: "spring" as const, stiffness: 400, damping: 25 },
};

// ─── Button press (use with whileTap) ─────────────
export const buttonTap = {
  scale: 0.97,
  transition: { type: "spring" as const, stiffness: 500, damping: 30 },
};

// ─── Slide-in from right (panels, sidebars) ──────
export const slideInRight = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 16 },
  transition: { duration: 0.3, ease: "easeOut" },
};

// ─── Slide-in from left ──────────────────────────
export const slideInLeft = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
  transition: { duration: 0.3, ease: "easeOut" },
};

// ─── Modal / overlay entrance ─────────────────────
export const modalTransition = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 8 },
  transition: { duration: 0.2, ease: "easeOut" },
};

// ─── Expand/collapse (height animation) ──────────
export const expandCollapse = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.3, ease: "easeInOut" },
};

// ─── Section reveal on scroll (use with whileInView) 
export const sectionReveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.5, ease: "easeOut" },
};
