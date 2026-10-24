window.__DCB=window.__DCB||{};window.__DCB["Story"]=function(DCLogic,React){

const IMGS = {"pointing": "assets/noga_pointing.webp", "clapping": "assets/noga_clapping.webp", "tryagain": "assets/noga_tryagain.webp", "wow": "assets/noga_wow.webp", "thumbsup": "assets/noga_thumbsup.webp", "thinking": "assets/noga_thinking.webp", "listening": "assets/noga_listening.webp", "friendly": "assets/noga_friendly.webp", "talk": ["assets/noga_talk2.webp", "assets/noga_talk1.webp", "assets/noga_talk2.webp"]};
const STORY = {"b": [8.38, 18.95, 30.53, 47.7, 53.85, 62.25, 74.95, 80.9, 92.45, 99.5], "env": "001499994285765433544000001100389877624000389874741253631000322530323231222311100000000034695223923653366331101442542232000000024433622223202353200231322234423326234200003126000079421100000000000314000004442000000742242334351543114543354120100000000997645326201054999953000069534251434234855139673661751110003244232425357744549843000000000000398796567412693131121995138318688897744665431010000215386566343268744557433223312100051991003145495593936951119998950009889984573200000000001965200000034251010001199848655624433311079963464622000000000999745443533424241224595586452455101206638222322142222212100000011100289953751000485679543000012644545331005354452100000010529735304346463527445344322100100017745842330001553285245000023334653000924632100000010038289954666332331032100476331008862000975441322110000000000003964997220373472243243011031534354789453100015314100013241740015445200117647476411000000999985162035983333110000582345310442674100009967327535443110000000000659710000001454327410000000493673200000328731000002372100000006799400000", "p": ["שלום, טייסים וטייסות! קוראים לי נוגה, ואני מורה בכוכב נוגה – הכוכב הכי מנצנץ בשמיים.", "אצלנו בכוכב חיינו חיים שקטים ושמחים. הילדים קראו סיפורים, ספרו כוכבים ושרו שירים, בעברית ובאנגלית.", "אבל יום אחד נחתה אצלנו ספינת חלל ענקית. ממנה ירדו זללון, המפלצת הכי רעבתנית ביקום, וחבורת החייזרים העוזרים שלו.", "זללון בלע את כל האותיות, המספרים והמילים של הכוכב שלנו, ופיזר אותם על כוכבי הלכת של מערכת השמש. פתאום אף אחד לא הצליח לקרוא, לספור או לדבר עם חברים!", "ואז הוא חטף אותי, ונעל אותי במבצר שלו, כאן על כוכב נוגה.", "אני מדברת אליכם עכשיו דרך מכשיר ההולוגרמה הסודי שלי, כי אני צריכה את העזרה שלכם!", "עלו על החללית וצאו למסע, מכוכב לכת לכוכב לכת. בכל כוכב מחכה לכם חייזר עוזר של זללון. כדי לנצח אותו, תצטרכו לקרוא, לחשב ולדבר אנגלית.", "כל תשובה נכונה משחררת אות, מספר או מילה, ומחזירה אותם הביתה.", "בסוף המסע, במבצר של זללון, תפתחו שלושה מנעולים – של עברית, של חשבון ושל אנגלית – ותשחררו אותי.", "אני אהיה איתכם כל הדרך: אסביר, אעזור, ואשמח איתכם בכל הצלחה.", "מוכנים? חגרו חגורות... שלוש, שתיים, אחת – המראה!"]};
const SCENE = [0, 1, 2, 3, 4, 4, 5, 5, 6, 6, 6];
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { talking: false, mouth: 0, playing: false, started: false, blocked: false, t: 0 }; }

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

  para() { const t = this.state.t; let i = 0; while (i < STORY.b.length && t >= STORY.b[i]) i++; return i; }
  renderVals() {
    const pi = this.state.started ? this.para() : 0; const sc = SCENE[pi];
    const v = {};
    for (let i = 0; i < 7; i++) v['sc' + i] = 'position: absolute; inset: 0; transition: opacity .8s, transform .8s; ' + (i === sc ? 'opacity: 1; transform: scale(1)' : 'opacity: 0; transform: scale(0.96); pointer-events: none');
    return Object.assign(v, {
      nogaGlow: this.glow(), nogaImg: this.frame(),
      dots: [0, 1, 2, 3, 4, 5, 6].map(i => ({ s: 'width: 12px; height: 12px; border-radius: 50%; background: ' + (i === sc ? '#FFC83D' : 'rgba(201,195,242,0.4)') })),
      startCover: this.state.started ? [] : [{ note: this.state.blocked ? 'הדפדפן חסם את השמע. לוחצים שוב.' : 'דקה וחצי · מומלץ עם רמקול', go: () => { this.setState({ started: true }); this.playClip('story-audio', STORY.env); } }],
      caption: this.state.started ? STORY.p[pi] : 'לוחצים על כפתור ההפעלה, ונוגה תספר את כל הסיפור.',
      toggleLabel: this.state.playing ? 'עצירה' : 'המשך',
      toggle: () => { const au = document.getElementById('story-audio'); if (!au) return; if (this.state.playing) this.stopClip('story-audio'); else { this.setState({ started: true }); this.playClip('story-audio', STORY.env, null, true); } },
      restart: () => { this.setState({ started: true, t: 0 }); this.playClip('story-audio', STORY.env); }
    });
  }
}


;return Component;};
