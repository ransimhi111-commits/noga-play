window.__DCB=window.__DCB||{};window.__DCB["MapEng"]=function(DCLogic,React){

const INFO = [{"what": "בְּנֶפְטוּן מַתְחִילִים לְדַבֵּר אַנְגְּלִית! קֹדֶם מַקְשִׁיבִים, אַחַר כָּךְ מְשַׂחֲקִים.", "games": "🎨 Paint by Voice · 🕺 Alien Says · 🔢 Listen and Count · 〰️ Number Match", "title": "שִׂיחָה וּמִלִּים בְּעַל פֶּה"}, {"what": "בְּאוּרָנוּס נַכִּיר אֶת הָאוֹתִיּוֹת בְּאַנְגְּלִית, מֵאֵיי וְעַד זֵד!", "games": "⌨️ Sound Keypad · 🎯 Letter Blaster · 〰️ Big and Small · 🃏 ABC Memory", "title": "אוֹתִיּוֹת וּצְלִילִים"}, {"what": "בְּשַׁבְּתַאי לוֹמְדִים מִלִּים חֲדָשׁוֹת בְּאַנְגְּלִית: חַיּוֹת, אֹכֶל וּבֵית סֵפֶר.", "games": "👂 Listen and Find · 📦 Category Pods · 〰️ Match-Line · 🃏 Word Memory", "title": "מִלִּים עִם תְּמוּנוֹת"}, {"what": "בְּצֶדֶק מַתְחִילִים לִקְרֹא בְּאַנְגְּלִית: מִלִּים קְצָרוֹת שֶׁל שָׁלוֹשׁ אוֹתִיּוֹת.", "games": "🧩 Build-a-Word · ⭐ Rhyme Catch · 🪨 Word Stones · 〰️ Match-Line", "title": "קוֹרְאִים מִלִּים קְצָרוֹת"}, {"what": "בְּמַאְדִּים מְדַבְּרִים עִם הַחַיְזָרִים בְּאַנְגְּלִית!", "games": "📡 Alien Chat · 🛒 Space Shop · 🤖 Finish My Phrase · 〰️ Question & Answer", "title": "שִׂיחוֹת קְצָרוֹת"}, {"what": "בְּכַדּוּר הָאָרֶץ אוֹסְפִים עוֹד וְעוֹד מִלִּים בְּאַנְגְּלִית: גּוּף, בְּגָדִים וּמֶזֶג אֲוִיר.", "games": "🎱 Word Bingo · 🎯 Word Blaster · 📒 מְמַיְּנִים מִלִּים · 🃏 Word Memory", "title": "אוֹצַר מִלִּים"}, {"what": "הִגַּעְנוּ לְנֹגַהּ! כָּאן קוֹרְאִים מִשְׁפָּטִים וְסִפּוּרִים קְטַנִּים בְּאַנְגְּלִית.", "games": "📕 Copy-Cat Book · 🧩 Story Puzzle · 📖 Predict-a-Story · 〰️ Sentence Match", "title": "מִשְׁפָּטִים וְסִפּוּרוֹנִים"}];
class Component extends DCLogic {
  renderVals() {
    const st = this.props && this.props.store;
    const v = {};
    for (let i = 1; i <= 7; i++) {
      const key = 'EngL' + i;
      const open = !st || st.isOpen(key);
      v['p' + i] = { open, locked: !open, done: !!(st && st.isComplete(key)), cur: false };
    }
    let c = 1; for (let i = 1; i <= 7; i++) if (v['p' + i].open) c = i;
    for (let i = 1; i <= 7; i++) if (v['p' + i].open && !v['p' + i].done) { c = i; break; }
    v['p' + c].cur = true;
    const sel = this.state && this.state.info;
    for (let i = 1; i <= 7; i++) v['p' + i].info = () => this.setState({ info: i });
    v.infoOn = !!sel; v.infoClose = () => this.setState({ info: 0 });
    if (sel) {
      const d = INFO[sel - 1];
      v.infoHead = '⁧' + sel + ' · ' + d.title + '⁩'; v.infoWhat = d.what; v.infoGames = d.games;
      v.infoCanGo = v['p' + sel].open; v.infoLocked = !v['p' + sel].open; v.infoHref = 'EngL' + sel + '.dc.html';
    }
    return v;
  }
}

;return Component;};
