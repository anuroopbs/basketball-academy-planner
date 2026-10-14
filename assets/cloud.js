// =====================================================================
// Cloud save + sign-in (Supabase).
//  - Sign in with a username + password (Supabase Auth). Usernames map to
//    an internal email: <username>@academy-planner.example (never emailed).
//  - Signed in: save plans to your account and see them on any device.
//  - Every plan also has link access, like a shared doc:
//      view link  ?s=<id>            read-only copy, safe to share
//      edit link  ?s=<id>&k=<token>  keep private; edits autosave
// The publishable key below is meant to be public; the database only
// exposes token/owner-checked functions (see supabase/*.sql).
// =====================================================================
const CLOUD_URL = "https://hzvuzhrdxenmotuehnpz.supabase.co";
const CLOUD_KEY = "sb_publishable_kEDwB37wRBFkTlF7yiiyyA_UTix4-PN";
const LOGIN_DOMAIN = "academy-planner.example";

const sb = window.supabase.createClient(CLOUD_URL, CLOUD_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: "bball-auth" },
});
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const when = iso => { try { return new Date(iso).toLocaleString("en-IE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };
const toEmail = u => u.includes("@") ? u.trim() : `${u.trim().toLowerCase()}@${LOGIN_DOMAIN}`;
const displayName = u => !u ? "" : (u.email || "").endsWith("@" + LOGIN_DOMAIN) ? u.email.split("@")[0] : u.email;

async function rpc(fn, body = {}) {
  const { data, error } = await sb.rpc(fn, body);
  if (error) throw new Error(error.message);
  return data;
}

let user = null;
let cur = null;                // { id, token|null, name, updated }
let status = "idle";           // idle | saving | saved | error | view
let applying = false, timer = null;
let myPlans = null, myPlansErr = "";

const base = () => location.origin + location.pathname;
const viewLink = () => cur ? `${base()}?s=${cur.id}#mission` : "";
const editLink = () => cur && cur.token ? `${base()}?s=${cur.id}&k=${cur.token}#mission` : "";
function setUrl() {
  const q = cur ? (cur.token ? `?s=${cur.id}&k=${cur.token}` : `?s=${cur.id}`) : "";
  history.replaceState(null, "", base() + q + location.hash);
}
const drawerOpen = () => !$("cloudDrawer").hidden;

// ---------- header pill ----------
function renderPill() {
  const map = {
    idle: user ? ["☁️", "Cloud"] : ["🔐", "Sign in"],
    saving: ["⏳", "Saving…"], saved: ["✅", "Saved"], error: ["⚠️", "Not saved"], view: ["👁", "View only"],
  };
  const [ic, txt] = map[status];
  $("cloudBtn").innerHTML = `<span>${ic}</span><span class="cloud-txt">${txt}</span>`;
  $("cloudBtn").classList.toggle("on", status === "saved");
}

// ---------- drawer ----------
function signInForm(msg) {
  return `<form id="signInForm" autocomplete="on">
    ${msg ? `<div class="callout" style="margin-bottom:12px"><div>${msg}</div></div>` : ""}
    <label class="small muted" for="siUser">Username</label>
    <input id="siUser" class="text-in" autocomplete="username" autocapitalize="none" spellcheck="false" required>
    <label class="small muted" for="siPass">Password</label>
    <div class="pass-wrap"><input id="siPass" class="text-in" type="password" autocomplete="current-password" required>
      <button type="button" class="pass-eye" id="siEye" aria-label="Show password">👁</button></div>
    <button class="btn primary wide" type="submit" id="siBtn">Sign in</button>
    <p class="help">Signing in lets you save plans to your account and open them on any device. Anyone can still use the planner and open view links you share.</p>
  </form>`;
}
function plansList() {
  if (!user) return "";
  const rows = myPlans === null ? `<p class="help">Loading your plans…</p>`
    : myPlansErr ? `<p class="help">⚠️ ${esc(myPlansErr)}</p>`
    : !myPlans.length ? `<p class="help">No saved plans yet.</p>`
    : myPlans.map(p => `<div class="mine-row${cur && cur.id === p.id ? " cur" : ""}">
        <div><b>${esc(p.name)}</b><div class="help">${when(p.updated_at)}</div></div>
        <a class="btn" href="${esc(`${base()}?s=${p.id}&k=${p.edit_token}#mission`)}">Open</a>
        <button class="btn" data-del="${esc(p.id)}" title="Delete">🗑</button></div>`).join("");
  return `<h3 style="margin-top:20px">Your plans <span class="muted small">${myPlans ? myPlans.length : ""}</span></h3><div class="mine">${rows}</div>`;
}
function renderDrawer(msg = "") {
  const linkRow = (label, url, hint) => `<div class="link-row"><div class="small muted">${label}</div>
    <div class="link-box"><input readonly value="${esc(url)}" aria-label="${label}"><button class="btn" data-copy="${esc(url)}">Copy</button></div>
    <div class="help">${hint}</div></div>`;
  const note = msg ? `<div class="callout ${msg.startsWith("⚠") ? "" : "good"}" style="margin-bottom:12px"><div>${msg}</div></div>` : "";
  const account = user ? `<div class="account-row"><span>👤 Signed in as <b>${esc(displayName(user))}</b></span><button class="btn" id="signOut">Sign out</button></div>` : "";

  let body;
  if (cur && cur.token) {
    body = `${note}${account}
      <label class="small muted" for="cloudName">Plan name</label>
      <input id="cloudName" class="text-in" maxlength="80" value="${esc(cur.name)}">
      <div class="status-line">${status === "saving" ? "⏳ Saving…" : status === "error" ? "⚠️ Last save failed. Check your connection." : `✅ Autosaving · last saved ${when(cur.updated)}`}</div>
      ${linkRow("👁 View link: share with investors and partners", viewLink(), "They see a read-only copy. Their changes never touch your plan.")}
      ${linkRow("🔑 Edit link: keep private", editLink(), "Opens this plan with editing, even without signing in. Anyone with this link can change it.")}
      <div class="row-btns">${user ? `<button class="btn" id="cloudCopyNew">Save as a new copy</button>` : ""}<button class="btn" id="cloudDetach">Stop syncing</button></div>
      ${plansList()}`;
  } else if (!user) {
    body = `${cur ? `<div class="status-line">👁 You're viewing a shared plan. Changes stay in this browser only.</div>` : ""}${signInForm(msg)}`;
  } else {
    body = `${note}${account}
      ${cur ? `<div class="status-line">👁 You're viewing a shared plan. Save your own copy to edit it in the cloud.</div>` : ""}
      <label class="small muted" for="cloudName">Plan name</label>
      <input id="cloudName" class="text-in" maxlength="80" value="${esc(cur ? cur.name + " (copy)" : "My academy plan")}">
      <button class="btn primary wide" id="cloudCreate">☁️ ${cur ? "Save my own copy" : "Save this plan to the cloud"}</button>
      <p class="help">Saves every lever, the timetable and all weights to your account.</p>
      ${cur ? `<div class="row-btns" style="margin-top:8px"><button class="btn" id="cloudDetach">Close shared plan</button></div>` : ""}
      ${plansList()}`;
  }
  $("cloudBody").innerHTML = body + `<p class="help" style="margin-top:16px">Stored in Supabase (EU · Ireland).</p>`;
}
async function refreshPlans() {
  if (!user) { myPlans = null; return; }
  try { myPlans = await rpc("list_my_scenarios"); myPlansErr = ""; }
  catch (e) { myPlans = []; myPlansErr = e.message; }
  // If the open shared plan is one of ours, switch to edit mode.
  if (cur && !cur.token && myPlans) {
    const mine = myPlans.find(p => p.id === cur.id);
    if (mine) { cur.token = mine.edit_token; status = "saved"; setUrl(); $("cloudBanner").innerHTML = ""; renderPill(); }
  }
  if (drawerOpen() && document.activeElement !== $("cloudName")) renderDrawer();
}
function openDrawer() { renderDrawer(); $("cloudDrawer").hidden = false; document.body.classList.add("drawer-open"); if (user) refreshPlans(); }
function closeDrawer() { $("cloudDrawer").hidden = true; document.body.classList.remove("drawer-open"); }

// ---------- actions ----------
async function signIn(e) {
  e.preventDefault();
  const u = $("siUser").value, p = $("siPass").value;
  $("siBtn").disabled = true; $("siBtn").textContent = "Signing in…";
  const { error } = await sb.auth.signInWithPassword({ email: toEmail(u), password: p });
  if (error) {
    renderDrawer(/invalid/i.test(error.message) ? "⚠️ Wrong username or password." : "⚠️ " + esc(error.message));
    $("siUser").value = u;
  }
}
async function createPlan() {
  const name = ($("cloudName") && $("cloudName").value.trim()) || "My academy plan";
  status = "saving"; renderPill();
  try {
    const [row] = await rpc("create_scenario", { p_name: name, p_data: getState() });
    cur = { id: row.id, token: row.edit_token, name, updated: row.updated_at };
    status = "saved"; setUrl(); renderPill(); $("cloudBanner").innerHTML = "";
    renderDrawer("✅ Saved to your account.");
    refreshPlans();
  } catch (e) { status = "error"; renderPill(); renderDrawer("⚠️ " + esc(e.message)); }
}
async function pushUpdate() {
  if (!cur || !cur.token) return;
  status = "saving"; renderPill();
  try {
    const nameEl = $("cloudName");
    if (nameEl && drawerOpen()) cur.name = nameEl.value.trim() || cur.name;
    cur.updated = await rpc("update_scenario", { p_id: cur.id, p_token: cur.token, p_name: cur.name, p_data: getState() });
    status = "saved";
  } catch (e) { status = "error"; }
  renderPill();
  if (drawerOpen() && document.activeElement !== $("cloudName")) renderDrawer();
}
function scheduleSave() {
  if (applying || !cur || !cur.token) return;
  clearTimeout(timer);
  status = "saving"; renderPill();
  timer = setTimeout(pushUpdate, 1200);
}
async function deletePlan(id) {
  const p = (myPlans || []).find(x => x.id === id);
  if (!p || !confirm(`Delete “${p.name}”? Anyone with its links will lose access.`)) return;
  try { await rpc("delete_scenario", { p_id: p.id, p_token: p.edit_token }); } catch (e) { renderDrawer("⚠️ " + esc(e.message)); return; }
  if (cur && cur.id === id) { cur = null; status = "idle"; setUrl(); renderPill(); }
  renderDrawer("🗑 Deleted.");
  refreshPlans();
}
function detach() { cur = null; status = "idle"; setUrl(); renderPill(); $("cloudBanner").innerHTML = ""; renderDrawer(); }

// ---------- wiring ----------
$("cloudBtn").addEventListener("click", openDrawer);
$("cloudDrawer").addEventListener("click", e => {
  if (e.target.id === "cloudDrawer" || e.target.closest("[data-close]")) return closeDrawer();
  const copy = e.target.closest("[data-copy]");
  if (copy) { navigator.clipboard && navigator.clipboard.writeText(copy.dataset.copy); copy.textContent = "Copied ✓"; setTimeout(() => copy.textContent = "Copy", 1500); }
  if (e.target.closest("#cloudCreate") || e.target.closest("#cloudCopyNew")) { if (e.target.closest("#cloudCopyNew")) cur = null; createPlan(); }
  if (e.target.closest("#cloudDetach")) detach();
  if (e.target.closest("#signOut")) sb.auth.signOut();
  if (e.target.closest("#siEye")) { const p = $("siPass"); p.type = p.type === "password" ? "text" : "password"; }
  const del = e.target.closest("[data-del]");
  if (del) deletePlan(del.dataset.del);
});
$("cloudDrawer").addEventListener("submit", e => { if (e.target.id === "signInForm") signIn(e); });
$("cloudDrawer").addEventListener("input", e => { if (e.target.id === "cloudName" && cur && cur.token) scheduleSave(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && drawerOpen()) closeDrawer(); });
onStateChange = scheduleSave;

sb.auth.onAuthStateChange((event, session) => {
  const wasIn = !!user;
  user = session ? session.user : null;
  renderPill();
  if (user && !wasIn) { myPlans = null; if (drawerOpen()) renderDrawer(); refreshPlans(); }
  if (!user && wasIn) { myPlans = null; if (drawerOpen()) renderDrawer("Signed out."); }
});

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
    if (token) status = "saved";
    else {
      status = "view";
      $("cloudBanner").innerHTML = `<div class="callout info"><div>👁</div><div>You're viewing the shared plan <b>${esc(cur.name)}</b>. Changes you make stay in this browser.</div></div>`;
      if (user) refreshPlans();
    }
  } catch (e) { applying = false; status = "error"; }
  renderPill();
})();
