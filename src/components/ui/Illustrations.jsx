export const LegalIllustrationSVG = () => (
  <svg viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="800" y2="600" gradientUnits="userSpaceOnUse">
        <stop stopColor="var(--color-primary)" stopOpacity="0.05" />
        <stop offset="1" stopColor="var(--color-primary)" stopOpacity="0.1" />
      </linearGradient>
      <linearGradient id="docGrad" x1="200" y1="150" x2="400" y2="450" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ffffff" />
        <stop offset="1" stopColor="#f8fafc" />
      </linearGradient>
      <linearGradient id="glowGrad" x1="300" y1="100" x2="500" y2="300" gradientUnits="userSpaceOnUse">
        <stop stopColor="var(--color-secondary)" stopOpacity="0.4" />
        <stop offset="1" stopColor="var(--color-secondary)" stopOpacity="0" />
      </linearGradient>
      <filter id="shadow" x="180" y="130" width="300" height="400" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="10" stdDeviation="15" floodOpacity="0.1" />
      </filter>
    </defs>

    {/* Abstract Background */ }
    <rect width="800" height="600" fill="url(#bgGrad)" rx="24" />
    <circle cx="600" cy="150" r="250" fill="var(--color-primary)" opacity="0.03" />
    <circle cx="150" cy="450" r="200" fill="var(--color-secondary)" opacity="0.04" />

    {/* Law Book/Document Base */}
    <g filter="url(#shadow)">
      <rect x="250" y="200" width="260" height="320" rx="8" fill="url(#docGrad)" transform="rotate(-5 250 200)" />
      <rect x="230" y="180" width="260" height="320" rx="8" fill="#ffffff" transform="rotate(-10 230 180)" />
    </g>

    {/* Document Details */}
    <g transform="rotate(-10 230 180)">
      <rect x="260" y="210" width="120" height="12" rx="4" fill="var(--color-primary)" opacity="0.2" />
      <rect x="260" y="240" width="200" height="8" rx="4" fill="var(--color-primary)" opacity="0.1" />
      <rect x="260" y="260" width="180" height="8" rx="4" fill="var(--color-primary)" opacity="0.1" />
      <rect x="260" y="280" width="200" height="8" rx="4" fill="var(--color-primary)" opacity="0.1" />
      <rect x="260" y="300" width="160" height="8" rx="4" fill="var(--color-primary)" opacity="0.1" />
      
      {/* Highlighting abstract block */}
      <rect x="260" y="330" width="200" height="40" rx="4" fill="var(--color-secondary)" opacity="0.15" />
      <rect x="270" y="340" width="180" height="6" rx="3" fill="var(--color-primary)" opacity="0.4" />
      <rect x="270" y="355" width="140" height="6" rx="3" fill="var(--color-primary)" opacity="0.3" />
      
      <circle cx="430" cy="450" r="16" fill="var(--color-primary)" />
      <circle cx="430" cy="450" r="6" fill="#ffffff" />
    </g>

    {/* AI / Tech Abstract Overlay */}
    <circle cx="500" cy="250" r="80" fill="url(#glowGrad)" />
    <path d="M420 250 L580 250 M500 170 L500 330 M450 200 L550 300 M450 300 L550 200" stroke="var(--color-secondary)" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
    
    {/* Nodes */}
    <circle cx="420" cy="250" r="6" fill="var(--color-primary)" />
    <circle cx="580" cy="250" r="6" fill="var(--color-primary)" />
    <circle cx="500" cy="170" r="6" fill="var(--color-primary)" />
    <circle cx="500" cy="330" r="6" fill="var(--color-primary)" />
    <circle cx="500" cy="250" r="12" fill="var(--color-secondary)" />
    
    {/* Connection lines to document */}
    <path d="M480 250 Q380 250 350 330" stroke="var(--color-secondary)" strokeWidth="2" fill="none" strokeDasharray="6 4" />
    <circle cx="350" cy="330" r="4" fill="var(--color-secondary)" />
  </svg>
);

export const DashboardMockupSVG = () => (
   <svg viewBox="0 0 800 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <filter id="cardShadow" x="0" y="0" width="800" height="500" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="5" stdDeviation="10" floodOpacity="0.05" />
      </filter>
    </defs>
    
    <rect width="800" height="500" fill="#f8fafc" />
    
    {/* Sidebar */}
    <rect x="0" y="0" width="180" height="500" fill="#ffffff" filter="url(#cardShadow)" />
    <rect x="20" y="20" width="140" height="24" rx="4" fill="var(--color-primary)" opacity="0.1" />
    <rect x="20" y="70" width="100" height="12" rx="4" fill="var(--color-primary)" opacity="0.8" />
    <rect x="20" y="100" width="120" height="12" rx="4" fill="var(--color-primary)" opacity="0.2" />
    <rect x="20" y="130" width="110" height="12" rx="4" fill="var(--color-primary)" opacity="0.2" />
    <rect x="20" y="160" width="130" height="12" rx="4" fill="var(--color-primary)" opacity="0.2" />

    {/* Top Nav */}
    <rect x="180" y="0" width="620" height="60" fill="#ffffff" filter="url(#cardShadow)" />
    <rect x="210" y="20" width="200" height="20" rx="10" fill="var(--color-background)" />
    <circle cx="750" cy="30" r="15" fill="var(--color-primary)" opacity="0.1" />

    {/* Metric Cards */}
    <rect x="210" y="90" width="170" height="90" rx="8" fill="#ffffff" filter="url(#cardShadow)" />
    <rect x="230" y="110" width="60" height="10" rx="4" fill="var(--color-primary)" opacity="0.3" />
    <rect x="230" y="135" width="80" height="24" rx="4" fill="var(--color-primary)" />
    
    <rect x="400" y="90" width="170" height="90" rx="8" fill="#ffffff" filter="url(#cardShadow)" />
    <rect x="420" y="110" width="60" height="10" rx="4" fill="var(--color-primary)" opacity="0.3" />
    <rect x="420" y="135" width="80" height="24" rx="4" fill="var(--color-primary)" opacity="0.8" />

    <rect x="590" y="90" width="170" height="90" rx="8" fill="#ffffff" filter="url(#cardShadow)" />
    <rect x="610" y="110" width="60" height="10" rx="4" fill="var(--color-primary)" opacity="0.3" />
    <rect x="610" y="135" width="80" height="24" rx="4" fill="var(--color-secondary)" />

    {/* Chart Area */}
    <rect x="210" y="200" width="360" height="260" rx="8" fill="#ffffff" filter="url(#cardShadow)" />
    <rect x="240" y="230" width="120" height="14" rx="4" fill="var(--color-primary)" opacity="0.3" />
    
    {/* Bar Chart Mockup */}
    <rect x="250" y="380" width="30" height="40" rx="2" fill="var(--color-primary)" opacity="0.4" />
    <rect x="290" y="320" width="30" height="100" rx="2" fill="var(--color-primary)" opacity="0.6" />
    <rect x="330" y="280" width="30" height="140" rx="2" fill="var(--color-primary)" opacity="0.8" />
    <rect x="370" y="340" width="30" height="80" rx="2" fill="var(--color-primary)" opacity="0.5" />
    <rect x="410" y="260" width="30" height="160" rx="2" fill="var(--color-secondary)" />
    <rect x="450" y="300" width="30" height="120" rx="2" fill="var(--color-primary)" opacity="0.7" />
    <rect x="490" y="360" width="30" height="60" rx="2" fill="var(--color-primary)" opacity="0.4" />

    <line x1="240" y1="420" x2="540" y2="420" stroke="var(--color-primary)" strokeOpacity="0.1" strokeWidth="2" />

    {/* Task List Mockup */}
    <rect x="590" y="200" width="170" height="260" rx="8" fill="#ffffff" filter="url(#cardShadow)" />
    <rect x="610" y="230" width="80" height="14" rx="4" fill="var(--color-primary)" opacity="0.3" />
    
    <rect x="610" y="270" width="130" height="40" rx="4" fill="var(--color-background)" />
    <rect x="620" y="285" width="90" height="10" rx="3" fill="var(--color-primary)" opacity="0.6" />
    
    <rect x="610" y="320" width="130" height="40" rx="4" fill="var(--color-background)" />
    <rect x="620" y="335" width="70" height="10" rx="3" fill="var(--color-primary)" opacity="0.4" />
    
    <rect x="610" y="370" width="130" height="40" rx="4" fill="var(--color-background)" />
    <rect x="620" y="385" width="100" height="10" rx="3" fill="var(--color-primary)" opacity="0.5" />
  </svg>
)
