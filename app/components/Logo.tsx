'use client';

export default function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      {/* Elegant "E" icon - modern geometric design */}
      <svg
        className={className}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main E shape with rounded corners */}
        <path
          d="M6 4 L6 28 L26 28 L26 22 L12 22 L12 18 L24 18 L24 14 L12 14 L12 10 L26 10 L26 4 Z"
          fill="currentColor"
          className="text-primary"
        />
        {/* Elegant accent line */}
        <path
          d="M6 4 L26 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-accent"
          opacity="0.5"
        />
        {/* Subtle inner highlight */}
        <path
          d="M8 6 L24 6"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-accent"
          opacity="0.3"
        />
      </svg>
      {/* Elvance text */}
      <span className="text-xl font-light text-primary tracking-tight">
        Elvance
      </span>
    </div>
  );
}

