/* Motion kit: the starting point for every site. Self-host the libraries:
 *   npm i gsap@3.13.0 lenis@1.3.4
 *   copy node_modules/gsap/dist/{gsap,ScrollTrigger,SplitText,Flip,CustomEase}.min.js
 *        node_modules/lenis/dist/{lenis.min.js,lenis.css}  -> site/assets/vendor/
 * Load order: vendor scripts, then this file, then page scripts.
 * Data-attribute API (mix and match per design; never use everything on one page):
 *   data-split="lines|chars"   kinetic headline reveal (masked lines or chars)
 *   data-clip                  image/video clip-path reveal with scale 1.2 -> 1
 *   data-parallax="0.2"        depth parallax (speed factor)
 *   data-skew                  scroll-velocity skew (images, marquees)
 *   data-magnetic              magnetic hover on buttons/links
 *   data-marquee               infinite marquee that speeds up with scroll velocity
 *   data-pin-horizontal        pinned horizontal gallery (child .track)
 *   data-stack                 stacking cards that scale back as the next arrives
 *   data-count="1240"          number ticker
 *   data-draw                  SVG path draw on scroll
 */
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const REC = new URLSearchParams(location.search).has('rec');
  gsap.registerPlugin(ScrollTrigger, SplitText, Flip, CustomEase);
  CustomEase.create('lux', '0.16,1,0.3,1');        // expo-out feel for reveals
  CustomEase.create('silk', '0.65,0,0.35,1');      // in-out for transitions
  gsap.defaults({ ease: 'lux', duration: 1.2 });

  /* smooth inertial scroll synced with ScrollTrigger */
  let lenis = null;
  if (!RM && !REC) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  window.MK = { lenis, RM, REC };

  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  if (RM) { $$('[data-split],[data-clip]').forEach(e => e.style.opacity = 1); return; }

  document.fonts.ready.then(() => {
    /* kinetic type */
    $$('[data-split]').forEach(el => {
      const chars = el.dataset.split === 'chars';
      const sp = new SplitText(el, { type: chars ? 'lines,chars' : 'lines', mask: 'lines', linesClass: 'mk-line' });
      gsap.from(chars ? sp.chars : sp.lines, {
        yPercent: 110, rotate: chars ? 6 : 2, stagger: chars ? 0.025 : 0.08, duration: 1.3,
        scrollTrigger: { trigger: el, start: 'top 85%' }
      });
    });
    /* clip-path reveal */
    $$('[data-clip]').forEach(el => {
      const media = el.querySelector('img,video,canvas') || el;
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 80%' } });
      tl.fromTo(el, { clipPath: 'inset(18% 12% 18% 12% round 4px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1.6, ease: 'silk' })
        .fromTo(media, { scale: 1.22 }, { scale: 1, duration: 1.8 }, 0);
    });
    /* parallax depth */
    $$('[data-parallax]').forEach(el => gsap.to(el, {
      yPercent: -100 * (+el.dataset.parallax || 0.15), ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
    }));
    /* number tickers */
    $$('[data-count]').forEach(el => {
      const o = { v: 0 }, to = +el.dataset.count;
      gsap.to(o, { v: to, duration: 2, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 85%' },
        onUpdate: () => el.textContent = Math.round(o.v).toLocaleString('en-IN') });
    });
    /* SVG draw */
    $$('[data-draw] path, [data-draw] circle').forEach(p => {
      const L = p.getTotalLength(); gsap.set(p, { strokeDasharray: L, strokeDashoffset: L });
      gsap.to(p, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: p.closest('[data-draw]'), start: 'top 75%', end: 'bottom 40%', scrub: 1 } });
    });
    /* pinned horizontal gallery */
    $$('[data-pin-horizontal]').forEach(sec => {
      const track = sec.querySelector('.track');
      gsap.to(track, { x: () => -(track.scrollWidth - innerWidth), ease: 'none',
        scrollTrigger: { trigger: sec, pin: true, scrub: 1, end: () => '+=' + (track.scrollWidth - innerWidth), invalidateOnRefresh: true } });
    });
    /* stacking cards */
    $$('[data-stack] > *').forEach((card, i, all) => {
      if (i === all.length - 1) return;
      gsap.to(card, { scale: 0.9, opacity: 0.4, filter: 'blur(2px)', ease: 'none',
        scrollTrigger: { trigger: all[i + 1], start: 'top bottom', end: 'top top', scrub: true } });
      ScrollTrigger.create({ trigger: card, start: 'top top', pin: true, pinSpacing: false, endTrigger: all[all.length - 1], end: 'top top' });
    });
    ScrollTrigger.refresh();
  });

  /* velocity skew + marquee */
  const skewEls = $$('[data-skew]'), marquees = $$('[data-marquee]');
  const setSkew = skewEls.map(e => gsap.quickTo(e, 'skewY', { duration: 0.5, ease: 'power3' }));
  let mqX = 0; const mqW = []; addEventListener('resize', () => (mqW.length = 0));
  gsap.ticker.add(() => {
    const v = lenis ? lenis.velocity : 0;
    setSkew.forEach(f => f(gsap.utils.clamp(-6, 6, v * 0.25)));
    mqX -= 0.6 + Math.abs(v) * 0.08;
    marquees.forEach((m, i) => { const w = mqW[i] || (mqW[i] = m.scrollWidth / 2); m.style.transform = `translate3d(${(mqX % w)}px,0,0)`; });
  });

  /* magnetic */
  $$('[data-magnetic]').forEach(b => {
    const x = gsap.quickTo(b, 'x', { duration: 0.6, ease: 'elastic.out(1,0.4)' }), y = gsap.quickTo(b, 'y', { duration: 0.6, ease: 'elastic.out(1,0.4)' });
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.35); y((e.clientY - r.top - r.height / 2) * 0.35); });
    b.addEventListener('pointerleave', () => { x(0); y(0); });
  });
})();
