window.__DCB=window.__DCB||{};window.__DCB["Main"]=function(DCLogic,React){

const IMGS = {"pointing": "assets/noga_pointing.webp", "clapping": "assets/noga_clapping.webp", "tryagain": "assets/noga_tryagain.webp", "wow": "assets/noga_wow.webp", "thumbsup": "assets/noga_thumbsup.webp", "thinking": "assets/noga_thinking.webp", "listening": "assets/noga_listening.webp", "friendly": "assets/noga_friendly.webp", "talk": ["assets/noga_talk2.webp", "assets/noga_talk1.webp", "assets/noga_talk2.webp"]};
const ENV = {"home": "001699973783355420111272892297416353684000000954466652000025313540013133963227852200"};
const SHIP = "assets/ship.webp";
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { talking: false, mouth: 0, playing: false, heard: false }; }

  // Lip-synced narration: the clip's own Wav2Lip video (same mp3) replaces the generic talking loop and follows the audio clock.
  lipLoad(id) {
    const vid = document.getElementById('noga-vid'); if (!vid) return false;
    const key = id.replace(/^aud-/, '').replace(/-audio$/, '');
    if (!/^(story|home|p_[a-z]+)$/.test(key)) return false;
    if (vid.getAttribute('data-lip') !== key) {
      const mp4 = vid.canPlayType && vid.canPlayType('video/mp4; codecs="avc1.42E01E"');
      vid.setAttribute('data-lip', key); vid.loop = false;
      vid.src = 'video/lip_scr_' + key + (mp4 ? '.mp4' : '.webm');
      try { vid.load(); } catch (e) {}
    }
    return true;
  }
  lipFollow(au, live) {
    const vid = document.getElementById('noga-vid'); if (!vid) return;
    // past the video's last frame (it can end a few ms before the mp3): hold that frame, since play() on an ended video restarts it
    if (!live || (vid.duration && au.currentTime >= vid.duration - 0.06)) { if (!vid.paused) vid.pause(); return; }
    if (vid.readyState >= 1 && Math.abs(vid.currentTime - au.currentTime) > 0.12) { try { vid.currentTime = au.currentTime; } catch (e) {} }
    if (vid.paused) { const q = vid.play(); if (q && q.catch) q.catch(() => {}); }
  }
  playClip(id, env, after, resume) {
    const au = document.getElementById(id); if (!au) return;
    ['story-audio','home-audio','pilot-audio'].forEach(x => { const o = document.getElementById(x); if (o && o !== au) { try { o.pause(); } catch (e) {} } });
    if (!resume) { try { au.currentTime = 0; } catch (e) {} }
    const lip = this.lipLoad(id);
    if (lip) au.onplaying = () => this.lipFollow(au, true);
    const p = au.play(); if (p && p.catch) p.catch(() => this.setState({ blocked: true, playing: false }));
    this.setState({ playing: true, blocked: false });
    clearInterval(this.mi);
    this.mi = setInterval(() => {
      const t = au.currentTime, k = Math.floor(t * 10), v = Number(env.charAt(k) || 0);
      const live = !au.paused && !au.ended;
      const talking = live && v >= 2;
      const vid = document.getElementById('noga-vid');
      if (lip) this.lipFollow(au, live);
      else if (vid) { if (talking && vid.paused) { const q = vid.play(); if (q && q.catch) q.catch(() => {}); } if (!talking && !vid.paused) vid.pause(); }
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
    const cur = (pre) => { let n = 1; if (st) { for (let i = 2; i <= 7; i++) if (st.isOpen(pre + 'L' + i)) n = i; for (let i = 1; i <= 7; i++) if (st.isOpen(pre + 'L' + i) && !st.isComplete(pre + 'L' + i)) { n = i; break; } } return 'רמה ' + n + ' · ' + PL[n - 1]; };   // same rule as the map's rocket
    let parts = 0; const dots = []; ['Heb', 'Math', 'Eng'].forEach(p => { for (let i = 1; i <= 7; i++) { const c = st ? st.isComplete(p + 'L' + i) : false; if (c) parts++; dots.push({ s: 'width: 12px; height: 12px; border-radius: 50%; background: ' + (c ? '#FFC83D' : 'rgba(255,255,255,0.18)') + '; box-shadow: ' + (c ? '0 0 8px #FFC83D' : 'none') }); } });
    const stk = st ? (st.get('stickers') || {}) : {};
    let stars = 0; if (st) ['Heb', 'Math', 'Eng'].forEach(p => { for (let i = 1; i <= 7; i++) { const d = st.getDone(p + 'L' + i); for (const k in d) if (k !== '_total') stars += Number(d[k]) || 0; } });
    const pilot = st ? st.get('pilot') : ''; const kid = st ? st.get('kid') : null;
    return { nogaGlow: this.glow(), nogaImg: this.frame(), speak: go, playHint: (this.state.heard || this.state.playing) ? [] : [{ go: go }], hebLabel: cur('Heb'), mathLabel: cur('Math'), engLabel: cur('Eng'),
             shipImg: SHIP, shipParts: parts + '/21 חֲלָקִים', shipDots: dots, stickerCount: String(Object.keys(stk).length), pilotLabel: kid && kid.name ? '🧑‍🚀 ' + kid.name : pilot ? '🧑‍🚀 ' + pilot : '🧑‍🚀 טַיָּסִים', starCount: String(stars) };
  }
}


;return Component;};
