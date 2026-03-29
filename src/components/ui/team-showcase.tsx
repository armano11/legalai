import { useState } from 'react';
import {
  FaBehance,
  FaInstagram,
  FaLinkedinIn,
  FaTwitter,
} from 'react-icons/fa';
import { cn } from '@/lib/utils';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  social?: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    behance?: string;
  };
}

const DEFAULT_MEMBERS: TeamMember[] = [
  {
    id: '1',
    name: 'Asha Kapoor',
    role: 'Director of Litigation',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1200&auto=format&fit=crop',
    social: { twitter: '#', linkedin: '#', behance: '#' },
  },
  {
    id: '2',
    name: 'Nikhil Sharma',
    role: 'Founding Partner',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop',
    social: { twitter: '#', linkedin: '#' },
  },
  {
    id: '3',
    name: 'Priya Singh',
    role: 'Head of Regulatory',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1200&auto=format&fit=crop',
    social: { twitter: '#', linkedin: '#' },
  },
  {
    id: '4',
    name: 'Arjun Mehta',
    role: 'Product Owner',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1200&auto=format&fit=crop',
    social: { linkedin: '#' },
  },
  {
    id: '5',
    name: 'Meera Patel',
    role: 'Family Law Specialist',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1200&auto=format&fit=crop',
    social: { twitter: '#', linkedin: '#' },
  },
  {
    id: '6',
    name: 'Vikram Rao',
    role: 'Case Strategist',
    image: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=1200&auto=format&fit=crop',
    social: { instagram: '#' },
  },
];

interface TeamShowcaseProps {
  members?: TeamMember[];
  selectedId?: string | null;
  className?: string;
  onSelectMember?: (member: TeamMember) => void;
  renderAction?: (member: TeamMember) => React.ReactNode;
}

export default function TeamShowcase({
  members = DEFAULT_MEMBERS,
  selectedId = null,
  className,
  onSelectMember,
  renderAction,
}: TeamShowcaseProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(selectedId);
  const activeId = hoveredId ?? selectedId;

  const col1 = members.filter((_, index) => index % 3 === 0);
  const col2 = members.filter((_, index) => index % 3 === 1);
  const col3 = members.filter((_, index) => index % 3 === 2);

  const handleHover = (id: string | null) => {
    setHoveredId(id);
  };

  const handleSelect = (member: TeamMember) => {
    onSelectMember?.(member);
    setHoveredId(member.id);
  };

  return (
    <section
      className={cn(
        'w-full rounded-[1.9rem] border border-white/8 bg-[#121214] p-5 text-white shadow-[0_28px_90px_rgba(0,0,0,0.34)] md:p-7',
        className,
      )}
    >
      <div className="mb-6 flex flex-col gap-3 border-b border-white/8 pb-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-[#b8a06a]">
            Counsel Roster
          </p>
          <h3 className="max-w-xl text-2xl font-semibold tracking-[-0.03em] text-white md:text-[2rem]">
            Senior lawyers, visible case load, and direct profile access.
          </h3>
          <p className="max-w-2xl text-sm leading-6 text-white/55">
            Select any lawyer to inspect their full working profile, current matters,
            and assignment readiness.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/45">
            {members.length} lawyers
          </div>
          {activeId ? (
            <div className="rounded-full border border-[#b8a06a]/25 bg-[#b8a06a]/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#f3deb0]">
              profile selected
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.5rem] border border-white/8 bg-[#0d0d0f] p-4 md:p-5">
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <div className="flex flex-col gap-3 md:gap-4">
              {col1.map((member) => (
                <PhotoCard
                  key={member.id}
                  member={member}
                  className="h-[140px] w-full sm:h-[170px] md:h-[190px]"
                  activeId={activeId}
                  onHover={handleHover}
                  onSelect={handleSelect}
                />
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-3 md:mt-14 md:gap-4">
              {col2.map((member) => (
                <PhotoCard
                  key={member.id}
                  member={member}
                  className="h-[160px] w-full sm:h-[190px] md:h-[220px]"
                  activeId={activeId}
                  onHover={handleHover}
                  onSelect={handleSelect}
                />
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-3 md:mt-8 md:gap-4">
              {col3.map((member) => (
                <PhotoCard
                  key={member.id}
                  member={member}
                  className="h-[148px] w-full sm:h-[178px] md:h-[205px]"
                  activeId={activeId}
                  onHover={handleHover}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/8 bg-[#0d0d0f] p-3 md:p-4">
          <div className="mb-3 flex items-center justify-between px-2 pb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-white/35">
              Directory
            </p>
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/25">
              click to open
            </p>
          </div>
          <div className="flex w-full flex-col gap-1">
            {members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                activeId={activeId}
                onHover={handleHover}
                onSelect={handleSelect}
                action={renderAction?.(member)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PhotoCard({
  member,
  className,
  activeId,
  onHover,
  onSelect,
}: {
  member: TeamMember;
  className: string;
  activeId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (member: TeamMember) => void;
}) {
  const isActive = activeId === member.id;
  const isDimmed = activeId !== null && !isActive;

  return (
    <button
      type="button"
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-[1.2rem] border border-white/8 bg-[#16161a] text-left transition duration-300',
        className,
        isDimmed ? 'opacity-45' : 'opacity-100',
        isActive && 'border-[#b8a06a]/45 shadow-[0_18px_40px_rgba(0,0,0,0.35)]',
      )}
      onMouseEnter={() => onHover(member.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(member.id)}
      onBlur={() => onHover(null)}
      onClick={() => onSelect(member)}
    >
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/72 via-black/10 to-transparent" />
      <img
        src={member.image}
        alt={member.name}
        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        loading="lazy"
        style={{
          filter: isActive
            ? 'grayscale(0) brightness(1)'
            : 'grayscale(0.22) brightness(0.72)',
        }}
      />
      <div className="absolute inset-x-0 bottom-0 z-20 p-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/65">
          {member.role}
        </div>
        <div className="mt-1 text-sm font-semibold tracking-[0.01em] text-white md:text-[15px]">
          {member.name}
        </div>
      </div>
    </button>
  );
}

function MemberRow({
  member,
  activeId,
  onHover,
  onSelect,
  action,
}: {
  member: TeamMember;
  activeId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (member: TeamMember) => void;
  action?: React.ReactNode;
}) {
  const isActive = activeId === member.id;
  const isDimmed = activeId !== null && !isActive;
  const hasSocial =
    member.social?.twitter ??
    member.social?.linkedin ??
    member.social?.instagram ??
    member.social?.behance;

  return (
    <div
      className={cn(
        'group cursor-pointer rounded-[1.1rem] border border-transparent px-3 py-3 transition duration-300',
        isDimmed ? 'opacity-45' : 'opacity-100',
        isActive
          ? 'border-[#b8a06a]/20 bg-[#18181c]'
          : 'hover:border-white/8 hover:bg-[#141418]',
      )}
      onMouseEnter={() => onHover(member.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(member)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                'h-2.5 w-2.5 flex-shrink-0 rounded-full transition-all duration-300',
                isActive
                  ? 'bg-[#c8ab6b] shadow-[0_0_0_4px_rgba(200,171,107,0.12)]'
                  : 'bg-white/20',
              )}
            />
            <span
              className={cn(
                'truncate text-[15px] font-semibold leading-none tracking-[-0.01em] transition-colors duration-300 md:text-[17px]',
                isActive ? 'text-white' : 'text-white/84',
              )}
            >
              {member.name}
            </span>

            {hasSocial && (
              <div
                className={cn(
                  'ml-0.5 flex items-center gap-1.5 transition-all duration-200',
                  isActive
                    ? 'translate-x-0 opacity-100'
                    : '-translate-x-2 opacity-0 pointer-events-none',
                )}
              >
                {member.social?.twitter && (
                  <a
                    href={member.social.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className="rounded p-1 text-white/35 transition-all duration-150 hover:scale-110 hover:bg-white/8 hover:text-white"
                    title="X / Twitter"
                  >
                    <FaTwitter size={10} />
                  </a>
                )}
                {member.social?.linkedin && (
                  <a
                    href={member.social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className="rounded p-1 text-white/35 transition-all duration-150 hover:scale-110 hover:bg-white/8 hover:text-white"
                    title="LinkedIn"
                  >
                    <FaLinkedinIn size={10} />
                  </a>
                )}
                {member.social?.instagram && (
                  <a
                    href={member.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className="rounded p-1 text-white/35 transition-all duration-150 hover:scale-110 hover:bg-white/8 hover:text-white"
                    title="Instagram"
                  >
                    <FaInstagram size={10} />
                  </a>
                )}
                {member.social?.behance && (
                  <a
                    href={member.social.behance}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className="rounded p-1 text-white/35 transition-all duration-150 hover:scale-110 hover:bg-white/8 hover:text-white"
                    title="Behance"
                  >
                    <FaBehance size={10} />
                  </a>
                )}
              </div>
            )}
          </div>

          <p className="mt-1.5 pl-5 text-[10px] font-medium uppercase tracking-[0.24em] text-white/38">
            {member.role}
          </p>
        </div>

        {action ? <div className="flex-shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
