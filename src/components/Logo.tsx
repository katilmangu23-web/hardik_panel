import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Hexagon Circuit Board - Solid Fill */}
        <path
          d="M32 8L56 20V44L32 56L8 44V20L32 8Z"
          stroke="#06b6d4"
          strokeWidth="2"
          fill="#06b6d4"
          className="drop-shadow-lg"
        />
        
        {/* Circuit Lines */}
        <path
          d="M20 32L44 32"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M32 20L32 44"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* Circuit Nodes */}
        <circle cx="20" cy="32" r="2.5" fill="#ffffff" />
        <circle cx="44" cy="32" r="2.5" fill="#ffffff" />
        <circle cx="32" cy="20" r="2.5" fill="#ffffff" />
        <circle cx="32" cy="44" r="2.5" fill="#ffffff" />
        
        {/* Laptop (Left) */}
        <rect
          x="16"
          y="26"
          width="12"
          height="8"
          rx="1"
          stroke="#ffffff"
          strokeWidth="1.5"
          fill="#1e293b"
        />
        {/* Laptop Screen */}
        <rect
          x="17"
          y="27"
          width="10"
          height="6"
          rx="0.5"
          fill="#06b6d4"
        />
        {/* Code Tag on Laptop Screen */}
        <text
          x="22"
          y="31"
          fontSize="6"
          fill="white"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="monospace"
          fontWeight="bold"
        >
          &lt;/&gt;
        </text>
        
        {/* Smartphone (Right) */}
        <rect
          x="36"
          y="26"
          width="8"
          height="12"
          rx="1"
          stroke="#ffffff"
          strokeWidth="1.5"
          fill="#1e293b"
        />
        {/* Smartphone Home Button */}
        <rect
          x="38"
          y="34"
          width="4"
          height="1"
          rx="0.5"
          fill="#06b6d4"
        />
        
        {/* Additional Circuit Details */}
        <path
          d="M26 26L38 26"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M26 38L38 38"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        
        {/* Hexagon Corner Nodes */}
        <circle cx="32" cy="8" r="2" fill="#00d4ff" />
        <circle cx="56" cy="20" r="2" fill="#00d4ff" />
        <circle cx="56" cy="44" r="2" fill="#00d4ff" />
        <circle cx="32" cy="56" r="2" fill="#00d4ff" />
        <circle cx="8" cy="44" r="2" fill="#00d4ff" />
        <circle cx="8" cy="20" r="2" fill="#00d4ff" />
      </svg>
    </div>
  );
}
