export interface SampleDesign {
  id: string;
  name: string;
  category: string;
  dataUrl: string;
  width: number;
  height: number;
  description: string;
}

// Crisp sample SVG designs tailored to standard 2000 x 950 panoramic sublimation templates
export const SAMPLE_DESIGNS: SampleDesign[] = [
  {
    id: 'coffee-lover',
    name: 'Coffee & Code Typography',
    category: 'Tipografía',
    description: 'Composición panorámica ideal para programadores y amantes del café',
    width: 2000,
    height: 950,
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 950" width="2000" height="950">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e1b4b" />
            <stop offset="50%" stop-color="#312e81" />
            <stop offset="100%" stop-color="#0f172a" />
          </linearGradient>
          <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#f59e0b" />
            <stop offset="100%" stop-color="#fbbf24" />
          </linearGradient>
        </defs>
        <rect width="2000" height="950" fill="url(#bg)" />
        
        <!-- Left Zone (Reverse) -->
        <g transform="translate(320, 475)">
          <circle r="140" fill="#3b82f6" opacity="0.15" />
          <path d="M-60,-40 C-60,-80 60,-80 60,-40 C60,40 40,80 0,90 C-40,80 -60,40 -60,-40 Z" fill="none" stroke="#60a5fa" stroke-width="8" stroke-linecap="round"/>
          <path d="M60,-20 C85,-20 95,0 95,15 C95,35 80,50 55,50" fill="none" stroke="#60a5fa" stroke-width="8" stroke-linecap="round"/>
          <path d="M-25,-90 Q0,-120 -20,-150" fill="none" stroke="#93c5fd" stroke-width="6" stroke-linecap="round" opacity="0.7"/>
          <path d="M15,-90 Q40,-125 20,-160" fill="none" stroke="#93c5fd" stroke-width="6" stroke-linecap="round" opacity="0.7"/>
          <text y="160" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="700" font-size="36" fill="#bfdbfe" letter-spacing="4">DEV FUEL</text>
        </g>

        <!-- Center Zone -->
        <g transform="translate(1000, 475)">
          <text y="-80" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="800" font-size="74" fill="#ffffff" letter-spacing="6">FIRST I DRINK</text>
          <text y="10" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="110" fill="url(#accent)" letter-spacing="4">THE COFFEE</text>
          <text y="90" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="600" font-size="44" fill="#94a3b8" letter-spacing="8">THEN I WRITE THE CODE</text>
          <line x1="-350" y1="150" x2="350" y2="150" stroke="#f59e0b" stroke-width="4" stroke-dasharray="16 12" />
        </g>

        <!-- Right Zone (Front) -->
        <g transform="translate(1680, 475)">
          <rect x="-140" y="-140" width="280" height="280" rx="32" fill="#4338ca" opacity="0.25" stroke="#6366f1" stroke-width="4" />
          <text y="-10" text-anchor="middle" font-family="monospace" font-weight="800" font-size="72" fill="#a5b4fc">&lt;/&gt;</text>
          <text y="70" text-anchor="middle" font-family="monospace" font-weight="700" font-size="32" fill="#c7d2fe">WHILE(ALIVE)</text>
          <text y="110" text-anchor="middle" font-family="monospace" font-weight="600" font-size="28" fill="#818cf8">sip();</text>
        </g>
      </svg>
    `)}`,
  },
  {
    id: 'sunset-landscape',
    name: 'Sunset Minimal Panorama',
    category: 'Paisaje',
    description: 'Ilustración panorámica con degradados cálidos y siluetas montañosas',
    width: 2000,
    height: 950,
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 950" width="2000" height="950">
        <defs>
          <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0f172a" />
            <stop offset="35%" stop-color="#7c2d12" />
            <stop offset="65%" stop-color="#ea580c" />
            <stop offset="85%" stop-color="#fbbf24" />
            <stop offset="100%" stop-color="#fef08a" />
          </linearGradient>
        </defs>
        <rect width="2000" height="950" fill="url(#sky)" />
        
        <!-- Big Sun -->
        <circle cx="1000" cy="500" r="220" fill="#ffedd5" opacity="0.95" />

        <!-- Distant Mountains -->
        <polygon points="0,950 0,680 340,510 650,660 1000,480 1380,680 1700,520 2000,720 2000,950" fill="#431407" opacity="0.85" />

        <!-- Mid Mountains -->
        <polygon points="0,950 0,760 260,650 560,780 840,640 1200,810 1560,670 1850,790 2000,730 2000,950" fill="#260e05" opacity="0.92" />

        <!-- Foreground Ridge -->
        <polygon points="0,950 0,840 400,790 750,880 1100,820 1450,890 1800,830 2000,870 2000,950" fill="#0c0a09" />
        
        <!-- Subtle Birds -->
        <g stroke="#431407" stroke-width="4" fill="none" stroke-linecap="round">
          <path d="M680,340 Q695,330 710,340 Q725,330 740,340" />
          <path d="M730,310 Q742,302 755,310 Q767,302 780,310" />
          <path d="M1280,330 Q1295,320 1310,330 Q1325,320 1340,330" />
        </g>
        
        <text x="1000" y="890" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="600" font-size="32" fill="#fde68a" letter-spacing="12">CHASING HORIZONS</text>
      </svg>
    `)}`,
  },
  {
    id: 'botanical-pattern',
    name: 'Wild Botanical Flora',
    category: 'Arte Orgánico',
    description: 'Diseño botánico continuo en tonalidades terracota y verde salvia',
    width: 2000,
    height: 950,
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 950" width="2000" height="950">
        <rect width="2000" height="950" fill="#f7f5f0" />
        <circle cx="280" cy="475" r="260" fill="#e8dfd8" opacity="0.6"/>
        <circle cx="1000" cy="475" r="320" fill="#e0e7db" opacity="0.6"/>
        <circle cx="1720" cy="475" r="260" fill="#f0dfd5" opacity="0.6"/>
        
        <!-- Left motif -->
        <g transform="translate(300, 480) scale(1.4)" stroke="#3f4e3d" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M0,120 Q-20,40 -10,-120" />
          <path d="M-12,50 Q-60,30 -60,0 Q-30,10 -14,30" fill="#60725a" fill-opacity="0.3"/>
          <path d="M-10,0 Q-70,-30 -60,-70 Q-25,-40 -8,-20" fill="#60725a" fill-opacity="0.3"/>
          <path d="M-5,-40 Q-50,-90 -20,-110 Q-5,-80 -4,-55" fill="#60725a" fill-opacity="0.3"/>
          <path d="M-15,30 Q40,10 40,-20 Q10,0 -8,15" fill="#a46d54" fill-opacity="0.25"/>
          <path d="M-10,-20 Q45,-50 45,-80 Q15,-60 -5,-35" fill="#a46d54" fill-opacity="0.25"/>
        </g>

        <!-- Center badge -->
        <g transform="translate(1000, 475)">
          <circle r="190" fill="#ffffff" stroke="#3f4e3d" stroke-width="4" stroke-dasharray="8 6"/>
          <text y="-25" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="52" fill="#2d372c">Live Simply</text>
          <path d="M-80,10 Q0,30 80,10" stroke="#a46d54" stroke-width="4" fill="none"/>
          <text y="60" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="600" font-size="24" fill="#6b7c65" letter-spacing="6">BLOOM EVERY DAY</text>
        </g>

        <!-- Right motif -->
        <g transform="translate(1700, 480) scale(1.4) scale(-1, 1)" stroke="#3f4e3d" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M0,120 Q-20,40 -10,-120" />
          <path d="M-12,50 Q-60,30 -60,0 Q-30,10 -14,30" fill="#60725a" fill-opacity="0.3"/>
          <path d="M-10,0 Q-70,-30 -60,-70 Q-25,-40 -8,-20" fill="#60725a" fill-opacity="0.3"/>
          <path d="M-15,30 Q40,10 40,-20 Q10,0 -8,15" fill="#a46d54" fill-opacity="0.25"/>
        </g>
      </svg>
    `)}`,
  },
];
