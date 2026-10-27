window.__DCB=window.__DCB||{};window.__DCB["Main"]=function(DCLogic,React){

const IMGS = {"pointing": "assets/noga_pointing.webp", "clapping": "assets/noga_clapping.webp", "tryagain": "assets/noga_tryagain.webp", "wow": "assets/noga_wow.webp", "thumbsup": "assets/noga_thumbsup.webp", "thinking": "assets/noga_thinking.webp", "listening": "assets/noga_listening.webp", "friendly": "assets/noga_friendly.webp", "talk": ["assets/noga_talk2.webp", "assets/noga_talk1.webp", "assets/noga_talk2.webp"]};
const ENV = {"home": "001699973783355420111272892297416353684000000954466652000025313540013133963227852200"};
const SHIP = "assets/ship.webp";
const SHOP = [["s0", "ship", "הַמְּקוֹרִית", 0, "none"], ["s1", "ship", "וְרֻדָּה", 8, "hue-rotate(290deg) saturate(1.4)"], ["s2", "ship", "יְרֻקָּה", 8, "hue-rotate(95deg) saturate(1.2)"], ["s3", "ship", "כְּחֻלָּה", 12, "hue-rotate(190deg) saturate(1.3)"], ["s4", "ship", "זְהֻבָּה", 20, "sepia(1) saturate(3) hue-rotate(-12deg) brightness(1.1)"], ["s5", "ship", "גָּלַקְסְיָה", 40, "hue-rotate(245deg) saturate(1.8) brightness(1.1) drop-shadow(0 0 10px #B48CFF)"], ["h1", "hat", "כּוֹבַע", 5, "🧢"], ["h2", "hat", "מִשְׁקְפֵי שֶׁמֶשׁ", 10, "🕶️"], ["h3", "hat", "סֶרֶט", 10, "🎀"], ["h4", "hat", "אֹזְנִיּוֹת", 12, "🎧"], ["h5", "hat", "גִּבּוֹר עַל", 25, "🦸"], ["h6", "hat", "כֶּתֶר", 45, "👑"], ["p1", "pet", "חֲתַלְתּוּל", 15, "🐱"], ["p2", "pet", "כַּלְבְּלָב", 15, "🐶"], ["p3", "pet", "רוֹבּוֹט", 25, "🤖"], ["p4", "pet", "חַד־קֶרֶן", 35, "🦄"], ["p5", "pet", "דְּרָקוֹן", 50, "🐉"]];
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { talking: false, mouth: 0, playing: false, heard: false, shop: false, tab: 'ship', msg: '' }; }

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
    // ---- ship shop ----
    const coins = st ? (Number(st.get('coins')) || 0) : 0;
    const sh = Object.assign({ owned: { s0: 1 }, ship: 's0', shipFx: 'none', hat: '', pet: '' }, st ? (st.get('shop') || {}) : {});
    const saveShop = (o) => { if (st) st.set('shop', o); };
    const beep = (hi) => { try { const C = window.AudioContext || window.webkitAudioContext; const c = this.__ac || (this.__ac = new C()); const o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.value = hi ? 880 : 220; g.gain.setValueAtTime(0.12, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25); o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + 0.26); if (hi) { const o2 = c.createOscillator(), g2 = c.createGain(); o2.type = 'triangle'; o2.frequency.value = 1320; g2.gain.setValueAtTime(0.1, c.currentTime + 0.12); g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4); o2.connect(g2); g2.connect(c.destination); o2.start(c.currentTime + 0.12); o2.stop(c.currentTime + 0.42); } } catch (e) {} };
    const equip = (it) => { const o = Object.assign({}, sh, { owned: Object.assign({}, sh.owned) });
      if (it[1] === 'ship') { o.ship = it[0]; o.shipFx = it[4]; } else if (it[1] === 'hat') o.hat = o.hat === it[4] ? '' : it[4]; else o.pet = o.pet === it[4] ? '' : it[4]; return o; };
    const tapItem = (it) => {
      if (sh.owned[it[0]] || it[3] === 0) { const o = equip(it); o.owned[it[0]] = 1; saveShop(o); beep(true); this.setState({ msg: '' }); return; }
      if (coins < it[3]) { beep(false); this.setState({ msg: 'חֲסֵרִים עוֹד ' + (it[3] - coins) + ' 🪙 · כָּל תְּשׁוּבָה נְכוֹנָה בַּמִּשְׂחָקִים = 🪙' }); return; }
      const o = equip(it); o.owned[it[0]] = 1; saveShop(o); if (st) st.set('coins', coins - it[3]); beep(true);
      this.setState({ msg: '🎉 ' + it[2] + ' – שֶׁלָּכֶם!' });
    };
    const TABS = [['ship', '🚀 צֶבַע לַחֲלָלִית'], ['hat', '🧑‍🚀 לַטַּיָּס'], ['pet', '🐾 חַיַּת מַחְמָד']];
    const tabStyle = (on) => 'border: 0; border-radius: 999px; padding: 10px 24px; font: 700 22px Fredoka, Rubik, sans-serif; cursor: pointer; ' + (on ? 'background: #FFC83D; color: #17123D' : 'background: #241C5C; color: #FFFFFF');
    const shopItems = SHOP.filter(it => it[1] === this.state.tab).map(it => {
      const own = !!sh.owned[it[0]] || it[3] === 0, on = (it[1] === 'ship' && sh.ship === it[0]) || (it[1] === 'hat' && sh.hat === it[4]) || (it[1] === 'pet' && sh.pet === it[4]);
      const can = own || coins >= it[3];
      return { tap: () => tapItem(it), name: it[2], isShip: it[1] === 'ship', isEmoji: it[1] !== 'ship', e: it[4], fx: it[1] === 'ship' ? 'filter: ' + it[4] : '',
        tag: on ? '✓ עָלַי' : own ? 'לִבְחֹר' : '🪙 ' + it[3],
        tagStyle: 'border-radius: 999px; padding: 3px 14px; font-size: 18px; font-weight: 700; ' + (on ? 'background: #34D1BF; color: #17123D' : own ? 'background: #FFFFFF; color: #17123D' : can ? 'background: #FFC83D; color: #17123D' : 'background: rgba(255,255,255,0.12); color: #C9C3F2'),
        style: 'display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; min-height: 170px; border-radius: 22px; cursor: pointer; color: #FFFFFF; font-family: Fredoka, Rubik, sans-serif; background: rgba(36,28,92,0.9); ' + (on ? 'border: 4px solid #34D1BF; box-shadow: 0 0 24px rgba(52,209,191,0.6)' : can ? 'border: 3px solid #FFC83D' : 'border: 3px solid rgba(201,195,242,0.25); opacity: 0.7') };
    });
    const shopVals = { coins: String(coins), shopOn: !!this.state.shop, openShop: () => this.setState({ shop: true, msg: '' }), closeShop: () => this.setState({ shop: false, msg: '' }),
      shopTabs: TABS.map(t => ({ label: t[1], style: tabStyle(this.state.tab === t[0]), go: () => this.setState({ tab: t[0], msg: '' }) })), shopItems, shopMsg: this.state.msg,
      shipFx: 'filter: ' + (sh.shipFx || 'none'), petEmoji: sh.pet || '', hatBig: sh.hat || '🧑‍🚀' };
    return { nogaGlow: this.glow(), nogaImg: this.frame(), speak: go, playHint: (this.state.heard || this.state.playing) ? [] : [{ go: go }], hebLabel: cur('Heb'), mathLabel: cur('Math'), engLabel: cur('Eng'),
             shipImg: SHIP, shipParts: parts + '/21 חֲלָקִים', shipDots: dots, stickerCount: String(Object.keys(stk).length), pilotLabel: (sh.hat || '🧑‍🚀') + ' ' + (kid && kid.name ? kid.name : pilot ? pilot : 'טַיָּסִים'), starCount: String(stars), holiTag: window.__nogaHoliday === 'hanukkah' ? ' 🕎' : '', ...shopVals };
  }
}


;return Component;};
