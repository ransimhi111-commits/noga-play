window.__DCB=window.__DCB||{};window.__DCB["Pilots"]=function(DCLogic,React){

const IMGS = {"pointing": "assets/noga_pointing.webp", "clapping": "assets/noga_clapping.webp", "tryagain": "assets/noga_tryagain.webp", "wow": "assets/noga_wow.webp", "thumbsup": "assets/noga_thumbsup.webp", "thinking": "assets/noga_thinking.webp", "listening": "assets/noga_listening.webp", "friendly": "assets/noga_friendly.webp", "talk": ["assets/noga_talk2.webp", "assets/noga_talk1.webp", "assets/noga_talk2.webp"]};
const ENV = {"home": "001699973783355420111272892297416353684000000954466652000025313540013133963227852200", "pilots": "012355104224131214261020000210269972100", "p_nir": "0798654421123561447300000267691100", "p_luna": "03699820002345228600001179530100", "p_zik": "02271000004366114930012179751100", "p_tuti": "01923100004546368610022269954110", "p_kochi": "017830000123962585000031289551100", "p_tofi": "04913000003346633541000211755311", "p_jet": "03491000002239433630000116853110", "p_mika": "049942000015497772000002117762010000"};
const PIL = [["ניר", "#FF7A59", "p_nir"], ["לונה", "#B48CFF", "p_luna"], ["זיק", "#FFC83D", "p_zik"], ["תותי", "#FF6FA8", "p_tuti"], ["כוכי", "#34D1BF", "p_kochi"], ["טופי", "#7CC8FF", "p_tofi"], ["ג׳ט", "#9BE36B", "p_jet"], ["מיקה", "#FFB37A", "p_mika"]];
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { talking: false, mouth: 0, playing: false, picked: -1, says: 'בוחרים טייס או טייסת, ויוצאים למסע!' }; }

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
    const st = this.state;
    return {
      nogaGlow: this.glow(), nogaImg: this.frame(), says: st.says,
      pilots: PIL.map((p, i) => ({
        n: p[0], col: p[1], cls: st.picked === i ? 'popin' : '',
        box: 'display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 18px 10px; border-radius: 26px; cursor: pointer; color: #FFFFFF; font-family: Fredoka, Rubik, sans-serif; background: rgba(36,28,92,0.85); transition: transform .2s, box-shadow .2s; ' +
          (st.picked === i ? 'border: 4px solid #FFC83D; box-shadow: 0 0 0 6px rgba(255,200,61,0.35), 0 0 40px rgba(255,200,61,0.9); transform: scale(1.06)' : 'border: 3px solid ' + p[1] + '; box-shadow: 0 0 18px ' + p[1] + ', inset 0 0 14px rgba(255,255,255,0.08)'),
        face: 'width: 96px; height: 96px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at 35% 30%, ' + p[1] + ', #241C5C 75%); box-shadow: 0 0 22px ' + p[1],
        pick: () => { this.setState({ picked: i, says: p[0] + '! בחירה מצוינת. יוצאים לדרך!' }); this.playClip('aud-' + p[2], ENV[p[2]]); }
      })),
      goCls: st.picked >= 0 ? 'pulse' : '',
      goStyle: 'display: flex; align-items: center; gap: 12px; border-radius: 999px; padding: 16px 52px; font-size: 30px; font-weight: 700; text-decoration: none; ' + (st.picked >= 0 ? 'background: #FFC83D; color: #17123D; box-shadow: 0 8px 0 #D49D10, 0 0 40px rgba(255,200,61,0.7)' : 'background: rgba(36,28,92,0.7); color: #8F88C2; pointer-events: none')
    };
  }
}


;return Component;};
