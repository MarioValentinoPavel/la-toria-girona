// La Tòria · «Risografia»: fotos tramadas en dos tintas, capas que se descuadran y un generador de carteles de tu noche
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LI = () => ({ es: 0, ca: 1, en: 2 }[document.documentElement.lang] || 0);
  const T = (es, ca, en) => [es, ca, en][LI()];
  const INKS = [['#ffe600', '#ff4fa3'], ['#ff4fa3', '#2c5cff'], ['#2c5cff', '#ffe600']];

  // ---------- trama de risografía ----------
  function halftone(fig, inkA = '#ff4fa3', inkB = '#2c5cff') {
    const cv = fig.querySelector('canvas'), g = cv.getContext('2d', { willReadFrequently: true });
    const img = new Image();
    img.onload = () => {
      const r = fig.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
      const W = Math.round(Math.min(900, r.width * d)), H = Math.round(W * r.height / r.width);
      if (!W || !H) return;
      cv.width = W; cv.height = H;
      const s = Math.max(W / img.width, H / img.height), iw = img.width * s, ih = img.height * s;
      g.drawImage(img, (W - iw) / 2, (H - ih) / 2, iw, ih);
      const px = g.getImageData(0, 0, W, H).data;
      const lum = (x, y) => { x = Math.max(0, Math.min(W - 1, x | 0)); y = Math.max(0, Math.min(H - 1, y | 0)); const i = (y * W + x) * 4; return (px[i] * .3 + px[i + 1] * .59 + px[i + 2] * .11) / 255; };
      const warm = (x, y) => { x = Math.max(0, Math.min(W - 1, x | 0)); y = Math.max(0, Math.min(H - 1, y | 0)); const i = (y * W + x) * 4; return Math.max(0, (px[i] - px[i + 2]) / 255); };
      g.globalCompositeOperation = 'source-over'; g.fillStyle = '#f4efe3'; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'multiply';
      const layer = (ink, ang, step, val, ox, oy) => {
        g.fillStyle = ink; const ca = Math.cos(ang), sa = Math.sin(ang), R = Math.hypot(W, H);
        for (let v = -R; v < R; v += step) for (let u = -R; u < R; u += step) {
          const x = W / 2 + u * ca - v * sa, y = H / 2 + u * sa + v * ca;
          if (x < -step || y < -step || x > W + step || y > H + step) continue;
          const k = val(x, y); if (k < .04) continue;
          g.beginPath(); g.arc(x + ox, y + oy, step * .62 * Math.sqrt(k), 0, 7); g.fill();
        }
      };
      const st = Math.max(5, W / 90);
      layer(inkA, .26, st, (x, y) => Math.min(1, Math.max(0, .78 - lum(x, y)) * .75 + warm(x, y) * .9), 0, 0);
      layer(inkB, 1.31, st, (x, y) => Math.max(0, (.62 - lum(x, y)) / .62) * .8, d * 1.5, -d);
      g.globalCompositeOperation = 'source-over';
      fig.classList.add('ready');
    };
    img.src = fig.dataset.src;
  }

  // ---------- portada: el vídeo del bar lleno, reimpreso en riso unas 12 veces por segundo ----------
  function videoRiso(fig, inkA = '#ff4fa3', inkB = '#2c5cff') {
    const v = fig.querySelector('video'), cv = fig.querySelector('canvas'), g = cv.getContext('2d');
    if (reduce || !v) { if (v) v.remove(); return; }
    const src = document.createElement('canvas'), s = src.getContext('2d', { willReadFrequently: true });
    let vis = true, last = 0, W = 0, H = 0;
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; vis ? v.play().catch(() => {}) : v.pause(); }).observe(fig);
    const size = () => { const r = fig.getBoundingClientRect(); W = Math.round(Math.min(760, r.width * Math.min(2, devicePixelRatio || 1))); H = Math.round(W * r.height / r.width); cv.width = W; cv.height = H; src.width = Math.round(W / 4); src.height = Math.round(H / 4); };
    size(); new ResizeObserver(size).observe(fig);
    const frame = (t) => {
      requestAnimationFrame(frame);
      if (!vis || v.readyState < 2 || t - last < 84 || !W) return;
      last = t;
      const sw = src.width, sh = src.height, k = Math.max(sw / v.videoWidth, sh / v.videoHeight), iw = v.videoWidth * k, ih = v.videoHeight * k;
      s.drawImage(v, (sw - iw) / 2, (sh - ih) / 2, iw, ih);
      const px = s.getImageData(0, 0, sw, sh).data;
      const at = (x, y) => { x = Math.max(0, Math.min(sw - 1, (x / 4) | 0)); y = Math.max(0, Math.min(sh - 1, (y / 4) | 0)); return (y * sw + x) * 4; };
      // el vídeo es de noche: se aclara un poco antes de tramar para que no quede todo empastado
      const lum = (x, y) => { const i = at(x, y); return Math.min(1, ((px[i] * .3 + px[i + 1] * .59 + px[i + 2] * .11) / 255) * 2 + .1); };
      const warm = (x, y) => { const i = at(x, y); return Math.max(0, (px[i] - px[i + 2]) / 255); };
      g.globalCompositeOperation = 'source-over'; g.fillStyle = '#f4efe3'; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'multiply';
      const st = Math.max(6, W / 70), jit = (Math.random() - .5) * 2;
      const layer = (ink, ang, val, ox, oy) => {
        g.fillStyle = ink; const ca = Math.cos(ang), sa = Math.sin(ang), R = Math.hypot(W, H);
        for (let q = -R; q < R; q += st) for (let u = -R; u < R; u += st) {
          const x = W / 2 + u * ca - q * sa, y = H / 2 + u * sa + q * ca;
          if (x < -st || y < -st || x > W + st || y > H + st) continue;
          const kk = val(x, y); if (kk < .05) continue;
          g.beginPath(); g.arc(x + ox, y + oy, st * .62 * Math.sqrt(kk), 0, 7); g.fill();
        }
      };
      layer(inkA, .26, (x, y) => Math.min(1, Math.max(0, .74 - lum(x, y)) * .8 + warm(x, y) * .6), 0, 0);
      layer(inkB, 1.31, (x, y) => Math.max(0, (.6 - lum(x, y)) / .6) * .8, 2 + jit, -1 + jit);
      g.globalCompositeOperation = 'source-over';
      fig.classList.add('ready');
    };
    v.play().catch(() => {});
    requestAnimationFrame(frame);
  }

  // ---------- generador de carteles ----------
  function poster() {
    const cv = document.getElementById('kCv'), g = cv.getContext('2d');
    const tI = document.getElementById('kT'), dI = document.getElementById('kD'), hI = document.getElementById('kH');
    let ink = 0;
    const next = new Date(); next.setDate(next.getDate() + ((5 - next.getDay() + 7) % 7 || 7));
    dI.value = next.toISOString().slice(0, 10);
    const DAYS = [['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SÁ'], ['DG', 'DL', 'DT', 'DC', 'DJ', 'DV', 'DS'], ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']];
    const MON = [['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'], ['GEN', 'FEB', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DES'], ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']];
    function wrap(text, max, size) {
      g.font = `400 ${size}px "Rammetto One"`;
      const words = text.split(/\s+/), lines = []; let cur = '';
      words.forEach((w) => { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > max && cur) { lines.push(cur); cur = w; } else cur = t; });
      if (cur) lines.push(cur); return lines;
    }
    function draw() {
      const [A, B] = INKS[ink], W = 1080, H = 1350, L = LI();
      g.globalCompositeOperation = 'source-over'; g.fillStyle = '#f4efe3'; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'multiply';
      g.fillStyle = A; g.beginPath(); g.arc(300, 330, 420, 0, 7); g.fill();
      g.fillStyle = B;
      for (let y = 560; y < 1180; y += 22) for (let x = 0; x < W; x += 22) { const k = (y - 560) / 620 * (x / W); if (k > .03) { g.beginPath(); g.arc(x + (y / 22 % 2) * 11, y, 11 * Math.sqrt(k), 0, 7); g.fill(); } }
      g.globalCompositeOperation = 'source-over';
      // título
      const title = (tI.value.trim() || T('Cena de amigos', 'Sopar d’amics', 'Dinner with friends')).toUpperCase();
      let size = 150, lines = wrap(title, 940, size);
      while ((lines.length > 3 || lines.some((l) => g.measureText(l).width > 960)) && size > 60) { size -= 8; lines = wrap(title, 940, size); }
      g.textBaseline = 'alphabetic';
      lines.forEach((l, i) => {
        const y = 300 + i * size * 1.02;
        g.fillStyle = B; g.globalAlpha = .9; g.fillText(l, 76, y + 6); g.globalAlpha = 1;
        g.fillStyle = '#161514'; g.fillText(l, 70, y);
      });
      // fecha y hora
      const dt = dI.value ? new Date(dI.value + 'T12:00') : next;
      const day = `${DAYS[L][dt.getDay()]} ${dt.getDate()} ${MON[L][dt.getMonth()]}`;
      g.font = '400 120px "Rammetto One"'; g.fillStyle = '#161514'; g.fillText(day, 70, 300 + lines.length * size * 1.02 + 150);
      const hy = 300 + lines.length * size * 1.02 + 200;
      g.fillStyle = '#161514'; g.beginPath(); g.roundRect(70, hy, 300, 86, 43); g.fill();
      g.fillStyle = A === '#2c5cff' ? '#ffe600' : A; g.font = '400 52px "Rammetto One"'; g.fillText(hI.value + 'H', 104, hy + 64);
      // pie
      g.fillStyle = '#161514'; g.fillRect(0, 1180, W, 170);
      g.fillStyle = A === '#2c5cff' ? '#ffe600' : A; g.font = '400 70px "Rammetto One"'; g.fillText('BAR LA TÒRIA', 70, 1262);
      g.fillStyle = '#f4efe3'; g.font = '700 25px "Inclusive Sans"'; g.fillText(T('VINOS · CERVEZAS · TAPAS', 'VINS · CERVESES · TAPES', 'WINE · BEER · TAPAS') + '   ·   PL. BELL-LLOC 4 · BARRI VELL · GIRONA', 70, 1312);
    }
    const redraw = () => (document.fonts ? document.fonts.load('400 40px "Rammetto One"').then(draw) : draw());
    [tI, dI, hI].forEach((el) => el.addEventListener('input', draw));
    document.getElementById('kInks').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      ink = +b.dataset.ink; document.querySelectorAll('#kInks button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); draw();
      if (!reduce && typeof gsap !== 'undefined') gsap.fromTo(cv, { rotate: 2, x: 10 }, { rotate: -2, x: 0, duration: .6, ease: 'back.out(2)' });
    });
    document.getElementById('kSave').addEventListener('click', () => {
      cv.toBlob((blob) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'cartell-la-toria.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }, 'image/png');
    });
    document.addEventListener('langchange', redraw);
    redraw();
  }

  function header() {
    const top = document.querySelector('.top'); let last = 0;
    addEventListener('scroll', () => {
      const y = scrollY; top.classList.toggle('solid', y > 40);
      if (y > 600 && y > last + 4) top.classList.add('hide'); else if (y < last - 4) top.classList.remove('hide');
      last = y;
    }, { passive: true });
  }

  function motion() {
    gsap.registerPlugin(ScrollTrigger);
    // impresión: cada tinta entra descuadrada y se ajusta
    gsap.from('.ink-y', { x: -120, y: -60, opacity: 0, duration: 1.2, ease: 'expo.out' });
    gsap.from('.ink-p', { x: 160, y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', delay: .15 });
    gsap.from('.ink-b', { x: -40, y: 80, opacity: 0, duration: 1.2, ease: 'expo.out', delay: .3 });
    gsap.from('.hero h1', { textShadow: '.35em .22em 0 #ff4fa300, -.3em -.2em 0 #2c5cff00', duration: 1.6, ease: 'expo.out', delay: .35 });
    gsap.from('.tag, .hero-p, .hero-cta', { opacity: 0, y: 24, duration: 1, stagger: .08, ease: 'expo.out', delay: .4 });
    gsap.from('.hero-photo', { rotate: 18, scale: .7, opacity: 0, duration: 1.3, ease: 'back.out(1.4)', delay: .45 });
    gsap.from('.stamp', { scale: 0, rotate: -120, duration: 1, ease: 'back.out(2)', delay: 1 });
    gsap.utils.toArray('h2.rv').forEach((h) => gsap.from(h, { opacity: 0, x: -30, textShadow: '.3em .2em 0 #ff4fa300, -.25em -.18em 0 #2c5cff00', duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%' } }));
    gsap.utils.toArray('.card, .bar-photos figure, .posters figure, .k-out, .visita dl').forEach((el, i) => gsap.from(el, { opacity: 0, y: 60, rotate: (i % 2 ? 4 : -4), duration: 1.1, ease: 'back.out(1.3)', scrollTrigger: { trigger: el, start: 'top 92%' } }));
  }

  function init() {
    document.querySelectorAll('.ht:not(.hv)').forEach((f) => halftone(f));
    const hv = document.getElementById('hv'); halftone(hv); videoRiso(hv);
    poster(); header();
    if (!reduce && typeof gsap !== 'undefined') motion();
    document.fonts && document.fonts.ready.then(() => typeof ScrollTrigger !== 'undefined' && ScrollTrigger.refresh());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
