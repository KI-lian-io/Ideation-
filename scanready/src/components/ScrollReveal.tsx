'use client'
import { useEffect } from 'react'

/**
 * Scroll-reveal driver. Renders nothing.
 *
 * Hydration-safe by construction: the hidden state lives behind `.reveal-ready`
 * on <html>, which only this effect adds — after hydration. So SSR markup (no
 * reveal-ready → everything visible) matches the client's first render, and
 * without JS the page degrades to fully visible. The reveal CSS is in globals.css.
 */
export function ScrollReveal() {
  useEffect(() => {
    // Respect reduced motion: never hide, never animate — leave everything visible.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    document.documentElement.classList.add('reveal-ready')
    const sections = Array.from(document.querySelectorAll<HTMLElement>('.section-animate'))
    // Hero shows immediately (same tick as hiding → no flash).
    sections[0]?.classList.add('section-visible')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('section-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )
    sections.slice(1).forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return null
}
