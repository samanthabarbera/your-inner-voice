// Starburst motif for Look F · Pop. Pure decoration.
export default function Starburst({ size = 240, color = '#F26BB5', lines = '#FFFFFF', showLines = true, className = '', style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-100 -100 200 200"
      fill="none"
      aria-hidden="true"
      className={className}
      style={style}
    >
      {showLines && (
        <g stroke={lines} strokeWidth="0.5" strokeLinecap="round">
          <path d="M0 0L98 0M0 0L69 69M0 0L0 98M0 0L-69 69M0 0L-98 0M0 0L-69 -69M0 0L0 -98M0 0L69 -69" />
          <path d="M0 0L57 24M0 0L24 57M0 0L-24 57M0 0L-57 24M0 0L-57 -24M0 0L-24 -57M0 0L24 -57M0 0L57 -24" strokeOpacity="0.6" />
        </g>
      )}
      <polygon
        points="62,0 9,4 44,44 4,9 0,62 -4,9 -44,44 -9,4 -62,0 -9,-4 -44,-44 -4,-9 0,-62 4,-9 44,-44 9,-4"
        fill={color}
      />
    </svg>
  )
}
