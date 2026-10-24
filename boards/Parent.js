window.__DCB=window.__DCB||{};window.__DCB["Parent"]=function(DCLogic,React){

const NAMES = {"Heb": ["היכרות עם הא״ב", "אות ותנועה", "קוראים מילים", "הברות סגורות ושווא", "משפטים קצרים", "משפחות מילים", "סיפורים ושטף"], "Math": ["ספירה עד 10", "עד 20 · חיבור עד 10", "חיבור וחיסור עד 20", "מספרים עד 100", "חיבור וחיסור עד 100", "משמעות הכפל", "לוח הכפל"], "Eng": ["שיחה ומילים בעל פה", "אותיות וצלילים", "מילים עם תמונות", "קוראים מילים קצרות", "שיחות קצרות", "כ200 מילים", "משפטים וסיפורונים"]};
const GAMES = {"Heb": [["כוכבים נופלים", "זכרון אות ותמונה", "קליעה לאות", "קו התאמה"], ["פיצוץ בלונים", "בית לכל תנועה", "לוח מקשים", "קליעה להברה"], ["קוראים ומצילים", "פאזל מלה", "קו התאמה", "שביל אבנים"], ["תוף ההברות", "מתקנים את המלה", "שביל אבנים", "פאזל מלה"], ["משפט ותמונה", "דלק למשפט", "החיזר שלא שיך", "פאזל משפט"], ["אספן השרשים", "שלושה ירחים", "קרן הסורק", "קו למשפחה"], ["ספור ושאלות", "מסדרים את הספור", "איך זה ממשיך?", "שביל הספורים"]], "Math": [["טילי תשובות", "איפה יותר?", "שביל אבני כוכב", "מסגרת העשר"], ["ממלאים את המכל", "זוגות לעשר", "קליעה לתשובה", "קו התאמה"], ["טילי תשובות", "קפיצה דרך 10", "שביל מכשולים", "קליעה לאסטרואיד"], ["כוכב גדול", "איפה החללית?", "לוח המאה", "בונים עשרות"], ["טילים עד 100", "קפיצות בעשרות", "מעבדת פריטה", "פאזל תרגילים"], ["קבוצות חיזרים", "חממת המלבן", "אבני דלוג", "מחלקים מטען"], ["טילי כפל", "מראת החלוף", "חוקר לוח הכפל", "מרוץ אסטרואידים"]], "Eng": [["Paint by Voice", "Alien Says", "Listen and Count", "Number Match"], ["Sound Keypad", "Letter Blaster", "Big and Small", "ABC Memory"], ["Listen and Find", "Category Pods", "Match-Line", "Word Memory"], ["Build-a-Word", "Rhyme Catch", "Word Stones", "Match-Line"], ["Alien Chat", "Space Shop", "Finish My Phrase", "Question & Answer"], ["Word Bingo", "Word Blaster", "ממינים מלים", "Word Memory"], ["Copy-Cat Book", "Story Puzzle", "Predict-a-Story", "Sentence Match"]]};
const SUBJ = [["Heb", "עברית", "#FF7A59"], ["Math", "חשבון", "#FFC83D"], ["Eng", "אנגלית", "#34D1BF"]];
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { v: 0, confirm: false }; }
  renderVals() {
    const st = this.props && this.props.store;
    const btn = (on) => 'border: 0; border-radius: 999px; padding: 12px 22px; font: 600 18px Rubik, sans-serif; cursor: pointer; ' + (on ? 'background: #34D1BF; color: #17123D' : 'background: #241C5C; color: #FFFFFF');
    const subjects = SUBJ.map(([p, name, color]) => ({ name, color, levels: NAMES[p].map((nm, i) => {
      const key = p + 'L' + (i + 1);
      const cnt = st ? st.count(key) : (i === 0 ? 3 : 0);
      const open = st ? st.isOpen(key) : true;
      const comp = st ? st.isComplete(key) : false;
      const d = st ? st.getDone(key) : {}; let sum = 0, n = 0; for (const k in d) if (k !== '_total') { sum += Number(d[k]) || 0; n++; }
      return { n: String(i + 1), name: nm, stars: n ? '⁦' + '★'.repeat(Math.round(sum / n)) + '⁩' : '', label: !open ? '🔒' : comp ? '✓ ' + cnt + '/7' : cnt + '/7',
        style: 'display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 8px 4px; border-radius: 12px; ' + (comp ? 'background: rgba(52,209,191,0.3); border: 2px solid #34D1BF' : open ? 'background: rgba(255,255,255,0.08); border: 2px solid rgba(201,195,242,0.35)' : 'background: rgba(0,0,0,0.25); border: 2px solid transparent; opacity: 0.6') };
    }) }));
    const mute = st ? !!st.get('mute') : false, openAll = st ? !!st.get('openAll') : false;
    // 3-line report: what was practised, what goes well alone, where help is useful
    const sec = st ? (st.get('time') || 0) : 0, last = st ? st.get('lastPlay') : 0;
    const mins = Math.round(sec / 60);
    const intake = st ? st.get('intake') : null;
    const ago = last ? Math.round((Date.now() - last) / 86400000) : -1;
    const practised = [], strong = [], weak = []; let games = 0;
    SUBJ.forEach(([p, name]) => { for (let i = 1; i <= 7; i++) { const d = st ? st.getDone(p + 'L' + i) : {}; let n = 0; for (const k in d) if (k !== '_total') { n++; games++; const v = Number(d[k]) || 0; const t = (GAMES[p][i - 1][Number(k)] || '') + ' (' + name + ' ' + i + ')'; const hp = ((st && st.get('help')) || {})[p + 'L' + i] || {}; const hn = Number(hp[k]) || 0; if (v <= 2 || hn >= 3) weak.push(t + (v > 2 ? ' – נעזר/ה ברמזים' : '')); else if (v >= 4) strong.push(t); } if (n) practised.push(name + ' רמה ' + i + ' – ' + NAMES[p][i - 1] + ' (' + n + '/7)'); } });
    const when = mins ? mins + ' דק׳ סה״כ' + (ago === 0 ? ', שיחקו היום' : ago > 0 ? ', לפני ' + ago + ' ימים' : '') : 'עדיין לא שיחקו';
    const report = [
      { k: 'מה תרגל/ה · ' + when + (intake ? ' · יעד: ' + intake.minutes + ' דק׳ ביום' : ''), v: practised.length ? practised.join(' · ') : 'עדיין לא התחילו. מתחילים מהמפה.', c: '#34D1BF' },
      { k: 'מה הולך טוב לבד (4–5 כוכבים, בלי הרבה רמזים)', v: strong.length ? strong.length + ' משחקים, למשל: ' + strong.slice(0, 3).join(', ') : games ? 'עוד לא – זה בסדר, רק מתחילים.' : 'עוד אין נתונים', c: '#FFC83D' },
      { k: 'במה כדאי לעזור (1–2 כוכבים, או ניצחון בעזרת רמזים)', v: weak.length ? weak.slice(0, 3).join(', ') + ' – כדאי לשחק יחד פעם אחת, ואז לתת לנסות לבד.' : games ? 'כרגע אין – נוגה מסתדרת עם הילד/ה.' : 'עוד אין נתונים', c: '#FF7A59' },
    ];
    return {
      report, subjects,
      note: st ? 'רמה נפתחת אחרי 5 משחקים עם 3 כוכבים ומעלה, ורמה שנפתחה נשארת פתוחה. ההתקדמות נשמרת במכשיר הזה.' : 'תצוגה לדוגמה. באפליקציה מוצגת ההתקדמות האמיתית מהמכשיר.',
      muteLabel: mute ? '🔇 צלילי משחק כבויים' : '🔊 צלילי משחק פועלים', muteStyle: btn(!mute),
      toggleMute: () => { if (st) { st.set('mute', !mute); this.setState({ v: this.state.v + 1 }); } },
      openLabel: openAll ? '🔓 כל הרמות פתוחות (מצב בודקים)' : '🔒 רמות נפתחות לפי התקדמות', openStyle: btn(openAll),
      toggleOpen: () => { if (st) { st.set('openAll', !openAll); this.setState({ v: this.state.v + 1 }); } },
      resetLabel: this.state.confirm ? 'ללחוץ שוב כדי למחוק את כל הכוכבים וההתקדמות' : 'איפוס התקדמות…',
      reset: () => { if (!this.state.confirm) { this.setState({ confirm: true }); return; } if (st) { st.reset(); } this.setState({ confirm: false, v: this.state.v + 1 }); },
    };
  }
}


;return Component;};
