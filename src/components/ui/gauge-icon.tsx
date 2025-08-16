export function GaugeIcon({ className = "w-6 h-6", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Gauge casing/frame */}
      <path
        d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"
        fill="#4B5563"
        stroke="#1F2937"
        strokeWidth="2"
      />
      
      {/* Gauge dial face */}
      <path
        d="M12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3"
        fill="#E0E7FF"
        stroke="#1F2937"
        strokeWidth="1.5"
      />
      
      {/* Gauge markings (dots) */}
      <circle cx="4" cy="12" r="1" fill="#1F2937" />
      <circle cx="6" cy="8" r="1" fill="#1F2937" />
      <circle cx="8" cy="5" r="1" fill="#1F2937" />
      <circle cx="12" cy="4" r="1" fill="#1F2937" />
      <circle cx="16" cy="5" r="1" fill="#1F2937" />
      <circle cx="18" cy="8" r="1" fill="#1F2937" />
      <circle cx="20" cy="12" r="1" fill="#1F2937" />
      <circle cx="18" cy="16" r="1" fill="#1F2937" />
      <circle cx="16" cy="19" r="1" fill="#1F2937" />
      <circle cx="12" cy="20" r="1" fill="#1F2937" />
      
      {/* Needle pivot point */}
      <circle cx="12" cy="12" r="1.5" fill="#EF4444" />
      
      {/* Needle */}
      <line
        x1="12"
        y1="12"
        x2="16"
        y2="8"
        stroke="#1F2937"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
