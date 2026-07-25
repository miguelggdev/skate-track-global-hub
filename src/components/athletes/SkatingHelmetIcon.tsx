export const SkatingHelmetIcon = ({ className = "w-16 h-16" }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M32 8C20 8 12 16 12 28C12 32 13 35 15 38L18 44H46L49 38C51 35 52 32 52 28C52 16 44 8 32 8Z"
        fill="#001F54"
        stroke="#001F54"
        strokeWidth="2"
      />
      <ellipse cx="32" cy="46" rx="18" ry="4" fill="#001F54" opacity="0.3" />
      <path
        d="M18 44C18 44 20 48 22 50C24 52 26 54 32 54C38 54 40 52 42 50C44 48 46 44 46 44"
        stroke="#001F54"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="24" cy="26" r="2" fill="white" />
      <circle cx="40" cy="26" r="2" fill="white" />
      <path
        d="M28 32C28 32 30 34 32 34C34 34 36 32 36 32"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};
