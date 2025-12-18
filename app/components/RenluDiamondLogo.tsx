'use client';

interface RenluDiamondLogoProps {
  size?: number;
}

export default function RenluDiamondLogo({ size = 24 }: RenluDiamondLogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M10 2L15 7L10 12L5 7L10 2Z" fill="url(#gradient1-logo)"/>
      <path d="M10 8L15 13L10 18L5 13L10 8Z" fill="url(#gradient2-logo)" opacity="0.6"/>
      <defs>
        <linearGradient id="gradient1-logo" x1="5" y1="2" x2="15" y2="12">
          <stop offset="0%" stopColor="#14b8a6"/>
          <stop offset="100%" stopColor="#2dd4bf"/>
        </linearGradient>
        <linearGradient id="gradient2-logo" x1="5" y1="8" x2="15" y2="18">
          <stop offset="0%" stopColor="#14b8a6"/>
          <stop offset="100%" stopColor="#0d9488"/>
        </linearGradient>
      </defs>
    </svg>
  );
}
