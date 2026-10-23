window.__DCB=window.__DCB||{};window.__DCB["MapEng"]=function(DCLogic,React){

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
    return v;
  }
}

;return Component;};
