/**
 * Progressive reveal of below-the-fold homepage content.
 * The source HTML is always visible without JavaScript or when motion is reduced.
 * Only opacity/transform are animated, so layout geometry never changes.
 */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const targets = document.querySelectorAll<HTMLElement>('[data-fd-reveal]');

if ('IntersectionObserver' in window && !reduceMotion.matches && targets.length > 0) {
  const observer = new IntersectionObserver((entries, activeObserver) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const element = entry.target as HTMLElement;
      element.classList.add('fd-is-visible');
      activeObserver.unobserve(element);
    }
  }, { rootMargin: '0px 0px -32px 0px', threshold: 0.04 });

  for (const element of targets) {
    // Content already in the viewport must never be hidden during page load.
    if (element.getBoundingClientRect().top < window.innerHeight - 16) continue;
    element.classList.add('fd-will-reveal');
    observer.observe(element);
  }

  reduceMotion.addEventListener('change', (event) => {
    if (!event.matches) return;
    observer.disconnect();
    for (const element of targets) {
      element.classList.remove('fd-will-reveal');
      element.classList.remove('fd-is-visible');
    }
  });
}
