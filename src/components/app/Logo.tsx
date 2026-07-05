// SI-TRACK TANAH brand logo — falls back to inline SVG when no custom logo URL provided
export function Logo({ size = 40, className = "", src, alt }: { size?: number; className?: string; src?: string; alt?: string }) {
  // Use uploaded custom logo if provided
  if (src) {
    return (
      <img
        src={src}
        alt={alt || "Logo"}
        width={size}
        height={size}
        className={`object-contain ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  // Fallback — inline SVG brand mark (gold + navy)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SI-TRACK TANAH logo"
    >
      <defs>
        <linearGradient id="sit-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5d77a" />
          <stop offset="55%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#b8941f" />
        </linearGradient>
        <linearGradient id="sit-navy" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="#0a1628" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#sit-navy)" stroke="url(#sit-gold)" strokeWidth="2" />
      {/* document */}
      <path d="M20 14h16l10 10v26a2 2 0 0 1-2 2H20a2 2 0 0 1-2-2V16a2 2 0 0 1 2-2z" fill="#0a1628" stroke="url(#sit-gold)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M36 14v10h10" fill="none" stroke="url(#sit-gold)" strokeWidth="2" strokeLinejoin="round" />
      {/* location pin */}
      <circle cx="32" cy="40" r="7" fill="url(#sit-gold)" />
      <path d="M32 36a4 4 0 0 1 0 8" fill="#0a1628" />
      <path d="M32 47v6" stroke="url(#sit-gold)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="40" r="2.4" fill="#0a1628" />
    </svg>
  );
}

export function LogoFull({ className = "", src, appName, appSubtitle }: { className?: string; src?: string; appName?: string; appSubtitle?: string }) {
  const name = appName || "SI-TRACK TANAH";
  const subtitle = appSubtitle || "Kuala Pembuang II";
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Logo size={38} src={src} alt={`${name} logo`} />
      <div className="flex flex-col leading-tight">
        <span className="gold-gradient-text font-extrabold tracking-tight text-lg">{name}</span>
        <span className="text-[10px] text-muted-foreground tracking-wide uppercase">{subtitle}</span>
      </div>
    </div>
  );
}
