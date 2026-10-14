// =====================================================================
// Basketball Academy Planner: page logic. Content/reference data: data.js
// =====================================================================

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------
const $ = id => document.getElementById(id);
const fmtInt = v => Math.round(v).toLocaleString("en-IE");
const eur = v => (v < 0 ? "-" : "") + "€" + fmtInt(Math.abs(v));
function short(v) {
  const s = v < 0 ? "-" : "", a = Math.abs(v);
  if (a >= 1e6) return s + "€" + (a / 1e6).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (a >= 1e4) return s + "€" + Math.round(a / 1e3) + "k";
  if (a >= 1e3) return s + "€" + (a / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
  return s + "€" + Math.round(a);
}
const pct = v => Math.round(v * 100) + "%";
const plural = (n, one, many) => `${fmtInt(n)} ${n === 1 ? one : many}`;
const sign = v => `<span class="${v >= 0 ? "pos" : "neg"}">${short(v)}</span>`;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const WEEKS = 52 / 12;
const PALETTE = ["#ff7a1a", "#3b82f6", "#22c55e", "#a78bfa", "#eab308", "#ec4899", "#14b8a6", "#f97316", "#64748b", "#06b6d4", "#84cc16", "#f43f5e", "#8b5cf6", "#0ea5e9"];

const kpiHtml = c => `<div class="kpi${c.hero ? " hero" : ""}${c.go ? " link" : ""}"${c.go ? ` data-go="${c.go}"` : ""}>
  <div class="l">${c.label}</div><div class="v">${c.value}</div>${c.sub ? `<div class="s">${c.sub}</div>` : ""}</div>`;
const kpis = list => list.map(kpiHtml).join("");

function srcItems(keys) {
  return [...new Set(keys)].map(k => {
    const [t, u] = SOURCES[k] || [k, null];
    return `<li>${u ? `<a href="${u}" target="_blank" rel="noopener">${t}</a>` : t}</li>`;
  }).join("");
}
const srcDetails = (keys, extra = "") => `<details class="src"><summary>ⓘ Sources</summary><ul>${srcItems(keys)}${extra}</ul></details>`;

// Donut chart: items = [{label, value, color}]
function donut(items, centerValue, centerLabel) {
  const list = items.filter(i => i.value > 0).sort((a, b) => b.value - a.value);
  const total = list.reduce((s, i) => s + i.value, 0) || 1;
  const shown = list.slice(0, 7);
  if (list.length > 7) shown.push({ label: "Other", value: list.slice(7).reduce((s, i) => s + i.value, 0), color: "#475063" });
  let acc = 0, arcs = "";
  shown.forEach(i => {
    const p = i.value / total * 100, d = Math.max(0, p - 0.6);
    arcs += `<circle r="15.915" cx="21" cy="21" fill="none" stroke="${i.color}" stroke-width="5.2"
      stroke-dasharray="${d.toFixed(2)} ${(100 - d).toFixed(2)}" stroke-dashoffset="${(25 - acc).toFixed(2)}"/>`;
    acc += p;
  });
  return `<div class="donut"><svg viewBox="0 0 42 42" role="img" aria-label="${centerLabel}">
      <circle r="15.915" cx="21" cy="21" fill="none" stroke="#20252f" stroke-width="5.2"/>${arcs}
      <text x="21" y="21" text-anchor="middle" fill="#eef0f4" font-size="5.6" font-weight="800">${centerValue}</text>
      <text x="21" y="26.5" text-anchor="middle" fill="#8b93a3" font-size="3">${centerLabel}</text></svg>
    <div class="donut-legend">${shown.map(i => `<div><i style="background:${i.color}"></i><span title="${i.label}">${i.label}</span><b>${short(i.value)}</b><em>${pct(i.value / total)}</em></div>`).join("")}</div></div>`;
}
function stackbar(items, minLabel = .1) {
  const list = items.filter(i => i.value > 0), total = list.reduce((s, i) => s + i.value, 0) || 1;
  return {
    bar: list.map(i => `<div style="flex:${i.value};background:${i.color}" title="${i.label}: ${i.fmt ? i.fmt(i.value) : short(i.value)}">${i.value / total >= minLabel ? (i.inLabel || pct(i.value / total)) : ""}</div>`).join(""),
    legend: list.map(i => `<span><i style="background:${i.color}"></i>${i.label} <b>${i.fmt ? i.fmt(i.value) : short(i.value)}</b></span>`).join(""),
  };
}
const heatBg = v => `rgba(255,122,26,${(0.06 + clamp(v, 0, 10) / 10 * 0.78).toFixed(2)})`;
function paintRange(el) {
  const p = (el.value - el.min) / ((el.max - el.min) || 1) * 100;
  el.style.setProperty("--p", p + "%");
}
const paintAll = () => document.querySelectorAll("input[type=range]").forEach(paintRange);
document.addEventListener("input", e => { if (e.target.type === "range") paintRange(e.target); });

// ---------------------------------------------------------------------
// Saved state
// ---------------------------------------------------------------------
const STORE_KEY = "bball-planner-v5";
const saved = (() => { try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); } catch { return {}; } })();
// Cloud sync (cloud.js) sets this to be told about every change.
let onStateChange = null;
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ A, W, BW, WHY, TT, TTF, PN, slide, preset })); } catch {}
  if (onStateChange) onStateChange();
}

// ---------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------
const TABS = ["mission", "partners", "why", "calc", "timetable", "revenue", "cities", "business", "funding", "deck", "params"];
const TAB_ALIASES = { about: "mission" };
let currentTab = "mission";
function showTab(name) {
  name = TAB_ALIASES[name] || name;
  if (!TABS.includes(name)) name = "mission";
  currentTab = name;
  document.querySelectorAll(".tab").forEach(t => t.setAttribute("aria-selected", t.dataset.tab === name));
  document.querySelectorAll(".panel").forEach(p => p.classList.toggle("active", p.id === "p-" + name));
  if (location.hash.slice(1) !== name) history.replaceState(null, "", "#" + name);
  const active = document.querySelector(`.tab[data-tab="${name}"]`);
  if (active && active.scrollIntoView) active.scrollIntoView({ block: "nearest", inline: "center" });
  window.scrollTo(0, 0);
  paintAll();
}
document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => showTab(t.dataset.tab)));
document.addEventListener("click", e => {
  const go = e.target.closest("[data-go]");
  if (go) showTab(go.dataset.go);
});
window.addEventListener("hashchange", () => showTab(location.hash.slice(1)));
$("checked").textContent = "Data checked " + DATA_CHECKED;
function setHeaderHeight() {
  const h = document.querySelector(".top");
  if (h && h.offsetHeight) document.documentElement.style.setProperty("--hdr", h.offsetHeight + "px");
}
window.addEventListener("resize", setHeaderHeight);

// =====================================================================
// TIMETABLE state + maths
// =====================================================================
let TT = Array.isArray(saved.TT) && saved.TT.length === 7 ? saved.TT : TT_DEFAULT.map(r => r.slice());
let TTF = { fill: 60, ...(saved.TTF || {}) };
let brush = "kids";

function actSession(key, P, fill) {
  const a = ACTIVITIES[key];
  if (!a || key === "empty") return { rev: 0, cost: 0, people: 0 };
  let people = 0, price = a.price;
  if (key === "kids")        { people = P.group * P.occ / 100; price = P.kidsFee / (P.perKid * WEEKS); }
  else if (key === "adults") { people = a.att * fill; price = P.adultFee / (2 * WEEKS); }
  else if (key === "pickup") { people = a.att * fill; price = P.pickupFee; }
  else if (a.type === "pp")  people = a.att * fill;
  // Whole-court hires count at the booking rate (expected value), like attendance.
  const rev = a.type === "flat" ? a.price * fill : people * price;
  return { rev, cost: a.cost, people };
}
function ttStats(P) {
  const fill = (P.fill ?? TTF.fill) / 100;
  const by = {};
  let used = 0, prime = 0, primeUsed = 0, weekRev = 0, weekCost = 0, extraRev = 0, extraCost = 0, people = 0;
  const perDay = TT.map(() => 0);
  TT.forEach((row, d) => row.forEach((key, h) => {
    const hour = TT_START + h;
    const isPrime = d < 5 ? hour >= 16 : hour >= 9 && hour < 18;
    if (isPrime) prime++;
    if (key === "empty") return;
    used++; perDay[d]++;
    if (isPrime) primeUsed++;
    const s = actSession(key, P, fill);
    const b = by[key] || (by[key] = { hours: 0, rev: 0, cost: 0, people: 0 });
    b.hours++; b.rev += s.rev; b.cost += s.cost; b.people += s.people;
    weekRev += s.rev; weekCost += s.cost; people += s.people;
    if (!ACTIVITIES[key].inCalc) { extraRev += s.rev; extraCost += s.cost; }
  }));
  const total = TT.length * TT_HOURS;
  return { by, used, total, util: used / total, prime, primeUsed, weekRev, weekCost, people, perDay,
           extraMonthlyRev: extraRev * WEEKS, extraMonthlyCost: extraCost * WEEKS,
           kidsSessions: (by.kids && by.kids.hours) || 0 };
}
const kitTotal = CONVERSION_KIT.reduce((s, [, v]) => s + v, 0);
const actColor = key => ACT_CATS[ACTIVITIES[key].cat][1];

// =====================================================================
// HUB CALCULATOR
// =====================================================================
const LEVERS_COURT = [
  { k: "n",         label: "Number of hubs",                   min: 1,  max: 10,  step: 1,  v: 1,   main: true },
  { k: "occ",       label: "Occupancy (court places filled)",  min: 10, max: 100, step: 5,  v: 70,  fmt: v => v + "%" },
  { k: "kidsFee",   label: "Kids monthly fee",                 min: 20, max: 150, step: 5,  v: 70,  fmt: v => "€" + v },
  { k: "group",     label: "Kids per coach on one court",      min: 20, max: 40,  step: 1,  v: 30 },
  { k: "cac",       label: "Cost to acquire a student",        min: 0,  max: 200, step: 5,  v: 60,  fmt: v => "€" + v },
  { k: "campWeeks", label: "Holiday camp weeks / year",        min: 0,  max: 16,  step: 1,  v: 8 },
];
const LEVERS_OTHER = [
  { k: "gymArea",    label: "Fitness zone size",               min: 0,  max: 400,  step: 10, v: 200, fmt: v => v + " m²" },
  { k: "gymMembers", label: "Fitness members",                 min: 0,  max: 300,  step: 5,  v: 80 },
  { k: "gymFee",     label: "Fitness monthly fee",             min: 30, max: 150,  step: 5,  v: 65,  fmt: v => "€" + v },
  { k: "adults",     label: "Adult basketball members",        min: 0,  max: 200,  step: 5,  v: 40 },
  { k: "pickup",     label: "Pickup visits / month",           min: 0,  max: 1000, step: 10, v: 250 },
  { k: "grantPct",   label: "Fit-out covered by grants",       min: 0,  max: 80,   step: 5,  v: 0,   fmt: v => v + "%" },
];
const LEVERS = [...LEVERS_COURT, ...LEVERS_OTHER];
const GROUPS = [
  { title: "Space & rent", fields: [
    ["courtArea", "Court footprint (m²)", 608], ["supportArea", "Changing, reception, storage (m²)", 150],
    ["rentPerM2", "Rent per m² / month (€)", 9], ["utilPerM2", "Utilities per m² / month (€)", 2.5], ["depositMonths", "Rent deposit (months)", 3] ]},
  { title: "Students", fields: [ ["perKid", "Sessions per kid per week", 2], ["churnPct", "Students leaving per month (%)", 4] ]},
  { title: "One-time setup (€)", fields: [
    ["courtFitout", "Court fit-out (floor, hoops, lights)", 120000], ["gymEquipPerM2", "Fitness equipment per m²", 200],
    ["gymFloorPerM2", "Rubber flooring per m²", 45], ["supportFitout", "Changing rooms & reception", 40000],
    ["convKit", "Multi-use conversion kit", kitTotal], ["launch", "Launch marketing", 10000],
    ["legal", "Legal, insurance, company setup", 8000], ["bufferMonths", "Months of costs kept as buffer", 3] ]},
  { title: "Staff per month (€)", fields: [
    ["headCoach", "Head coach", 3800], ["asstCoaches", "Assistant coaches (number)", 2], ["asstSalary", "Salary per assistant", 2000],
    ["gymCoach", "Fitness coach", 2800], ["admin", "Admin / front desk", 2000], ["cleaning", "Cleaning & maintenance", 1200] ]},
  { title: "Other monthly costs (€)", fields: [
    ["insurance", "Insurance", 900], ["software", "Booking & payment software", 300], ["maintenance", "Repairs & upkeep", 500], ["brand", "Brand marketing", 800] ]},
  { title: "Other revenue", fields: [
    ["adultFee", "Adult monthly fee (€)", 45], ["pickupFee", "Pickup fee per visit (€)", 7], ["campKids", "Kids per camp week", 40],
    ["campFee", "Camp fee per kid / week (€)", 180], ["campCostPct", "Camp running cost (% of camp revenue)", 40],
    ["privateHrs", "Private 1:1 sessions / month", 30], ["privateFee", "Price per private session (€)", 45],
    ["parties", "Birthday parties / month", 6], ["partyFee", "Price per party (€)", 220], ["sponsor", "Sponsorship / month (€)", 800] ]},
];
const DEFAULTS = Object.fromEntries([...LEVERS.map(l => [l.k, l.v]), ...GROUPS.flatMap(g => g.fields.map(([k,,v]) => [k, v]))]);
let A = { ...DEFAULTS, ...(saved.A || {}) };
const PRESETS = {
  conservative: { occ: 50, kidsFee: 60, cac: 90, churnPct: 6, gymMembers: 50, rentPerM2: 11, fill: 40 },
  base:         { occ: 70, kidsFee: 70, cac: 60, churnPct: 4, gymMembers: 80, rentPerM2: 9,  fill: 60 },
  optimistic:   { occ: 85, kidsFee: 80, cac: 40, churnPct: 3, gymMembers: 120, rentPerM2: 8, fill: 80 },
};
let preset = saved.preset ?? "base";

function compute(over = {}) {
  const P = { ...A, fill: TTF.fill, ...over };
  const n = P.n, tt = ttStats(P);
  const totalArea = P.courtArea + P.gymArea + P.supportArea;
  const capacity = Math.floor(tt.kidsSessions * P.group / Math.max(1, P.perKid));
  const kids = Math.round(capacity * P.occ / 100);
  const churn = P.churnPct / 100;
  const members = kids + (P.gymArea > 0 ? P.gymMembers : 0);
  const camp = P.campWeeks * P.campKids * P.campFee / 12;
  const streams = [
    ["Kids coaching", kids * P.kidsFee],
    ["Fitness memberships", P.gymArea > 0 ? P.gymMembers * P.gymFee : 0],
    ["Multi-use & extra programmes", tt.extraMonthlyRev],
    ["Holiday camps", camp],
    ["Adult training", P.adults * P.adultFee],
    ["Pickup games", P.pickup * P.pickupFee],
    ["Private 1:1 coaching", P.privateHrs * P.privateFee],
    ["Birthday parties", P.parties * P.partyFee],
    ["Sponsorship", P.sponsor],
  ];
  const revenue = streams.reduce((s, [, v]) => s + v, 0);
  const rent = totalArea * P.rentPerM2;
  const costs = [
    ["Rent", rent],
    ["Utilities", totalArea * P.utilPerM2],
    ["Coaches", P.headCoach + P.asstCoaches * P.asstSalary + (P.gymArea > 0 ? P.gymCoach : 0)],
    ["Admin & cleaning", P.admin + P.cleaning],
    ["Insurance, software, upkeep", P.insurance + P.software + P.maintenance],
    ["Marketing & acquisition", P.brand + P.cac * churn * members],
    ["Camp running costs", camp * P.campCostPct / 100],
    ["Multi-use instructors", tt.extraMonthlyCost],
  ];
  const monthlyCost = costs.reduce((s, [, v]) => s + v, 0);
  const profit = revenue - monthlyCost;
  const gymEquip = P.gymArea * P.gymEquipPerM2, gymFloor = P.gymArea * P.gymFloorPerM2;
  const fitout = P.courtFitout + gymEquip + gymFloor + P.supportFitout + P.convKit;
  const grant = fitout * P.grantPct / 100;
  const inv = [
    ["Court fit-out", P.courtFitout],
    ["Fitness equipment & floor", gymEquip + gymFloor],
    ["Changing rooms & reception", P.supportFitout],
    ["Multi-use kit", P.convKit],
    ["Launch, legal & setup", P.launch + P.legal],
    ["Rent deposit", rent * P.depositMonths],
    ["First members (acquisition)", P.cac * members],
    ["Cash buffer", monthlyCost * P.bufferMonths],
  ];
  if (grant) inv.push(["Less grants", -grant]);
  const perHubInvest = inv.reduce((s, [, v]) => s + v, 0);
  const perKidMargin = P.kidsFee - P.cac * churn;
  const profitNoKids = profit - kids * perKidMargin;
  const breakEvenOcc = profitNoKids >= 0 ? 0 : (perKidMargin > 0 && capacity > 0 ? -profitNoKids / (capacity * perKidMargin) : Infinity);
  const coaches = 1 + P.asstCoaches + (P.gymArea > 0 ? 1 : 0);
  const lifetimeMonths = churn > 0 ? 1 / churn : 0;
  return { P, n, tt, totalArea, capacity, kids, members, streams, revenue, costs, monthlyCost, profit,
    fitout, grant, inv, perHubInvest, investment: perHubInvest * n,
    payback: profit > 0 ? perHubInvest / profit : null, breakEvenOcc, coaches, lifetimeMonths, ltv: P.kidsFee * lifetimeMonths };
}
const beoText = beo => beo === Infinity || beo > 1 ? `<span class="neg">${beo === Infinity ? "Never" : ">100%"}</span>` : beo === 0 ? `<span class="pos">0%</span>` : pct(beo);

function leverHtml(l, val, id) {
  return `<div class="lever${l.main ? " main" : ""}">
    <div class="lever-top"><span class="lever-label">${l.label}</span><span class="lever-value" id="${id}v_${l.k}"></span></div>
    <input type="range" id="${id}${l.k}" min="${l.min}" max="${l.max}" step="${l.step}" value="${val}" aria-label="${l.label}">
    ${l.help ? `<div class="help">${l.help}</div>` : ""}</div>`;
}
$("leversCourt").innerHTML = LEVERS_COURT.map(l => leverHtml(l, A[l.k], "l_")).join("");
$("leversOther").innerHTML = LEVERS_OTHER.map(l => leverHtml(l, A[l.k], "l_")).join("");
LEVERS.forEach(l => $("l_" + l.k).addEventListener("input", e => { A[l.k] = Number(e.target.value); preset = ""; save(); renderAll(); }));

function buildAssumptions() {
  $("groups").innerHTML = GROUPS.map(g => `<div class="group"><h3>${g.title}</h3>
    ${g.fields.map(([k, label]) => `<div class="field"><label for="f_${k}">${label}</label>
      <input id="f_${k}" data-k="${k}" type="number" min="0" step="any" inputmode="decimal" value="${A[k]}"></div>`).join("")}</div>`).join("");
  $("groups").querySelectorAll("input").forEach(inp => inp.addEventListener("input", () => {
    A[inp.dataset.k] = Math.max(0, Number(inp.value) || 0); preset = ""; save(); renderAll();
  }));
}
function syncInputs() { LEVERS.forEach(l => $("l_" + l.k).value = A[l.k]); $("fill").value = TTF.fill; buildAssumptions(); paintAll(); }
$("reset").addEventListener("click", () => { A = { ...DEFAULTS }; TTF.fill = 60; preset = "base"; save(); syncInputs(); renderAll(); });
document.querySelectorAll("[data-preset]").forEach(b => b.addEventListener("click", () => {
  preset = b.dataset.preset;
  Object.entries(PRESETS[preset]).forEach(([k, v]) => { if (k === "fill") TTF.fill = v; else A[k] = v; });
  save(); syncInputs(); renderAll();
}));
$("gymKit").innerHTML = GYM_KIT.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("");
$("gymSrc").innerHTML = srcDetails(["crossfit", "est"]);
$("calcSrc").innerHTML = srcDetails(["est", "court_bb", "crossfit"], "<li>Kids capacity = academy slots in the Timetable × kids per coach ÷ sessions per kid per week</li>");

function occChartSvg(m) {
  const W = 560, H = 210, L = 54, R = 12, T = 12, B = 26;
  const pts = [];
  for (let o = 10; o <= 100; o += 5) pts.push([o, compute({ occ: o }).profit]);
  const ys = pts.map(p => p[1]);
  const yMin = Math.min(0, ...ys), yMax = Math.max(0, ...ys);
  const x = o => L + (o - 10) / 90 * (W - L - R);
  const y = v => T + (yMax - v) / ((yMax - yMin) || 1) * (H - T - B);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join("");
  const area = `M${x(10)},${y(0)}` + pts.map(p => `L${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join("") + `L${x(100)},${y(0)}Z`;
  let g = `<defs><linearGradient id="og" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ff7a1a" stop-opacity=".35"/><stop offset="1" stop-color="#ff7a1a" stop-opacity="0"/></linearGradient></defs>`;
  [yMax, (yMax + yMin) / 2, yMin].forEach(v => g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="#1d222b"/><text x="${L - 8}" y="${y(v) + 4}" fill="#5c6474" font-size="11" text-anchor="end">${short(v)}</text>`);
  g += `<line x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}" stroke="#475063" stroke-width="1.2"/>`;
  [10, 40, 70, 100].forEach(o => g += `<text x="${x(o)}" y="${H - 6}" fill="#5c6474" font-size="11" text-anchor="middle">${o}%</text>`);
  g += `<path d="${area}" fill="url(#og)"/><path d="${line}" fill="none" stroke="#ff9a3c" stroke-width="2.5" stroke-linejoin="round"/>`;
  const be = m.breakEvenOcc;
  if (be > 0 && be <= 1) g += `<line x1="${x(be * 100)}" x2="${x(be * 100)}" y1="${T}" y2="${H - B}" stroke="#22c55e" stroke-dasharray="4 4"/>
      <text x="${x(be * 100) + 5}" y="${T + 10}" fill="#22c55e" font-size="11" font-weight="700">break-even ${pct(be)}</text>`;
  g += `<circle cx="${x(m.P.occ)}" cy="${y(m.profit)}" r="5.5" fill="#fff" stroke="#ff7a1a" stroke-width="3"/>
    <text x="${clamp(x(m.P.occ), L + 40, W - 60)}" y="${y(m.profit) - 11}" fill="#eef0f4" font-size="11.5" font-weight="800" text-anchor="middle">${short(m.profit)}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Monthly profit per hub at each occupancy">${g}</svg>`;
}

function renderCalc(m) {
  const n = m.n, P = m.P;
  LEVERS.forEach(l => $("l_v_" + l.k).textContent = l.fmt ? l.fmt(A[l.k]) : A[l.k]);
  document.querySelectorAll("#presets button").forEach(b => b.classList.toggle("on", b.dataset.preset === preset));
  document.querySelectorAll(".thAll").forEach(th => th.textContent = `All ${plural(n, "hub", "hubs")}`);

  const sb = [
    { hero: true, l: n > 1 ? `Investment (${n} hubs)` : "Investment", v: short(m.investment) },
    { l: "Revenue / mo", v: short(m.revenue * n) },
    { l: "Costs / mo", v: short(m.monthlyCost * n) },
    { l: "Profit / mo", v: sign(m.profit * n) },
    { l: "Margin", v: m.revenue ? `<span class="${m.profit >= 0 ? "pos" : "neg"}">${pct(m.profit / m.revenue)}</span>` : "–" },
    { l: "Payback", v: m.payback ? `${Math.ceil(m.payback)} mo` : `<span class="neg">Never</span>` },
    { l: "Break-even occ.", v: beoText(m.breakEvenOcc) },
    { l: "Kids", v: fmtInt(m.kids * n) },
    { l: "Court used", v: pct(m.tt.util) },
  ];
  $("calcSummary").innerHTML = sb.map(i => `<div class="sb-item${i.hero ? " hero" : ""}"><div class="l">${i.l}</div><div class="v">${i.v}</div></div>`).join("");

  const groups = [
    ["Money needed", [
      { hero: true, label: "Total investment", value: short(m.investment), sub: `${short(m.perHubInvest)} per hub` },
      { label: "Fit-out", value: short(m.fitout * n), sub: "Court, gym, rooms, kit" },
      { label: "Grants used", value: short(m.grant * n), sub: `${P.grantPct}% of fit-out`, go: "funding" },
      { label: "Per m²", value: eur(m.perHubInvest / m.totalArea), sub: "Investment ÷ floor area" },
      { label: "Per kid place", value: m.capacity ? short(m.perHubInvest / m.capacity) : "–", sub: `${fmtInt(m.capacity)} places` },
    ]],
    ["Students & space", [
      { label: "Kids enrolled", value: fmtInt(m.kids * n), sub: `${P.occ}% of ${fmtInt(m.capacity * n)} places` },
      { label: "Court utilisation", value: pct(m.tt.util), sub: `${m.tt.used}/${m.tt.total} h a week`, go: "timetable" },
      { label: "Fitness members", value: fmtInt((P.gymArea ? P.gymMembers : 0) * n), sub: `${P.gymArea} m² zone` },
      { label: "Total area", value: fmtInt(m.totalArea * n) + " m²", sub: `Rent ${short(m.totalArea * P.rentPerM2 * n)}/mo` },
      { label: "Coaches", value: m.coaches * n, sub: "+ freelance instructors" },
    ]],
    ["Unit economics", [
      { label: "Lifetime value / kid", value: eur(m.ltv), sub: `${m.lifetimeMonths.toFixed(0)} months average stay` },
      { label: "Value ÷ acquisition cost", value: P.cac ? (m.ltv / P.cac).toFixed(1) + "×" : "∞", sub: "Above 3× is healthy" },
      { label: "Acquisition payback", value: P.cac ? (P.cac / P.kidsFee).toFixed(1) + " mo" : "0", sub: "Months of fees" },
      { label: "Revenue / m² / yr", value: eur(m.revenue * 12 / m.totalArea), sub: "How hard the space works" },
      { label: "Cost / member / mo", value: eur(m.monthlyCost / Math.max(1, m.members + P.adults)), sub: "All members" },
    ]],
  ];
  const share = m.revenue ? m.tt.extraMonthlyRev / m.revenue : 0;
  $("calcRisk").innerHTML = share > 0.25 ? `<div class="callout" style="margin:4px 0 6px"><div>⚠️</div><div><b>${pct(share)} of revenue comes from off-peak multi-use</b>
    (yoga, badminton, hires…). It's the least proven income until a pilot confirms it. Stress-test it with the <b>Cautious</b> scenario or lower the
    booking rate on the <a href="#timetable">Timetable</a>.</div></div>` : "";
  $("calcKpis").innerHTML = groups.map(([t, list]) => `<div class="kpi-group-title">${t}</div><div class="kpis">${kpis(list)}</div>`).join("");
  $("occChart").innerHTML = occChartSvg(m);
  $("revDonut").innerHTML = donut(m.streams.map(([l, v], i) => ({ label: l, value: v, color: PALETTE[i] })), short(m.revenue), "per month");
  $("costDonut").innerHTML = donut(m.costs.map(([l, v], i) => ({ label: l, value: v, color: PALETTE[(i + 3) % PALETTE.length] })), short(m.monthlyCost), "per month");
  $("revSub").textContent = `${m.streams.filter(s => s[1] > 0).length} streams`;
  $("costSub").textContent = `${pct(m.costs[0][1] / m.monthlyCost)} is rent`;
  const area = stackbar([{ label: "Court", value: P.courtArea, color: "#ff7a1a" }, { label: "Fitness", value: P.gymArea, color: "#3b82f6" },
    { label: "Support", value: P.supportArea, color: "#64748b" }].map(i => ({ ...i, fmt: v => fmtInt(v) + " m²", inLabel: `${i.label} ${fmtInt(i.value)} m²` })), .15);
  $("areaBar").innerHTML = area.bar; $("areaLegend").innerHTML = area.legend;
  const invB = stackbar(m.inv.filter(([, v]) => v > 0).map(([l, v], i) => ({ label: l, value: v, color: PALETTE[i] })), .12);
  $("invBar").innerHTML = invB.bar; $("invLegend").innerHTML = invB.legend;
  $("spaceSub").textContent = `${fmtInt(m.totalArea)} m² · ${short(m.perHubInvest)}`;

  const tbl = (rows, total, label, share = true) =>
    rows.map(([l, v]) => `<tr><td>${l}</td><td>${eur(v)}</td><td>${eur(v * n)}</td>${share ? `<td>${total ? pct(v / total) : "0%"}</td>` : ""}</tr>`).join("") +
    `<tr class="total"><td>${label}</td><td>${eur(total)}</td><td>${eur(total * n)}</td>${share ? "<td>100%</td>" : ""}</tr>`;
  $("revTable").innerHTML = tbl(m.streams, m.revenue, "Total revenue");
  $("costTable").innerHTML = tbl(m.costs, m.monthlyCost, "Total running cost");
  $("invTable").innerHTML = tbl(m.inv, m.perHubInvest, "Total investment", false);
  $("revHint").textContent = `${eur(m.revenue)} / month per hub`;
  $("costHint").textContent = `${eur(m.monthlyCost)} / month per hub`;
  $("invHint").textContent = `${eur(m.perHubInvest)} per hub`;
}

// =====================================================================
// TIMETABLE rendering
// =====================================================================
$("fill").value = TTF.fill;
$("fill").addEventListener("input", e => { TTF.fill = Number(e.target.value); preset = ""; save(); renderAll(); });
const hourLabel = h => String(h).padStart(2, "0") + ":00";
function renderPalette() {
  $("palette").innerHTML = Object.entries(ACTIVITIES).map(([k, a]) =>
    `<button class="chip${k === brush ? " on" : ""}" data-brush="${k}"><i style="background:${k === "empty" ? "#2a2f3a" : actColor(k)}"></i>${a.icon} ${a.short || "Empty"}</button>`).join("");
}
$("palette").addEventListener("click", e => { const b = e.target.closest("[data-brush]"); if (b) { brush = b.dataset.brush; renderPalette(); } });
$("tt").addEventListener("click", e => {
  const c = e.target.closest("td.cell");
  if (!c) return;
  TT[+c.dataset.d][+c.dataset.h] = brush;
  save(); renderAll();
});
$("ttReset").addEventListener("click", () => { TT = TT_DEFAULT.map(r => r.slice()); save(); renderAll(); });
$("ttClear").addEventListener("click", () => { TT = TT.map(r => r.map(k => k === "kids" ? "kids" : "empty")); save(); renderAll(); });
$("kitTable").innerHTML = `<thead><tr><th>Item</th><th>Cost</th></tr></thead><tbody>` +
  CONVERSION_KIT.map(([k, v]) => `<tr><td>${k}</td><td>${eur(v)}</td></tr>`).join("") +
  `<tr class="total"><td>Total conversion kit</td><td>${eur(kitTotal)}</td></tr></tbody>`;
$("kitHint").textContent = `${eur(kitTotal)} one-time, included in the hub investment`;
$("ttSrc").innerHTML = srcDetails(["court_bb", "court_bd", "court_pb", "court_hb", "est"]);

function renderTimetable(m) {
  const tt = m.tt;
  $("fillV").textContent = TTF.fill + "%";
  let html = `<thead><tr><th></th>${TT_DAYS.map(d => `<th>${d}</th>`).join("")}</tr></thead><tbody>`;
  for (let h = 0; h < TT_HOURS; h++) {
    const hour = TT_START + h;
    html += `<tr class="${hour >= 16 ? "prime" : ""}"><td class="time">${hourLabel(hour)}</td>`;
    for (let d = 0; d < 7; d++) {
      const k = TT[d][h], a = ACTIVITIES[k] || ACTIVITIES.empty;
      html += `<td class="cell${k === "empty" ? " empty" : ""}" data-d="${d}" data-h="${h}" style="background:${k === "empty" ? "#171b23" : actColor(k)}"
        title="${TT_DAYS[d]} ${hourLabel(hour)}–${hourLabel(hour + 1)}: ${a.name}"><span>${a.icon} ${a.short || "·"}</span></td>`;
    }
    html += "</tr>";
  }
  $("tt").innerHTML = html + "</tbody>";

  const acts = Object.entries(tt.by).map(([k, b]) => ({ k, ...b, a: ACTIVITIES[k], perHour: b.rev / b.hours }));
  $("ttKpis").innerHTML = kpis([
    { hero: true, label: "Court utilisation", value: pct(tt.util), sub: `${tt.used} of ${tt.total} h / week` },
    { label: "Prime time used", value: tt.prime ? pct(tt.primeUsed / tt.prime) : "–", sub: "Weekdays 16–22, weekends 9–18" },
    { label: "Court revenue / week", value: short(tt.weekRev), sub: `${short(tt.weekRev * WEEKS)} / month` },
    { label: "Net after instructors", value: sign(tt.weekRev - tt.weekCost), sub: "per week" },
    { label: "Visits / week", value: fmtInt(tt.people), sub: `${acts.length} different uses` },
    { label: "Added to the calculator", value: short(tt.extraMonthlyRev), sub: "multi-use / month", go: "calc" },
  ]);
  const sorted = acts.slice().sort((a, b) => b.perHour - a.perHour);
  const maxPH = Math.max(1, ...sorted.map(a => a.perHour));
  $("ttPerHour").innerHTML = sorted.map(a => `<div class="hbar-row"><span>${a.a.icon} ${a.a.short}</span>
    <div class="hbar"><span style="width:${Math.max(2, a.perHour / maxPH * 100)}%;background:${actColor(a.k)}"></span></div><span class="v">${eur(a.perHour)}</span></div>`).join("");
  const cats = {};
  acts.forEach(a => cats[a.a.cat] = (cats[a.a.cat] || 0) + a.hours);
  cats.none = tt.total - tt.used;
  const mix = stackbar(Object.entries(cats).filter(([, v]) => v > 0).map(([c, v]) => ({ label: ACT_CATS[c][0], value: v, color: c === "none" ? "#2a2f3a" : ACT_CATS[c][1], fmt: v => v + " h" })), .09);
  $("ttMix").innerHTML = mix.bar; $("ttMixLegend").innerHTML = mix.legend;
  $("ttDays").innerHTML = tt.perDay.map((v, d) => `<div class="daybar"><b>${pct(v / TT_HOURS)}</b><div class="col" style="height:${v / TT_HOURS * 100}%"></div>${TT_DAYS[d]}</div>`).join("");
  $("ttTable").innerHTML = `<thead><tr><th>Activity</th><th>Hours / wk</th><th>Visits / wk</th><th>Revenue / wk</th><th>Cost / wk</th><th>€ / hour</th><th class="l">Counted</th></tr></thead><tbody>` +
    acts.sort((a, b) => b.rev - a.rev).map(a => `<tr><td>${a.a.icon} ${a.a.name}</td><td>${a.hours}</td><td>${fmtInt(a.people)}</td><td>${eur(a.rev)}</td><td>${eur(a.cost)}</td><td>${eur(a.perHour)}</td>
      <td class="l">${a.a.inCalc ? '<span class="tag in">In calculator</span>' : '<span class="tag">Multi-use</span>'}</td></tr>`).join("") +
    `<tr class="total"><td>Total</td><td>${tt.used}</td><td>${fmtInt(tt.people)}</td><td>${eur(tt.weekRev)}</td><td>${eur(tt.weekCost)}</td><td>${eur(tt.used ? tt.weekRev / tt.used : 0)}</td><td></td></tr></tbody>`;
}

// =====================================================================
// WHY BASKETBALL
// =====================================================================
let WHY = { area: 608, coach: 35, ...(saved.WHY || {}) };
$("whyArea").value = WHY.area; $("whyCoach").value = WHY.coach;
$("whyArea").addEventListener("input", e => { WHY.area = Number(e.target.value); save(); renderWhy(); renderDeck(); });
$("whyCoach").addEventListener("input", e => { WHY.coach = Number(e.target.value); save(); renderWhy(); renderDeck(); });
$("whySrc").innerHTML = srcDetails([...SPORTS.map(s => s.src), "est"], "<li>Fit-out costs are rough estimates for one indoor court inside a rented building, not including the building itself</li>");

function spaceDims(area) { const w = Math.sqrt(area * 32 / 19); return [w, area / w]; }
function fitCourts(sport, area) {
  const [W, H] = spaceDims(area), [a, b] = sport.footprint;
  const opt = (fw, fh) => ({ cols: Math.floor(W / fw), rows: Math.floor(H / fh), fw, fh });
  const o1 = opt(a, b), o2 = opt(b, a), best = o1.cols * o1.rows >= o2.cols * o2.rows ? o1 : o2;
  return { ...best, count: best.cols * best.rows, W, H, rotated: best === o2 };
}
function sportMetrics(s, area, coachRate) {
  const fit = fitCourts(s, area), fpArea = s.footprint[0] * s.footprint[1];
  return { s, fit, fpArea, students: fit.count * s.group, investment: fit.count * s.courtCost, coaches: fit.count,
    perCoach: s.group, coachPerKidHr: coachRate / s.group, invPerPlace: s.courtCost / s.group,
    m2PerKid: fpArea / s.group, invPerM2: s.courtCost / fpArea, usedPct: fit.count * fpArea / area };
}
const allSportMetrics = () => SPORTS.map(s => sportMetrics(s, WHY.area, WHY.coach));
function sportSvg(m) {
  const { fit, s } = m, pad = 0.6, k = 10;
  const VW = (fit.W + pad * 2) * k, VH = (fit.H + pad * 2) * k;
  let g = `<rect x="${pad * k}" y="${pad * k}" width="${fit.W * k}" height="${fit.H * k}" fill="none" stroke="#3a404c" stroke-width="3" stroke-dasharray="10 6"/>`;
  const [cw, ch] = fit.rotated ? [s.court[1], s.court[0]] : s.court;
  for (let r = 0; r < fit.rows; r++) for (let c = 0; c < fit.cols; c++) {
    const x0 = pad + c * fit.fw, y0 = pad + r * fit.fh, cx = x0 + (fit.fw - cw) / 2, cy = y0 + (fit.fh - ch) / 2;
    g += `<rect x="${x0 * k}" y="${y0 * k}" width="${fit.fw * k}" height="${fit.fh * k}" fill="${s.color}" fill-opacity=".07"/>`;
    g += `<rect x="${cx * k}" y="${cy * k}" width="${cw * k}" height="${ch * k}" rx="4" fill="${s.color}" fill-opacity=".18" stroke="${s.color}" stroke-width="2.5"/>`;
    const n = s.group, cols = Math.max(1, Math.round(Math.sqrt(n * cw / ch))), rows = Math.ceil(n / cols);
    const dx = cw / cols, dy = ch / rows, rad = Math.min(dx, dy) * 0.3 * k;
    for (let i = 0; i < n; i++) g += `<circle cx="${(cx + dx * (i % cols + .5)) * k}" cy="${(cy + dy * (Math.floor(i / cols) + .5)) * k}" r="${rad}" fill="${s.color}"/>`;
    const cs = Math.max(rad * 2, 7);
    g += `<rect x="${(cx + cw / 2) * k - cs / 2}" y="${cy * k - cs / 2}" width="${cs}" height="${cs}" rx="2" fill="#fff"/>`;
  }
  return `<svg viewBox="0 0 ${VW.toFixed(0)} ${VH.toFixed(0)}" role="img" aria-label="${s.name}: ${fit.count} courts">${g}</svg>`;
}
function renderWhy() {
  $("whyAreaV").textContent = fmtInt(WHY.area) + " m²";
  $("whyCoachV").textContent = "€" + WHY.coach;
  const ms = allSportMetrics();
  $("sportPanels").innerHTML = ms.map(m => `<div class="sport${m.s.k === "basketball" ? " win" : ""}">
    <div class="hd"><span>${m.s.icon} ${m.s.name}</span><span class="tag${m.s.k === "basketball" ? " acc" : ""}">${plural(m.fit.count, "court", "courts")}</span></div>
    ${sportSvg(m)}
    <div class="trio"><div><b>${m.students}</b><span>kids</span></div><div><b>${m.coaches}</b><span>${m.coaches === 1 ? "coach" : "coaches"}</span></div><div><b>${short(m.investment)}</b><span>fit-out</span></div></div>
  </div>`).join("");
  const chart = (title, key, fmt, lowerBetter) => {
    const max = Math.max(...ms.map(m => m[key])) || 1;
    const best = lowerBetter ? Math.min(...ms.map(m => m[key])) : Math.max(...ms.map(m => m[key]));
    return `<div class="card pad-s"><h3>${title} <span class="muted small" style="font-weight:500">${lowerBetter ? "· lower is better" : "· higher is better"}</span></h3>
      ${ms.map(m => `<div class="hbar-row"><span>${m.s.icon} ${m.s.name}</span><div class="hbar"><span style="width:${Math.max(3, m[key] / max * 100)}%;background:${m.s.color};opacity:${m[key] === best ? 1 : .35}"></span></div><span class="v">${fmt(m[key])}</span></div>`).join("")}</div>`;
  };
  $("sportCharts").innerHTML = [
    chart("Kids per coach", "perCoach", v => v, false),
    chart(`Coach cost per kid-hour (€${WHY.coach}/h)`, "coachPerKidHr", v => "€" + v.toFixed(2), true),
    chart(`Kids at once in ${fmtInt(WHY.area)} m²`, "students", v => fmtInt(v), false),
    chart(`Coaches needed in ${fmtInt(WHY.area)} m²`, "coaches", v => v, true),
    chart("Floor space per kid", "m2PerKid", v => v.toFixed(1) + " m²", true),
    chart("Fit-out per kid place", "invPerPlace", v => eur(v), true),
  ].join("");
  const rows = [
    ["Official court size", m => m.s.court.join(" × ") + " m"], ["Space one court needs", m => `${fmtInt(m.fpArea)} m²`],
    ["Minimum ceiling", m => m.s.ceiling + " m"], ["Kids per coach", m => m.s.range], [`Courts in ${fmtInt(WHY.area)} m²`, m => m.fit.count],
    ["Kids at once", m => fmtInt(m.students)], ["Coaches needed", m => m.coaches], ["Fit-out per court", m => eur(m.s.courtCost)],
    ["Total fit-out", m => eur(m.investment)], ["Fit-out per m²", m => eur(m.invPerM2)], ["Fit-out per kid place", m => eur(m.invPerPlace)],
    ["Floor space per kid", m => m.m2PerKid.toFixed(1) + " m²"], ["Coach cost per kid-hour", m => "€" + m.coachPerKidHr.toFixed(2)], ["Space used", m => pct(m.usedPct)],
  ];
  $("sportTable").innerHTML = `<thead><tr><th>Metric</th>${ms.map(m => `<th>${m.s.icon} ${m.s.name}</th>`).join("")}</tr></thead><tbody>` +
    rows.map(([l, f]) => `<tr><td>${l}</td>${ms.map(m => `<td>${f(m)}</td>`).join("")}</tr>`).join("") + "</tbody>";
}

// =====================================================================
// PARTNER VENUES
// =====================================================================
const PN_LEVERS = [
  { k: "venues", label: "Partner venues",                 min: 1,  max: 50, step: 1,   v: 10, main: true },
  { k: "hours",  label: "Session hours per venue / week", min: 2,  max: 30, step: 1,   v: 10 },
  { k: "kids",   label: "Kids per session (average)",     min: 5,  max: 40, step: 1,   v: 15 },
  { k: "price",  label: "Price per kid per session",      min: 3,  max: 15, step: 0.5, v: 6,  fmt: v => "€" + v },
  { k: "share",  label: "Venue's share of revenue",       min: 0,  max: 50, step: 5,   v: 30, fmt: v => v + "%" },
  { k: "coach",  label: "Coach pay per hour",             min: 15, max: 50, step: 1,   v: 30, fmt: v => "€" + v },
];
const PN_FIXED = { setup: 4000, tech: 60, marketing: 150, managerPer: 15, manager: 3800, launch: 5000, sessionsPerKid: 1.5 };
let PN = { ...Object.fromEntries(PN_LEVERS.map(l => [l.k, l.v])), ...(saved.PN || {}) };
$("partnerLevers").innerHTML = PN_LEVERS.map(l => leverHtml(l, PN[l.k], "pn_")).join("");
PN_LEVERS.forEach(l => $("pn_" + l.k).addEventListener("input", e => { PN[l.k] = Number(e.target.value); save(); const m = compute(); renderPartners(m); renderMission(m); renderDeck(); }));
const ilist = list => list.map(([ic, t, d]) => `<div class="it"><div class="ic">${ic}</div><div><b>${t}</b><p>${d}</p></div></div>`).join("");
$("venueTypes").innerHTML = ilist(VENUE_TYPES);
$("weBring").innerHTML = ilist(WE_BRING);
$("venueBrings").innerHTML = ilist(VENUE_BRINGS);
$("dealTypes").innerHTML = ilist(DEAL_TYPES.map(([t, d], i) => [["🤝", "🏷️", "🎟️"][i], t + (i === 0 ? ' <span class="tag in">default</span>' : ""), d]));
$("partnerSrc").innerHTML = srcDetails(["meanwhile", "est"], "<li>Prices, coach pay and setup cost per venue are planner estimates and can all be changed with the levers</li>");

function computeNetwork() {
  const f = PN_FIXED, sessions = PN.venues * PN.hours * WEEKS;
  const revenue = sessions * PN.kids * PN.price, venueShare = revenue * PN.share / 100;
  const coachesPer = Math.ceil(PN.kids / 25), coachCost = sessions * coachesPer * PN.coach;
  const managers = Math.ceil(PN.venues / f.managerPer), managerCost = managers * f.manager;
  const techMkt = PN.venues * (f.tech + f.marketing);
  const costs = venueShare + coachCost + techMkt + managerCost, profit = revenue - costs;
  const investment = PN.venues * f.setup + f.launch + 2 * costs, places = PN.venues * PN.hours * PN.kids;
  return { sessions, revenue, venueShare, coachCost, managerCost, techMkt, managers, costs, profit, investment, places,
    kidsReached: places / f.sessionsPerKid, coachHours: sessions * coachesPer, payback: profit > 0 ? investment / profit : null };
}
function renderPartners(m) {
  PN_LEVERS.forEach(l => $("pn_v_" + l.k).textContent = l.fmt ? l.fmt(PN[l.k]) : PN[l.k]);
  const x = computeNetwork();
  $("partnerKpis").innerHTML = kpis([
    { hero: true, label: "Monthly profit", value: sign(x.profit), sub: `${short(x.profit * 12)} / year` },
    { label: "Kids reached", value: fmtInt(x.kidsReached), sub: `${fmtInt(x.places)} places / week` },
    { label: "Revenue / month", value: short(x.revenue), sub: `${fmtInt(x.sessions)} sessions` },
    { label: "Investment", value: short(x.investment), sub: `€${fmtInt(PN_FIXED.setup)} kit / venue` },
    { label: "Payback", value: x.payback ? `${Math.ceil(x.payback)} mo` : `<span class="neg">Never</span>` },
    { label: "Coach hours / month", value: fmtInt(x.coachHours), sub: `${x.managers} area manager${x.managers > 1 ? "s" : ""}` },
  ]);
  const r = x.revenue || 1;
  const parts = [["Venue share", x.venueShare, "#3b82f6"], ["Coaches", x.coachCost, "#a78bfa"], ["Area managers", x.managerCost, "#64748b"],
    ["Software & marketing", x.techMkt, "#14b8a6"], [x.profit >= 0 ? "Our profit" : "Loss", Math.abs(x.profit), x.profit >= 0 ? "#22c55e" : "#ef4444"]];
  const flow = stackbar(parts.map(([l, v, c]) => ({ label: l, value: v / r * 100, color: c, fmt: v => "€" + Math.round(v), inLabel: `${l} €${Math.round(v / r * 100)}` })), .13);
  $("netFlow").innerHTML = flow.bar; $("netFlowLegend").innerHTML = flow.legend;
  $("netFlowSub").textContent = `at ${PN.share}% venue share`;
  const rows = [
    ["Investment", short(m.perHubInvest), short(x.investment)],
    ["Kids reached", fmtInt(m.kids), fmtInt(x.kidsReached)],
    ["Investment per kid", eur(m.kids ? m.perHubInvest / m.kids : 0), eur(x.kidsReached ? x.investment / x.kidsReached : 0)],
    ["Monthly profit", sign(m.profit), sign(x.profit)],
    ["Payback", m.payback ? `${Math.ceil(m.payback)} months` : "Never", x.payback ? `${Math.ceil(x.payback)} months` : "Never"],
    ["Control", "Full: our building", "Shared: agreed hours"],
    ["Main risk", "Rent & occupancy", "Venues cancelling, coach supply"],
    ["Role", "Trains coaches, showcase", "Scale, reach, impact"],
  ];
  $("hubVsNet").innerHTML = `<thead><tr><th class="l"></th><th class="l">🏭 1 hub</th><th class="l">🏫 ${plural(PN.venues, "venue", "venues")}</th></tr></thead><tbody>` +
    rows.map(r => `<tr><td class="l muted">${r[0]}</td><td class="l">${r[1]}</td><td class="l">${r[2]}</td></tr>`).join("") + "</tbody>";
}

// =====================================================================
// CITIES
// =====================================================================
let W = { ...Object.fromEntries(FACTORS.map(f => [f.k, f.w])), ...(saved.W || {}) };
let selCity = null;
const CITIES = CITY_DATA.map(([name, cc, ...rest]) => { const why = rest.pop(); return { name, cc, why, s: Object.fromEntries(FACTORS.map((f, i) => [f.k, rest[i]])) }; });
const countryName = cc => (COUNTRIES.find(c => c.code === cc) || {}).name || ({ LT: "Lithuania" })[cc] || cc;
function rankCities() {
  const tw = FACTORS.reduce((s, f) => s + W[f.k], 0) || 1;
  return CITIES.map(c => ({ ...c, score: FACTORS.reduce((s, f) => s + c.s[f.k] * W[f.k], 0) / tw * 10 })).sort((a, b) => b.score - a.score);
}
$("weights").innerHTML = FACTORS.map(f => `<div class="lever-box" style="padding:4px 12px 6px">${leverHtml({ ...f, min: 0, max: 40, step: 1, help: f.why }, W[f.k], "w_")}</div>`).join("");
FACTORS.forEach(f => $("w_" + f.k).addEventListener("input", e => { W[f.k] = Number(e.target.value); save(); renderAll(); }));
$("resetWeights").addEventListener("click", () => { FACTORS.forEach(f => { W[f.k] = f.w; $("w_" + f.k).value = f.w; }); save(); renderAll(); paintAll(); });
$("cityRank").addEventListener("click", e => { const r = e.target.closest("[data-city]"); if (r) { selCity = r.dataset.city; renderCities(); } });
$("cityHeat").addEventListener("click", e => { const r = e.target.closest("[data-city]"); if (r) { selCity = r.dataset.city; renderCities(); $("cityDetail").scrollIntoView({ block: "nearest", behavior: "smooth" }); } });
$("citySrc").innerHTML = srcDetails(FACTORS.map(f => f.src).concat("est"), "<li>Scores are 1–10 estimates from these sources, for comparison only. Check your shortlist against local census and school-location data</li>");

function rankRows(list, key, valKey, sel, label) {
  const max = Math.max(...list.map(c => c[valKey]));
  const attr = key === "name" ? "city" : "country";
  return list.map((c, i) => `<div class="hbar-row${c[key] === sel ? " sel" : ""}" data-${attr}="${c[key]}">
    <span class="rk">${i + 1}</span><span><b>${c[label]}</b></span>
    <div class="hbar"><span style="width:${c[valKey] / max * 100}%;background:${i < 5 ? "linear-gradient(90deg,#ff7a1a,#ffb547)" : "#3a404c"}"></span></div>
    <span class="v">${c[valKey].toFixed(1)}</span></div>`).join("");
}
function renderCities() {
  const tw = FACTORS.reduce((s, f) => s + W[f.k], 0) || 1;
  FACTORS.forEach(f => $("w_v_" + f.k).textContent = Math.round(W[f.k] / tw * 100) + "%");
  const ranked = rankCities();
  if (!selCity || !ranked.find(c => c.name === selCity)) selCity = ranked[0].name;
  $("cityRank").innerHTML = rankRows(ranked, "name", "score", selCity, "name");
  const c = ranked.find(x => x.name === selCity), rank = ranked.indexOf(c) + 1;
  $("cityDetail").innerHTML = `<div class="eyebrow">#${rank} of ${ranked.length} · ${countryName(c.cc)}</div>
    <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px"><h2>${c.name}</h2><span style="font-size:28px;font-weight:900;color:var(--accent-2)">${c.score.toFixed(1)}</span></div>
    <p class="muted" style="margin:6px 0 12px;font-size:13px">${c.why}</p>
    <div class="mini-bars">${FACTORS.map(f => `<div class="hbar-row"><span>${f.label} <span class="muted small">${Math.round(W[f.k] / tw * 100)}%</span></span>
      <div class="hbar"><span style="width:${c.s[f.k] * 10}%;background:${heatBg(c.s[f.k])}"></span></div><span class="v">${c.s[f.k]}</span></div>`).join("")}</div>`;
  $("cityHeat").innerHTML = `<thead><tr><th>#</th><th class="l">City</th><th>Score</th>${FACTORS.map(f => `<th title="${f.why}">${f.label.replace(" (few academies)", "").replace("Residential / family areas", "Residential")}</th>`).join("")}</tr></thead><tbody>` +
    ranked.map((x, i) => `<tr class="clickable${x.name === selCity ? " sel" : ""}" data-city="${x.name}"><td>${i + 1}</td><td class="l"><b>${x.name}</b> <span class="muted small">${x.cc}</span></td>
      <td><b style="color:var(--accent-2)">${x.score.toFixed(1)}</b></td>${FACTORS.map(f => `<td class="heat" style="background:${heatBg(x.s[f.k])}">${x.s[f.k]}</td>`).join("")}</tr>`).join("") + "</tbody>";
}

// =====================================================================
// START A BUSINESS
// =====================================================================
let BW = { ...Object.fromEntries(BIZ_FACTORS.map(f => [f.k, f.w])), ...(saved.BW || {}) };
let selCountry = null;
const labourScore = l => clamp(10 - (l - 12) / (48 - 12) * 9, 1, 10);
function rankCountries() {
  const tw = BIZ_FACTORS.reduce((s, f) => s + BW[f.k], 0) || 1, cities = rankCities();
  return COUNTRIES.map(c => {
    const sc = { ...c.s, labour: labourScore(c.labour) };
    const ease = BIZ_FACTORS.reduce((t, f) => t + sc[f.k] * BW[f.k], 0) / tw * 10;
    const best = cities.filter(x => x.cc === c.code)[0];
    return { ...c, sc, ease, demand: best ? best.score : 0, bestCity: best ? best.name : c.city };
  }).sort((a, b) => b.ease - a.ease);
}
$("bizWeights").innerHTML = BIZ_FACTORS.map(f => `<div class="lever-box" style="padding:4px 12px 6px">${leverHtml({ ...f, min: 0, max: 40, step: 1 }, BW[f.k], "bw_")}</div>`).join("");
BIZ_FACTORS.forEach(f => $("bw_" + f.k).addEventListener("input", e => { BW[f.k] = Number(e.target.value); save(); renderAll(); }));
$("bizResetWeights").addEventListener("click", () => { BIZ_FACTORS.forEach(f => { BW[f.k] = f.w; $("bw_" + f.k).value = f.w; }); save(); renderAll(); paintAll(); });
const pickCountry = e => { const r = e.target.closest("[data-country]"); if (r) { selCountry = r.dataset.country; renderBusiness(); return true; } return false; };
$("bizRank").addEventListener("click", pickCountry);
$("bizHeat").addEventListener("click", e => { if (pickCountry(e)) $("bizDetail").scrollIntoView({ block: "nearest", behavior: "smooth" }); });
$("bizMatrix").addEventListener("click", e => { if (pickCountry(e)) $("bizDetail").scrollIntoView({ block: "nearest", behavior: "smooth" }); });
$("bizSrc").innerHTML = srcDetails(["eurostat_lc", "eurostat_news", "taxfound", "bready", "estonia_reg", "ie_cro", "ie_vetting", "pt_hora", "fr_coach", "fr_coach2", "est"],
  "<li>Registration times, costs and the youth-sport rules score are summaries for comparison. Confirm current fees with each national registry</li>");

function matrixSvg(list) {
  const Wd = 640, H = 380, L = 44, R = 16, T = 16, B = 40;
  const xs = list.map(c => c.ease), ys = list.map(c => c.demand);
  const x0 = Math.floor(Math.min(...xs) / 5) * 5 - 5, x1 = Math.ceil(Math.max(...xs) / 5) * 5 + 5;
  const y0 = Math.floor(Math.min(...ys) / 5) * 5 - 5, y1 = Math.ceil(Math.max(...ys) / 5) * 5 + 5;
  const X = v => L + (v - x0) / (x1 - x0) * (Wd - L - R), Y = v => T + (y1 - v) / (y1 - y0) * (H - T - B);
  const mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length;
  let g = `<rect x="${X(mx)}" y="${T}" width="${Wd - R - X(mx)}" height="${Y(my) - T}" rx="10" fill="#22c55e" fill-opacity=".07"/>
    <line x1="${X(mx)}" x2="${X(mx)}" y1="${T}" y2="${H - B}" stroke="#2a2f3a" stroke-dasharray="4 4"/>
    <line x1="${L}" x2="${Wd - R}" y1="${Y(my)}" y2="${Y(my)}" stroke="#2a2f3a" stroke-dasharray="4 4"/>`;
  const q = (x, y, t, c, a) => `<text x="${x}" y="${y}" fill="${c}" font-size="11.5" font-weight="800" letter-spacing=".06em" text-anchor="${a}">${t}</text>`;
  g += q(Wd - R - 8, T + 16, "LAUNCH FIRST", "#22c55e", "end") + q(L + 8, T + 16, "BIG PRIZE, HARDER", "#eab308", "start")
     + q(Wd - R - 8, H - B - 8, "EASY, SMALLER", "#60a5fa", "end") + q(L + 8, H - B - 8, "LATER", "#5c6474", "start");
  g += `<text x="${(L + Wd - R) / 2}" y="${H - 10}" fill="#8b93a3" font-size="12" text-anchor="middle">Ease of starting →</text>
    <text x="14" y="${(T + H - B) / 2}" fill="#8b93a3" font-size="12" text-anchor="middle" transform="rotate(-90 14 ${(T + H - B) / 2})">Demand in best city →</text>`;
  list.forEach(c => {
    const cx = X(c.ease), cy = Y(c.demand), on = c.code === selCountry;
    g += `<g data-country="${c.code}" style="cursor:pointer"><circle cx="${cx}" cy="${cy}" r="${on ? 10 : 7}" fill="${on ? "#ffb547" : "#ff7a1a"}" stroke="#0a0c11" stroke-width="2.5"/>
      <text x="${cx + 12}" y="${cy + 4.5}" fill="${on ? "#ffb547" : "#eef0f4"}" font-size="13.5" font-weight="700">${c.bestCity.split(" / ")[0]}</text></g>`;
  });
  return `<svg viewBox="0 0 ${Wd} ${H}" role="img" aria-label="Ease vs demand">${g}</svg>`;
}
function renderBusiness() {
  const tw = BIZ_FACTORS.reduce((s, f) => s + BW[f.k], 0) || 1;
  BIZ_FACTORS.forEach(f => $("bw_v_" + f.k).textContent = Math.round(BW[f.k] / tw * 100) + "%");
  const list = rankCountries();
  if (!selCountry || !list.find(c => c.code === selCountry)) selCountry = list[0].code;
  $("bizMatrix").innerHTML = matrixSvg(list);
  $("bizRank").innerHTML = rankRows(list, "code", "ease", selCountry, "name");
  const c = list.find(x => x.code === selCountry), rank = list.indexOf(c) + 1;
  $("bizDetail").innerHTML = `<div class="cols-3" style="gap:20px">
    <div><div class="eyebrow">#${rank} easiest · best city ${c.bestCity}</div>
      <div style="display:flex;justify-content:space-between;align-items:baseline"><h2>${c.name}</h2><span style="font-size:28px;font-weight:900;color:var(--accent-2)">${c.ease.toFixed(1)}</span></div>
      <dl class="facts"><dt>Company</dt><dd>${c.entity}</dd><dt>Register</dt><dd>${c.time}</dd><dt>Setup cost</dt><dd>${c.setup}</dd>
        <dt>Min. capital</dt><dd>${c.capital}</dd><dt>Corporate tax</dt><dd>${c.tax}</dd><dt>Labour</dt><dd>€${c.labour.toFixed(1)}/h <span class="muted">(EU €34.9)</span></dd></dl></div>
    <div><h3>Score breakdown</h3><div class="mini-bars">${BIZ_FACTORS.map(f => `<div class="hbar-row"><span>${f.label}</span>
      <div class="hbar"><span style="width:${c.sc[f.k] * 10}%;background:${heatBg(c.sc[f.k])}"></span></div><span class="v">${c.sc[f.k].toFixed(0)}</span></div>`).join("")}</div>
      <div class="small muted" style="margin-top:6px">Demand in ${c.bestCity}: <b style="color:var(--text)">${c.demand.toFixed(1)}</b> / 100</div></div>
    <div><h3>Business support programmes</h3><ul class="plist prog">${c.programmes.map(p => `<li>${p}</li>`).join("")}</ul>
      <h3 style="margin-top:12px">Challenges</h3><ul class="plist chal">${c.challenges.map(p => `<li>${p}</li>`).join("")}</ul>${srcDetails(c.src)}</div></div>`;
  $("bizHeat").innerHTML = `<thead><tr><th>#</th><th class="l">Country</th><th>Ease</th>${BIZ_FACTORS.map(f => `<th>${f.label.replace(" (lower = better)", "").replace("Setup cost & minimum capital", "Setup cost")}</th>`).join("")}<th>€/hour</th><th>Demand</th></tr></thead><tbody>` +
    list.map((x, i) => `<tr class="clickable${x.code === selCountry ? " sel" : ""}" data-country="${x.code}"><td>${i + 1}</td><td class="l"><b>${x.name}</b></td><td><b style="color:var(--accent-2)">${x.ease.toFixed(1)}</b></td>
      ${BIZ_FACTORS.map(f => `<td class="heat" style="background:${heatBg(x.sc[f.k])}">${x.sc[f.k].toFixed(0)}</td>`).join("")}<td>${x.labour.toFixed(1)}</td><td>${x.demand.toFixed(0)}</td></tr>`).join("") + "</tbody>";
}

// =====================================================================
// REVENUE STREAMS
// =====================================================================
let streamFilter = "all";
const groupShort = g => g.group.split(" (")[0];
function renderStreamFilter() {
  const total = STREAMS.reduce((s, g) => s + g.items.length, 0);
  $("streamFilter").innerHTML = `<button class="chip${streamFilter === "all" ? " on" : ""}" data-f="all">All <span class="n">${total}</span></button>` +
    STREAMS.map((g, i) => `<button class="chip${streamFilter === String(i) ? " on" : ""}" data-f="${i}"><i style="background:${PALETTE[i]}"></i>${groupShort(g)} <span class="n">${g.items.length}</span></button>`).join("");
  $("streams").innerHTML = STREAMS.flatMap((g, i) => streamFilter !== "all" && streamFilter !== String(i) ? [] :
    g.items.map(([name, price, inCalc, desc]) => `<div class="stream" style="--c:${PALETTE[i]}"><div class="hd"><b>${name}</b>${inCalc ? '<span class="tag in">In calc</span>' : ""}</div>
      <div class="price">${price}</div><p>${desc}</p></div>`)).join("");
}
$("streamFilter").addEventListener("click", e => { const b = e.target.closest("[data-f]"); if (b) { streamFilter = b.dataset.f; renderStreamFilter(); } });
$("streamSrc").innerHTML = srcDetails(["est"]);
function renderRevenue(m) {
  $("revMixDonut").innerHTML = donut(m.streams.map(([l, v], i) => ({ label: l, value: v, color: PALETTE[i] })), short(m.revenue), "per month");
  const total = STREAMS.reduce((s, g) => s + g.items.length, 0), inCalc = STREAMS.reduce((s, g) => s + g.items.filter(i => i[2]).length, 0);
  const top = m.streams.slice().sort((a, b) => b[1] - a[1])[0];
  $("revKpis").innerHTML = kpis([
    { hero: true, label: "Revenue streams", value: total, sub: `${STREAMS.length} groups` },
    { label: "In the calculator", value: inCalc, sub: "already counted", go: "calc" },
    { label: "Biggest stream", value: short(top[1]), sub: top[0] },
    { label: "Kids coaching share", value: m.revenue ? pct(m.streams[0][1] / m.revenue) : "–", sub: "the core business" },
    { label: "Off-peak multi-use", value: short(m.tt.extraMonthlyRev), sub: "per month", go: "timetable" },
    { label: "Not yet modelled", value: total - inCalc, sub: "extra upside" },
  ]);
}

// =====================================================================
// FUNDING
// =====================================================================
const FUND_MAX = [60000, 400000, 450000, 0, 0, 0, 0, 200000, 30000, 0, 50000];
const fundOpen = new Set();
const TYPE_TAG = { eu: '<span class="tag eu">EU</span>', nat: '<span class="tag nat">National</span>', pri: '<span class="tag pri">Private</span>' };
function renderFunding() {
  const max = Math.max(...FUND_MAX);
  $("fundTable").innerHTML = `<thead><tr><th class="l">Programme</th><th class="l">Type</th><th class="l">Up to</th><th class="l">In short</th><th></th></tr></thead><tbody>` +
    FUNDS.map((f, i) => `<tr class="clickable" data-fund="${i}"><td class="l"><b>${f.name}</b></td><td class="l">${TYPE_TAG[f.type]}</td>
      <td class="l"><div class="amount-bar">${FUND_MAX[i] ? `<div class="hbar"><span style="width:${Math.max(4, Math.sqrt(FUND_MAX[i] / max) * 100)}%;background:linear-gradient(90deg,#ff7a1a,#ffb547)"></span></div>` : `<div class="hbar" style="opacity:.4"></div>`}<b>${f.amount}</b></div></td>
      <td class="l muted small">${f.pts[0]}</td><td class="muted">${fundOpen.has(i) ? "▴" : "▾"}</td></tr>` +
      (fundOpen.has(i) ? `<tr><td colspan="5" class="l" style="background:var(--s2)"><ul class="plist">${f.pts.map(p => `<li>${p}</li>`).join("")}</ul>${srcDetails(f.src)}</td></tr>` : "")).join("") + "</tbody>";
}
$("fundTable").addEventListener("click", e => {
  if (e.target.closest("details")) return;
  const r = e.target.closest("[data-fund]"); if (!r) return;
  const i = +r.dataset.fund; fundOpen.has(i) ? fundOpen.delete(i) : fundOpen.add(i); renderFunding();
});
$("fundKpis").innerHTML = kpis([
  { hero: true, label: "Realistic grants, year 1", value: "€30k–€90k", sub: "1 small Erasmus+ grant + national/city" },
  { label: "Years 2–3 (multi-city)", value: "€150k–€450k", sub: "Cooperation partnership + event" },
  { label: "Largest EU sport grant", value: "€400k", sub: "Erasmus+ cooperation partnership" },
  { label: "Next Erasmus+ deadline", value: "~Mar 2027", sub: "2026 round closed 5 Mar 2026" },
]);

// =====================================================================
// PARAMETERS
// =====================================================================
let pn = 0;
$("paramList").innerHTML = PARAMS.map(g => `<div class="card"><h2 style="margin-bottom:6px">${g.group}</h2>
  ${g.items.map(([p, where]) => `<div class="param"><span class="no">${++pn}</span><span>${p}</span><span class="where">${where}</span></div>`).join("")}</div>`).join("");
$("dupList").innerHTML = DUPLICATES.map(d => `<li>${d}</li>`).join("");
$("dupHint").textContent = `${DUPLICATES.length} merged`;
$("paramKpis").innerHTML = kpis([
  { hero: true, label: "Requirements", value: pn, sub: "all built" },
  { label: "Groups", value: PARAMS.length },
  { label: "Duplicates merged", value: DUPLICATES.length },
  { label: "Sources cited", value: Object.values(SOURCES).filter(s => s[1]).length, sub: "linked" },
]);

// =====================================================================
// MISSION
// =====================================================================
function flywheelSvg() {
  const nodes = [["🏭", "Warehouse hub", "trains coaches"], ["🧑‍🏫", "Coaches", "staff partner venues"], ["🏫", "Partner venues", "reach kids near home"],
    ["⭐", "Kids & talent", "flow back to the hub"], ["💶", "Revenue", "funds the next hub"]];
  const cx = 230, cy = 175, r = 128, W = 460, H = 350;
  let g = `<defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10z" fill="#ff7a1a"/></marker>
    <radialGradient id="fwg"><stop offset="0" stop-color="#ff7a1a" stop-opacity=".18"/><stop offset="1" stop-color="#ff7a1a" stop-opacity="0"/></radialGradient></defs>
    <circle cx="${cx}" cy="${cy}" r="${r - 30}" fill="url(#fwg)"/>
    <text x="${cx}" y="${cy - 2}" fill="#ffb547" font-size="15" font-weight="900" text-anchor="middle" letter-spacing=".1em">FLYWHEEL</text>
    <text x="${cx}" y="${cy + 16}" fill="#8b93a3" font-size="11" text-anchor="middle">every turn gets easier</text>`;
  const pos = nodes.map((_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / nodes.length; return [cx + r * Math.cos(a), cy + r * Math.sin(a), a]; });
  pos.forEach(([, , a]) => {
    const a1 = a + 0.36, a2 = a + 2 * Math.PI / nodes.length - 0.36;
    g += `<path d="M${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} A${r},${r} 0 0 1 ${cx + r * Math.cos(a2)},${cy + r * Math.sin(a2)}" fill="none" stroke="#ff7a1a" stroke-width="2.5" marker-end="url(#arr)"/>`;
  });
  nodes.forEach(([ic, t, s], i) => {
    const [x, y] = pos[i];
    g += `<rect x="${x - 66}" y="${y - 25}" width="132" height="50" rx="12" fill="#181c25" stroke="rgba(255,122,26,.6)"/>
      <text x="${x}" y="${y - 4}" fill="#eef0f4" font-size="12.5" font-weight="800" text-anchor="middle">${ic} ${t}</text>
      <text x="${x}" y="${y + 13}" fill="#8b93a3" font-size="10.5" text-anchor="middle">${s}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Strategy flywheel">${g}</svg>`;
}
$("flywheel").innerHTML = flywheelSvg();
$("roadmap").innerHTML = ROADMAP.map((p, i) => `<div class="phase" style="--o:${1 - i * 0.15}">
  <div class="n">${i + 1}</div><div class="when">${p.when}</div><h3>${p.title}</h3><div class="kpi-line">🎯 ${p.kpi}</div>
  <ul>${p.what.map(w => `<li>${w}</li>`).join("")}</ul></div>`).join("");
function renderMission(m) {
  const x = computeNetwork(), city = rankCities()[0], easy = rankCountries()[0];
  $("missionKpis").innerHTML = kpis([
    { hero: true, label: "First hub investment", value: short(m.perHubInvest), sub: `Payback ${m.payback ? Math.ceil(m.payback) + " months" : "n/a"}`, go: "calc" },
    { hero: true, label: "Combined profit / month", value: sign(m.profit + x.profit), sub: `Hub + ${PN.venues} venues`, go: "partners" },
    { label: "Kids reached", value: fmtInt(m.kids + x.kidsReached), sub: `${fmtInt(m.kids)} hub + ${fmtInt(x.kidsReached)} venues`, go: "partners" },
    { label: "Court used", value: pct(m.tt.util), sub: `${Object.keys(m.tt.by).length} uses, 06–22h`, go: "timetable" },
    { label: "Kids per coach", value: A.group, sub: "vs 4–8 in racket sports", go: "why" },
    { label: "Network investment", value: short(x.investment), sub: `${PN.venues} partner venues`, go: "partners" },
    { label: "Top demand city", value: city.name, sub: `${city.score.toFixed(0)} / 100`, go: "cities" },
    { label: "Easiest to start", value: easy.name, sub: `${easy.ease.toFixed(0)} / 100`, go: "business" },
  ]);
}

// =====================================================================
// DECK
// =====================================================================
let slide = Number(saved.slide) || 0;
function buildSlides(m) {
  const P = m.P, x = computeNetwork();
  const ms = allSportMetrics(), bb = ms.find(s => s.s.k === "basketball"), others = ms.filter(s => s.s.k !== "basketball");
  const cities = rankCities().slice(0, 3), countries = rankCountries();
  const launch = countries.slice().sort((a, b) => (b.ease + b.demand) - (a.ease + a.demand)).slice(0, 3);
  const per = m.perHubInvest, pr = m.profit, beo = m.breakEvenOcc;
  const K = list => `<div class="kpis">${kpis(list)}</div>`;
  return [
    `<div class="eyebrow">Investor deck</div><h2>Get every kid in Europe playing</h2>
     <p>Youth basketball (ages 8–18): one warehouse hub that trains coaches, then a network of partner schools and community centres.</p>
     ${K([{ hero: true, label: "First hub", value: short(per) }, { label: "Kids reached", value: fmtInt(m.kids + x.kidsReached) },
          { label: "Partner venues", value: PN.venues }, { label: "Combined profit / mo", value: sign(pr + x.profit) }])}`,
    `<div class="eyebrow">The problem</div><h2>Kids need somewhere close by to play, and the courts that exist sit empty</h2>
     <ul><li>Basketball is growing fast in Europe, but indoor courts and academies are scarce.</li>
       <li>School halls and community centres sit empty after 16:00, at weekends and in the holidays.</li>
       <li>Parents want structured activity within walking distance of school and home.</li></ul>`,
    `<div class="eyebrow">The strategy</div><h2>Hub first, then partner venues, then Europe</h2>
     <div style="max-width:420px;width:100%">${flywheelSvg()}</div>`,
    `<div class="eyebrow">Why basketball</div><h2>The most kids per coach</h2><div class="big">${bb.s.range}</div>
     <p>kids per coach on one court, vs ${others.map(o => `${o.s.name.toLowerCase()} ${o.s.range}`).join(", ")}.</p>
     ${K([{ hero: true, label: `Basketball · ${fmtInt(WHY.area)} m²`, value: `${bb.students} kids`, sub: "1 coach" },
       ...others.slice(0, 3).map(o => ({ label: `${o.s.name} · ${fmtInt(WHY.area)} m²`, value: `${o.students} kids`, sub: plural(o.coaches, "coach", "coaches") }))])}`,
    `<div class="eyebrow">One court, used all day</div><h2>${pct(m.tt.util)} utilisation, ${Object.keys(m.tt.by).length} different uses</h2>
     <ul><li>06–10: early training, mini kids, women's yoga, seniors</li><li>10–16: school PE, badminton, pickleball, handball, corporate</li>
       <li>16–19: the kids academy (prime time)</li><li>19–22: dance rental, leagues, pickup basketball</li></ul>
     ${K([{ hero: true, label: "Court revenue / week", value: short(m.tt.weekRev) }, { label: "Visits / week", value: fmtInt(m.tt.people) }, { label: "Per court hour", value: eur(m.tt.used ? m.tt.weekRev / m.tt.used : 0) }])}`,
    `<div class="eyebrow">The hub</div><h2>${short(per)} for ${fmtInt(m.totalArea)} m² of court + fitness zone</h2>
     ${donut(m.inv.filter(([, v]) => v > 0).map(([l, v], i) => ({ label: l, value: v, color: PALETTE[i] })), short(per), "investment")}`,
    `<div class="eyebrow">How the hub makes money</div><h2>${short(m.revenue)} revenue per month</h2>
     ${donut(m.streams.map(([l, v], i) => ({ label: l, value: v, color: PALETTE[i] })), short(m.revenue), "per month")}`,
    `<div class="eyebrow">Unit economics & break-even</div><h2>${pr >= 0 ? "Profitable" : "Loss-making"} at ${P.occ}% occupancy</h2>
     ${K([{ hero: true, label: "Profit / month", value: sign(pr) }, { label: "Payback", value: m.payback ? `${Math.ceil(m.payback)} mo` : "Never" },
       { label: "Break-even occupancy", value: beoText(beo) }, { label: "Value ÷ acquisition cost", value: P.cac ? (m.ltv / P.cac).toFixed(1) + "×" : "∞" },
       { label: "Kids", value: fmtInt(m.kids) }, { label: "Fee", value: eur(P.kidsFee) + "/mo" }])}
     <div class="chart" style="margin-top:12px;max-width:640px">${occChartSvg(m)}</div>`,
    `<div class="eyebrow">Partner venues</div><h2>${PN.venues} venues, ${fmtInt(x.kidsReached)} kids, no buildings to buy</h2>
     <p>We bring coaches, programmes, software and kit. The venue brings the space and gets ${PN.share}% of revenue.</p>
     ${K([{ hero: true, label: "Network profit / mo", value: sign(x.profit) }, { label: "Investment", value: short(x.investment) },
       { label: "Per kid", value: eur(x.kidsReached ? x.investment / x.kidsReached : 0) }, { label: "Payback", value: x.payback ? `${Math.ceil(x.payback)} mo` : "Never" }])}`,
    `<div class="eyebrow">Where</div><h2>Launch where it's easy and demand is strong</h2>
     ${K(launch.map((c, i) => ({ hero: i === 0, label: c.name, value: c.bestCity.split(" / ")[0], sub: `Ease ${c.ease.toFixed(0)} · demand ${c.demand.toFixed(0)}` })))}
     <p style="margin-top:14px">Top demand: ${cities.map(c => c.name).join(", ")}. Easiest to start: ${countries.slice(0, 3).map(c => c.name).join(", ")}.</p>`,
    `<div class="eyebrow">Funding</div><h2>Grants reduce the founder capital needed</h2>
     ${K([{ hero: true, label: "Year 1 grants", value: "€30–90k" }, { label: "Erasmus+ small-scale", value: "€30k / €60k" }, { label: "Erasmus+ cooperation", value: "up to €400k" }, { label: "Ireland sports capital", value: "up to €200k" }])}`,
    `<div class="eyebrow">Roadmap</div><h2>From one warehouse to Europe</h2>
     <ul>${ROADMAP.map(p => `<li><b>${p.when}: ${p.title}.</b> ${p.kpi}</li>`).join("")}</ul>`,
    `<div class="eyebrow">The ask</div><h2>${short(per + x.investment)} to launch the hub + ${PN.venues} partner venues</h2>
     ${K([{ hero: true, label: "Hub", value: short(per), sub: `${fmtInt(m.kids)} kids` }, { label: "Partner network", value: short(x.investment), sub: `${fmtInt(x.kidsReached)} kids` },
       { label: "Combined profit / mo", value: sign(pr + x.profit) }])}`,
  ];
}
function renderDeck() {
  const slides = buildSlides(compute());
  slide = clamp(slide, 0, slides.length - 1);
  $("deck").innerHTML = slides.map((s, i) => `<div class="slide${i === slide ? " active" : ""}">${s}<div class="pg">${i + 1} / ${slides.length}</div></div>`).join("");
  $("dots").innerHTML = slides.map((_, i) => `<button class="${i === slide ? "on" : ""}" data-i="${i}" aria-label="Slide ${i + 1}"></button>`).join("");
  $("slideCount").textContent = `${slide + 1} / ${slides.length}`;
  $("prevSlide").disabled = slide === 0;
  $("nextSlide").disabled = slide === slides.length - 1;
}
function goSlide(i) { slide = i; save(); renderDeck(); }
$("prevSlide").addEventListener("click", () => goSlide(slide - 1));
$("nextSlide").addEventListener("click", () => goSlide(slide + 1));
$("dots").addEventListener("click", e => { if (e.target.dataset.i) goSlide(Number(e.target.dataset.i)); });
$("fullscreen").addEventListener("click", () => { const d = $("deck"); if (document.fullscreenElement) document.exitFullscreen(); else if (d.requestFullscreen) d.requestFullscreen(); });
document.addEventListener("keydown", e => {
  if (currentTab !== "deck" || e.target.tagName === "INPUT") return;
  if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); goSlide(slide + 1); }
  if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); goSlide(slide - 1); }
});

// =====================================================================
// Whole-plan state: read it (for cloud save) and apply it (cloud load).
// Loaded data is untrusted, so every value is coerced to a number or a
// known activity key before it reaches the page.
// =====================================================================
function getState() { return { A, W, BW, WHY, TT, TTF, PN, preset }; }
function numbersFrom(src, defaults) {
  const out = { ...defaults };
  if (src && typeof src === "object") for (const k of Object.keys(defaults)) {
    const v = Number(src[k]);
    if (src[k] !== null && src[k] !== "" && Number.isFinite(v)) out[k] = v;
  }
  return out;
}
function applyState(s) {
  if (!s || typeof s !== "object") return;
  A = numbersFrom(s.A, DEFAULTS);
  W = numbersFrom(s.W, Object.fromEntries(FACTORS.map(f => [f.k, f.w])));
  BW = numbersFrom(s.BW, Object.fromEntries(BIZ_FACTORS.map(f => [f.k, f.w])));
  WHY = numbersFrom(s.WHY, { area: 608, coach: 35 });
  TTF = numbersFrom(s.TTF, { fill: 60 });
  PN = numbersFrom(s.PN, Object.fromEntries(PN_LEVERS.map(l => [l.k, l.v])));
  TT = Array.isArray(s.TT) && s.TT.length === 7 && s.TT.every(r => Array.isArray(r) && r.length === TT_HOURS)
    ? s.TT.map(r => r.map(k => (typeof k === "string" && ACTIVITIES[k]) ? k : "empty"))
    : TT_DEFAULT.map(r => r.slice());
  preset = PRESETS[s.preset] ? s.preset : "";
  LEVERS.forEach(l => $("l_" + l.k).value = A[l.k]);
  PN_LEVERS.forEach(l => $("pn_" + l.k).value = PN[l.k]);
  FACTORS.forEach(f => $("w_" + f.k).value = W[f.k]);
  BIZ_FACTORS.forEach(f => $("bw_" + f.k).value = BW[f.k]);
  $("fill").value = TTF.fill; $("whyArea").value = WHY.area; $("whyCoach").value = WHY.coach;
  buildAssumptions();
  save(); renderWhy(); renderAll(); paintAll();
}

// =====================================================================
// Boot
// =====================================================================
function renderAll() {
  const m = compute();
  renderCalc(m);
  renderTimetable(m);
  renderPalette();
  renderCities();
  renderBusiness();
  renderPartners(m);
  renderRevenue(m);
  renderMission(m);
  renderDeck();
}
buildAssumptions();
renderWhy();
renderStreamFilter();
renderFunding();
renderAll();
setHeaderHeight();
showTab(location.hash.slice(1));
