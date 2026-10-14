// =====================================================================
// Cloud save (Supabase). Plans are shared by link, like a shared doc:
//   view link  ?s=<id>            anyone with it can open a read-only copy
//   edit link  ?s=<id>&k=<token>  keep private; edits autosave to the cloud
// The database only exposes 4 functions (create/get/update/delete); the
// table itself is closed, and update/delete check the secret edit token.
// The publishable key below is meant to be public.
// =====================================================================
const CLOUD_URL = "https://hzvuzhrdxenmotuehnpz.supabase.co";
const CLOUD_KEY = "sb_publishable_kEDwB37wRBFkTlF7yiiyyA_UTix4-PN";
const MINE_KEY = "bball-cloud-mine";

const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const when = iso => { try { return new Date(iso).toLocaleString("en-IE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };

async function rpc(fn, body) {
  const r = await fetch(`${CLOUD_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: CLOUD_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error((j && j.message) || `Cloud error ${r.status}`);
  return j;
}

// Plans saved from this browser (so you can find them again).
function loadMine() { try { return JSON.parse(localStorage.getItem(MINE_KEY) || "[]"); } catch { return []; } }
function saveMine(list) { try { localStorage.setItem(MINE_KEY, JSON.stringify(list)); } catch {} }
function rememberMine(entry) { saveMine([entry, ...loadMine().filter(p => p.id !== entry.id)].slice(0, 50)); }

// Current cloud link: { id, token (null when view-only), name, updated }
let cur = null;
let status = "idle";          // idle | saving | saved | error | view
let applying = false, timer = null;

const base = () => location.origin + location.pathname;
const viewLink = () => cur ? `${base()}?s=${cur.id}#mission` : "";
const editLink = () => cur && cur.token ? `${base()}?s=${cur.id}&k=${cur.token}#mission` : "";
function setUrl() {
  const q = cur ? (cur.token ? `?s=${cur.id}&k=${cur.token}` : `?s=${cur.id}`) : "";
  history.replaceState(null, "", base() + q + location.hash);
}

// ---------- header pill + drawer ----------
function renderPill() {
  const map = {
    idle: ["☁️", cur ? "Cloud" : "Save to cloud"],
    saving: ["⏳", "Saving…"],
    saved: ["✅", "Saved"],
    error: ["⚠️", "Not saved"],
    view: ["👁", "View only"],
  };
  const [ic, txt] = map[status];
  $("cloudBtn").innerHTML = `<span>${ic}</span><span class="cloud-txt">${txt}</span>`;
  $("cloudBtn").classList.toggle("on", status === "saved");
}
function renderDrawer(msg = "") {
  const mine = loadMine();
  const linkRow = (label, url, hint) => `<div class="link-row"><div class="small muted">${label}</div>
    <div class="link-box"><input readonly value="${esc(url)}" aria-label="${label}"><button class="btn" data-copy="${esc(url)}">Copy</button></div>
    <div class="help">${hint}</div></div>`;
  $("cloudBody").innerHTML = `
    ${msg ? `<div class="callout ${msg.startsWith("⚠") ? "" : "good"}" style="margin-bottom:12px"><div>${msg}</div></div>` : ""}
    <label class="small muted" for="cloudName">Plan name</label>
    <input id="cloudName" class="text-in" maxlength="80" value="${esc(cur ? cur.name : "My academy plan")}">
    ${!cur ? `<button class="btn primary wide" id="cloudCreate">☁️ Save this plan to the cloud</button>
        <p class="help">Saves every lever, the timetable and all weights. You'll get a private edit link and a view link to share.</p>`
      : cur.token ? `
        <div class="status-line">${status === "saving" ? "⏳ Saving…" : status === "error" ? "⚠️ Last save failed. Check your connection." : `✅ Autosaving · last saved ${when(cur.updated)}`}</div>
        ${linkRow("👁 View link: share with investors and partners", viewLink(), "They see a read-only copy. Their changes never touch your plan.")}
        ${linkRow("🔑 Edit link: keep private", editLink(), "Opens this plan on any device with editing and autosave. Anyone with this link can change it.")}
        <div class="row-btns"><button class="btn" id="cloudCopyNew">Save as a new copy</button><button class="btn" id="cloudDetach">Stop syncing</button></div>`
      : `
        <div class="status-line">👁 You're viewing a shared plan. Changes stay in this browser only.</div>
        <button class="btn primary wide" id="cloudCreate">☁️ Save my own copy</button>
        <div class="row-btns"><button class="btn" id="cloudDetach">Close shared plan</button></div>`}
    <h3 style="margin-top:20px">Plans saved from this browser <span class="muted small">${mine.length}</span></h3>
    <div class="mine">${mine.length ? mine.map(p => `<div class="mine-row${cur && cur.id === p.id ? " cur" : ""}">
        <div><b>${esc(p.name)}</b><div class="help">${when(p.updated)}</div></div>
        <a class="btn" href="${esc(`${base()}?s=${p.id}&k=${p.token}#mission`)}">Open</a>
        <button class="btn" data-del="${esc(p.id)}" title="Delete from the cloud">🗑</button></div>`).join("")
      : `<p class="help">Nothing yet. Saved plans appear here so you can reopen them on this device. Use the edit link to open them anywhere.</p>`}</div>
    <p class="help" style="margin-top:16px">Stored in Supabase (EU · Ireland). No account needed: whoever holds the edit link can edit.</p>`;
}
function openDrawer() { renderDrawer(); $("cloudDrawer").hidden = false; document.body.classList.add("drawer-open"); }
function closeDrawer() { $("cloudDrawer").hidden = true; document.body.classList.remove("drawer-open"); }

// ---------- actions ----------
async function createPlan() {
  const name = ($("cloudName") && $("cloudName").value.trim()) || "My academy plan";
  status = "saving"; renderPill();
  try {
    const [row] = await rpc("create_scenario", { p_name: name, p_data: getState() });
    cur = { id: row.id, token: row.edit_token, name, updated: row.updated_at };
    rememberMine({ ...cur });
    status = "saved"; setUrl(); renderPill();
    renderDrawer("✅ Saved. Bookmark the edit link to keep working on any device.");
  } catch (e) { status = "error"; renderPill(); renderDrawer("⚠️ " + e.message); }
}
async function pushUpdate() {
  if (!cur || !cur.token) return;
  status = "saving"; renderPill();
  try {
    const nameEl = $("cloudName");
    if (nameEl && !$("cloudDrawer").hidden) cur.name = nameEl.value.trim() || cur.name;
    cur.updated = await rpc("update_scenario", { p_id: cur.id, p_token: cur.token, p_name: cur.name, p_data: getState() });
    rememberMine({ ...cur });
    status = "saved";
  } catch (e) { status = "error"; }
  renderPill();
  if (!$("cloudDrawer").hidden && document.activeElement !== $("cloudName")) renderDrawer();
}
function scheduleSave() {
  if (applying || !cur || !cur.token) return;
  clearTimeout(timer);
  status = "saving"; renderPill();
  timer = setTimeout(pushUpdate, 1200);
}
async function deletePlan(id) {
  const p = loadMine().find(x => x.id === id);
  if (!p || !confirm(`Delete “${p.name}” from the cloud? Anyone with its links will lose access.`)) return;
  try { await rpc("delete_scenario", { p_id: p.id, p_token: p.token }); } catch (e) { renderDrawer("⚠️ " + e.message); return; }
  saveMine(loadMine().filter(x => x.id !== id));
  if (cur && cur.id === id) { cur = null; status = "idle"; setUrl(); renderPill(); }
  renderDrawer("🗑 Deleted.");
}
function detach() { cur = null; status = "idle"; setUrl(); renderPill(); renderDrawer(); }

// ---------- wiring ----------
$("cloudBtn").addEventListener("click", openDrawer);
$("cloudDrawer").addEventListener("click", e => {
  if (e.target.id === "cloudDrawer" || e.target.closest("[data-close]")) return closeDrawer();
  const copy = e.target.closest("[data-copy]");
  if (copy) { navigator.clipboard && navigator.clipboard.writeText(copy.dataset.copy); copy.textContent = "Copied ✓"; setTimeout(() => copy.textContent = "Copy", 1500); }
  if (e.target.closest("#cloudCreate")) { cur = null; createPlan(); }
  if (e.target.closest("#cloudCopyNew")) { cur = null; createPlan(); }
  if (e.target.closest("#cloudDetach")) detach();
  const del = e.target.closest("[data-del]");
  if (del) deletePlan(del.dataset.del);
});
$("cloudDrawer").addEventListener("input", e => { if (e.target.id === "cloudName" && cur && cur.token) scheduleSave(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("cloudDrawer").hidden) closeDrawer(); });
onStateChange = scheduleSave;

// ---------- boot: open a plan from the URL ----------
(async function boot() {
  renderPill();
  const q = new URLSearchParams(location.search);
  const id = q.get("s"), token = q.get("k");
  const uuid = /^[0-9a-f-]{36}$/i;
  if (!id || !uuid.test(id) || (token && !uuid.test(token))) return;
  status = "saving"; renderPill();
  try {
    const rows = await rpc("get_scenario", { p_id: id });
    if (!rows.length) { status = "error"; renderPill(); $("cloudBanner").innerHTML = `<div class="callout">⚠️ This plan no longer exists. It may have been deleted.</div>`; return; }
    applying = true; applyState(rows[0].data); applying = false;
    cur = { id, token: token || null, name: rows[0].name, updated: rows[0].updated_at };
    if (token) { rememberMine({ ...cur }); status = "saved"; }
    else {
      status = "view";
      $("cloudBanner").innerHTML = `<div class="callout info"><div>👁</div><div>You're viewing the shared plan <b>${esc(cur.name)}</b>. Changes you make stay in this browser.
        <a href="#" id="bannerCopy">Save your own copy</a>.</div></div>`;
      $("bannerCopy").addEventListener("click", e => { e.preventDefault(); openDrawer(); });
    }
  } catch (e) { applying = false; status = "error"; }
  renderPill();
})();
