window.__DCB=window.__DCB||{};window.__DCB["MapMath"]=function(DCLogic,React){

const INFO = [{"what": "בְּנֶפְטוּן סוֹפְרִים עַד עֶשֶׂר!", "games": "🚀 טִילֵי תְּשׁוּבוֹת · 🪐 אֵיפֹה יוֹתֵר? · 🪨 שְׁבִיל אַבְנֵי כּוֹכָב · ⌨️ מִסְגֶּרֶת הָעֶשֶׂר", "title": "סְפִירָה עַד 10"}, {"what": "בְּאוּרָנוּס נִלְמַד מִסְפָּרִים עַד עֶשְׂרִים, וּנְחַבֵּר עַד עֶשֶׂר!", "games": "⛽ מְמַלְּאִים אֶת הַמְּכָל · 👯 זוּגוֹת לְעֶשֶׂר · 🎯 קְלִיעָה לַתְּשׁוּבָה · 〰️ קַו הַתְאָמָה", "title": "עַד 20 וְחִבּוּר עַד 10"}, {"what": "בְּשַׁבְּתַאי מְחַבְּרִים וּמְחַסְּרִים עַד עֶשְׂרִים!", "games": "🚀 טִילֵי תְּשׁוּבוֹת · 🌗 קְפִיצָה דֶּרֶךְ 10 · 🪨 שְׁבִיל מִכְשׁוֹלִים · 🎯 קְלִיעָה לָאַסְטֵרוֹאִיד", "title": "חִבּוּר וְחִסּוּר עַד 20"}, {"what": "בְּצֶדֶק נַגִּיעַ עַד מֵאָה!", "games": "🪐 כּוֹכָב גָּדוֹל · 🛰️ אֵיפֹה הַחֲלָלִית? · 🗺️ לוּחַ הַמֵּאָה · 🧱 בּוֹנִים עֲשָׂרוֹת", "title": "מִסְפָּרִים עַד 100"}, {"what": "בְּמַאְדִּים פּוֹתְרִים תַּרְגִּילִים עַד מֵאָה!", "games": "🚀 טִילִים עַד 100 · 🌀 קְפִיצוֹת בַּעֲשָׂרוֹת · 🔬 מַעְבֶּדֶת פְּרִיטָה · 🧩 פָּאזֶל תַּרְגִּילִים", "title": "חִבּוּר וְחִסּוּר עַד 100"}, {"what": "בְּכַדּוּר הָאָרֶץ נִלְמַד מָה זֶה כֶּפֶל: קְבוּצוֹת שָׁווֹת!", "games": "👽 קְבוּצוֹת חַיְזָרִים · 🌱 חֲמָמַת הַמַּלְבֵּן · 🪨 אַבְנֵי דִּלּוּג · 📦 מְחַלְּקִים מִטְעָן", "title": "מַשְׁמָעוּת הַכֶּפֶל"}, {"what": "הִגַּעְנוּ לְנֹגַהּ! כָּאן מְתַרְגְּלִים אֶת לוּחַ הַכֶּפֶל וּמַצִּילִים אֶת הַכּוֹכָב.", "games": "🚀 טִילֵי כֶּפֶל · 🪞 מַרְאַת הַחִלּוּף · 🔢 חוֹקֵר לוּחַ הַכֶּפֶל · ☄️ מֵרוֹץ אַסְטֵרוֹאִידִים", "title": "לוּחַ הַכֶּפֶל"}];
class Component extends DCLogic {
  renderVals() {
    const st = this.props && this.props.store;
    const v = {};
    for (let i = 1; i <= 7; i++) {
      const key = 'MathL' + i;
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
      v.infoCanGo = v['p' + sel].open; v.infoLocked = !v['p' + sel].open; v.infoHref = 'MathL' + sel + '.dc.html';
    }
    return v;
  }
}

;return Component;};
