// The Recipe Box's own mark - fork, plate, knife - so the button that jumps to
// that app is recognisable as belonging to it.
//
// Drawn rather than borrowing its PNG on purpose: that file is a solid dark
// green tile with white cutlery, which would sit as a green square on top of
// Mealz's cards. This is the same place setting on a transparent background,
// taking its colour from the text around it, so it works on the pale surfaces
// and on the orange Today card alike.
export default function RecipeBoxIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`rb-icon ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {/* Fork: three tines, then a neck down into the handle. The tines are
          deliberately finer than the handle, so it reads as a fork rather than
          a single blob once it is down at button size. */}
      <path
        d="M2.7 3.2v4.4M4.5 3.2v4.4M6.3 3.2v4.4"
        strokeWidth="1.05"
        strokeLinecap="round"
      />
      <path d="M2.7 7.6h3.6" strokeWidth="1.05" strokeLinecap="round" />
      <path d="M4.5 8.1v12.7" strokeWidth="1.5" strokeLinecap="round" />

      {/* Plate */}
      <circle cx="12" cy="12" r="5" strokeWidth="1.45" />
      <circle cx="12" cy="12" r="2.6" strokeWidth="0.9" opacity="0.6" />

      {/* Knife: tapered blade over a handle */}
      <path
        d="M18.6 3.2c1.7 1.3 2.2 3.8 1.7 6.3h-1.7z"
        fill="currentColor"
        stroke="none"
      />
      <path d="M19.45 9.8v11" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
