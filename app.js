/* להציל את כוכב נוגה — app shell.
 * Runs the same .dc.html screens as the design canvas, with a small template renderer of our own.
 * Works on iPhone / iPad (Safari), Android (Chrome) and desktop. */
(function () {
  'use strict';
  const R = window.React, RD = window.ReactDOM, h = R.createElement;
  const W = 1180, H = 820;
  const CFG = window.NOGA_CONFIG || { open: {}, start: 'Story', home: 'Main' };

  // ------------------------------------------------------------------ progress store
  const KEY = 'noga.v1';
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  const S = Object.assign({ done: {}, seenStory: false }, load());
  const store = {
    getDone(k) { return S.done[k] || {}; },
    setDone(k, d, total) { S.done[k] = Object.assign({}, d, { _total: total }); save(S); },
    count(k) { const d = S.done[k]; return d ? Object.keys(d).filter(x => x !== '_total').length : 0; },
    isComplete(k) { const d = S.done[k]; if (!d) return false; return store.count(k) >= Math.min(CFG.pass || 5, d._total || 7); },
    isOpen(k) {
      const m = /^(Heb|Math|Eng)L(\d)$/.exec(k); if (!m) return true;
      const n = Number(m[2]), max = CFG.open[m[1]] || 0;
      if (S.openAll) return true;
      if (n > max) return false;
      const st = (S.intake && S.intake.start && S.intake.start[m[1]]) || 1;
      return n <= st || store.isComplete(m[1] + 'L' + (n - 1));
    },
    config() { return CFG; },
    get(k) { return S[k]; }, set(k, v) { S[k] = v; save(S); },
    reset() { S.done = {}; S.seenStory = false; S.time = 0; S.intake = null; save(S); },
    addTime(sec) { S.time = (S.time || 0) + sec; S.lastPlay = Date.now(); save(S); },
  };
  // play-time: 1 tick per 15s while the page is visible and not on parent/intake screens
  let curScreen = '';
  setInterval(() => { if (document.visibilityState === 'visible' && !/^(Parent|Intake|Start)$/.test(curScreen)) store.addTime(15); }, 15000);

  // ------------------------------------------------------------------ template compiler
  const EVT = { onclick: 'onClick', onpointerdown: 'onPointerDown', onpointermove: 'onPointerMove', onpointerup: 'onPointerUp', onpointerleave: 'onPointerLeave', onpointercancel: 'onPointerCancel', oninput: 'onInput', onchange: 'onChange', onkeydown: 'onKeyDown' };
  const ATTR = { class: 'className', for: 'htmlFor', tabindex: 'tabIndex', autoplay: 'autoPlay', playsinline: 'playsInline', crossorigin: 'crossOrigin', readonly: 'readOnly' };
  const SKIP = { 'hint-placeholder-count': 1, 'hint-placeholder-val': 1, 'hint-size': 1 };
  function camel(s) { return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase()); }
  function attrName(n, svg) {
    if (EVT[n]) return EVT[n];
    if (ATTR[n]) return ATTR[n];
    if (n.startsWith('data-') || n.startsWith('aria-')) return n;
    if (n.indexOf('-') > 0 && svg) return camel(n);
    if (n === 'xlink:href') return 'xlinkHref';
    return n;
  }
  function parseStyle(s) {
    const out = {}; let depth = 0, cur = '';
    const push = (decl) => { const i = decl.indexOf(':'); if (i < 0) return; const k = decl.slice(0, i).trim(); const v = decl.slice(i + 1).trim(); if (!k) return; out[k.startsWith('--') ? k : camel(k)] = v; };
    for (const ch of String(s)) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ';' && depth === 0) { push(cur); cur = ''; } else cur += ch; }
    push(cur); return out;
  }
  const WHOLE = /^\s*\{\{\s*([^{}]+?)\s*\}\}\s*$/, PART = /\{\{\s*([^{}]+?)\s*\}\}/g;
  function lookup(path, scope) {
    if (path === 'true') return true; if (path === 'false') return false; if (path === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    if (/^'.*'$/.test(path)) return path.slice(1, -1);
    const parts = path.split('.'); let v = scope[parts[0]];
    for (let i = 1; i < parts.length && v != null; i++) v = v[parts[i]];
    return v;
  }
  function val(raw, scope) {
    const m = WHOLE.exec(raw); if (m) return lookup(m[1], scope);
    if (raw.indexOf('{{') < 0) return raw;
    return raw.replace(PART, (_, p) => { const v = lookup(p, scope); return v == null ? '' : String(v); });
  }
  function compile(node, svg) {
    if (node.nodeType === 3) { const t = node.nodeValue; if (!t.trim() && /\n/.test(t)) return null; return { text: t }; }
    if (node.nodeType !== 1) return null;
    const tag = node.tagName.toLowerCase();
    if (tag === 'helmet' || tag === 'script') return null;
    const isSvg = svg || tag === 'svg';
    const attrs = [];
    for (const a of node.attributes) { if (!SKIP[a.name]) attrs.push([a.name, a.value]); }
    const children = []; for (const c of node.childNodes) { const k = compile(c, isSvg); if (k) children.push(k); }
    return { tag: node.tagName.indexOf('-') > 0 ? tag : (isSvg ? node.tagName : tag), attrs, children, svg: isSvg };
  }
  function renderList(list, scope, nav) { const out = []; for (let i = 0; i < list.length; i++) { const r = renderNode(list[i], scope, nav, i); if (r != null) out.push(r); } return out; }
  function renderNode(n, scope, nav, key) {
    if (n.text != null) return n.text.indexOf('{{') >= 0 ? val(n.text, scope) : n.text;
    const A = {}; n.attrs.forEach(([k, v]) => { A[k] = v; });
    if (n.tag === 'sc-for') {
      const list = val(A.list || '[]', scope) || []; const as = A.as || 'item';
      return h(R.Fragment, { key }, list.map((it, i) => { const sc = Object.create(scope); sc[as] = it; sc.$index = i; return h(R.Fragment, { key: i }, renderList(n.children, sc, nav)); }));
    }
    if (n.tag === 'sc-if') { return val(A.value || 'false', scope) ? h(R.Fragment, { key }, renderList(n.children, scope, nav)) : null; }
    const props = { key };
    for (const [k, raw] of n.attrs) {
      const name = attrName(k, n.svg); let v = val(raw, scope);
      if (name === 'style') { props.style = parseStyle(v); continue; }
      if (EVT[k]) { if (typeof v === 'function') props[name] = v; continue; }
      props[name] = v;
    }
    if (n.tag === 'a' && typeof props.href === 'string' && /\.dc\.html$/.test(props.href)) {
      const target = props.href.replace(/^.*\//, '').replace('.dc.html', '');
      const prev = props.onClick;
      props.onClick = (e) => { e.preventDefault(); if (typeof prev === 'function') { try { prev(e); } catch (err) {} } nav(target); };
    }
    if (n.tag === 'img' && props.draggable == null) props.draggable = false;
    return h(n.tag, props, n.children.length ? renderList(n.children, scope, nav) : undefined);
  }

  // ------------------------------------------------------------------ board loading
  const boards = {};
  const injected = {};
  function injectHelmet(html) {
    const m = /<helmet>([\s\S]*?)<\/helmet>/.exec(html); if (!m) return;
    const doc = new DOMParser().parseFromString('<head>' + m[1] + '</head>', 'text/html');
    doc.head.childNodes.forEach(n => {
      if (n.nodeType !== 1) return;
      const sig = n.outerHTML; if (injected[sig]) return; injected[sig] = 1;
      if (n.tagName === 'LINK' && /fonts\.(googleapis|gstatic)/.test(n.getAttribute('href') || '')) { const l = document.createElement('link'); l.rel = n.rel; l.href = n.href; document.head.appendChild(l); }
      else if (n.tagName === 'STYLE') { const s = document.createElement('style'); s.textContent = n.textContent; document.head.appendChild(s); }
    });
  }
  class DCLogic extends R.Component {
    render() {
      let vals;
      try { vals = this.renderVals(); } catch (e) { console.error(e); return h('div', { style: { color: '#fff', padding: 40 } }, 'שגיאה במסך: ' + e.message); }
      const scope = Object.assign(Object.create(null), vals);
      const kids = renderList(this.__tpl.children, scope, this.props.nav);
      return kids.length === 1 ? kids[0] : h(R.Fragment, null, kids);
    }
  }
  async function getBoard(name) {
    if (boards[name]) return boards[name];
    const res = await fetch('boards/' + name + '.dc.html');
    if (!res.ok) throw new Error('missing board ' + name);
    const html = await res.text();
    injectHelmet(html);
    const xm = /<x-dc>([\s\S]*?)<\/x-dc>/.exec(html);
    const sm = /<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/.exec(html);
    const doc = new DOMParser().parseFromString('<!doctype html><html><body>' + (xm ? xm[1] : '') + '</body></html>', 'text/html');
    const tpl = compile(doc.body, false);
    const Base = class extends DCLogic {}; Base.prototype.__tpl = tpl;
    // board logic is precompiled into boards/NAME.js (no eval, works under strict security policies)
    let factory = (window.__DCB || {})[name];
    if (!factory) {
      await new Promise((ok, bad) => { const sc = document.createElement('script'); sc.src = 'boards/' + name + '.js?v=' + (CFG.v || ''); sc.onload = ok; sc.onerror = () => bad(new Error('missing logic ' + name)); document.head.appendChild(sc); }).catch(() => {});
      factory = (window.__DCB || {})[name];
    }
    if (!factory && sm && sm[1].trim()) factory = new Function('DCLogic', 'React', sm[1] + '\n;return Component;');
    const Comp = factory ? factory(Base, R) : class extends Base { renderVals() { return {}; } };
    boards[name] = Comp; return Comp;
  }

  // ------------------------------------------------------------------ shell
  function useFit() {
    const [s, setS] = R.useState(1);
    R.useEffect(() => {
      const f = () => { const vw = window.innerWidth, vh = window.innerHeight; setS(Math.min(vw / W, vh / H)); };
      f(); window.addEventListener('resize', f); window.addEventListener('orientationchange', f);
      return () => { window.removeEventListener('resize', f); window.removeEventListener('orientationchange', f); };
    }, []);
    return s;
  }
  function unlockAudio() {
    try { const a = window.__nogaAu || (window.__nogaAu = new Audio()); a.src = 'audio/silence.mp3'; a.volume = 1; const p = a.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
    try { const C = window.AudioContext || window.webkitAudioContext; if (C) { const c = new C(); const b = c.createBuffer(1, 1, 22050); const s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } } catch (e) {}
  }
  function goFullscreen() {
    const el = document.documentElement;
    try { if (el.requestFullscreen && !document.fullscreenElement) el.requestFullscreen({ navigationUI: 'hide' }).catch(() => {}); } catch (e) {}
    try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); } catch (e) {}
  }
  const STARS = Array.from({ length: 46 }, (_, i) => [(i * 37) % 100, (i * 53 + 11) % 100, 2 + (i % 3), (i % 7) * 0.35]);
  function App() {
    const scale = useFit();
    const initial = (location.hash || '').slice(1);
    const [started, setStarted] = R.useState(false);
    const [name, setName] = R.useState(initial || (S.seenStory ? CFG.home : CFG.start));
    curScreen = name;
    const [Comp, setComp] = R.useState(null);
    const [err, setErr] = R.useState('');
    const [portrait, setPortrait] = R.useState(false);
    const [keepPortrait, setKeepPortrait] = R.useState(false);
    const [menu, setMenu] = R.useState(false);
    const [guide, setGuide] = R.useState(false);
    const go = (target) => { setMenu(false); unlockAudio(); setName(target); setStarted(true); history.pushState({ b: target }, '', '#' + target); };
    const GUIDE = [
      ['📱', 'מחזיקים את הטלפון לרוחב. בפעם הראשונה לוחצים "מתחילים" ונוגה מספרת את הסיפור.'],
      ['📝', 'שאלון של 2 דקות להורים קובע מאיפה הילד/ה מתחיל/ה בכל מקצוע. אפשר לדלג ולהתחיל מרמה 1.'],
      ['🪐', 'הילד/ה בוחר/ת תחום (עברית, חשבון, אנגלית) ואז כוכב. בכל כוכב: קודם "שיעור עם נוגה", אחר כך 7 משחקים.'],
      ['🔊', 'נוגה אומרת הכול בקול, לא צריך לדעת לקרוא. כשלא בטוחים לוחצים על הרמקול. אחרי טעויות נוגה עוזרת לבד.'],
      ['⭐', 'כל משחק מסתיים ב-1 עד 5 כוכבים, ותמיד אפשר לשחק שוב ולשפר. כוכב חדש נפתח אחרי 5 מתוך 7 משחקים.'],
      ['⏱️', '10–20 דקות ביום מספיקות. עדיף קצת כל יום מאשר הרבה בבת אחת.'],
      ['👨‍👩‍👧', 'אזור הורים (כפתור ☰ בפינה): דוח קצר על ההתקדמות, שאלון מחדש, צלילים, פתיחת כל הרמות.'],
      ['🔒', 'הכול נשמר במכשיר הזה בלבד. האפליקציה לא אוספת ולא שולחת שום מידע.'],
    ];
    const guideOv = guide ? h('div', { className: 'ov', onClick: () => setGuide(false) },
      h('div', { className: 'guide', onClick: (e) => e.stopPropagation() },
        h('div', { className: 'guide-head' }, h('span', null, 'איך משתמשים? מדריך קצר להורים'), h('button', { className: 'ov-x', 'aria-label': 'סגירה', onClick: () => setGuide(false) }, '✕')),
        h('ol', { className: 'guide-list' }, GUIDE.map((g, i) => h('li', { key: i }, h('span', { className: 'guide-ic' }, g[0]), h('span', null, g[1])))),
        h('button', { className: 'guide-ok', onClick: () => setGuide(false) }, 'הבנתי'))) : null;
    const menuOv = started ? h(R.Fragment, null,
      h('button', { className: 'fab', 'aria-label': 'תפריט', onClick: () => setMenu(m => !m) }, menu ? '✕' : '☰'),
      menu ? h('div', { className: 'menu' },
        h('button', { onClick: () => go(CFG.home) }, '🏠 מסך הבית'),
        h('button', { onClick: () => { setMenu(false); setStarted(false); history.pushState({ b: 'Start' }, '', '#'); } }, '▶ מסך הפתיחה'),
        h('button', { onClick: () => go('Parent') }, '👨‍👩‍👧 אזור הורים'),
        h('button', { onClick: () => { setMenu(false); setGuide(true); } }, '❓ איך משתמשים')) : null) : null;
    R.useEffect(() => { const f = () => setPortrait(window.innerHeight > window.innerWidth && window.innerWidth < 900); f(); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
    const nav = R.useCallback((target, replace) => {
      if (!store.isOpen(target)) return;
      if (target === 'Pilots' || target === CFG.home) { S.seenStory = true; save(S); }
      if (replace) history.replaceState({ b: target }, '', '#' + target); else history.pushState({ b: target }, '', '#' + target);
      setName(target);
    }, []);
    R.useEffect(() => { const f = (e) => setName((e.state && e.state.b) || (location.hash || '').slice(1) || CFG.home); window.addEventListener('popstate', f); return () => window.removeEventListener('popstate', f); }, []);
    R.useEffect(() => { let alive = true; setComp(null); setErr(''); getBoard(name).then(C => { if (alive) setComp(() => C); }).catch(e => { if (alive) setErr(String(e.message || e)); }); return () => { alive = false; }; }, [name]);
    const stage = h('div', { id: 'stage', style: { width: W, height: H, transform: 'scale(' + scale + ')', transformOrigin: 'top left', position: 'absolute', left: Math.max(0, (window.innerWidth - W * scale) / 2), top: Math.max(0, (window.innerHeight - H * scale) / 2), overflow: 'hidden', background: '#0E0A2E' } },
      started && Comp ? h(Comp, { key: name, nav, store }) : null,
      started && !Comp && !err ? h('div', { className: 'loading' }, h('div', { className: 'spinner' }), 'טוֹעֲנִים…') : null,
      err ? h('div', { className: 'loading' }, 'אופס: ' + err) : null,
      !started ? h('div', { className: 'start' },
        STARS.map((st, i) => h('span', { key: 'st' + i, className: 'star', style: { left: st[0] + '%', top: st[1] + '%', width: st[2] + 'px', height: st[2] + 'px', animationDelay: st[3] + 's' } })),
        h('img', { src: 'assets/saturn.webp', alt: '', className: 'deco deco-planet', style: { left: '4%', top: '6%', width: '16vw', maxWidth: 200, animationDelay: '0s' } }),
        h('img', { src: 'assets/mars.webp', alt: '', className: 'deco deco-planet', style: { right: '6%', bottom: '8%', width: '9vw', maxWidth: 120, animationDelay: '-2s' } }),
        h('img', { src: 'assets/neptune.webp', alt: '', className: 'deco deco-planet', style: { right: '18%', top: '8%', width: '7vw', maxWidth: 90, animationDelay: '-4s' } }),
        h('img', { src: 'assets/zallon.webp', alt: '', className: 'deco deco-alien', style: { left: '12%', bottom: '10%', width: '15vw', maxWidth: 190 } }),
        h('img', { src: 'assets/alien.webp', alt: '', className: 'deco deco-alien', style: { right: '7%', top: '28%', width: '11vw', maxWidth: 140, animationDelay: '-1.1s' } }),
        h('img', { src: 'assets/math.webp', alt: '', className: 'deco deco-alien', style: { left: '26%', top: '12%', width: '9vw', maxWidth: 110, animationDelay: '-0.6s' } }),
        h('img', { src: 'assets/eng.webp', alt: '', className: 'deco deco-alien', style: { right: '24%', bottom: '6%', width: '9vw', maxWidth: 110, animationDelay: '-1.6s' } }),
        h('img', { src: 'assets/ship.webp', alt: '', className: 'deco deco-ship', style: { left: '22%', bottom: '32%', width: '12vw', maxWidth: 150 } }),
        h('img', { src: 'assets/noga_friendly.webp', alt: 'נוגה', className: 'start-noga' }),
        h('h1', null, 'לְהַצִּיל אֶת כּוֹכַב נֹגַהּ'),
        h('button', { className: 'start-btn', onClick: () => { unlockAudio(); goFullscreen(); setStarted(true); history.replaceState({ b: name }, '', '#' + name); } }, '▶  מַתְחִילִים'),
        h('div', { className: 'start-parents' },
          h('button', { className: 'pbtn', onClick: () => go('Parent') }, '👨‍👩‍👧 אזור הורים'),
          !S.intake ? h('button', { className: 'pbtn pbtn-gold', onClick: () => go('Intake') }, '📝 שאלון לבחירת רמה (2 דק׳)') : null,
          h('button', { className: 'pbtn', onClick: () => setGuide(true) }, '❓ איך משתמשים'))) : null,
      menuOv, guideOv);
    return h(R.Fragment, null, stage, portrait && !keepPortrait ? h('div', { className: 'rotate' }, h('div', { className: 'rotate-icon' }, '📱↻'), 'סוֹבְבוּ אֶת הַמַּכְשִׁיר לְרֹחַב', h('button', { className: 'rotate-skip', onClick: () => setKeepPortrait(true) }, 'לְהַמְשִׁיךְ בְּלִי לְסוֹבֵב')) : null);
  }
  RD.createRoot(document.getElementById('root')).render(h(App));
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
