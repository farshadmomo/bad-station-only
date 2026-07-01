// Sprayed — a word with roughened "spray" glyph edges and paint drips
// hanging off the bottom, like the «بَد» logo. Deterministic (no random)
// so it's safe in server components and won't cause hydration mismatch.
// Drips inherit currentColor and scale with font-size (em units).

// each drip: left position + size (em) + optional mask image / color / opacity.
// color defaults to the text's currentColor so drips match what they hang from.
const DEFAULT_DRIPS = [
  { left: "16%", w: "0.5em", h: "0.9em", o: 0.9 },
  { left: "39%", w: "0.45em", h: "0.7em", img: "/drips/drip-2.png", o: 0.8 },
  { left: "62%", w: "0.5em", h: "1.1em", img: "/drips/drip-3.png", o: 0.75 },
  { left: "83%", w: "0.42em", h: "0.8em", o: 0.85 },
];

export default function Sprayed({
  children,
  className = "",
  drips = DEFAULT_DRIPS,
  halo = false,
  as: Tag = "span",
  style,
  ...rest
}) {
  return (
    <Tag className={`sprayed ${halo ? "spray-halo" : ""} ${className}`} style={style} {...rest}>
      <span className="ink">{children}</span>
      {drips.map((d, i) => (
        <span
          key={i}
          className="spray-drip"
          style={{
            left: d.left,
            width: d.w ?? "0.5em",
            height: d.h ?? "0.9em",
            opacity: d.o ?? 0.85,
            ...(d.top ? { top: d.top } : null),
            ...(d.color ? { color: d.color } : null),
            ...(d.img ? { "--drip": `url(${d.img})` } : null),
          }}
          aria-hidden="true"
        />
      ))}
    </Tag>
  );
}
