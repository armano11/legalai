import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { ArrowUpRight, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KineticTeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  subtitle?: string;
}

interface KineticTeamHybridProps {
  members: KineticTeamMember[];
  title?: string;
  eyebrow?: string;
  footerLabel?: string;
  className?: string;
  onSelectMember?: (member: KineticTeamMember) => void;
}

export default function KineticTeamHybrid({
  members,
  title = "Legal Bench",
  eyebrow = "Firm Roster",
  footerLabel = "Review profiles and assign matters instantly.",
  className,
  onSelectMember,
}: KineticTeamHybridProps) {
  const [activeId, setActiveId] = useState<string | null>(members[0]?.id ?? null);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const cursorX = useSpring(mouseX, { damping: 22, stiffness: 180, mass: 0.55 });
  const cursorY = useSpring(mouseY, { damping: 22, stiffness: 180, mass: 0.55 });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!members.length) {
      setActiveId(null);
      return;
    }
    if (!activeId || !members.some((member) => member.id === activeId)) {
      setActiveId(members[0].id);
    }
  }, [members, activeId]);

  const activeMember = useMemo(
    () => members.find((member) => member.id === activeId) ?? null,
    [members, activeId]
  );

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isMobile) return;
    mouseX.set(event.clientX + 24);
    mouseY.set(event.clientY + 24);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#09090b] px-6 py-10 text-white shadow-[0_30px_120px_rgba(0,0,0,0.45)] md:px-10",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.1),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05),transparent_20%,transparent_80%,rgba(255,255,255,0.03))]" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <motion.header
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="mb-12 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.45em] text-amber-300/80">
              {eyebrow}
            </p>
            <h2 className="max-w-3xl text-4xl font-light tracking-tight text-white sm:text-5xl">
              {title} <span className="text-white/35">in motion</span>
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-white/55">{footerLabel}</p>
        </motion.header>

        {!members.length ? (
          <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.03] px-6 py-16 text-center text-sm text-white/55">
            No lawyers are available for this workspace yet.
          </div>
        ) : (
          <div className="flex flex-col">
            {members.map((member, index) => (
              <TeamRow
                key={member.id}
                data={member}
                index={index}
                isActive={activeId === member.id}
                isMobile={isMobile}
                isAnyActive={activeId !== null}
                setActiveId={setActiveId}
                onSelectMember={onSelectMember}
              />
            ))}
          </div>
        )}
      </div>

      {!isMobile && activeMember && (
        <motion.div
          style={{ x: cursorX, y: cursorY }}
          className="pointer-events-none fixed left-0 top-0 z-50 hidden xl:block"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMember.id}
              initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="relative h-72 w-80 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#111214] shadow-2xl"
            >
              <img
                src={activeMember.image}
                alt={activeMember.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-[10px] uppercase tracking-[0.35em] text-white/70">
                    Ready to Assign
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white">{activeMember.name}</h3>
                <p className="mt-1 text-sm text-white/65">{activeMember.role}</p>
                {activeMember.subtitle ? (
                  <p className="mt-3 text-xs leading-5 text-white/65">{activeMember.subtitle}</p>
                ) : null}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

function TeamRow({
  data,
  index,
  isActive,
  isMobile,
  isAnyActive,
  setActiveId,
  onSelectMember,
}: {
  data: KineticTeamMember;
  index: number;
  isActive: boolean;
  isMobile: boolean;
  isAnyActive: boolean;
  setActiveId: (id: string | null) => void;
  onSelectMember?: (member: KineticTeamMember) => void;
}) {
  const isDimmed = isAnyActive && !isActive;

  const activate = () => setActiveId(data.id);
  const handleSelect = () => {
    activate();
    onSelectMember?.(data);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{
        opacity: isDimmed ? 0.38 : 1,
        y: 0,
        backgroundColor: isActive && isMobile ? "rgba(255,255,255,0.04)" : "transparent",
      }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      onMouseEnter={() => !isMobile && activate()}
      onMouseLeave={() => !isMobile && setActiveId(null)}
      onClick={() => {
        if (isMobile) {
          setActiveId(isActive ? null : data.id);
        }
        handleSelect();
      }}
      className={cn(
        "group relative border-t border-white/10 transition-colors duration-500 last:border-b",
        isMobile ? "cursor-pointer" : "cursor-pointer"
      )}
    >
      <div className="relative z-10 flex flex-col gap-4 py-7 md:flex-row md:items-center md:justify-between md:gap-6 md:py-10">
        <div className="flex items-baseline gap-5 pl-2 transition-transform duration-500 group-hover:translate-x-2 md:gap-10 md:pl-0">
          <span className="font-mono text-xs text-white/35">{String(index + 1).padStart(2, "0")}</span>
          <div>
            <h3 className="text-3xl font-medium tracking-tight text-white/55 transition-colors duration-300 group-hover:text-white md:text-5xl">
              {data.name}
            </h3>
            {data.subtitle ? (
              <p className="mt-2 text-xs uppercase tracking-[0.25em] text-white/35">{data.subtitle}</p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 pl-12 pr-2 md:justify-end md:gap-8 md:pl-0 md:pr-0">
          <span className="text-xs font-semibold uppercase tracking-[0.26em] text-white/45">
            {data.role}
          </span>
          <div className="text-white/55 md:hidden">{isActive ? <Minus size={18} /> : <Plus size={18} />}</div>
          <motion.div
            animate={{ x: isActive ? 0 : -10, opacity: isActive ? 1 : 0 }}
            className="hidden text-white md:block"
          >
            <ArrowUpRight size={28} strokeWidth={1.5} />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isMobile && isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="overflow-hidden pb-4"
          >
            <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-3">
              <div className="relative aspect-[16/10] overflow-hidden rounded-[1rem]">
                <img src={data.image} alt={data.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-white/80">View Profile</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
