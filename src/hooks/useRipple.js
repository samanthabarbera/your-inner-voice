import { useCallback } from 'react'

export function useRipple(color = 'rgba(232,248,248,0.3)') {
  const trigger = useCallback((e) => {
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top

    const ripple = document.createElement('div')
    ripple.style.cssText = `
      position: absolute;
      left: ${x}px; top: ${y}px;
      width: 8px; height: 8px;
      margin-left: -4px; margin-top: -4px;
      border-radius: 50%;
      background: ${color};
      pointer-events: none;
      animation: rippleOut 0.9s ease-out forwards;
      z-index: 10;
    `
    // ensure container is positioned
    const prev = el.style.position
    if (!prev || prev === 'static') el.style.position = 'relative'
    el.style.overflow = 'hidden'
    el.appendChild(ripple)
    setTimeout(() => {
      ripple.remove()
      if (!prev || prev === 'static') el.style.position = prev
    }, 900)
  }, [color])

  return trigger
}

// Global keyframe — injected once
if (!document.getElementById('ripple-style')) {
  const s = document.createElement('style')
  s.id = 'ripple-style'
  s.textContent = `@keyframes rippleOut {
    0%   { transform: scale(1);  opacity: 0.7; }
    100% { transform: scale(60); opacity: 0; }
  }`
  document.head.appendChild(s)
}
