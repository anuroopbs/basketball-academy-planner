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
const WEEKS = 52 / 12;                                       // weeks per month

function cardHtml(c) {
  return `<div class="card${c.hero ? " hero" : ""}${c.go ? " link" : ""}"${c.go ? ` data-go="${c.go}"` : ""}>
    <div class="label">${c.label}</div><div class="value">${c.value}</div><div class="sub">${c.sub || ""}</div></div>`;
}
// Source list items for a set of SOURCES keys (deduplicated).
function srcItems(keys) {
  return [...new Set(keys)].map(k => {
    const [t, u] = SOURCES[k] || [k, null];
    return `<li>${u ? `<a href="${u}" target="_blank" rel="noopener">${t}</a>` : t}</li>`;
  }).join("");
}
const srcDetails = keys => `<details class="src"><summary>ⓘ Sources</summary><ul>${srcItems(keys)}</ul></details>`;

// ---------------------------------------------------------------------
// Saved state
// ---------------------------------------------------------------------
const STORE_KEY = "bball-planner-v4";
const saved = (() => { try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); } catch { return {}; } })();
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ A, W, BW, WHY, TT, TTF, PN, slide })); } catch {}
}

// ---------------------------------------------------------------------
// Tabs (URL hash, so every tab is linkable)
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
  if (active && active.scrollIntoView) active.scrollIntoView({ block: "nearest", inline: "nearest" });
  window.scrollTo(0, 0);
}
document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => showTab(t.dataset.tab)));
document.addEventListener("click", e => {
  const go = e.target.closest("[data-go]");
  if (go) showTab(go.dataset.go);
});
window.addEventListener("hashchange", () => showTab(location.hash.slice(1)));
$("checked").textContent = "Data checked " + DATA_CHECKED;

// =====================================================================
// TIMETABLE state + maths (used by the calculator too)
// =====================================================================
let TT = Array.isArray(saved.TT) && saved.TT.length === 7 ? saved.TT : TT_DEFAULT.map(r => r.slice());
let TTF = { fill: 60, ...(saved.TTF || {}) };
let brush = "kids";

// Value of one one-hour session of an activity, given calculator settings P.
function actSession(key, P, fill) {
  const a = ACTIVITIES[key];
  if (!a || key === "empty") return { rev: 0, cost: 0, people: 0, price: 0 };
  let people = 0, price = a.price;
  if (key === "kids")   { people = P.group * P.occ / 100; price = P.kidsFee / (P.perKid * WEEKS); }
  else if (key === "adults") { people = a.att * fill; price = P.adultFee / (2 * WEEKS); }
  else if (key === "pickup") { people = a.att * fill; price = P.pickupFee; }
  else if (a.type === "pp") people = a.att * fill;
  // Whole-court hires count at the booking rate (expected value), like attendance.
  const rev = a.type === "flat" ? a.price * fill : people * price;
  return { rev, cost: a.cost, people, price };
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

// =====================================================================
// HUB CALCULATOR
// =====================================================================
const LEVERS_COURT = [
  { k: "n",         label: "Number of hub academies",          min: 1,  max: 10,  step: 1,  v: 1,   main: true },
  { k: "occ",       label: "Occupancy (court places filled)",  min: 10, max: 100, step: 5,  v: 70,  fmt: v => v + "%" },
  { k: "kidsFee",   label: "Price charged: kids monthly fee",  min: 20, max: 150, step: 5,  v: 70,  fmt: v => "€" + v },
  { k: "group",     label: "Kids per coach on one court",      min: 20, max: 40,  step: 1,  v: 30 },
  { k: "cac",       label: "Cost to acquire one student",      min: 0,  max: 200, step: 5,  v: 60,  fmt: v => "€" + v },
  { k: "campWeeks", label: "Holiday camp weeks per year",      min: 0,  max: 16,  step: 1,  v: 8 },
];
const LEVERS_OTHER = [
  { k: "gymArea",    label: "Fitness zone size",               min: 0,  max: 400,  step: 10, v: 200, fmt: v => v + " m²" },
  { k: "gymMembers", label: "Fitness zone members",            min: 0,  max: 300,  step: 5,  v: 80 },
  { k: "gymFee",     label: "Fitness membership monthly fee",  min: 30, max: 150,  step: 5,  v: 65,  fmt: v => "€" + v },
  { k: "adults",     label: "Adult basketball members",        min: 0,  max: 200,  step: 5,  v: 40 },
  { k: "pickup",     label: "Pickup-game visits per month",    min: 0,  max: 1000, step: 10, v: 250 },
  { k: "grantPct",   label: "Fit-out covered by grants",       min: 0,  max: 80,   step: 5,  v: 0,   fmt: v => v + "%" },
];
const LEVERS = [...LEVERS_COURT, ...LEVERS_OTHER];
const GROUPS = [
  { title: "Space & rent", fields: [
    ["courtArea",     "Basketball court footprint (m²)",   608],
    ["supportArea",   "Changing, reception, storage (m²)", 150],
    ["rentPerM2",     "Rent per m² per month (€)",           9],
    ["utilPerM2",     "Utilities per m² per month (€)",    2.5],
    ["depositMonths", "Rent deposit (months)",               3],
  ]},
  { title: "Students", fields: [
    ["perKid",        "Sessions per kid per week",           2],
    ["churnPct",      "Students leaving per month (%)",      4],
  ]},
  { title: "One-time setup (€)", fields: [
    ["courtFitout",   "Court fit-out (floor, hoops, lights)", 120000],
    ["gymEquipPerM2", "Fitness equipment per m² of zone",     200],
    ["gymFloorPerM2", "Rubber gym flooring per m²",            45],
    ["supportFitout", "Changing rooms & reception fit-out", 40000],
    ["convKit",       "Multi-use conversion kit",        kitTotal],
    ["launch",        "Launch marketing",                   10000],
    ["legal",         "Legal, insurance, company setup",     8000],
    ["bufferMonths",  "Months of costs kept as buffer",         3],
  ]},
  { title: "Staff per month (€)", fields: [
    ["headCoach",     "Head coach",                          3800],
    ["asstCoaches",   "Assistant coaches (number)",             2],
    ["asstSalary",    "Salary per assistant",                2000],
    ["gymCoach",      "Fitness coach (if fitness zone)",     2800],
    ["admin",         "Admin / front desk",                  2000],
    ["cleaning",      "Cleaning & maintenance staff",        1200],
  ]},
  { title: "Other monthly costs (€)", fields: [
    ["insurance",     "Insurance",                            900],
    ["software",      "Booking & payment software",           300],
    ["maintenance",   "Repairs & equipment upkeep",           500],
    ["brand",         "Brand marketing (not acquisition)",    800],
  ]},
  { title: "Other revenue", fields: [
    ["adultFee",      "Adult monthly fee (€)",                 45],
    ["pickupFee",     "Pickup fee per visit (€)",               7],
    ["campKids",      "Kids per camp week",                    40],
    ["campFee",       "Camp fee per kid per week (€)",        180],
    ["campCostPct",   "Camp running cost (% of camp revenue)", 40],
    ["privateHrs",    "Private 1:1 sessions per month",        30],
    ["privateFee",    "Price per private session (€)",         45],
    ["parties",       "Birthday parties per month",             6],
    ["partyFee",      "Price per party (€)",                  220],
    ["sponsor",       "Local sponsorship per month (€)",      800],
  ]},
];
const DEFAULTS = Object.fromEntries([
  ...LEVERS.map(l => [l.k, l.v]),
  ...GROUPS.flatMap(g => g.fields.map(([k,,v]) => [k, v])),
]);
let A = { ...DEFAULTS, ...(saved.A || {}) };

const PRESETS = {
  conservative: { occ: 50, kidsFee: 60, cac: 90, churnPct: 6, gymMembers: 50, rentPerM2: 11, fill: 40 },
  base:         { occ: 70, kidsFee: 70, cac: 60, churnPct: 4, gymMembers: 80, rentPerM2: 9,  fill: 60 },
  optimistic:   { occ: 85, kidsFee: 80, cac: 40, churnPct: 3, gymMembers: 120, rentPerM2: 8, fill: 80 },
};

function compute(over = {}) {
  const P = { ...A, fill: TTF.fill, ...over };
  const n = P.n;
  const tt = ttStats(P);
  // ---- Space ----
  const totalArea = P.courtArea + P.gymArea + P.supportArea;
  // ---- Students: capacity comes from the academy slots in the Timetable ----
  const capacity = Math.floor(tt.kidsSessions * P.group / Math.max(1, P.perKid));
  const kids = Math.round(capacity * P.occ / 100);
  const churn = P.churnPct / 100;
  const members = kids + (P.gymArea > 0 ? P.gymMembers : 0);
  // ---- Revenue ----
  const camp = P.campWeeks * P.campKids * P.campFee / 12;
  const streams = [
    ["Kids coaching",                     kids * P.kidsFee],
    ["Fitness memberships",               P.gymArea > 0 ? P.gymMembers * P.gymFee : 0],
    ["Extra programmes & multi-use (Timetable)", tt.extraMonthlyRev],
    ["Holiday camps (monthly avg)",       camp],
    ["Adult training",                    P.adults * P.adultFee],
    ["Pickup games",                      P.pickup * P.pickupFee],
    ["Private 1:1 coaching",              P.privateHrs * P.privateFee],
    ["Birthday parties",                  P.parties * P.partyFee],
    ["Sponsorship",                       P.sponsor],
  ];
  const revenue = streams.reduce((s, [, v]) => s + v, 0);
  // ---- Costs ----
  const rent = totalArea * P.rentPerM2;
  const costs = [
    ["Rent",                       rent],
    ["Utilities",                  totalArea * P.utilPerM2],
    ["Head coach",                 P.headCoach],
    ["Assistant coaches",          P.asstCoaches * P.asstSalary],
    ["Fitness coach",              P.gymArea > 0 ? P.gymCoach : 0],
    ["Admin / front desk",         P.admin],
    ["Cleaning & maintenance",     P.cleaning],
    ["Insurance",                  P.insurance],
    ["Software",                   P.software],
    ["Repairs & upkeep",           P.maintenance],
    ["Brand marketing",            P.brand],
    ["Student acquisition",        P.cac * churn * members],
    ["Camp running costs",         camp * P.campCostPct / 100],
    ["Multi-use instructors & referees", tt.extraMonthlyCost],
  ];
  const monthlyCost = costs.reduce((s, [, v]) => s + v, 0);
  const profit = revenue - monthlyCost;
  // ---- Investment ----
  const gymEquip = P.gymArea * P.gymEquipPerM2, gymFloor = P.gymArea * P.gymFloorPerM2;
  const fitout = P.courtFitout + gymEquip + gymFloor + P.supportFitout + P.convKit;
  const grant = fitout * P.grantPct / 100;
  const inv = [
    ["Basketball court fit-out",         P.courtFitout],
    ["Fitness equipment",                gymEquip],
    ["Fitness flooring",                 gymFloor],
    ["Changing rooms & reception",       P.supportFitout],
    ["Multi-use conversion kit",         P.convKit],
    ["Launch marketing",                 P.launch],
    ["Legal, insurance, company setup",  P.legal],
    [`Rent deposit (${P.depositMonths} months)`, rent * P.depositMonths],
    [`Acquiring the first ${fmtInt(members)} members`, P.cac * members],
    [`Running-cost buffer (${P.bufferMonths} months)`, monthlyCost * P.bufferMonths],
  ];
  if (grant) inv.push([`Less grants (${P.grantPct}% of fit-out)`, -grant]);
  const perHubInvest = inv.reduce((s, [, v]) => s + v, 0);
  // ---- Break-even occupancy (profit is linear in the number of kids) ----
  const perKidMargin = P.kidsFee - P.cac * churn;
  const profitNoKids = profit - kids * perKidMargin;
  const breakEvenOcc = profitNoKids >= 0 ? 0 : (perKidMargin > 0 && capacity > 0 ? -profitNoKids / (capacity * perKidMargin) : Infinity);
  const coaches = 1 + P.asstCoaches + (P.gymArea > 0 ? 1 : 0);
  const lifetimeMonths = churn > 0 ? 1 / churn : 0;
  return {
    P, n, tt, totalArea, capacity, kids, members, streams, revenue, costs, monthlyCost, profit,
    fitout, grant, inv, perHubInvest, investment: perHubInvest * n,
    payback: profit > 0 ? perHubInvest / profit : null,
    breakEvenOcc, coaches, lifetimeMonths, ltv: P.kidsFee * lifetimeMonths,
  };
}

// ---- Levers ----
function leverHtml(l, val, id = "l_") {
  return `<div class="lever${l.main ? " main" : ""}">
    <div class="lever-top"><span class="lever-label">${l.label}</span><span class="lever-value" id="${id}v_${l.k}"></span></div>
    <input type="range" id="${id}${l.k}" min="${l.min}" max="${l.max}" step="${l.step}" value="${val}" aria-label="${l.label}">
    ${l.help ? `<div class="small muted">${l.help}</div>` : ""}
  </div>`;
}
$("leversCourt").innerHTML = LEVERS_COURT.map(l => leverHtml(l, A[l.k])).join("");
$("leversOther").innerHTML = LEVERS_OTHER.map(l => leverHtml(l, A[l.k])).join("");
LEVERS.forEach(l => $("l_" + l.k).addEventListener("input", e => { A[l.k] = Number(e.target.value); save(); renderAll(); }));

function buildAssumptions() {
  $("groups").innerHTML = GROUPS.map(g => `
    <div class="group"><h3>${g.title}</h3>
      ${g.fields.map(([k, label]) => `
        <div class="field"><label for="f_${k}">${label}</label>
          <input id="f_${k}" data-k="${k}" type="number" min="0" step="any" inputmode="decimal" value="${A[k]}"></div>`).join("")}
    </div>`).join("");
  $("groups").querySelectorAll("input").forEach(inp => inp.addEventListener("input", () => {
    A[inp.dataset.k] = Math.max(0, Number(inp.value) || 0); save(); renderAll();
  }));
}
function syncInputs() {
  LEVERS.forEach(l => $("l_" + l.k).value = A[l.k]);
  $("fill").value = TTF.fill;
  buildAssumptions();
}
$("reset").addEventListener("click", () => { A = { ...DEFAULTS }; TTF.fill = 60; save(); syncInputs(); renderAll(); });
document.querySelectorAll("[data-preset]").forEach(b => b.addEventListener("click", () => {
  const p = PRESETS[b.dataset.preset];
  Object.entries(p).forEach(([k, v]) => { if (k === "fill") TTF.fill = v; else A[k] = v; });
  save(); syncInputs(); renderAll();
}));
$("gymKit").innerHTML = GYM_KIT.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("");
$("calcSources").innerHTML = srcItems(["est", "court_bb", "crossfit"]) +
  `<li>Kids capacity = academy slots in the Timetable × kids per coach ÷ sessions per kid per week</li>`;

function occChartSvg(m) {
  const W = 640, H = 230, L = 64, R = 16, T = 14, B = 34;
  const pts = [];
  for (let o = 10; o <= 100; o += 5) pts.push([o, compute({ occ: o }).profit]);
  const ys = pts.map(p => p[1]);
  const yMin = Math.min(0, ...ys), yMax = Math.max(0, ...ys);
  const x = o => L + (o - 10) / 90 * (W - L - R);
  const y = v => T + (yMax - v) / ((yMax - yMin) || 1) * (H - T - B);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join("");
  const area = `M${x(10)},${y(0)}` + pts.map(p => `L${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join("") + `L${x(100)},${y(0)}Z`;
  const cur = m.P.occ, curP = m.profit;
  const be = m.breakEvenOcc;
  let g = `<rect x="0" y="0" width="${W}" height="${H}" fill="none"/>`;
  [yMin, 0, yMax].forEach(v => g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="${v === 0 ? "#5a6170" : "#262a33"}" stroke-width="${v === 0 ? 1.5 : 1}"/>
    <text x="${L - 8}" y="${y(v) + 4}" fill="#9aa1ad" font-size="12" text-anchor="end">${short(v)}</text>`);
  [10, 25, 50, 75, 100].forEach(o => g += `<text x="${x(o)}" y="${H - 12}" fill="#9aa1ad" font-size="12" text-anchor="middle">${o}%</text>`);
  g += `<path d="${area}" fill="#ff7a1a" fill-opacity=".10"/><path d="${path}" fill="none" stroke="#ff7a1a" stroke-width="3"/>`;
  if (be > 0 && be <= 1) {
    const bx = x(be * 100);
    g += `<line x1="${bx}" x2="${bx}" y1="${T}" y2="${H - B}" stroke="#2ecc71" stroke-dasharray="5 4"/>
      <text x="${bx + 6}" y="${T + 12}" fill="#2ecc71" font-size="12">break-even ${pct(be)}</text>`;
  }
  g += `<circle cx="${x(cur)}" cy="${y(curP)}" r="6" fill="#fff" stroke="#ff7a1a" stroke-width="3"/>
    <text x="${clamp(x(cur), L + 40, W - 80)}" y="${y(curP) - 12}" fill="#f2f3f5" font-size="12" font-weight="700" text-anchor="middle">you: ${short(curP)}/mo</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Monthly profit per hub at each occupancy level">${g}</svg>
    <div class="small muted">Monthly profit per hub (y) at each occupancy level (x). Green line = break-even, white dot = your current setting.</div>`;
}

function renderCalc(m) {
  const n = m.n, P = m.P;
  LEVERS.forEach(l => $("l_v_" + l.k).textContent = l.k === "n" ? plural(n, "hub", "hubs") : (l.fmt ? l.fmt(A[l.k]) : A[l.k]));
  document.querySelectorAll(".thAll").forEach(th => th.textContent = `All ${plural(n, "hub", "hubs")}`);
  const beo = m.breakEvenOcc;
  const beoTxt = beo === Infinity || beo > 1 ? `<span class="neg">${beo === Infinity ? "Never" : ">100%"}</span>`
    : beo === 0 ? `<span class="pos">0%</span>` : pct(beo);

  $("cardsMoney").innerHTML = [
    { hero: true, label: "Total investment needed", value: short(m.investment), sub: `${short(m.perHubInvest)} per hub × ${n}` },
    { label: "Fit-out (court, gym, rooms, kit)", value: short(m.fitout * n), sub: `${short(m.fitout)} per hub` },
    { label: "Grants used", value: short(m.grant * n), sub: `${P.grantPct}% of fit-out. See EU funding`, go: "funding" },
    { label: "Investment per m²", value: eur(m.perHubInvest / m.totalArea), sub: "Total investment ÷ floor area" },
    { label: "Investment per kid place", value: m.capacity ? short(m.perHubInvest / m.capacity) : "–", sub: `${fmtInt(m.capacity)} places at full capacity` },
  ].map(cardHtml).join("");
  $("cardsPL").innerHTML = [
    { label: "Monthly revenue", value: short(m.revenue * n), sub: `${eur(m.revenue)} per hub` },
    { label: "Monthly running cost", value: short(m.monthlyCost * n), sub: `${eur(m.monthlyCost)} per hub` },
    { hero: true, label: "Monthly profit", value: sign(m.profit * n), sub: `Yearly: ${short(m.profit * n * 12)}` },
    { label: "Profit margin", value: m.revenue ? `<span class="${m.profit >= 0 ? "pos" : "neg"}">${pct(m.profit / m.revenue)}</span>` : "–", sub: "Profit ÷ revenue" },
    { label: "Payback period", value: m.payback === null ? `<span class="neg">Never</span>` : `${Math.ceil(m.payback)} months`,
      sub: m.payback === null ? "Costs are higher than revenue" : `≈ ${(m.payback / 12).toFixed(1)} years` },
    { label: "Break-even occupancy", value: beoTxt, sub: beo === 0 ? "Other income already covers all costs" : `You're at ${P.occ}%` },
  ].map(cardHtml).join("");
  $("occChart").innerHTML = occChartSvg(m);

  $("cardsSpace").innerHTML = [
    { hero: true, label: "Total area per hub", value: fmtInt(m.totalArea) + " m²", sub: `${fmtInt(m.totalArea * n)} m² across ${plural(n, "hub", "hubs")}` },
    { label: "Basketball court", value: fmtInt(P.courtArea) + " m²", sub: "28 × 15 m court + run-off, 7 m+ ceiling" },
    { label: "Fitness zone", value: fmtInt(P.gymArea) + " m²", sub: P.gymArea ? "Rigs, barbells, dumbbells, rowers, bikes" : "No fitness zone" },
    { label: "Changing, reception, storage", value: fmtInt(P.supportArea) + " m²", sub: "Toilets, showers, office, kit room" },
    { label: "Rent", value: short(m.totalArea * P.rentPerM2), sub: `per month at €${P.rentPerM2}/m²` },
  ].map(cardHtml).join("");
  const parts = [["Court", P.courtArea, "#ff7a1a"], ["Fitness zone", P.gymArea, "#4da3ff"], ["Support", P.supportArea, "#9aa1ad"]];
  $("areaBar").innerHTML = parts.filter(p => p[1] > 0).map(([l, v, c]) =>
    `<div style="flex:${v};background:${c}" title="${l}: ${fmtInt(v)} m²">${v / m.totalArea > .12 ? `${l} ${fmtInt(v)} m²` : ""}</div>`).join("");
  $("areaLegend").innerHTML = parts.map(([l, v, c]) => `<span><i style="background:${c}"></i>${l}: ${fmtInt(v)} m² (${pct(v / m.totalArea)})</span>`).join("");

  $("cardsStudents").innerHTML = [
    { hero: true, label: "Kids enrolled", value: fmtInt(m.kids * n), sub: `${fmtInt(m.kids)} per hub at ${P.occ}% occupancy` },
    { label: "Maximum capacity", value: fmtInt(m.capacity * n), sub: `${m.tt.kidsSessions} academy slots × ${P.group} kids ÷ ${P.perKid}/week`, go: "timetable" },
    { label: "Court utilisation", value: pct(m.tt.util), sub: `${m.tt.used} of ${m.tt.total} hours a week used`, go: "timetable" },
    { label: "Fitness members", value: fmtInt((P.gymArea ? P.gymMembers : 0) * n), sub: P.gymArea ? `${(P.gymMembers / P.gymArea).toFixed(2)} per m²` : "No fitness zone" },
    { label: "Adults + pickup visits", value: fmtInt(P.adults * n) + " + " + fmtInt(P.pickup * n), sub: "Members + drop-in visits / month" },
    { label: "Coaches employed", value: m.coaches * n, sub: `${m.coaches} per hub + freelance instructors` },
  ].map(cardHtml).join("");
  $("cardsUnit").innerHTML = [
    { label: "Cost to acquire a student", value: eur(P.cac), sub: "Ads, trial sessions, school visits per sign-up" },
    { label: "Lifetime value of a kid", value: eur(m.ltv), sub: `€${P.kidsFee} × ${m.lifetimeMonths.toFixed(0)} months average stay` },
    { label: "Lifetime value ÷ acquisition cost", value: P.cac ? (m.ltv / P.cac).toFixed(1) + "×" : "∞", sub: "Above 3× is healthy" },
    { label: "Acquisition payback", value: P.cac ? (P.cac / P.kidsFee).toFixed(1) + " months" : "0", sub: "Months of fees to recover acquisition cost" },
    { label: "Revenue per m² per year", value: eur(m.revenue * 12 / m.totalArea), sub: "How hard the space works" },
    { label: "Cost per member per month", value: eur(m.monthlyCost / Math.max(1, m.members + P.adults)), sub: "Running cost ÷ all members" },
  ].map(cardHtml).join("");

  const tbl = (rows, total, totalLabel, withShare = true) =>
    rows.map(([l, v]) => `<tr><td>${l}</td><td>${eur(v)}</td><td>${eur(v * n)}</td>${withShare ? `<td>${total ? pct(v / total) : "0%"}</td>` : ""}</tr>`).join("") +
    `<tr class="total"><td>${totalLabel}</td><td>${eur(total)}</td><td>${eur(total * n)}</td>${withShare ? "<td>100%</td>" : ""}</tr>`;
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
$("fill").addEventListener("input", e => { TTF.fill = Number(e.target.value); save(); renderAll(); });
function hourLabel(h) { return String(h).padStart(2, "0") + ":00"; }
function actColor(key) { return ACT_CATS[ACTIVITIES[key].cat][1]; }
function renderPalette() {
  $("palette").innerHTML = Object.entries(ACTIVITIES).map(([k, a]) =>
    `<button class="chip${k === brush ? " on" : ""}" data-brush="${k}"><i style="background:${actColor(k)}"></i>${a.icon} ${a.short || "Empty"}</button>`).join("");
}
$("palette").addEventListener("click", e => {
  const b = e.target.closest("[data-brush]");
  if (b) { brush = b.dataset.brush; renderPalette(); }
});
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
$("kitHint").textContent = `${eur(kitTotal)} one-time`;
$("ttSources").innerHTML = srcItems(["court_bb", "court_bd", "court_pb", "court_hb", "est"]);

function renderTimetable(m) {
  const tt = m.tt;
  $("fillV").textContent = TTF.fill + "%";
  let html = `<thead><tr><th></th>${TT_DAYS.map(d => `<th>${d}</th>`).join("")}</tr></thead><tbody>`;
  for (let h = 0; h < TT_HOURS; h++) {
    const hour = TT_START + h;
    html += `<tr class="${hour >= 16 ? "prime" : ""}"><td class="time">${hourLabel(hour)}</td>`;
    for (let d = 0; d < 7; d++) {
      const k = TT[d][h], a = ACTIVITIES[k] || ACTIVITIES.empty;
      html += `<td class="cell${k === "empty" ? " empty" : ""}" data-d="${d}" data-h="${h}" style="background:${k === "empty" ? "#1c2028" : actColor(k)}"
        title="${TT_DAYS[d]} ${hourLabel(hour)}–${hourLabel(hour + 1)}: ${a.name}"><span>${a.icon} ${a.short || "free"}</span></td>`;
    }
    html += "</tr>";
  }
  $("tt").innerHTML = html + "</tbody>";

  const acts = Object.entries(tt.by).map(([k, b]) => ({ k, ...b, a: ACTIVITIES[k], perHour: b.rev / b.hours }));
  $("ttCards").innerHTML = [
    { hero: true, label: "Court utilisation", value: pct(tt.util), sub: `${tt.used} of ${tt.total} hours a week (06:00–22:00)` },
    { label: "Prime-time utilisation", value: tt.prime ? pct(tt.primeUsed / tt.prime) : "–", sub: "Weekdays 16–22, weekends 09–18" },
    { label: "Weekly court revenue", value: short(tt.weekRev), sub: `${short(tt.weekRev * WEEKS)} / month from court activities` },
    { label: "Weekly net (after instructors)", value: sign(tt.weekRev - tt.weekCost), sub: "Before rent and salaried staff" },
    { label: "People through the door", value: fmtInt(tt.people), sub: "Visits per week" },
    { label: "Different uses", value: acts.length, sub: "Activities on the same floor" },
    { label: "Added to the Hub calculator", value: short(tt.extraMonthlyRev), sub: "Extra programmes & multi-use / month", go: "calc" },
    { label: "Revenue per court hour", value: eur(tt.used ? tt.weekRev / tt.used : 0), sub: "Average over the hours used" },
  ].map(cardHtml).join("");

  const sorted = acts.slice().sort((a, b) => b.perHour - a.perHour);
  const maxPH = Math.max(1, ...sorted.map(a => a.perHour));
  $("ttPerHour").innerHTML = sorted.map(a => `<div class="hbar-row"><span>${a.a.icon} ${a.a.short}</span>
    <div class="hbar"><span style="width:${Math.max(2, a.perHour / maxPH * 100)}%;background:${actColor(a.k)}"></span></div>
    <span class="v">${eur(a.perHour)}/h</span></div>`).join("");

  const cats = {};
  acts.forEach(a => cats[a.a.cat] = (cats[a.a.cat] || 0) + a.hours);
  cats.none = tt.total - tt.used;
  const catList = Object.entries(cats).filter(([, v]) => v > 0);
  $("ttMix").innerHTML = catList.map(([c, v]) => `<div style="flex:${v};background:${ACT_CATS[c][1]}" title="${ACT_CATS[c][0]}: ${v} h"></div>`).join("");
  $("ttMixLegend").innerHTML = catList.map(([c, v]) => `<span><i style="background:${ACT_CATS[c][1]}"></i>${ACT_CATS[c][0]}: ${v} h</span>`).join("");
  $("ttDays").innerHTML = tt.perDay.map((v, d) => `<div class="daybar"><b>${pct(v / TT_HOURS)}</b>
    <div class="col" style="height:${v / TT_HOURS * 100}%"></div>${TT_DAYS[d]}</div>`).join("");

  $("ttTable").innerHTML = `<thead><tr><th>Activity</th><th>Hours / week</th><th>Visits / week</th><th>Revenue / week</th><th>Direct cost / week</th><th>Revenue / hour</th><th class="l">Counted where</th></tr></thead><tbody>` +
    acts.sort((a, b) => b.rev - a.rev).map(a => `<tr><td>${a.a.icon} ${a.a.name}</td><td>${a.hours}</td><td>${fmtInt(a.people)}</td>
      <td>${eur(a.rev)}</td><td>${eur(a.cost)}</td><td>${eur(a.perHour)}</td>
      <td class="l">${a.a.inCalc ? '<span class="tag in">In calculator</span>' : '<span class="tag">Added as multi-use</span>'}</td></tr>`).join("") +
    `<tr class="total"><td>Total</td><td>${tt.used}</td><td>${fmtInt(tt.people)}</td><td>${eur(tt.weekRev)}</td><td>${eur(tt.weekCost)}</td><td>${eur(tt.used ? tt.weekRev / tt.used : 0)}</td><td></td></tr></tbody>`;
}

// =====================================================================
// WHY BASKETBALL
// =====================================================================
let WHY = { area: 608, coach: 35, ...(saved.WHY || {}) };
$("whyArea").value = WHY.area;
$("whyCoach").value = WHY.coach;
$("whyArea").addEventListener("input", e => { WHY.area = Number(e.target.value); save(); renderWhy(); renderDeck(); });
$("whyCoach").addEventListener("input", e => { WHY.coach = Number(e.target.value); save(); renderWhy(); renderDeck(); });
$("whySources").innerHTML = srcItems([...SPORTS.map(s => s.src), "est"]);

function spaceDims(area) { const w = Math.sqrt(area * 32 / 19); return [w, area / w]; }
function fitCourts(sport, area) {
  const [W, H] = spaceDims(area);
  const [a, b] = sport.footprint;
  const opt = (fw, fh) => ({ cols: Math.floor(W / fw), rows: Math.floor(H / fh), fw, fh });
  const o1 = opt(a, b), o2 = opt(b, a);
  const best = o1.cols * o1.rows >= o2.cols * o2.rows ? o1 : o2;
  return { ...best, count: best.cols * best.rows, W, H, rotated: best === o2 };
}
function sportMetrics(s, area, coachRate) {
  const fit = fitCourts(s, area);
  const fpArea = s.footprint[0] * s.footprint[1];
  return {
    s, fit, fpArea, students: fit.count * s.group, investment: fit.count * s.courtCost, coaches: fit.count,
    perCoach: s.group, coachPerKidHr: coachRate / s.group, invPerPlace: s.courtCost / s.group,
    m2PerKid: fpArea / s.group, invPerM2: s.courtCost / fpArea, usedPct: fit.count * fpArea / area,
  };
}
const allSportMetrics = () => SPORTS.map(s => sportMetrics(s, WHY.area, WHY.coach));

function sportSvg(m) {
  const { fit, s } = m;
  const pad = 0.6, k = 10;
  const VW = (fit.W + pad * 2) * k, VH = (fit.H + pad * 2) * k;
  let g = `<rect x="${pad * k}" y="${pad * k}" width="${fit.W * k}" height="${fit.H * k}" fill="none" stroke="#5a6170" stroke-width="3" stroke-dasharray="10 6"/>`;
  const [cw, ch] = fit.rotated ? [s.court[1], s.court[0]] : s.court;
  for (let r = 0; r < fit.rows; r++) for (let c = 0; c < fit.cols; c++) {
    const x0 = pad + c * fit.fw, y0 = pad + r * fit.fh;
    const cx = x0 + (fit.fw - cw) / 2, cy = y0 + (fit.fh - ch) / 2;
    g += `<rect x="${x0 * k}" y="${y0 * k}" width="${fit.fw * k}" height="${fit.fh * k}" fill="${s.color}" fill-opacity=".10" stroke="${s.color}" stroke-opacity=".35"/>`;
    g += `<rect x="${cx * k}" y="${cy * k}" width="${cw * k}" height="${ch * k}" fill="${s.color}" fill-opacity=".22" stroke="${s.color}" stroke-width="2"/>`;
    const n = s.group, cols = Math.max(1, Math.round(Math.sqrt(n * cw / ch))), rows = Math.ceil(n / cols);
    const dx = cw / cols, dy = ch / rows, rad = Math.min(dx, dy) * 0.28 * k;
    for (let i = 0; i < n; i++)
      g += `<circle cx="${(cx + dx * (i % cols + .5)) * k}" cy="${(cy + dy * (Math.floor(i / cols) + .5)) * k}" r="${rad}" fill="${s.color}"/>`;
    const cs = Math.max(rad * 2, 6);
    g += `<rect x="${(cx + cw / 2) * k - cs / 2}" y="${cy * k - cs / 2}" width="${cs}" height="${cs}" fill="#fff" stroke="#111" stroke-width="1.5"/>`;
  }
  return `<svg viewBox="0 0 ${VW.toFixed(0)} ${VH.toFixed(0)}" role="img" aria-label="${s.name}: ${fit.count} courts in ${fmtInt(WHY.area)} m²">${g}</svg>`;
}

function renderWhy() {
  $("whyAreaV").textContent = fmtInt(WHY.area) + " m²";
  $("whyCoachV").textContent = "€" + WHY.coach;
  const ms = allSportMetrics();
  $("sportPanels").innerHTML = ms.map(m => `
    <div class="sport${m.s.k === "basketball" ? " win" : ""}">
      <h3><span>${m.s.icon} ${m.s.name}</span><span class="tag">${plural(m.fit.count, "court", "courts")}</span></h3>
      ${sportSvg(m)}
      <div class="kv">
        <span>Kids training at once</span><span>${fmtInt(m.students)}</span>
        <span>Coaches needed</span><span>${m.coaches}</span>
        <span>Kids per coach</span><span>${m.s.range}</span>
        <span>Fit-out investment</span><span>${short(m.investment)}</span>
        <span>Space one court needs</span><span>${fmtInt(m.fpArea)} m²</span>
        <span>Investment per m²</span><span>${eur(m.invPerM2)}</span>
        <span>Minimum ceiling</span><span>${m.s.ceiling} m</span>
      </div>
      <p class="small muted" style="margin:8px 0 0">${m.s.note}</p>
      ${srcDetails([m.s.src, "est"])}
    </div>`).join("");

  const chart = (title, sub, key, fmt, lowerBetter) => {
    const max = Math.max(...ms.map(m => m[key])) || 1;
    const best = lowerBetter ? Math.min(...ms.map(m => m[key])) : Math.max(...ms.map(m => m[key]));
    return `<div class="chart-box"><h3>${title}</h3><div class="small muted">${sub}</div>
      ${ms.map(m => `<div class="hbar-row"><span>${m.s.icon} ${m.s.name}</span>
        <div class="hbar"><span style="width:${Math.max(2, m[key] / max * 100)}%;background:${m.s.color};opacity:${m[key] === best ? 1 : .55}"></span></div>
        <span class="v">${fmt(m[key])}</span></div>`).join("")}</div>`;
  };
  $("sportCharts").innerHTML = [
    chart("Kids per coach", "One coach, one court, one session. Higher is better", "perCoach", v => v, false),
    chart("Coach cost per kid per hour", `At €${WHY.coach}/hour per coach. Lower is better`, "coachPerKidHr", v => "€" + v.toFixed(2), true),
    chart(`Kids training at once in ${fmtInt(WHY.area)} m²`, "Higher is better", "students", v => fmtInt(v), false),
    chart(`Coaches needed for ${fmtInt(WHY.area)} m²`, "Lower is better", "coaches", v => v, true),
    chart("Floor space per kid", "m² of court footprint per kid in a session. Lower is better", "m2PerKid", v => v.toFixed(1) + " m²", true),
    chart("Fit-out investment per kid place", "One court's fit-out ÷ kids per session. Lower is better", "invPerPlace", v => eur(v), true),
  ].join("");
  const rows = [
    ["Official court size", m => m.s.court.join(" × ") + " m"],
    ["Space one court needs (incl. run-off)", m => `${fmtInt(m.fpArea)} m²`],
    ["Minimum ceiling height", m => m.s.ceiling + " m"],
    ["Kids per coach per court", m => m.s.range],
    [`Courts that fit in ${fmtInt(WHY.area)} m²`, m => m.fit.count],
    ["Kids training at once", m => fmtInt(m.students)],
    ["Coaches needed", m => m.coaches],
    ["Fit-out cost per court", m => eur(m.s.courtCost)],
    ["Total fit-out for the space", m => eur(m.investment)],
    ["Fit-out per m²", m => eur(m.invPerM2)],
    ["Fit-out per kid place", m => eur(m.invPerPlace)],
    ["Floor space per kid", m => m.m2PerKid.toFixed(1) + " m²"],
    ["Coach cost per kid per hour", m => "€" + m.coachPerKidHr.toFixed(2)],
    ["Share of the space used", m => pct(m.usedPct)],
  ];
  $("sportTable").innerHTML = `<thead><tr><th>Metric</th>${ms.map(m => `<th>${m.s.icon} ${m.s.name}</th>`).join("")}</tr></thead><tbody>` +
    rows.map(([l, f]) => `<tr><td>${l}</td>${ms.map(m => `<td>${f(m)}</td>`).join("")}</tr>`).join("") + "</tbody>";
}

// =====================================================================
// PARTNER VENUES
// =====================================================================
const PN_LEVERS = [
  { k: "venues", label: "Partner venues",                 min: 1,  max: 50, step: 1, v: 10, main: true },
  { k: "hours",  label: "Session hours per venue / week", min: 2,  max: 30, step: 1, v: 10 },
  { k: "kids",   label: "Kids per session (average)",     min: 5,  max: 40, step: 1, v: 15 },
  { k: "price",  label: "Price per kid per session",      min: 3,  max: 15, step: 0.5, v: 6, fmt: v => "€" + v },
  { k: "share",  label: "Venue's share of revenue",       min: 0,  max: 50, step: 5, v: 30, fmt: v => v + "%" },
  { k: "coach",  label: "Coach pay per hour",             min: 15, max: 50, step: 1, v: 30, fmt: v => "€" + v },
];
const PN_FIXED = { setup: 4000, tech: 60, marketing: 150, managerPer: 15, manager: 3800, launch: 5000, sessionsPerKid: 1.5 };
let PN = { ...Object.fromEntries(PN_LEVERS.map(l => [l.k, l.v])), ...(saved.PN || {}) };
$("partnerLevers").innerHTML = PN_LEVERS.map(l => leverHtml(l, PN[l.k], "pn_")).join("");
PN_LEVERS.forEach(l => $("pn_" + l.k).addEventListener("input", e => { PN[l.k] = Number(e.target.value); save(); renderPartners(compute()); renderMission(compute()); renderDeck(); }));

const iconCard = ([ic, t, d]) => `<div class="icon-card"><div class="ic">${ic}</div><h3>${t}</h3><p>${d}</p></div>`;
$("venueTypes").innerHTML = VENUE_TYPES.map(iconCard).join("") +
  `<div class="icon-card" style="grid-column:1/-1">${srcDetails(["meanwhile", "est"])}</div>`;
$("weBring").innerHTML = WE_BRING.map(iconCard).join("");
$("venueBrings").innerHTML = VENUE_BRINGS.map(iconCard).join("");
$("dealTypes").innerHTML = DEAL_TYPES.map(([t, d], i) => `<div class="box"><span class="tag${i === 0 ? " in" : ""}">${i === 0 ? "Default" : "Option"}</span><h3 class="mt">${t}</h3><p class="muted small">${d}</p></div>`).join("");

function computeNetwork() {
  const f = PN_FIXED;
  const sessions = PN.venues * PN.hours * WEEKS;                 // per month
  const revenue = sessions * PN.kids * PN.price;
  const venueShare = revenue * PN.share / 100;
  const coachesPer = Math.ceil(PN.kids / 25);
  const coachCost = sessions * coachesPer * PN.coach;
  const managers = Math.ceil(PN.venues / f.managerPer);
  const costs = venueShare + coachCost + PN.venues * (f.tech + f.marketing) + managers * f.manager;
  const profit = revenue - costs;
  const investment = PN.venues * f.setup + f.launch + 2 * costs;
  const places = PN.venues * PN.hours * PN.kids;
  return { sessions, revenue, venueShare, coachCost, managers, costs, profit, investment, places,
           kidsReached: places / f.sessionsPerKid, coachHours: sessions * coachesPer,
           payback: profit > 0 ? investment / profit : null };
}
function renderPartners(m) {
  PN_LEVERS.forEach(l => $("pn_v_" + l.k).textContent = l.fmt ? l.fmt(PN[l.k]) : PN[l.k]);
  const x = computeNetwork();
  $("partnerCards").innerHTML = [
    { hero: true, label: "Monthly profit (network)", value: sign(x.profit), sub: `Yearly: ${short(x.profit * 12)}` },
    { label: "Kids reached", value: fmtInt(x.kidsReached), sub: `${fmtInt(x.places)} kid places / week` },
    { label: "Monthly revenue", value: short(x.revenue), sub: `${fmtInt(x.sessions)} sessions / month` },
    { label: "Paid to venues", value: short(x.venueShare), sub: `${PN.share}% revenue share` },
    { label: "Coach pay", value: short(x.coachCost), sub: `${fmtInt(x.coachHours)} coach hours / month` },
    { label: "Investment needed", value: short(x.investment), sub: `€${fmtInt(PN_FIXED.setup)} kit per venue + launch + 2 months of costs` },
    { label: "Payback", value: x.payback ? `${Math.ceil(x.payback)} months` : `<span class="neg">Never</span>` },
    { label: "Area managers", value: x.managers, sub: `1 per ${PN_FIXED.managerPer} venues` },
  ].map(cardHtml).join("");

  const hub = m;
  const rows = [
    ["Investment", short(hub.perHubInvest), short(x.investment)],
    ["Kids reached", fmtInt(hub.kids), fmtInt(x.kidsReached)],
    ["Investment per kid", eur(hub.kids ? hub.perHubInvest / hub.kids : 0), eur(x.kidsReached ? x.investment / x.kidsReached : 0)],
    ["Monthly profit", sign(hub.profit), sign(x.profit)],
    ["Payback", hub.payback ? `${Math.ceil(hub.payback)} months` : "Never", x.payback ? `${Math.ceil(x.payback)} months` : "Never"],
    ["Control of the space", "Full: our building, our timetable", "Shared: agreed hours only"],
    ["Main risk", "Rent and occupancy", "Venues cancelling, coach supply"],
    ["Role in the strategy", "Trains coaches, showcase, elite squads", "Scale, reach, community impact"],
  ];
  $("hubVsNet").innerHTML = `<thead><tr><th class="l"></th><th class="l">🏭 1 warehouse hub</th><th class="l">🏫 ${plural(PN.venues, "partner venue", "partner venues")}</th></tr></thead><tbody>` +
    rows.map(r => `<tr><td class="l">${r[0]}</td><td class="l">${r[1]}</td><td class="l">${r[2]}</td></tr>`).join("") + "</tbody>";
}

// =====================================================================
// CITIES (demand)
// =====================================================================
let W = { ...Object.fromEntries(FACTORS.map(f => [f.k, f.w])), ...(saved.W || {}) };
const CITIES = CITY_DATA.map(([name, cc, ...rest]) => {
  const why = rest.pop();
  return { name, cc, why, s: Object.fromEntries(FACTORS.map((f, i) => [f.k, rest[i]])) };
});
const countryName = cc => (COUNTRIES.find(c => c.code === cc) || {}).name || ({ LT: "Lithuania" })[cc] || cc;
function rankCities() {
  const tw = FACTORS.reduce((s, f) => s + W[f.k], 0) || 1;
  return CITIES.map(c => ({ ...c, score: FACTORS.reduce((s, f) => s + c.s[f.k] * W[f.k], 0) / tw * 10 })).sort((a, b) => b.score - a.score);
}
$("weights").innerHTML = FACTORS.map(f => leverHtml({ ...f, min: 0, max: 40, step: 1, help: f.why }, W[f.k], "w_")).join("");
FACTORS.forEach(f => $("w_" + f.k).addEventListener("input", e => { W[f.k] = Number(e.target.value); save(); renderAll(); }));
$("resetWeights").addEventListener("click", () => { FACTORS.forEach(f => { W[f.k] = f.w; $("w_" + f.k).value = f.w; }); save(); renderAll(); });
$("citySources").innerHTML = srcItems(FACTORS.map(f => f.src).concat(["est"])) +
  "<li>Scores are 1–10 estimates from these sources, for comparing cities. Check your shortlist against local census and school-location data.</li>";

function renderCities() {
  const tw = FACTORS.reduce((s, f) => s + W[f.k], 0) || 1;
  FACTORS.forEach(f => $("w_v_" + f.k).textContent = Math.round(W[f.k] / tw * 100) + "%");
  const ranked = rankCities();
  $("top5").innerHTML = ranked.slice(0, 5).map((c, i) => {
    const best = FACTORS.slice().sort((a, b) => c.s[b.k] - c.s[a.k]).slice(0, 3);
    return `<div class="box"><div class="rank"><div class="rank-num">${i + 1}</div><div style="flex:1">
      <h3>${c.name} <span class="muted small">· ${countryName(c.cc)}</span></h3>
      <div class="small">Score <span class="score">${c.score.toFixed(1)}</span> / 100</div>
      <div class="bar"><span style="width:${c.score}%"></span></div>
      <p class="small muted" style="margin:10px 0 6px">${c.why}</p>
      <div>${best.map(f => `<span class="tag">${f.label}: ${c.s[f.k]}/10</span>`).join("")}</div>
    </div></div></div>`;
  }).join("");
  $("cityHead").innerHTML = `<tr><th>#</th><th class="l">City</th><th>Score</th>${FACTORS.map(f => `<th>${f.label}</th>`).join("")}</tr>`;
  $("cityBody").innerHTML = ranked.map((c, i) => `<tr${i < 5 ? ' class="hl"' : ""}><td>${i + 1}</td>
    <td class="l"><b>${c.name}</b><br><span class="muted small">${countryName(c.cc)}</span></td>
    <td class="score">${c.score.toFixed(1)}</td>${FACTORS.map(f => `<td>${c.s[f.k]}</td>`).join("")}</tr>`).join("");
}

// =====================================================================
// START A BUSINESS (supply / ease)
// =====================================================================
let BW = { ...Object.fromEntries(BIZ_FACTORS.map(f => [f.k, f.w])), ...(saved.BW || {}) };
const labourScore = l => clamp(10 - (l - 12) / (48 - 12) * 9, 1, 10);
function rankCountries() {
  const tw = BIZ_FACTORS.reduce((s, f) => s + BW[f.k], 0) || 1;
  const cities = rankCities();
  return COUNTRIES.map(c => {
    const s = { ...c.s, labour: labourScore(c.labour) };
    const ease = BIZ_FACTORS.reduce((t, f) => t + s[f.k] * BW[f.k], 0) / tw * 10;
    const best = cities.filter(x => x.cc === c.code)[0];
    return { ...c, sc: s, ease, demand: best ? best.score : 0, bestCity: best ? best.name : c.city };
  }).sort((a, b) => b.ease - a.ease);
}
$("bizWeights").innerHTML = BIZ_FACTORS.map(f => leverHtml({ ...f, min: 0, max: 40, step: 1 }, BW[f.k], "bw_")).join("");
BIZ_FACTORS.forEach(f => $("bw_" + f.k).addEventListener("input", e => { BW[f.k] = Number(e.target.value); save(); renderAll(); }));
$("bizResetWeights").addEventListener("click", () => { BIZ_FACTORS.forEach(f => { BW[f.k] = f.w; $("bw_" + f.k).value = f.w; }); save(); renderAll(); });
$("bizSources").innerHTML = srcItems(["eurostat_lc", "eurostat_news", "taxfound", "bready", "estonia_reg", "ie_cro", "ie_vetting", "pt_hora", "fr_coach", "fr_coach2", "est"]) +
  "<li>Registration times, costs and the youth-sport rules score are summaries for comparison. Confirm current fees with each national registry before you register.</li>";

function countryCard(c, rank) {
  return `<div class="box">
    <div class="rank">${rank ? `<div class="rank-num">${rank}</div>` : ""}<div style="flex:1">
      <h3>${c.name} <span class="muted small">· ${c.city}</span></h3>
      <div class="small">Ease score <span class="score">${c.ease.toFixed(1)}</span> / 100</div>
      <div class="bar"><span style="width:${c.ease}%"></span></div>
    </div></div>
    <dl class="facts">
      <dt>Company type</dt><dd>${c.entity}</dd>
      <dt>Time to register</dt><dd>${c.time}</dd>
      <dt>Setup cost</dt><dd>${c.setup}</dd>
      <dt>Minimum capital</dt><dd>${c.capital}</dd>
      <dt>Corporate tax</dt><dd>${c.tax}</dd>
      <dt>Labour cost</dt><dd>€${c.labour.toFixed(1)} / hour (EU avg €34.9)</dd>
    </dl>
    <div class="small muted">Business support programmes</div><ul class="pill-list prog">${c.programmes.map(p => `<li>${p}</li>`).join("")}</ul>
    <div class="small muted mt">Challenges</div><ul class="pill-list chal">${c.challenges.map(p => `<li>${p}</li>`).join("")}</ul>
    ${srcDetails(c.src)}
  </div>`;
}
function matrixSvg(list) {
  const Wd = 700, H = 440, L = 56, R = 20, T = 20, B = 46;
  const xs = list.map(c => c.ease), ys = list.map(c => c.demand);
  const x0 = Math.floor(Math.min(...xs) / 5) * 5 - 5, x1 = Math.ceil(Math.max(...xs) / 5) * 5 + 5;
  const y0 = Math.floor(Math.min(...ys) / 5) * 5 - 5, y1 = Math.ceil(Math.max(...ys) / 5) * 5 + 5;
  const X = v => L + (v - x0) / (x1 - x0) * (Wd - L - R), Y = v => T + (y1 - v) / (y1 - y0) * (H - T - B);
  const mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length;
  let g = `<rect x="${X(mx)}" y="${T}" width="${Wd - R - X(mx)}" height="${Y(my) - T}" fill="#2ecc71" fill-opacity=".08"/>`;
  g += `<line x1="${X(mx)}" x2="${X(mx)}" y1="${T}" y2="${H - B}" stroke="#3a404c" stroke-dasharray="4 4"/>
        <line x1="${L}" x2="${Wd - R}" y1="${Y(my)}" y2="${Y(my)}" stroke="#3a404c" stroke-dasharray="4 4"/>`;
  const q = (x, y, t, c, a) => `<text x="${x}" y="${y}" fill="${c}" font-size="13" font-weight="700" text-anchor="${a}">${t}</text>`;
  g += q(Wd - R - 6, T + 16, "LAUNCH FIRST: easy + strong demand", "#2ecc71", "end");
  g += q(L + 6, T + 16, "BIG PRIZE, HARDER SETUP", "#ffd166", "start");
  g += q(Wd - R - 6, H - B - 8, "EASY BUT SMALLER DEMAND", "#4da3ff", "end");
  g += q(L + 6, H - B - 8, "LATER", "#9aa1ad", "start");
  g += `<text x="${(L + Wd - R) / 2}" y="${H - 10}" fill="#9aa1ad" font-size="14" text-anchor="middle">Ease of starting the business → (score /100)</text>
        <text x="16" y="${(T + H - B) / 2}" fill="#9aa1ad" font-size="14" text-anchor="middle" transform="rotate(-90 16 ${(T + H - B) / 2})">Demand in best city → (score /100)</text>`;
  list.forEach(c => {
    const cx = X(c.ease), cy = Y(c.demand);
    g += `<circle cx="${cx}" cy="${cy}" r="8" fill="#ff7a1a" stroke="#111" stroke-width="2"/>
      <text x="${cx + 10}" y="${cy + 4}" fill="#f2f3f5" font-size="15" font-weight="700">${c.bestCity}</text>`;
  });
  return `<svg viewBox="0 0 ${Wd} ${H}" role="img" aria-label="Ease of starting a business vs demand">${g}</svg>
    <div class="small muted" style="padding:0 6px">Dashed lines = averages. Change weights on Best cities or below and the dots move.</div>`;
}
function renderBusiness() {
  const tw = BIZ_FACTORS.reduce((s, f) => s + BW[f.k], 0) || 1;
  BIZ_FACTORS.forEach(f => $("bw_v_" + f.k).textContent = Math.round(BW[f.k] / tw * 100) + "%");
  const list = rankCountries();
  $("bizTop").innerHTML = list.slice(0, 5).map((c, i) => countryCard(c, i + 1)).join("");
  $("bizAll").innerHTML = list.map(c => countryCard(c, 0)).join("");
  $("bizMatrix").innerHTML = matrixSvg(list);
  $("bizTable").innerHTML = `<thead><tr><th>#</th><th class="l">Country</th><th>Ease</th>${BIZ_FACTORS.map(f => `<th>${f.label}</th>`).join("")}<th>€/hour</th><th>Best-city demand</th></tr></thead><tbody>` +
    list.map((c, i) => `<tr${i < 5 ? ' class="hl"' : ""}><td>${i + 1}</td><td class="l"><b>${c.name}</b></td><td class="score">${c.ease.toFixed(1)}</td>
      ${BIZ_FACTORS.map(f => `<td>${c.sc[f.k].toFixed(f.k === "labour" ? 1 : 0)}</td>`).join("")}<td>${c.labour.toFixed(1)}</td><td>${c.demand.toFixed(1)}</td></tr>`).join("") + "</tbody>";
}

// =====================================================================
// REVENUE STREAMS, FUNDING, PARAMETERS (static)
// =====================================================================
$("streams").innerHTML = STREAMS.map(g => `
  <details class="fold"${g === STREAMS[0] ? " open" : ""}><summary>${g.group} <span class="hint">${g.items.length} streams</span></summary>
  <div class="fold-body"><div class="grid-2">${g.items.map(([name, price, inCalc, desc]) => `
    <div class="box stream"><h3>${name}</h3>
      <div><span class="price">${price}</span> ${inCalc ? '<span class="tag in">In calculator</span>' : ""}</div>
      <p>${desc}</p></div>`).join("")}</div>${srcDetails(["est"])}</div></details>`).join("");

const TYPE_TAG = { eu: '<span class="tag eu">EU</span>', nat: '<span class="tag nat">National</span>', pri: '<span class="tag pri">Private</span>' };
$("funds").innerHTML = FUNDS.map(f => `
  <div class="box fund"><div>${TYPE_TAG[f.type]}</div><h3>${f.name}</h3>
    <div class="amount">${f.amount}</div><ul>${f.pts.map(p => `<li>${p}</li>`).join("")}</ul>${srcDetails(f.src)}</div>`).join("");
$("fundCards").innerHTML = [
  { hero: true, label: "Realistic grant funding, year 1", value: "€30k–€90k", sub: "1 small-scale Erasmus+ grant + national/city grants" },
  { label: "Grant funding, years 2–3 (multi-city)", value: "€150k–€450k", sub: "Cooperation partnership + an event" },
  { label: "Largest single EU sport grant", value: "€400k", sub: "Erasmus+ cooperation partnership" },
  { label: "Ireland equipment-only cap", value: "€70k", sub: "Sports Capital & Equipment Programme" },
].map(cardHtml).join("");

let pn = 0;
$("paramList").innerHTML = PARAMS.map(g => `
  <h2>${g.group}</h2>
  <div class="table-scroll"><table>
    <thead><tr><th>#</th><th class="l">Parameter / requirement</th><th class="l">Where it is</th></tr></thead>
    <tbody>${g.items.map(([p, where]) => `<tr><td>${++pn}</td><td class="l">${p}</td><td class="l muted">${where}</td></tr>`).join("")}</tbody>
  </table></div>`).join("");
$("dupList").innerHTML = DUPLICATES.map(d => `<li>${d}</li>`).join("");
$("dupHint").textContent = `${DUPLICATES.length} merged`;

// =====================================================================
// MISSION
// =====================================================================
function flywheelSvg() {
  const nodes = [
    ["🏭", "Warehouse hub", "trains coaches"],
    ["🧑‍🏫", "Certified coaches", "staff partner venues"],
    ["🏫", "Partner venues", "reach kids near home"],
    ["⭐", "Kids & talent", "flow back to the hub"],
    ["💶", "Revenue & reputation", "fund the next hub"],
  ];
  const cx = 280, cy = 210, r = 150, W = 560, H = 420;
  let g = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#2c313c" stroke-width="2" stroke-dasharray="6 6"/>
    <text x="${cx}" y="${cy - 6}" fill="#ff7a1a" font-size="18" font-weight="900" text-anchor="middle">THE FLYWHEEL</text>
    <text x="${cx}" y="${cy + 16}" fill="#9aa1ad" font-size="12" text-anchor="middle">each turn makes the next one easier</text>
    <defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="#ff7a1a"/></marker></defs>`;
  const pos = nodes.map((_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / nodes.length; return [cx + r * Math.cos(a), cy + r * Math.sin(a), a]; });
  pos.forEach(([, , a], i) => {
    const a1 = a + 0.32, a2 = a + 2 * Math.PI / nodes.length - 0.32;
    g += `<path d="M${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} A${r},${r} 0 0 1 ${cx + r * Math.cos(a2)},${cy + r * Math.sin(a2)}" fill="none" stroke="#ff7a1a" stroke-width="3" marker-end="url(#arr)"/>`;
  });
  nodes.forEach(([ic, t, s], i) => {
    const [x, y] = pos[i];
    g += `<g><rect x="${x - 78}" y="${y - 30}" width="156" height="60" rx="14" fill="#20242d" stroke="#ff7a1a"/>
      <text x="${x}" y="${y - 6}" fill="#f2f3f5" font-size="13" font-weight="800" text-anchor="middle">${ic} ${t}</text>
      <text x="${x}" y="${y + 13}" fill="#9aa1ad" font-size="12" text-anchor="middle">${s}</text></g>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Strategy flywheel">${g}</svg>`;
}
$("flywheel").innerHTML = flywheelSvg();
$("roadmap").innerHTML = ROADMAP.map((p, i) => `
  <div class="step"><div class="dot">${i + 1}</div><div class="body">
    <div class="when">${p.phase} · ${p.when}</div><h3>${p.title}</h3>
    <ul>${p.what.map(w => `<li>${w}</li>`).join("")}</ul>
    <div class="kpi">🎯 ${p.kpi}</div></div></div>`).join("");

function renderMission(m) {
  const x = computeNetwork();
  const city = rankCities()[0], easy = rankCountries()[0];
  $("missionCards").innerHTML = [
    { hero: true, label: "Investment for the first hub", value: short(m.perHubInvest), sub: "Change it in the Hub calculator", go: "calc" },
    { label: "Kids at the hub", value: fmtInt(m.kids), sub: `${m.P.occ}% occupancy, ages 8–18`, go: "calc" },
    { label: "Court utilisation", value: pct(m.tt.util), sub: `${m.tt.used} hours/week, ${Object.keys(m.tt.by).length} uses`, go: "timetable" },
    { label: "Partner venues", value: PN.venues, sub: `${fmtInt(x.kidsReached)} more kids reached`, go: "partners" },
    { label: "Kids per coach", value: A.group, sub: "vs 4–8 in racket sports", go: "why" },
    { label: "Hub monthly profit", value: sign(m.profit), sub: m.payback ? `Payback ${Math.ceil(m.payback)} months` : "Not profitable yet", go: "calc" },
    { label: "Top demand city", value: city.name, sub: `Score ${city.score.toFixed(0)}/100`, go: "cities" },
    { label: "Easiest country to start", value: easy.name, sub: `Ease ${easy.ease.toFixed(0)}/100`, go: "business" },
  ].map(cardHtml).join("");
}

// =====================================================================
// DECK (built from live numbers)
// =====================================================================
let slide = Number(saved.slide) || 0;
function buildSlides(m) {
  const n = m.n, P = m.P, x = computeNetwork();
  const ms = allSportMetrics(), bb = ms.find(s => s.s.k === "basketball"), others = ms.filter(s => s.s.k !== "basketball");
  const topStreams = m.streams.slice().sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topInv = m.inv.filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const cities = rankCities().slice(0, 3), countries = rankCountries();
  const launch = countries.slice().sort((a, b) => (b.ease + b.demand) - (a.ease + a.demand)).slice(0, 3);
  const beo = m.breakEvenOcc, per = m.perHubInvest, pr = m.profit;
  const cards = list => `<div class="grid mt">${list.map(cardHtml).join("")}</div>`;
  return [
    `<div class="kicker">Investor deck</div>
     <h2>Get every kid in Europe playing</h2>
     <p>Youth basketball academies (ages 8–18): one warehouse hub that trains coaches, then a network of partner schools and community centres.</p>
     ${cards([{ hero: true, label: "First hub investment", value: short(per) }, { label: "Kids at the hub", value: fmtInt(m.kids) },
              { label: "Partner venues", value: PN.venues, sub: `${fmtInt(x.kidsReached)} kids` }, { label: "Court utilisation", value: pct(m.tt.util) }])}`,
    `<div class="kicker">The problem</div><h2>Kids need somewhere close by to play, and the courts that exist sit empty</h2>
     <ul><li>Basketball is growing fast in Europe, but indoor courts and academies are scarce.</li>
       <li>Meanwhile, school halls and community centres sit empty after 16:00, at weekends and in the holidays.</li>
       <li>Parents want structured after-school activity within walking distance of school and home.</li></ul>`,
    `<div class="kicker">The strategy</div><h2>Hub first, then partner venues</h2>
     <ul><li><b>Hub:</b> a warehouse academy that trains coaches and earns money all day from a multi-use timetable.</li>
       <li><b>Partner venues:</b> our coaches, programmes and software in existing schools and community centres, on a profit share.</li>
       <li><b>Europe:</b> repeat the hub + network in the best cities.</li></ul>`,
    `<div class="kicker">Why basketball</div><h2>The most kids per coach</h2>
     <div class="big">${bb.s.range}</div><p>kids per coach on one court, vs ${others.map(o => `${o.s.name.toLowerCase()} ${o.s.range}`).join(", ")}.</p>
     ${cards([{ hero: true, label: `Basketball in ${fmtInt(WHY.area)} m²`, value: `${bb.students} kids`, sub: `${bb.coaches} coach` },
       ...others.slice(0, 3).map(o => ({ label: `${o.s.name} in ${fmtInt(WHY.area)} m²`, value: `${o.students} kids`, sub: plural(o.coaches, "coach", "coaches") }))])}`,
    `<div class="kicker">The hub</div><h2>${fmtInt(m.totalArea)} m²: court + fitness zone</h2>
     <div class="areabar" style="height:56px">${[["Basketball court", P.courtArea, "#ff7a1a"], ["Fitness zone", P.gymArea, "#4da3ff"], ["Support", P.supportArea, "#9aa1ad"]]
        .filter(p => p[1] > 0).map(([l, v, c]) => `<div style="flex:${v};background:${c}">${v / m.totalArea > .12 ? `${l} · ${fmtInt(v)} m²` : ""}</div>`).join("")}</div>
     <ul class="mt"><li>Full-size court, sprung wooden floor, 7 m+ ceiling, converts to badminton, pickleball, yoga, dance.</li>
       <li>CrossFit-style zone: rigs, barbells, dumbbells, rowers, air bikes.</li><li>Rent ${eur(m.totalArea * P.rentPerM2)} / month at €${P.rentPerM2}/m².</li></ul>`,
    `<div class="kicker">One court, used all day</div><h2>${pct(m.tt.util)} utilisation, ${Object.keys(m.tt.by).length} different uses</h2>
     <ul><li>06–10: before-school training, mini kids, women's yoga, seniors.</li><li>10–16: school PE hire, badminton, pickleball, handball, corporate.</li>
       <li>16–19: the kids academy (prime time).</li><li>19–22: dance rental, adult leagues, pickup basketball.</li></ul>
     ${cards([{ hero: true, label: "Court revenue / week", value: short(m.tt.weekRev) }, { label: "People / week", value: fmtInt(m.tt.people) },
              { label: "Revenue per court hour", value: eur(m.tt.used ? m.tt.weekRev / m.tt.used : 0) }])}`,
    `<div class="kicker">Money needed</div><h2>First hub investment</h2><div class="big">${short(per)}</div>
     <p>${n > 1 ? `${short(m.investment)} for ${n} hubs. ` : ""}${m.grant ? `After ${short(m.grant * n)} of grants.` : ""}</p>
     <div class="table-scroll mt"><table><tbody>${topInv.map(([l, v]) => `<tr><td>${l}</td><td>${eur(v)}</td><td>${pct(v / per)}</td></tr>`).join("")}</tbody></table></div>`,
    `<div class="kicker">How the hub makes money</div><h2>${short(m.revenue)} revenue per month</h2>
     <div style="max-width:760px">${topStreams.map(([l, v]) => `<div class="hbar-row" style="grid-template-columns:230px 1fr 60px"><span>${l}</span>
       <div class="hbar"><span style="width:${v / topStreams[0][1] * 100}%;background:var(--accent)"></span></div><span class="v">${pct(v / m.revenue)}</span></div>`).join("")}</div>`,
    `<div class="kicker">Unit economics</div><h2>Each kid is worth ${eur(m.ltv)}</h2>
     ${cards([{ label: "Kids monthly fee", value: eur(P.kidsFee) }, { label: "Cost to acquire a kid", value: eur(P.cac) },
       { label: "Average stay", value: m.lifetimeMonths.toFixed(0) + " months" }, { hero: true, label: "Lifetime value ÷ acquisition cost", value: P.cac ? (m.ltv / P.cac).toFixed(1) + "×" : "∞" },
       { label: "Capacity", value: fmtInt(m.capacity) + " kids" }, { label: "Occupancy", value: P.occ + "%" }])}`,
    `<div class="kicker">Profit & break-even</div><h2>${pr >= 0 ? "Profitable" : "Loss-making"} at ${P.occ}% occupancy</h2>
     ${cards([{ hero: true, label: "Monthly profit", value: sign(pr), sub: `Margin ${m.revenue ? pct(pr / m.revenue) : "–"}` },
       { label: "Break-even occupancy", value: beo === Infinity || beo > 1 ? "Not reachable" : pct(beo), sub: beo === 0 ? "Other income covers all costs" : "" },
       { label: "Payback", value: m.payback ? `${Math.ceil(m.payback)} months` : "Never" }, { label: "Yearly profit", value: sign(pr * 12) }])}`,
    `<div class="kicker">Partner venues</div><h2>${PN.venues} venues, ${fmtInt(x.kidsReached)} kids, no buildings to buy</h2>
     <p>Schools, community centres, colleges, public courts. We bring coaches, programmes, software and kit; the venue gets ${PN.share}% of revenue.</p>
     ${cards([{ hero: true, label: "Network monthly profit", value: sign(x.profit) }, { label: "Investment", value: short(x.investment) },
       { label: "Investment per kid", value: eur(x.kidsReached ? x.investment / x.kidsReached : 0) }, { label: "Payback", value: x.payback ? `${Math.ceil(x.payback)} months` : "Never" }])}`,
    `<div class="kicker">Where</div><h2>Launch where it's easy and demand is strong</h2>
     ${cards(launch.map((c, i) => ({ hero: i === 0, label: c.name, value: c.bestCity, sub: `Ease ${c.ease.toFixed(0)} · demand ${c.demand.toFixed(0)}` })))}
     <p class="mt">Top demand cities: ${cities.map(c => c.name).join(", ")}. Easiest countries to start: ${countries.slice(0, 3).map(c => c.name).join(", ")}.</p>`,
    `<div class="kicker">Funding</div><h2>Grants reduce the founder capital needed</h2>
     <ul><li><b>Erasmus+ Sport small-scale:</b> €30k or €60k.</li><li><b>Erasmus+ Sport cooperation:</b> €120k / €250k / €400k.</li>
       <li><b>National sport capital grants</b> (e.g. Ireland up to €200k).</li><li>Realistic: <b>€30k–€90k in year 1</b> via a non-profit club partner.</li></ul>`,
    `<div class="kicker">Roadmap</div><h2>From one warehouse to Europe</h2>
     <ul>${ROADMAP.map(p => `<li><b>${p.when}: ${p.title}.</b> ${p.kpi}</li>`).join("")}</ul>`,
    `<div class="kicker">The ask</div><h2>${short(per + x.investment)} to launch the hub + ${PN.venues} partner venues</h2>
     <ul><li>Hub: ${short(per)}, ${fmtInt(m.totalArea)} m², ${fmtInt(m.kids)} kids, ${m.coaches} coaches.</li>
       <li>Partner network: ${short(x.investment)}, ${fmtInt(x.kidsReached)} kids.</li>
       <li>Combined monthly profit: ${sign(pr + x.profit)}.</li></ul>`,
  ];
}
function renderDeck() {
  const slides = buildSlides(compute());
  slide = clamp(slide, 0, slides.length - 1);
  $("deck").innerHTML = slides.map((s, i) => `<div class="slide${i === slide ? " active" : ""}">${s}</div>`).join("");
  $("dots").innerHTML = slides.map((_, i) => `<button class="${i === slide ? "on" : ""}" data-i="${i}" aria-label="Slide ${i + 1}"></button>`).join("");
  $("slideCount").textContent = `${slide + 1} / ${slides.length}`;
  $("prevSlide").disabled = slide === 0;
  $("nextSlide").disabled = slide === slides.length - 1;
}
function goSlide(i) { slide = i; save(); renderDeck(); }
$("prevSlide").addEventListener("click", () => goSlide(slide - 1));
$("nextSlide").addEventListener("click", () => goSlide(slide + 1));
$("dots").addEventListener("click", e => { if (e.target.dataset.i) goSlide(Number(e.target.dataset.i)); });
$("fullscreen").addEventListener("click", () => {
  const d = $("deck");
  if (document.fullscreenElement) document.exitFullscreen(); else if (d.requestFullscreen) d.requestFullscreen();
});
document.addEventListener("keydown", e => {
  if (currentTab !== "deck" || e.target.tagName === "INPUT") return;
  if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); goSlide(slide + 1); }
  if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); goSlide(slide - 1); }
});

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
  renderMission(m);
  renderDeck();
}
buildAssumptions();
renderWhy();
renderAll();
showTab(location.hash.slice(1));
