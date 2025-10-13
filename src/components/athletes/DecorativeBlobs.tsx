export const FrontBlobs = () => (
  <>
    {/* Top-left blue blob */}
    <svg className="absolute top-0 left-0 w-32 h-32 -z-10" viewBox="0 0 200 200">
      <path
        d="M0,100 C0,45 45,0 100,0 L0,0 Z"
        fill="#3B82F6"
        opacity="0.7"
      />
    </svg>
    
    {/* Bottom-right dark blob */}
    <svg className="absolute bottom-0 right-0 w-40 h-40 -z-10" viewBox="0 0 200 200">
      <path
        d="M200,100 C200,155 155,200 100,200 L200,200 Z"
        fill="#1E40AF"
        opacity="0.8"
      />
    </svg>
    
    {/* Additional accent blob */}
    <svg className="absolute top-1/3 right-0 w-24 h-24 -z-10" viewBox="0 0 200 200">
      <circle cx="200" cy="100" r="80" fill="#60A5FA" opacity="0.5"/>
    </svg>
  </>
);

export const BackBlobs = () => (
  <>
    {/* White blobs on dark background */}
    <svg className="absolute top-0 left-0 w-36 h-36 -z-10" viewBox="0 0 200 200">
      <path
        d="M0,100 C0,45 45,0 100,0 L0,0 Z"
        fill="#FFFFFF"
        opacity="0.15"
      />
    </svg>
    
    <svg className="absolute bottom-0 right-0 w-44 h-44 -z-10" viewBox="0 0 200 200">
      <path
        d="M200,100 C200,155 155,200 100,200 L200,200 Z"
        fill="#FFFFFF"
        opacity="0.12"
      />
    </svg>
    
    <svg className="absolute top-1/2 left-0 w-28 h-28 -z-10" viewBox="0 0 200 200">
      <circle cx="0" cy="100" r="70" fill="#FFFFFF" opacity="0.1"/>
    </svg>
  </>
);
