window.__DCB=window.__DCB||{};window.__DCB["Intake"]=function(DCLogic,React){

const Q = [{"k": "heb_letters", "subj": "Heb", "q": "עברית: האם הילד/ה מזהה אותיות לפי השם? (למשל \"זאת האות בּ\")", "opts": [["לא בטוח/ה או עדיין לא", 0], ["חלק מהאותיות", 0], ["את כולן", 1]]}, {"k": "heb_sound", "subj": "Heb", "q": "עברית: האם הילד/ה יודע/ת את הצליל של האותיות? (בּ = \"בְּ\")", "opts": [["לא בטוח/ה או עדיין לא", 0], ["חלק מהצלילים", 0], ["את כולם, וגם קורא/ת הברות", 1]]}, {"k": "heb_read", "subj": "Heb", "q": "עברית: האם הילד/ה קורא/ת מילים מנוקדות לבד?", "opts": [["לא בטוח/ה או עדיין לא", 0], ["מילים קצרות (כמו אַבָּא, דָּג)", 1], ["מילים ומשפטים קצרים", 1]]}, {"k": "math_count", "subj": "Math", "q": "חשבון: עד כמה הילד/ה סופר/ת בביטחון?", "opts": [["לא בטוח/ה או עד 10", 0], ["עד 20", 1], ["עד 100", 1]]}, {"k": "math_add", "subj": "Math", "q": "חשבון: חיבור וחיסור קטנים (3+2 או 5−1)?", "opts": [["לא בטוח/ה או עדיין לא", 0], ["עד 10, לפעמים עם אצבעות", 1], ["עד 20 בלי עזרה", 1]]}, {"k": "eng", "subj": "Eng", "q": "אנגלית: מה הילד/ה כבר מכיר/ה?", "opts": [["לא בטוח/ה או עדיין לא התחילו", 0], ["מילים בודדות: צבעים, מספרים, Hello", 0], ["גם אותיות באנגלית", 0]]}, {"k": "time", "subj": null, "q": "כמה זמן ביום מתאים לכם?", "opts": [["10 דקות", 10], ["15 דקות", 15], ["20 דקות", 20]]}];
const NAMES = { Heb: ['עברית', '#FF7A59', ['היכרות עם האלף-בית', 'אות ותנועה', 'קוראים מילים', 'הברות סגורות ושווא', 'משפטים קצרים', 'משפחות מילים', 'סיפורים ושטף']],
  Math: ['חשבון', '#FFC83D', ['ספירה עד 10', 'עד 20 וחיבור עד 10', 'חיבור וחיסור עד 20', 'מספרים עד 100', 'חיבור וחיסור עד 100', 'משמעות הכפל', 'לוח הכפל']],
  Eng: ['אנגלית', '#34D1BF', ['שיחה ומילים בעל-פה', 'אותיות וצלילים', 'מילים עם תמונות', 'קוראים מילים קצרות', 'שיחות קצרות', 'אוצר מילים', 'משפטים וסיפורונים']] };
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { i: 0, ans: {}, adj: {} }; }
  levels() {
    const st = this.props && this.props.store, cfg = st && st.config ? st.config() : { open: { Heb: 3, Math: 3, Eng: 1 } };
    const pts = { Heb: 0, Math: 0, Eng: 0 };
    Q.forEach(q => { if (q.subj && this.state.ans[q.k] != null) pts[q.subj] += q.opts[this.state.ans[q.k]][1]; });
    const out = {};
    for (const s in pts) out[s] = Math.max(1, Math.min(1 + pts[s] + (this.state.adj[s] || 0), (cfg.open || {})[s] || 1));
    return out;
  }
  renderVals() {
    const i = this.state.i, q = Q[i], done = i >= Q.length, st = this.props && this.props.store;
    const lv = this.levels();
    const minutes = this.state.ans.time != null ? Q[6].opts[this.state.ans.time][1] : 15;
    return {
      canBack: i > 0, back: () => this.setState({ i: Math.max(0, i - 1) }),
      step: done ? 'סיימנו' : 'שאלה ' + (i + 1) + ' מתוך ' + Q.length, asking: !done, done,
      qText: q ? q.q : '',
      opts: q ? q.opts.map((o, k) => ({ t: o[0], border: this.state.ans[q.k] === k ? '#FFC83D' : 'rgba(201,195,242,0.35)', pick: () => { const ans = Object.assign({}, this.state.ans); ans[q.k] = k; this.setState({ ans, i: i + 1 }); } })) : [],
      dots: Q.map((_, k) => ({ c: k < i ? '#FFC83D' : k === i ? '#FFFFFF' : 'rgba(201,195,242,0.3)' })),
      result: ['Heb', 'Math', 'Eng'].map(s => ({ name: NAMES[s][0], c: NAMES[s][1], n: String(lv[s]), desc: NAMES[s][2][lv[s] - 1], up: () => { const adj = Object.assign({}, this.state.adj); adj[s] = (adj[s] || 0) + 1; this.setState({ adj }); }, down: () => { const adj = Object.assign({}, this.state.adj); adj[s] = (adj[s] || 0) - 1; this.setState({ adj }); } })),
      minutes: String(minutes),
      finish: () => { if (!st) return; st.set('intake', { ans: this.state.ans, start: lv, minutes, at: Date.now() }); },
    };
  }
}


;return Component;};
