// The Recipe Box's place setting, so the button that jumps to that app is
// recognisable as belonging to it.
//
// This is the supplied artwork rather than a drawn approximation: the original
// is green on an off-white background, reduced here to a transparent 128px
// square (see public/recipe-box.png) so it sits on any of Mealz's surfaces and
// stays crisp at the ~20-26px the buttons actually render it at.
const ICON_SRC = '/recipe-box.png'

export default function RecipeBoxIcon({ className = '' }: { className?: string }) {
  return (
    <img
      className={`rb-icon ${className}`.trim()}
      src={ICON_SRC}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  )
}
