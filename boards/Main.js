window.__DCB=window.__DCB||{};window.__DCB["Main"]=function(DCLogic,React){

const IMGS = {"pointing": "assets/noga_pointing.webp", "clapping": "assets/noga_clapping.webp", "tryagain": "assets/noga_tryagain.webp", "wow": "assets/noga_wow.webp", "thumbsup": "assets/noga_thumbsup.webp", "thinking": "assets/noga_thinking.webp", "listening": "assets/noga_listening.webp", "friendly": "assets/noga_friendly.webp", "talk": ["assets/noga_talk2.webp", "assets/noga_talk1.webp", "assets/noga_talk2.webp"]};
const ENV = {"home": "001699973783355420111272892297416353684000000954466652000025313540013133963227852200"};
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { talking: false, mouth: 0, playing: false, heard: false }; }

  playClip(id, env, after) {
    const au = document.getElementById(id); if (!au) return;
    ['story-audio','home-audio','pilot-audio'].forEach(x => { const o = document.getElementById(x); if (o && o !== au) { try { o.pause(); } catch (e) {} } });
    try { au.currentTime = 0; } catch (e) {}
    const p = au.play(); if (p && p.catch) p.catch(() => this.setState({ blocked: true }));
    this.setState({ playing: true, blocked: false });
    clearInterval(this.mi);
    this.mi = setInterval(() => {
      const t = au.currentTime, k = Math.floor(t * 10), v = Number(env.charAt(k) || 0);
      const live = !au.paused && !au.ended;
      const talking = live && v >= 2;
      const vid = document.getElementById('noga-vid');
      if (vid) { if (talking && vid.paused) { const q = vid.play(); if (q && q.catch) q.catch(() => {}); } if (!talking && !vid.paused) vid.pause(); }
      this.setState({ talking: talking, mouth: talking ? (k % 2) + 1 : 0, t: t });
      if (au.ended) { clearInterval(this.mi); this.setState({ talking: false, mouth: 0, playing: false }); if (vid) vid.pause(); if (after) after(); }
    }, 100);
  }
  stopClip(id) { const au = document.getElementById(id); if (au) au.pause(); clearInterval(this.mi); const vid = document.getElementById('noga-vid'); if (vid) vid.pause(); this.setState({ talking: false, mouth: 0, playing: false }); }
  componentWillUnmount() { clearInterval(this.mi); clearTimeout(this.t); }
  glow() { return this.state.talking ? '0 0 34px rgba(52,209,191,0.95)' : '0 0 16px rgba(52,209,191,0.4)'; }
  frame() { return this.state.talking ? IMGS.talk[this.state.mouth || 1] : IMGS.talk[0]; }

  renderVals() {
    const go = () => { this.setState({ heard: true }); this.playClip('home-audio', ENV.home); };
    const st = this.props && this.props.store, PL = ['נפטון', 'אורנוס', 'שבתאי', 'צדק', 'מאדים', 'כדור הארץ', 'כוכב נוגה'];
    const cur = (pre) => { let n = 1; if (st) for (let i = 2; i <= 7; i++) if (st.isOpen(pre + 'L' + i)) n = i; return 'רמה ' + n + ' · ' + PL[n - 1]; };
    return { nogaGlow: this.glow(), nogaImg: this.frame(), speak: go, playHint: (this.state.heard || this.state.playing) ? [] : [{ go: go }], hebLabel: cur('Heb'), mathLabel: cur('Math'), engLabel: cur('Eng') };
  }
}


;return Component;};
