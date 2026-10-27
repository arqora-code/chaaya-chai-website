/* CHAAYA — shared page logic (loads after vendor + motion-kit) */
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const REC = new URLSearchParams(location.search).has('rec');
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const M = window.MEDIA || {};
  window.__boot = new Promise(res => (window.__bootDone = res));

  /* ---------- cursor ---------- */
  const cur = $('.cur');
  if (cur && !RM) {
    const x = gsap.quickTo(cur, 'x', { duration: .45, ease: 'power3' }), y = gsap.quickTo(cur, 'y', { duration: .45, ease: 'power3' });
    addEventListener('pointermove', e => { x(e.clientX); y(e.clientY); cur.style.opacity = 1; });
    $$('[data-cursor]').forEach(el => {
      el.addEventListener('pointerenter', () => { cur.querySelector('span').textContent = el.dataset.cursor; cur.classList.add('big'); });
      el.addEventListener('pointerleave', () => cur.classList.remove('big'));
    });
  }

  /* ---------- page transition: a copper stream that floods the screen ---------- */
  const curtain = $('.curtain');
  /* the pour: a wavering copper stream falls from the clicked x, pools and rises to flood; on the next page the brew drains down */
  const paths = curtain ? [curtain.querySelector('.milk'), curtain.querySelector('.tea')] : [];
  const S2 = { fall: 0, w: 0, pool: 0, x: .5, t: 0, drain: 0 };
  const shape = (lag) => {
    const W = innerWidth, H = innerHeight, cx = S2.x * W, n = 40;
    const fall = Math.max(0, S2.fall - lag), pool = Math.max(0, S2.pool - lag * .5);
    if (fall <= 0) return '';
    if (S2.drain > 0 || (S2.pool >= 1 && S2.w >= 1)) {
      const yT = (S2.drain > 0 ? S2.drain + lag * .5 : 0) * (H + 70) - 35 + (lag && !S2.drain ? 34 : 0); let d = `M0 ${H + 2} L0 ${yT}`;
      for (let i = 0; i <= n; i++) { const x = W * i / n; d += ` L${x.toFixed(1)} ${(yT + Math.sin(i * .35 + S2.t * 5) * (S2.drain > 0 ? 18 : 6)).toFixed(1)}`; }
      return d + ` L${W} ${H + 2} Z`;
    }
    const half = 5 + S2.w * W * .7, amp = 3 + S2.w * 18, top = S2.drain * (H + 80) - 40;
    const surf = H - pool * (H + 80), bot = Math.min(pool > 0 ? surf : H, top + fall * (H + 80));
    const wob = (i, o) => Math.sin(i * .45 + S2.t * 7 + o) * amp;
    const L = [], Rr = [];
    for (let i = 0; i <= n; i++) { const y = top + (bot - top) * i / n; L.push([cx - half + wob(i, 0), y]); Rr.push([cx + half + wob(i, 1.3), y]); }
    let pts = [...L];
    if (pool > 0 && bot >= surf - 1) {
      for (let i = 1; i <= n; i++) { const x = (cx - half) * (1 - i / n); pts.push([x, surf + Math.sin(x * .012 + S2.t * 6) * 10 * S2.pool]); }
      pts.push([0, H + 2], [W, H + 2]);
      for (let i = n; i >= 1; i--) { const x = cx + half + (W - cx - half) * (i / n); pts.push([x, surf + Math.sin(x * .012 + S2.t * 6) * 10 * S2.pool]); }
    }
    pts = pts.concat(Rr.reverse());
    /* smooth: quadratic curves through midpoints so the edge reads as liquid */
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length - 1; i++) { const m = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2]; d += ` Q${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`; }
    return d + ` L${pts[pts.length - 1][0].toFixed(1)} ${pts[pts.length - 1][1].toFixed(1)} Z`;
  };
  const render = () => { if (!paths[0]) return; paths[0].setAttribute('d', shape(0)); paths[1].setAttribute('d', shape(.22)); };
  const flood = (dir, x) => {
    if (!curtain || RM) return Promise.resolve();
    S2.x = x ?? .5; const tick = () => { S2.t += .016; render(); }; gsap.ticker.add(tick);
    const tl = gsap.timeline({ onComplete: () => { gsap.ticker.remove(tick); render(); } });
    if (dir === 'in') {
      Object.assign(S2, { fall: 0, w: 0, pool: 0, drain: 0 });
      tl.to(S2, { fall: 1, duration: .5, ease: 'power2.in' }).to(S2, { pool: 1, duration: .5, ease: 'power3.in' }, .3).to(S2, { w: 1, duration: .45, ease: 'power4.inOut' }, .5);
    } else {
      Object.assign(S2, { fall: 1, w: 1, pool: 1, drain: 0 });
      tl.to(S2, { drain: 1.05, duration: 1, ease: 'power4.inOut', delay: .05 }).set(S2, { fall: 0 });
    }
    return tl.then();
  };
  window.__flood = flood;
  const pf = new Set(); $$('a[href$=".html"]').forEach(a => a.addEventListener('pointerenter', () => { const h = a.getAttribute('href'); if (pf.has(h)) return; pf.add(h); const l = document.createElement('link'); l.rel = 'prefetch'; l.href = h; document.head.appendChild(l); }));
  $$('a[href$=".html"]').forEach(a => a.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || a.target) return;
    e.preventDefault(); const go = () => (location.href = a.getAttribute('href'));
    const r = a.getBoundingClientRect(), x = e.clientX || (r.left + r.width / 2);
    const lab = $('.curtain-label'), names = { 'index.html': 'Chaaya', 'blends.html': 'Blends', 'blend.html': 'Kadak Masala', 'ritual.html': 'The ritual', 'origins.html': 'Origins', 'visit.html': 'Hazratganj' };
    if (lab) { lab.textContent = names[a.getAttribute('href').split('#')[0]] || ''; gsap.fromTo(lab, { opacity: 0, '--w': 150 }, { opacity: 1, duration: .5, delay: .75, ease: 'lux' }); gsap.fromTo(lab, { fontVariationSettings: '"wght" 150,"SOFT" 60,"opsz" 144' }, { fontVariationSettings: '"wght" 560,"SOFT" 60,"opsz" 144', duration: 1, delay: .7, ease: 'power2.inOut' }); }
    flood('in', x / innerWidth).then(() => setTimeout(go, 60));
  }));
  addEventListener('pageshow', e => { if (e.persisted && curtain) { Object.assign(S2, { fall: 0, pool: 0, w: 0 }); render(); } });
  /* initial state: covered (so the drain reveals the page) unless this is home with its loader, or a recording */
  if (curtain && !$('.loader') && !REC && !RM) { Object.assign(S2, { fall: 1, w: 1, pool: 1, drain: 0 }); render(); }

  /* ---------- nav colour follows the chapter ---------- */
  const nav = $('.nav');
  if (nav) {
    const chk = () => {
      const y = 40; let mode = 'dark';
      for (let sec of [$('footer'), ...$$('main > section, main > div')].filter(Boolean)) { const r = sec.getBoundingClientRect(); if (r.top <= y && r.bottom > y) { if (sec.classList.contains('pin-spacer')) sec = sec.firstElementChild; mode = sec.classList.contains('ch-paper') ? 'paper' : sec.classList.contains('ch-kadak') ? 'kadak' : 'dark'; break; } }
      nav.classList.toggle('paper', mode === 'paper'); nav.classList.toggle('kadak', mode === 'kadak');
      nav.classList.toggle('solid', document.querySelector('.steep') ? scrollY > innerHeight * 3.2 : true);
    };
    addEventListener('scroll', chk, { passive: true }); chk(); window.__navChk = chk;
  }

  /* ---------- hover preview list (origins) ---------- */
  const pv = $('.preview');
  if (pv && !RM) {
    const img = pv.querySelector('img');
    const px = gsap.quickTo(pv, 'x', { duration: .7, ease: 'power3' }), py = gsap.quickTo(pv, 'y', { duration: .7, ease: 'power3' });
    let last = 0, rot = gsap.quickTo(pv, 'rotate', { duration: .8, ease: 'power3' });
    addEventListener('pointermove', e => { px(e.clientX + 30); py(e.clientY - 200); rot(gsap.utils.clamp(-8, 8, (e.clientX - last) * .4)); last = e.clientX; });
    $$('[data-preview]').forEach(a => {
      a.addEventListener('pointerenter', () => { img.src = a.dataset.preview; gsap.to(pv, { clipPath: 'inset(0% 0% 0% 0%)', duration: .9, ease: 'lux' }); gsap.fromTo(img, { scale: 1.3 }, { scale: 1, duration: 1.2, ease: 'lux' }); });
      a.addEventListener('pointerleave', () => gsap.to(pv, { clipPath: 'inset(50% 50% 50% 50%)', duration: .6, ease: 'silk' }));
    });
  }

  /* ---------- kulhad clip reveals (trapezoid -> rectangle) ---------- */
  if (!RM) $$('[data-kulhad]').forEach(el => {
    const m = el.querySelector('img,video');
    gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 82%' } })
      .fromTo(el, { clipPath: 'polygon(24% 14%,76% 14%,68% 86%,32% 86%)' }, { clipPath: 'polygon(0% 0%,100% 0%,100% 100%,0% 100%)', duration: 1.7, ease: 'silk' })
      .fromTo(m, { scale: 1.25 }, { scale: 1, duration: 2, ease: 'lux' }, 0);
  });

  if (!RM) $$('[data-kulhad-hero]').forEach(el => gsap.fromTo(el, { clipPath: 'polygon(44% 38%,56% 38%,54% 62%,46% 62%)', scale: 1.3 }, { clipPath: 'polygon(0% 0%,100% 0%,100% 100%,0% 100%)', scale: 1, duration: 1.8, ease: 'silk', delay: REC ? .1 : .9 }));

  /* ---------- lazy autoplay videos ---------- */
  $$('video[data-auto]').forEach(v => {
    v.muted = true; v.loop = true; v.playsInline = true;
    new IntersectionObserver(([e]) => e.isIntersecting ? v.play().catch(() => {}) : v.pause(), { rootMargin: '200px' }).observe(v);
  });

  /* ---------- WebGL steam ---------- */
  function steam(canvas) {
    const gl = canvas.getContext('webgl', { premultipliedAlpha: false, alpha: true });
    if (!gl) return null;
    const vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    const fs = `precision mediump float;uniform vec2 r;uniform float t;uniform vec2 m;uniform float k;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
    float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
    void main(){vec2 uv=gl_FragCoord.xy/r;vec2 p=uv*vec2(r.x/r.y,1.)*2.2;
      p.y-=t*.12;p.x+=sin(p.y*1.6+t*.4)*.18+(m.x-.5)*.25*uv.y;
      float q=fbm(p+fbm(p*1.3+t*.05));
      float col=smoothstep(.45,.85,uv.y)*(1.-smoothstep(.9,1.,uv.y));
      float mask=exp(-pow((uv.x-.5-(m.x-.5)*.08)*2.,2.))*col;
      float s=clamp(smoothstep(.45,.95,q)*mask*k,0.,.45);
      gl_FragColor=vec4(vec3(.98,.94,.88)*s,s);}`;
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr); gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = n => gl.getUniformLocation(pr, n), ur = U('r'), ut = U('t'), um = U('m'), uk = U('k');
    const S = { mx: .5, k: 1, t: 0 };
    const size = () => { const d = Math.min(devicePixelRatio, 1.5) * .5; canvas.width = innerWidth * d; canvas.height = innerHeight * d; gl.viewport(0, 0, canvas.width, canvas.height); };
    size(); addEventListener('resize', size);
    const qmx = gsap.quickTo(S, 'mx', { duration: 1.4, ease: 'power2' }); addEventListener('pointermove', e => qmx(e.clientX / innerWidth));
    S.draw = (time) => { gl.uniform2f(ur, canvas.width, canvas.height); gl.uniform1f(ut, time); gl.uniform2f(um, S.mx, .5); gl.uniform1f(uk, S.k); gl.drawArrays(gl.TRIANGLES, 0, 3); };
    return S;
  }

  /* ---------- HOME: the steep ---------- */
  const st = $('.steep');
  let homeReady = Promise.resolve();
  if (st) {
    const cv = $('canvas.seq', st), ctx = cv.getContext('2d');
    const seq = M.pour || { dir: 'media/pour', count: 1, ext: 'webp' };
    const frames = new Array(seq.count);
    const src = i => `${seq.dir}/${String(i + 1).padStart(4, '0')}.${seq.ext || 'webp'}`;
    let cur = -1, want = 0;
    const draw = i => {
      const im = frames[i]; if (!im || !im.complete || !im.naturalWidth) return false;
      const W = cv.width, H = cv.height;
      const s = Math.max(W / im.naturalWidth, H / im.naturalHeight), w = im.naturalWidth * s, h = im.naturalHeight * s;
      ctx.drawImage(im, (W - w) / 2, (H - h) / 2, w, h); cur = i; return true;
    };
    const load = i => new Promise(r => { const im = new Image(); im.decoding = 'async'; im.onload = im.onerror = () => r(im); im.src = src(i); frames[i] = im; });
    // first frame immediately, then every frame in parallel batches (no quality loss, faster start)
    const first = load(0).then(() => draw(0));
    const rest = (async () => { const idx = [...Array(seq.count).keys()].slice(1); await Promise.all(idx.slice(0, 47).map(load)); await new Promise(r => (window.requestIdleCallback || setTimeout)(r)); for (let b = 47; b < idx.length; b += 24) await Promise.all(idx.slice(b, b + 24).map(load)); })();
    homeReady = first;
    const fit = () => { cv.width = innerWidth; cv.height = innerHeight; draw(Math.max(cur, 0)); }; fit(); addEventListener('resize', fit);

    const stage = $('.stage', st), cue = $('.cue', st), media = $('.media', st), kend = $('.kend', st);
    /* kulhad silhouette: flared rim lip, convex walls, foot ring; every point morphs from the full-screen rectangle */
    const KP = [[.25, .1, 0, 0], [.5, .05, .5, 0], [.75, .1, 1, 0], [.745, .5, 1, .5], [.64, .84, 1, 1], [.645, .9, 1, 1], [.5, .925, .5, 1], [.355, .9, 0, 1], [.36, .84, 0, 1], [.255, .5, 0, .5]];
    const kulhad = e => { const W = innerWidth, H = innerHeight, P = KP.map(([kx, ky, rx, ry]) => [((rx + (kx - rx) * e) * W).toFixed(1), ((ry + (ky - ry) * e) * H).toFixed(1)]);
      return `path('M${P[0]} Q${P[1]} ${P[2]} Q${P[3]} ${P[4]} L${P[5]} Q${P[6]} ${P[7]} L${P[8]} Q${P[9]} ${P[0]} Z')`.replace(/,/g, ' ').replace(/(\d) (-?\d)/g, '$1 $2'); };
    let onScreen = true; new IntersectionObserver(([e]) => (onScreen = e.isIntersecting)).observe(stage);
    const word = $('.word', st), timer = $('.timer b', st), notes = $$('.notes i', st);
    const S = steam($('canvas.steam', st));
    const set = p => {
      want = Math.round(p * (seq.count - 1));
      let f = want; while (f > 0 && !(frames[f] && frames[f].complete && frames[f].naturalWidth)) f--;
      if (f !== cur) draw(f);
      const w = 120 + p * 480, soft = p * 50;
      word.style.fontVariationSettings = `"wght" ${w.toFixed(0)},"SOFT" ${soft.toFixed(0)},"opsz" 144,"WONK" 0`;
      word.style.letterSpacing = (-0.045 + p * 0.035).toFixed(3) + 'em';
      const lv = Math.min(1, Math.max(0, (p - .12) / .8)); word.style.setProperty('--lvl', (lv * 100).toFixed(1) + '%');
      const cl = Math.min(1, Math.max(0, (p - .9) / .1)), ce = cl * cl * (3 - 2 * cl);
      if (!RM) { media.style.clipPath = cl > 0 ? kulhad(ce) : ''; kend.style.opacity = Math.min(1, Math.max(0, (p - .9) / .07)); st.classList.toggle('closed', cl > .5); }

      const secs = Math.round(p * 210); timer.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
      [0, .16, .32, .48, .64, .8].forEach((th, i) => notes[i] && notes[i].classList.toggle('on', p >= th));
      if (S) S.k = .9 + p * .3;
      word.style.transform = `scale(${(1 - p * .08 - ce * .42).toFixed(4)})`;
      cue && (cue.style.opacity = p > .03 ? 0 : 1);
      const kb = Math.max(0, (p - .55) / .45), b0 = [20, 48, 42], b1 = [94, 44, 20];
      stage.style.setProperty('--base', `rgb(${b0.map((a, i) => Math.round(a + (b1[i] - a) * kb))})`);
    };
    window.__steepSet = set;
    set(0);
    if (!RM) {
      ScrollTrigger.create({ trigger: st, start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: s => set(s.progress) });
      if (S) gsap.ticker.add(t => { if (onScreen) S.draw(t); });
      gsap.from('.steep .word span', { yPercent: 40, opacity: 0, filter: 'blur(14px)', stagger: .06, duration: 1.6, ease: 'lux', delay: REC ? 0 : .9 });
    } else { if (S) S.draw(0); st.style.height = '100vh'; first.then(() => rest.then(() => set(.75))); }
    window.__homePos = () => ({ steepEnd: st.offsetTop + st.offsetHeight - innerHeight, blend: ($('#blend') || st).offsetTop, tins: ($('#tins') || st).offsetTop, ritual: ($('#ritual') || st).offsetTop, origins: ($('#origins') || st).offsetTop, visit: ($('#visit') || st).offsetTop, H: document.documentElement.scrollHeight });
  }

  /* ---------- loader ---------- */
  let ld = $('.loader');
  try { if (ld && sessionStorage.getItem('chaaya-seen')) { ld.remove(); ld = null; if (curtain && !REC && !RM) { Object.assign(S2, { fall: 1, w: 1, pool: 1, drain: 0 }); render(); } } sessionStorage.setItem('chaaya-seen', 1); } catch (e) {}
  const minT = new Promise(r => setTimeout(r, REC || !ld ? 0 : 1500));
  if (ld && !REC) {
    const fill = $('.fill', ld);
    gsap.fromTo(fill, { attr: { y: 100 } }, { attr: { y: 22 }, duration: 1.4, ease: 'power2.inOut' });
  }
  Promise.all([homeReady, minT, document.fonts.ready]).then(() => {
    if (ld) { if (curtain) { Object.assign(S2, { fall: 0 }); render(); } if (REC) ld.remove(); else gsap.to(ld, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'power4.inOut', onComplete: () => ld.remove() }); }
    else if (curtain && !REC) flood('out');
    if (curtain && REC) { Object.assign(S2, { fall: 0 }); render(); }
    ScrollTrigger.refresh(); window.__bootDone(true);
  });

  /* ---------- SHOP filters with Flip ---------- */
  const chips = $$('.chip');
  if (chips.length) chips.forEach(c => c.addEventListener('click', () => {
    chips.forEach(x => x.setAttribute('aria-pressed', x === c)); const f = c.dataset.f;
    const grid = $('.shop'), items = $$('.shop .tin'); const state = Flip.getState(items);
    grid.style.minHeight = grid.offsetHeight + 'px'; setTimeout(() => (grid.style.minHeight = ''), 1100);
    items.forEach(i => i.classList.toggle('hide', f !== 'all' && !i.dataset.cat.includes(f))); grid.classList.toggle('filtered', f !== 'all'); grid.classList.toggle('single', items.filter(i => !i.classList.contains('hide')).length === 1);
    Flip.from(state, { duration: 1, ease: 'silk', absolute: true, onEnter: e => gsap.fromTo(e, { opacity: 0, scale: .94 }, { opacity: 1, scale: 1, duration: .9, stagger: .05, delay: .15 })});
  }));

  /* ---------- PRODUCT: steep strength ---------- */
  const rng = $('#strength');
  if (rng) {
    const cup = $('.cup'), lab = $('#strengthLabel'), title = $('.pdp .display');
    const L = ['Halki: light and floral', 'Sadhi: balanced', 'Kadak: strong and spiced', 'Bahut kadak: for winter mornings'];
    const stops = [[216, 182, 140], [176, 122, 78], [122, 68, 36], [84, 42, 20]];
    /* the cup shows the real pour: stronger = less milk = an earlier frame of the steep */
    const cc = cup.querySelector('canvas'), cx2 = cc.getContext('2d'), seq = M.pour, cache = {};
    const frameAt = v => Math.round(seq.count * .3 + (1 - v) * (seq.count * .62));
    const paint = i => { const im = cache[i] || (cache[i] = Object.assign(new Image(), { src: `${seq.dir}/${String(i + 1).padStart(4, '0')}.${seq.ext}` }));
      const go = () => { const s2 = cc.height / (im.naturalHeight * .55); const w = im.naturalWidth * s2; cx2.drawImage(im, (cc.width - w) / 2, -im.naturalHeight * s2 * .3, w, im.naturalHeight * s2); };
      im.complete ? go() : (im.onload = go); };
    const upd = () => {
      const v = +rng.value / 100; paint(frameAt(v));
      const t0 = [242, 238, 229], t1 = [228, 212, 188]; $('.pdp').style.background = `rgb(${t0.map((a, i) => Math.round(a + (t1[i] - a) * v))})`;
      const secs = Math.round((120 + v * 180) / 15) * 15; lab.textContent = L[Math.min(3, Math.round(v * 3))] + `, boil ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
      const bo = $('.ring .boil'); if (bo) { const C = 2 * Math.PI * 160; bo.style.strokeDasharray = C; bo.style.strokeDashoffset = C * (1 - secs / 300); } rng.setAttribute('aria-valuetext', lab.textContent);
      title.style.fontVariationSettings = `"wght" ${Math.round(200 + v * 600)},"SOFT" 100,"opsz" 144`;
    };
    rng.addEventListener('input', upd); upd();
    let q = 1; const qn = $('#q');
    $$('.qty button').forEach(b => b.addEventListener('click', () => { q = Math.max(1, q + (+b.dataset.d)); qn.textContent = q; }));
    $('#add')?.addEventListener('click', () => { const t = $('.toast'); t.textContent = `Added ${q} × Kadak Masala to your bag`; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2600); window.__bagAdd && window.__bagAdd(q);
      const bn = $('.bagn'); if (bn) { const v = +bn.textContent + q; gsap.timeline().to(bn, { yPercent: -100, opacity: 0, duration: .3, ease: 'power2.in' }).add(() => (bn.textContent = v)).fromTo(bn, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .6, ease: 'lux' }); } });
  }

  /* ---------- ritual stack: each card settles over the last, which scales back and dims ---------- */
  const cards = $$('.stack .card');
  if (cards.length && !RM) cards.forEach((c, i) => {
    if (i === cards.length - 1) return;
    ScrollTrigger.create({ trigger: c, start: 'top 7vh', endTrigger: cards[cards.length - 1], end: 'top 7vh', pin: true, pinSpacing: false });
    gsap.to(c, { scale: .88, yPercent: -3, '--dim': .85, ease: 'none', scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top 7vh', scrub: true } });
  });

  /* ---------- bag drawer (concept, stored per browser) ---------- */
  const bag = $('.bag'), bn = $('.bagn');
  if (bag) {
    let items = []; try { items = JSON.parse(localStorage.getItem('chaaya-bag') || '[]'); } catch (e) {}
    const save = () => { try { localStorage.setItem('chaaya-bag', JSON.stringify(items)); } catch (e) {} };
    const draw = () => {
      const n = items.reduce((a, b) => a + b.q, 0); if (bn) bn.textContent = n;
      $('ul', bag).innerHTML = items.length ? items.map(i => `<li><img src="media/tin.jpg" alt=""><span>${i.name}<br><small style="color:var(--dhuaan)">Qty ${i.q}</small></span><b>₹ ${(i.q * i.price).toLocaleString('en-IN')}</b></li>`).join('') : '<p class="empty" style="padding:22px 0">Nothing steeping yet.</p>';
      $('.tot b', bag).textContent = '₹ ' + items.reduce((a, b) => a + b.q * b.price, 0).toLocaleString('en-IN');
    };
    const open = o => { bag.classList.toggle('open', o); bag.setAttribute('aria-hidden', !o); if (o) $('.x', bag).focus(); };
    $$('.bagbtn').forEach(b => b.addEventListener('click', () => open(true)));
    $('.x', bag).addEventListener('click', () => open(false)); $('.bag-veil')?.addEventListener('click', () => open(false));
    addEventListener('keydown', e => e.key === 'Escape' && open(false));
    window.__bagAdd = q => { const f = items.find(i => i.name === 'Kadak Masala'); f ? (f.q += q) : items.push({ name: 'Kadak Masala', price: 780, q }); save(); draw(); open(true); };
    window.__bagOpen = open; draw();
  }
  const day = $('#day');
  if (day) for (let i = 1; i <= 10; i++) { const d = new Date(Date.now() + i * 864e5); day.add(new Option(d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }))); }

  /* ---------- forms (concept: no real submission) ---------- */
  $$('form[data-concept]').forEach(f => f.addEventListener('submit', e => { e.preventDefault(); const b = f.querySelector('button'); b.textContent = 'Received — we will write to you'; }));
})();
