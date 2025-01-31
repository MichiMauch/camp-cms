import { useState, useEffect } from "react"

export function useScrollDirection() {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollTop, setLastScrollTop] = useState(0)

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement
      const currentScrollTop = target.scrollTop

      // Sofortige Überprüfung für schnelleres Ausblenden
      if (currentScrollTop > lastScrollTop && currentScrollTop > 50) {
        setIsVisible(false)
      } else if (currentScrollTop < lastScrollTop) {
        setIsVisible(true)
      }

      setLastScrollTop(currentScrollTop)
    }

    // Warte kurz, bis das DOM vollständig geladen ist
    const timer = setTimeout(() => {
      const scrollArea = document.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollArea) {
        scrollArea.addEventListener("scroll", handleScroll)
      }
    }, 100)

    return () => {
      const scrollArea = document.querySelector("[data-radix-scroll-area-viewport]")
      scrollArea?.removeEventListener("scroll", handleScroll)
      clearTimeout(timer)
    }
  }, [lastScrollTop])

  return isVisible
}

