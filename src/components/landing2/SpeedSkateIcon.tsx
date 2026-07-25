interface SpeedSkateIconProps {
  className?: string;
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
  wheelColor?: string;
}

export default function SpeedSkateIcon({
  className = '',
  size = 40,
  primaryColor = '#3B82F6',
  secondaryColor = '#1E40AF',
  wheelColor = '#F97316',
}: SpeedSkateIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* ── BOOT BODY (bota corta de patín de velocidad) ── */}
      {/* Caña trasera baja — característica del patín de velocidad */}
      <path
        d="M6 26 L6 17 Q6 11 13 11 L16 11 Q19 11 19 14 L19 20"
        fill={secondaryColor}
        stroke={secondaryColor}
        strokeWidth="0.5"
      />
      {/* Cuerpo principal de la bota — perfil aerodinámico bajo */}
      <path
        d="M6 26 L6 17 Q6 11 13 11 L17 11 Q20 11 20 14 L20 20
           L20 22 L44 22 L50 24 L52 26 Z"
        fill={primaryColor}
      />
      {/* Lengüeta y cordones */}
      <path
        d="M16 11 L16 21"
        stroke="white"
        strokeWidth="1"
        strokeOpacity="0.4"
      />
      {/* Línea decorativa superior bota */}
      <path
        d="M19 14 Q30 12 42 15 L50 20"
        stroke="white"
        strokeWidth="0.8"
        strokeOpacity="0.3"
        fill="none"
      />
      {/* Puntera aerodinámica (punta larga = patín de velocidad) */}
      <path
        d="M44 22 L52 24 Q58 25 60 27 L52 27 Z"
        fill={primaryColor}
      />
      {/* Highlight en la puntera */}
      <path
        d="M44 22 Q52 21 58 24"
        stroke="white"
        strokeWidth="0.8"
        strokeOpacity="0.35"
        fill="none"
      />

      {/* ── CHASIS / FRAME (largo, característico del patín de velocidad) ── */}
      <rect
        x="4"
        y="26"
        width="56"
        height="4"
        rx="2"
        fill={secondaryColor}
      />
      {/* Línea central del chasis */}
      <rect
        x="4"
        y="27.5"
        width="56"
        height="1"
        rx="0.5"
        fill="white"
        opacity="0.2"
      />

      {/* ── 4 RUEDAS (inline, baja fricción) ── */}
      {/* Rueda 1 */}
      <circle cx="12" cy="34" r="6" fill="#1E293B" />
      <circle cx="12" cy="34" r="5" fill={wheelColor} />
      <circle cx="12" cy="34" r="2.5" fill="#1E293B" />
      <circle cx="12" cy="34" r="1.2" fill={wheelColor} opacity="0.6" />

      {/* Rueda 2 */}
      <circle cx="26" cy="34" r="6" fill="#1E293B" />
      <circle cx="26" cy="34" r="5" fill={wheelColor} />
      <circle cx="26" cy="34" r="2.5" fill="#1E293B" />
      <circle cx="26" cy="34" r="1.2" fill={wheelColor} opacity="0.6" />

      {/* Rueda 3 */}
      <circle cx="40" cy="34" r="6" fill="#1E293B" />
      <circle cx="40" cy="34" r="5" fill={wheelColor} />
      <circle cx="40" cy="34" r="2.5" fill="#1E293B" />
      <circle cx="40" cy="34" r="1.2" fill={wheelColor} opacity="0.6" />

      {/* Rueda 4 */}
      <circle cx="54" cy="34" r="6" fill="#1E293B" />
      <circle cx="54" cy="34" r="5" fill={wheelColor} />
      <circle cx="54" cy="34" r="2.5" fill="#1E293B" />
      <circle cx="54" cy="34" r="1.2" fill={wheelColor} opacity="0.6" />

      {/* ── DETALLES DE VELOCIDAD (líneas de movimiento) ── */}
      <line x1="2" y1="18" x2="8" y2="18" stroke={wheelColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="0" y1="21" x2="5" y2="21" stroke={wheelColor} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <line x1="1" y1="24" x2="5" y2="24" stroke={wheelColor} strokeWidth="0.8" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}
