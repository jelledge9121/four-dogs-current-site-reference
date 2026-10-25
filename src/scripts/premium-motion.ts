/**
 * Progressive enhancement: below-the-fold items remain visible at all times.
 * Motion begins on intersection, but never blocks content, screenshots, or
 * fast-scrolling visitors. No observer or reduced motion => static content.
 */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const targets = document.querySelectorAll<HTMLElement>('[data-fd-reveal]');

if ('IntersectionObserver' in window && !reduceMotion.matches && targets.length > 0) {
  const observer = new IntersectionObserver((entries, activeObserver) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const element = entry.target as HTMLElement;
      element.classList.add('fd-reveal-play');
      activeObserver.unobserve(element);
    }
  }, { rootMargin: '0px 0px 80px 0px', threshold: 0.01 });

  for (const element of targets) {
    // Initial visible elements never animate or flash on page load.
    if (element.getBoundingClientRect().top <= window.innerHeight + 80) continue;
    observer.observe(element);
  }

  reduceMotion.addEventListener('change', (event) => {
    if (!event.matches) return;
    observer.disconnect();
    for (const element of targets) element.classList.remove('fd-reveal-play');
  });
}
