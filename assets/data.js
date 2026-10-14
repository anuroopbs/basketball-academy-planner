// =====================================================================
// All content and reference data for the site lives here, so numbers
// can be updated without touching the page logic in app.js.
// Every fact that comes from outside carries a source key (see SOURCES).
// =====================================================================

const DATA_CHECKED = "14 October 2026";

// ---------------------------------------------------------------------
// Sources. Shown wherever a figure is used, via the "ⓘ Sources" toggles.
// "est" = planner estimate (no outside source; editable in the site).
// ---------------------------------------------------------------------
const SOURCES = {
  est:          ["Planner estimate: typical Western European market ranges. Change it in the Calculator and check it against local quotes.", null],
  eurostat_lc:  ["Eurostat: hourly labour costs 2025, whole economy (dataset lc_lci_lev)", "https://ec.europa.eu/eurostat/databrowser/view/lc_lci_lev/default/table"],
  eurostat_news:["Eurostat news, 31 Mar 2026: EU hourly labour costs ranged from €12 to €57 in 2025", "https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20260331-2"],
  taxfound:     ["Tax Foundation: Corporate income tax rates in Europe, 2026", "https://taxfoundation.org/data/all/eu/corporate-income-tax-rates-europe/"],
  estonia_reg:  ["e-Residency (Republic of Estonia): starting a company online", "https://e-resident.gov.ee/blog/posts/which-of-these-countries-is-the-best-to-start-a-company"],
  bready:       ["World Bank: Business Ready (B-READY), which replaced Doing Business in 2024", "https://www.worldbank.org/en/businessready"],
  fr_coach:     ["French Ministry of Sport: paid sports coaches need a recognised diploma + professional card (Code du sport L212-1)", "https://www.sports.gouv.fr/educateurs-sportifs"],
  fr_coach2:    ["Bpifrance Création: regulated activity, éducateur sportif", "https://bpifrance-creation.fr/activites-reglementees/educateur-sportif"],
  ie_vetting:   ["Garda National Vetting Bureau: vetting is required for anyone working with children", "https://vetting.garda.ie/"],
  ie_cro:       ["Companies Registration Office Ireland (CORE online filing)", "https://cro.ie/"],
  pt_hora:      ["Empresa na Hora: Portugal's same-day company registration", "https://justica.gov.pt/en-gb/Servicos/Criar-empresa-na-hora"],
  erasmus:      ["Erasmus+ Programme Guide: Sport (European Commission)", "https://erasmus-plus.ec.europa.eu/programme-guide/part-b/key-action-2/sport"],
  erasmus_ss:   ["ERASMUS-SPORT-2026-SSCP small-scale partnerships (€30k / €60k)", "https://www.fundingprogrammesportal.gov.cy/en/call/small-scale-partnerships-en-2025/"],
  erasmus_cp:   ["Erasmus+ Programme Guide: Cooperation partnerships (lump sums €120k / €250k / €400k)", "https://erasmus-plus.ec.europa.eu/programme-guide/part-b/key-action-2/cooperation-partnerships"],
  erasmus_ev:   ["Erasmus+ sport grants summary (event amounts, durations, 2026 deadline)", "https://sporbilimleri.gelisim.edu.tr/en/akademik-news-erasmus-grants-in-the-field-of-sports"],
  ie_scep:      ["Leinster Express: Sports Capital & Equipment Programme caps (€200k local, €500k regional, €70k equipment-only)", "https://www.leinsterexpress.ie/sport/laois-clubs-urged-to-apply-for-sports-capital-grants-as-funds-set-to-increase-7398152"],
  eu_portal:    ["EU Funding & Tenders portal (open calls)", "https://ec.europa.eu/info/funding-tenders/opportunities/portal/"],
  court_bb:     ["Basketball court: FIBA standard 28 × 15 m", "https://en.wikipedia.org/wiki/Basketball_court"],
  court_sq:     ["Squash court: 9.75 × 6.4 m", "https://en.wikipedia.org/wiki/Squash_(sport)"],
  court_bd:     ["Badminton court: 13.4 × 6.1 m", "https://en.wikipedia.org/wiki/Badminton"],
  court_pd:     ["Padel court: 20 × 10 m", "https://en.wikipedia.org/wiki/Padel"],
  court_pb:     ["Pickleball court: 44 × 20 ft (13.41 × 6.1 m)", "https://en.wikipedia.org/wiki/Pickleball"],
  court_hb:     ["Handball court: 40 × 20 m (larger than a basketball court)", "https://en.wikipedia.org/wiki/Handball"],
  city_density: ["List of EU cities by population within city limits (area, density)", "https://en.wikipedia.org/wiki/List_of_cities_in_the_European_Union_by_population_within_city_limits"],
  eurostat_pop: ["Eurostat: population structure and ageing (share of young people by country)", "https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Population_structure_and_ageing"],
  crossfit:     ["CrossFit affiliate licence (the name is a registered trademark)", "https://www.crossfit.com/affiliate"],
  meanwhile:    ["‘Meanwhile use’ = temporary community use of vacant buildings at low rent while the owner waits for a long-term tenant (common practice in UK, Irish and Dutch cities)", null],
};

// ---------------------------------------------------------------------
// Sports compared on the "Why basketball" tab.
// footprint = court + safety run-off (the floor one court really needs, m)
// group     = students one coach can run on one court in a session
// courtCost = indicative fit-out of ONE indoor court inside a rented shell
// ---------------------------------------------------------------------
const SPORTS = [
  { k: "basketball", name: "Basketball", icon: "🏀", court: [28, 15],     footprint: [32, 19],    ceiling: 7,   group: 30, range: "20–40", courtCost: 120000, color: "#ff7a1a", src: "court_bb",
    note: "Sprung wooden floor, 2 competition hoops + 4 side hoops, lighting, scoreboard." },
  { k: "squash",     name: "Squash",     icon: "🎾", court: [9.75, 6.4],  footprint: [10.5, 7.2], ceiling: 6,   group: 5,  range: "4–6",   courtCost: 55000,  color: "#4da3ff", src: "court_sq",
    note: "4 walls (glass back wall), sprung maple floor, lighting." },
  { k: "badminton",  name: "Badminton",  icon: "🏸", court: [13.4, 6.1],  footprint: [16.4, 9.1], ceiling: 9,   group: 8,  range: "6–12",  courtCost: 18000,  color: "#2ecc71", src: "court_bd",
    note: "Synthetic court mat, posts and net, glare-free lighting. Needs a 9 m ceiling." },
  { k: "padel",      name: "Padel",      icon: "🥎", court: [20, 10],     footprint: [21, 11],    ceiling: 7,   group: 4,  range: "4–6",   courtCost: 35000,  color: "#e0b0ff", src: "court_pd",
    note: "Glass-and-mesh enclosure, artificial turf, lighting." },
  { k: "pickleball", name: "Pickleball", icon: "🏓", court: [13.41, 6.1], footprint: [18.3, 9.1], ceiling: 5.5, group: 8,  range: "8–12",  courtCost: 12000,  color: "#ffd166", src: "court_pb",
    note: "Court surface or mat, net, line marking, lighting." },
];

// ---------------------------------------------------------------------
// Fitness-zone equipment (CrossFit-style circuit training)
// ---------------------------------------------------------------------
const GYM_KIT = [
  ["Rig / squat racks with pull-up bars", "€6k–12k"],
  ["Olympic barbells + bumper plates", "€4k–8k"],
  ["Dumbbells (2.5–40 kg) + racks", "€3k–6k"],
  ["Kettlebells, wall balls, plyo boxes", "€2k–4k"],
  ["Rowers, air bikes, ski ergs", "€8k–15k"],
  ["Sled, battle ropes, bands, mats", "€1.5k–3k"],
  ["Rubber gym flooring (per m²)", "€35–60"],
  ["Sound system, mirrors, timer clock", "€2k–4k"],
];

// ---------------------------------------------------------------------
// MULTI-USE COURT: activities that can run on the one basketball floor.
// type: "member" = covered by a monthly membership (value per visit derived
//                  from the Calculator's fee),
//       "pp"     = pay per person per session,
//       "flat"   = whole court hired for a flat hourly fee.
// inCalc: already counted as its own stream in the Calculator, so the
//         Timetable must not add it again.
// cost  = direct cost per one-hour session (instructor, referee, cleaning)
// ---------------------------------------------------------------------
const ACT_CATS = {
  core:      ["Core academy (kids)", "#ff7a1a"],
  adults:    ["Adult basketball",    "#d9480f"],
  community: ["Community & wellbeing", "#9775fa"],
  sports:    ["Other sports on the same floor", "#2ecc71"],
  rental:    ["Whole-court hire", "#4da3ff"],
  none:      ["Empty", "#2c313c"],
};
const ACTIVITIES = {
  kids:       { name: "Academy training (ages 8–18)",      short: "Academy",    icon: "🏀", cat: "core",      type: "member", att: 30, price: 0,   cost: 0,  inCalc: true },
  early:      { name: "Before-school training",            short: "Early bird", icon: "🌅", cat: "core",      type: "pp",     att: 15, price: 8,   cost: 30, inCalc: false },
  mini:       { name: "Little kids mini-basketball (4–7)", short: "Mini kids",  icon: "🧒", cat: "core",      type: "pp",     att: 16, price: 9,   cost: 30, inCalc: false },
  adults:     { name: "Adult basketball training",         short: "Adults",     icon: "🏃", cat: "adults",    type: "member", att: 20, price: 0,   cost: 0,  inCalc: true },
  pickup:     { name: "Pickup basketball (drop-in)",       short: "Pickup",     icon: "🔥", cat: "adults",    type: "pp",     att: 25, price: 0,   cost: 0,  inCalc: true },
  league:     { name: "Adult league games",                short: "League",     icon: "🏆", cat: "adults",    type: "pp",     att: 20, price: 10,  cost: 40, inCalc: false },
  yoga:       { name: "Women's yoga",                      short: "Yoga",       icon: "🧘", cat: "community", type: "pp",     att: 20, price: 10,  cost: 40, inCalc: false },
  seniors:    { name: "Seniors active (walking basketball, mobility)", short: "Seniors", icon: "👵", cat: "community", type: "pp", att: 18, price: 5, cost: 30, inCalc: false },
  dance:      { name: "Dance academy rental",              short: "Dance",      icon: "💃", cat: "rental",    type: "flat",   att: 0,  price: 50,  cost: 0,  inCalc: false },
  school:     { name: "School PE hire",                    short: "School PE",  icon: "🏫", cat: "rental",    type: "flat",   att: 0,  price: 60,  cost: 0,  inCalc: false },
  corporate:  { name: "Corporate team event",              short: "Corporate",  icon: "💼", cat: "rental",    type: "flat",   att: 0,  price: 150, cost: 20, inCalc: false },
  party:      { name: "Birthday party",                    short: "Party",      icon: "🎉", cat: "rental",    type: "flat",   att: 0,  price: 110, cost: 15, inCalc: true },
  badminton:  { name: "Badminton (3 courts on the floor)", short: "Badminton",  icon: "🏸", cat: "sports",    type: "pp",     att: 12, price: 7,   cost: 0,  inCalc: false },
  pickleball: { name: "Pickleball (3 courts on the floor)",short: "Pickleball", icon: "🏓", cat: "sports",    type: "pp",     att: 12, price: 7,   cost: 0,  inCalc: false },
  handball:   { name: "Handball training (club hire)",     short: "Handball",   icon: "🤾", cat: "sports",    type: "flat",   att: 0,  price: 65,  cost: 0,  inCalc: false },
  volleyball: { name: "Volleyball club hire",              short: "Volleyball", icon: "🏐", cat: "sports",    type: "flat",   att: 0,  price: 60,  cost: 0,  inCalc: false },
  futsal:     { name: "Futsal / 5-a-side hire",            short: "Futsal",     icon: "⚽", cat: "sports",    type: "flat",   att: 0,  price: 70,  cost: 0,  inCalc: false },
  empty:      { name: "Empty",                             short: "",           icon: "",   cat: "none",      type: "flat",   att: 0,  price: 0,   cost: 0,  inCalc: false },
};
const TT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TT_START = 6, TT_HOURS = 16;                           // 06:00 → 22:00
// One row per day, one entry per hour from 06:00.
const TT_DEFAULT = [
  ["early","mini","yoga","seniors","school","school","pickleball","badminton","handball","badminton","kids","kids","kids","dance","adults","pickup"],
  ["early","mini","yoga","seniors","school","school","badminton","badminton","school","pickleball","kids","kids","kids","pickleball","league","pickup"],
  ["early","mini","yoga","seniors","school","school","pickleball","badminton","handball","badminton","kids","kids","kids","volleyball","adults","pickup"],
  ["early","mini","yoga","seniors","school","school","badminton","corporate","school","pickleball","kids","kids","kids","dance","league","pickup"],
  ["early","mini","yoga","seniors","school","school","pickleball","badminton","empty","corporate","kids","kids","pickup","pickup","futsal","empty"],
  ["empty","empty","kids","kids","kids","kids","party","party","badminton","pickleball","pickup","pickup","dance","league","empty","empty"],
  ["empty","empty","yoga","mini","kids","kids","party","party","pickleball","badminton","pickup","empty","empty","empty","empty","empty"],
];
// One-time kit to switch the court between uses.
const CONVERSION_KIT = [
  ["Badminton posts & nets (3 courts)", 3000],
  ["Pickleball nets & line tape (3 courts)", 1500],
  ["Multi-sport line markings in the floor", 2000],
  ["Yoga mats & blocks (25 sets)", 1000],
  ["Portable mirrors (dance / yoga)", 2500],
  ["Adjustable mini-basketball hoops (2)", 3000],
  ["Portable handball / futsal goals", 2000],
  ["Volleyball posts & net", 2500],
  ["Floor protection covers (events)", 5000],
  ["Storage cage & trolleys", 2000],
];

// ---------------------------------------------------------------------
// LEAN START: the first warehouse. Rooms around the court (m², editable in
// the calculator) and what the store room has to hold.
// [key, label, icon, default m², colour]
// ---------------------------------------------------------------------
const ROOMS = [
  ["officeArea",    "Office",                 "🗂️", 15, "#a78bfa"],
  ["changingArea",  "Changing room & WC",     "🚿", 34, "#3b82f6"],
  ["lockerArea",    "Lockers",                "🔐", 10, "#14b8a6"],
  ["storeArea",     "Store room",             "📦", 40, "#eab308"],
  ["receptionArea", "Entrance & reception",   "🚪", 10, "#64748b"],
];
// [item, quantity, floor space m²]
const STORE_ITEMS = [
  ["Basketballs on rolling racks", "60 balls · 3 racks", 2.5],
  ["Yoga mats & blocks (wall rack)", "30 sets", 2],
  ["Pickleball nets (portable)", "3 nets", 3],
  ["Badminton posts & nets", "3 courts · 6 posts", 4],
  ["Mini-basketball hoops (adjustable)", "2 hoops", 4],
  ["Volleyball posts & net", "1 set", 2],
  ["Cones, bibs, agility ladders, hurdles", "shelving", 3],
  ["Portable handball / futsal goals", "2 goals", 3],
  ["Floor protection covers", "rolls", 3],
  ["Scrubber-dryer & cleaning kit", "1 machine", 2],
  ["Spare kit, first aid, merchandise stock", "shelving", 3],
];
// Two ways to build the hub. Lean = start small and add the rest once the
// academy is full. Values override the calculator's assumptions.
const BUILDS = {
  lean: { courtArea: 540, courtFitout: 35000, gymArea: 0, gymMembers: 0, supportFitout: 20000, convKit: 6000,
          launch: 5000, legal: 4000, depositMonths: 2, asstCoaches: 1, admin: 0, cleaning: 600, brand: 500 },
  full: { courtArea: 608, courtFitout: 120000, gymArea: 200, gymMembers: 80, supportFitout: 40000, convKit: 24500,
          launch: 10000, legal: 8000, depositMonths: 3, asstCoaches: 2, admin: 2000, cleaning: 1200, brand: 800 },
};
const LEAN_FITOUT = [
  ["Modular sports-floor tiles on the existing concrete (~540 m²)", 15000, "court"],
  ["2 adjustable main hoops + 4 wall-mounted side baskets", 12000, "court"],
  ["LED high-bay lighting", 8000, "court"],
  ["Prefab changing room + 2 WCs/showers", 10000, "rooms"],
  ["30 lockers", 3000, "rooms"],
  ["Office furniture & IT", 2500, "rooms"],
  ["Store-room shelving & racks", 2500, "rooms"],
  ["Entrance, reception desk & signage", 2000, "rooms"],
  ["Starter multi-use kit: badminton & pickleball nets, yoga mats", 6000, "kit"],
];

// ---------------------------------------------------------------------
// Revenue streams catalogue  [name, typical price, in calculator?, description]
// ---------------------------------------------------------------------
const STREAMS = [
  { group: "Kids (the core business)", items: [
    ["Weekly kids coaching", "€50–90 / month", true, "Group sessions twice a week by age group (8–11, 12–14, 15–18). Monthly subscription by direct debit."],
    ["Holiday camps", "€150–250 / week", true, "Full-day camps in the summer, Easter, half-term and Christmas holidays. High margin, and they use daytime court hours that would otherwise be empty."],
    ["Before-school & mini-kids sessions", "€8–10 / session", true, "Early-bird training (06:00) and mini-basketball for ages 4–7. These feed the main academy. Part of the Timetable."],
    ["Private 1:1 & small-group coaching", "€35–60 / hour", true, "Skills, shooting and position-specific work."],
    ["Elite / development squads", "€90–150 / month", false, "Selective teams with extra training and tournaments. Builds the academy's reputation."],
    ["School partnerships (PE & after-school clubs)", "€40–70 / hour, paid by school", true, "Schools hire the court for PE during the day, or our coaches run clubs at the school."],
    ["Girls-only programmes", "Same as kids coaching", false, "Few providers offer these, and grant funders like them."],
    ["Birthday parties", "€180–300 / party", true, "Weekend basketball parties."],
  ]},
  { group: "Multi-use court (off-peak hours)", items: [
    ["Women's yoga & wellbeing", "€8–12 / person", true, "Mats on the sprung floor in the morning. A freelance instructor is paid per session."],
    ["Seniors active sessions", "€3–6 / person (often council-funded)", true, "Walking basketball, mobility and balance classes. Mornings are quiet, and councils fund these."],
    ["Dance academy rental", "€40–60 / hour", true, "Dance schools rent the sprung floor for practice. Add portable mirrors."],
    ["Badminton & pickleball", "€6–8 / person", true, "Portable nets turn one basketball court into 3 badminton or 3 pickleball courts."],
    ["Handball, volleyball, futsal club hire", "€60–70 / hour", true, "Clubs hire the court for training. A full handball or futsal pitch is bigger than a basketball court, so this suits training and small-sided games."],
    ["Corporate events", "€150+ / hour", true, "Team-building and company leagues in quiet afternoon hours."],
  ]},
  { group: "Fitness zone (CrossFit-style circuit training)", items: [
    ["Functional fitness memberships", "€50–90 / month", true, "Circuit and strength classes using rigs, barbells, dumbbells, rowers and bikes."],
    ["Teen strength & conditioning", "€30–50 / month add-on", false, "Supervised athletic training for players aged 14–18."],
    ["Personal training", "€40–70 / session", false, "Freelance trainers pay rent or a revenue share."],
  ]},
  { group: "Adults", items: [
    ["Adult training sessions", "€35–60 / month", true, "Evening skills and fitness sessions for beginners and returners."],
    ["Pickup games (drop-in)", "€5–10 / visit", true, "Open runs in the evenings. They build community."],
    ["Adult leagues (5×5 and 3×3)", "€300–600 / team / season", true, "Team entry fees plus referee fees."],
    ["Parent & child sessions", "€10–15 / session", false, "Weekend family sessions."],
  ]},
  { group: "Partner venues (asset-light network)", items: [
    ["Programmes at schools & community centres", "€5–10 / child / session", false, "Our coaches, curriculum and software at partner venues, on a profit-share basis. See the Partner venues tab."],
    ["Coach staffing for other organisations", "€30–45 / coach hour", false, "Hire out coaches trained at the hub to schools, clubs and councils."],
    ["Software licence for venues", "€30–100 / venue / month", false, "Booking, payments and attendance software for partner venues."],
  ]},
  { group: "Facility, events & products", items: [
    ["Court rental (hire to others)", "€40–80 / hour", true, "Unused court hours rented to clubs and groups."],
    ["Tournaments & showcase events", "€20–40 / player or €150+ / team", false, "Youth tournaments, 3×3 events and showcases."],
    ["Coach education & certification", "€100–300 / participant", false, "Courses for parent-coaches, PE teachers and junior coaches, run at the hub."],
    ["Local sponsorship", "€2k–20k / year per sponsor", true, "Kit, court banners and naming rights."],
    ["Merchandise & kit", "30–50% margin", false, "Academy jerseys, hoodies and balls."],
    ["Online / at-home training", "€5–15 / month", false, "An app or video programme for home practice."],
    ["Café & vending", "Small but steady", false, "Parents wait during sessions."],
  ]},
  { group: "Funding (non-trading income)", items: [
    ["Grants (EU, national, city)", "€10k–400k per project", false, "Erasmus+ Sport, national sport capital grants, city youth funds. See the EU funding tab."],
    ["Free places funded by councils or charities", "Per child", false, "Places for low-income kids. These fill spare capacity and make grant applications stronger."],
  ]},
];

// ---------------------------------------------------------------------
// EU / national / private funding programmes
// ---------------------------------------------------------------------
const FUNDS = [
  { name: "Erasmus+ Sport: Small-scale partnerships", type: "eu", amount: "€30,000 or €60,000", src: ["erasmus_ss", "erasmus_ev"],
    pts: ["A fixed lump sum: you choose €30k or €60k", "Runs 6–24 months", "Needs at least 2 organisations from 2 different countries",
          "Aimed at grassroots work: youth participation, inclusion, girls in sport", "The 2026 deadline was 5 March 2026. The next round is expected early 2027"] },
  { name: "Erasmus+ Sport: Cooperation partnerships", type: "eu", amount: "€120k / €250k / €400k", src: ["erasmus_cp", "erasmus"],
    pts: ["Lump sum in one of 3 sizes", "Runs 12–36 months", "Needs at least 3 organisations from 3 countries",
          "For example, a shared youth coaching method across academies in 3 cities"] },
  { name: "Erasmus+ Sport: Not-for-profit European sport events", type: "eu", amount: "up to ~€200k–€450k", src: ["erasmus_ev"],
    pts: ["Local events ~€200k / €300k; Europe-wide events ~€450k", "Large-scale events €1–2M (needs partners in 15 countries)",
          "Could fund an international youth 3×3 tournament"] },
  { name: "Erasmus+: Mobility of sport staff", type: "eu", amount: "Travel + daily allowance per person", src: ["erasmus"],
    pts: ["Coaches train or job-shadow at clubs abroad", "Paid at fixed travel and daily rates", "A cheap way to raise coaching standards"] },
  { name: "European Regional Development Fund (ERDF)", type: "eu", amount: "Varies; often 40–85% of project cost", src: ["eu_portal"],
    pts: ["Run by national or regional authorities", "Can fund sport facilities in urban regeneration", "Relevant to the warehouse hub fit-out"] },
  { name: "European Social Fund Plus (ESF+)", type: "eu", amount: "Varies by country call", src: ["eu_portal"],
    pts: ["Funds social inclusion and youth programmes", "Can pay for free places and outreach in low-income areas", "Fits the partner-venue model in deprived neighbourhoods"] },
  { name: "InvestEU / EIF-backed microloans & SME loans", type: "eu", amount: "Loans, amount set by the local bank", src: ["eu_portal"],
    pts: ["The EU guarantees loans that local banks make to small businesses", "Easier approval, less collateral needed", "A loan, not a grant"] },
  { name: "Ireland: Sports Capital & Equipment Programme", type: "nat", amount: "up to €200k local · €70k equipment", src: ["ie_scep"],
    pts: ["Latest published caps (2023 round): €200k local, €500k regional, €70k equipment-only",
          "Clubs without their own facility can apply for equipment-only grants", "For non-profit clubs. Check the current round on the OSCAR portal"] },
  { name: "France: Agence nationale du Sport (ANS)", type: "nat", amount: "Typically €1k–€30k+ per club project", src: ["est"],
    pts: ["Club grants through the federation's sport project scheme (PSF)", "Priority for youth, girls and priority neighbourhoods (QPV)", "Separate facility grants"] },
  { name: "Spain, Germany, Italy & others: national and city sport grants", type: "nat", amount: "Varies", src: ["est"],
    pts: ["Spain: CSD, regions and city councils (ayuntamientos)", "Germany: state (Land) and city funding for registered clubs (e.V.)",
          "Italy: Sport e Salute and regional calls", "Most cities have a youth sport fund"] },
  { name: "Private: sponsors, foundations, brand programmes", type: "pri", amount: "€2k–€50k+", src: ["est"],
    pts: ["Company community funds, local foundations", "Sports brands' grassroots programmes", "Community programmes run by federations and pro clubs"] },
];

// ---------------------------------------------------------------------
// City scoring (demand side)
// ---------------------------------------------------------------------
const FACTORS = [
  { k: "density",  label: "Population density",         w: 20, why: "More people within walking distance of one academy", src: "city_density" },
  { k: "youth",    label: "Share of kids aged 8–18",    w: 20, why: "More potential students per resident", src: "eurostat_pop" },
  { k: "schools",  label: "Near schools",               w: 15, why: "Kids come straight from school; recruitment and partnerships", src: "est" },
  { k: "resid",    label: "Residential / family areas", w: 15, why: "Families live close by, so trips are short", src: "est" },
  { k: "interest", label: "Basketball interest",        w: 10, why: "How popular basketball already is", src: "est" },
  { k: "gap",      label: "Supply gap (few academies)", w: 10, why: "Demand that isn't met yet: waiting lists, few clubs", src: "est" },
  { k: "pay",      label: "Ability to pay",             w: 5,  why: "Household income to afford monthly fees", src: "est" },
  { k: "cost",     label: "Low operating cost",         w: 5,  why: "Cheaper rent and salaries (10 = cheapest)", src: "eurostat_lc" },
];
// Tier 1 = big, expensive metros (shown last: too costly for the first hub).
// Tier 2 = mid-size cities; Tier 3 = smaller cities. Dublin removed on request.
//  name, country code, tier, density, youth, schools, resid, interest, gap, pay, cost, why
const CITY_DATA = [
  // ---- Tier 2 ----
  ["Valencia",     "ES", 2, 8, 5, 8, 8, 9, 4, 6, 7, "Spain's 3rd city: dense family neighbourhoods, and Valencia Basket's L'Alqueria academy shows huge youth demand. Rents far below Madrid or Barcelona."],
  ["Lyon",         "FR", 2,10, 7, 9, 7, 9, 5, 7, 5, "Very dense, young, and home to ASVEL (Tony Parker's club). Strong demand, but French coaching-licence rules apply."],
  ["Bologna",      "IT", 2, 6, 4, 7, 7,10, 5, 7, 6, "Italy's “Basket City” (Virtus and Fortitudo). Basketball is part of the culture and incomes are good, though the population is older."],
  ["Thessaloniki", "GR", 2,10, 4, 8, 7, 9, 4, 4, 9, "Extremely dense and basketball-mad (PAOK, Aris), with very low costs. Lower incomes cap fees."],
  ["Bilbao",       "ES", 2, 9, 4, 8, 7, 8, 5, 8, 5, "Dense, high Basque incomes and Bilbao Basket. A good balance of ability to pay and demand."],
  ["Kaunas",       "LT", 2, 3, 6, 6, 7,10, 3, 5, 9, "Home of Žalgiris, Europe's most basketball-obsessed city, and cheap. Already well served by clubs."],
  ["Málaga",       "ES", 2, 4, 5, 7, 7, 9, 5, 5, 7, "Unicaja basketball culture plus fast-growing expat and tech families. Lower costs than the big two."],
  ["Lille",        "FR", 2, 8, 7, 8, 7, 7, 6, 5, 7, "Dense student and family city near Belgium, young population, moderate costs."],
  ["Nantes",       "FR", 2, 7, 7, 7, 8, 7, 6, 6, 6, "Fast-growing family city with good schools and a gap in private youth academies."],
  ["Zaragoza",     "ES", 2, 3, 5, 7, 8, 8, 6, 6, 8, "Big, affordable city with Casademont Zaragoza and room for a modern academy."],
  ["Porto",        "PT", 2, 9, 4, 7, 6, 6, 7, 5, 7, "Dense and affordable, with FC Porto basketball. Few private academies yet."],
  ["Wrocław",      "PL", 2, 5, 6, 7, 7, 6, 7, 6, 8, "Fast-growing, young families and low costs. Basketball is rising."],
  ["Gdańsk",       "PL", 2, 3, 6, 6, 7, 6, 7, 6, 7, "Tri-city area (with Sopot's Trefl), young families and low costs."],
  ["Eindhoven",    "NL", 2, 6, 6, 7, 7, 5, 8, 8, 5, "Tech hub with high incomes and an international community. Very few basketball clubs."],
  ["Bonn",         "DE", 2, 5, 5, 7, 8, 8, 6, 8, 5, "Telekom Baskets, wealthy families, and cheaper than Cologne or Düsseldorf."],
  ["Cork",         "IE", 2, 3,10, 7, 8, 5, 9, 8, 5, "Ireland's young population at a lower cost than Dublin. Scarce indoor courts and clubs with waiting lists."],
  ["Tallinn",      "EE", 2, 3, 5, 5, 6, 8, 6, 6, 7, "Digital-first, very easy to start a company, and basketball is popular, but the market is small (~460k people)."],
  ["Vilnius",      "LT", 2, 2, 6, 4, 5,10, 2, 4, 8, "Basketball is the national religion, but the city is spread out and already full of clubs."],
  // ---- Tier 3 ----
  ["Vitoria-Gasteiz","ES",3, 3, 5, 6, 7,10, 3, 8, 7, "Baskonia's home, one of Europe's most basketball-mad cities. High incomes and cheap space, but small."],
  ["Granada",      "ES", 3, 4, 5, 6, 7, 8, 6, 4, 8, "University city with Covirán Granada and very low costs."],
  ["Limerick",     "IE", 3, 3,10, 6, 7, 6, 8, 6, 6, "Strong basketball tradition, very young population, much cheaper than Dublin."],
  ["Le Mans",      "FR", 3, 5, 6, 6, 7, 8, 6, 5, 8, "Le Mans Sarthe Basket, affordable and family-heavy."],
  ["Limoges",      "FR", 3, 3, 5, 6, 6, 9, 6, 4, 9, "CSP Limoges, a historic basketball city, and very cheap."],
  ["Bamberg",      "DE", 3, 4, 5, 6, 7, 9, 5, 7, 7, "A small German basketball town (Brose Bamberg) with good incomes."],
  ["Ulm",          "DE", 3, 3, 5, 6, 7, 9, 4, 8, 6, "ratiopharm Ulm's famous youth academy proves demand. Wealthy, but well served."],
  ["Varese",       "IT", 3, 3, 4, 6, 7, 9, 5, 7, 7, "A historic Italian basketball city near Milan, at a fraction of the cost."],
  ["Groningen",    "NL", 3, 4, 6, 6, 6, 7, 6, 7, 6, "Donar Groningen and a big student population. Cheapest Dutch option."],
  ["Tartu",        "EE", 3, 4, 5, 6, 6, 8, 5, 5, 8, "University city with a strong basketball club and very low costs."],
  // ---- Tier 1: too expensive for now ----
  ["Paris",     "FR", 1,10, 7, 9, 7, 8, 5, 8, 3, "Very dense and young, and basketball is booming, but rents and wages are among Europe's highest."],
  ["Barcelona", "ES", 1, 9, 5, 8, 7, 9, 3, 6, 5, "Strong basketball culture but intense competition and high rents."],
  ["Athens",    "GR", 1, 9, 4, 8, 6, 9, 3, 4, 8, "Basketball-mad and cheap, but a huge, competitive metro."],
  ["Madrid",    "ES", 1, 6, 5, 8, 8, 9, 3, 6, 6, "Large family suburbs, but a mature, crowded market with high rents."],
  ["Amsterdam", "NL", 1, 6, 6, 7, 6, 5, 7, 9, 3, "High incomes, but very expensive and hall space is scarce."],
  ["Berlin",    "DE", 1, 5, 5, 7, 7, 7, 6, 7, 6, "Growing interest after Germany's 2023 World Cup win, but a big, costly market."],
  ["Munich",    "DE", 1, 5, 5, 7, 7, 6, 6, 9, 3, "Wealthy families, but very high costs."],
  ["Milan",     "IT", 1, 7, 4, 7, 6, 7, 5, 7, 4, "Olimpia Milano tradition, but expensive with an older population."],
  ["Warsaw",    "PL", 1, 4, 6, 6, 7, 6, 7, 5, 8, "Fast-growing, but rents are rising quickly."],
  ["Lisbon",    "PT", 1, 6, 4, 6, 6, 5, 7, 5, 6, "Popular with expats, but rents have soared."],
];

// ---------------------------------------------------------------------
// Ease of starting a business, by country (supply side)
// labour = Eurostat 2025 hourly labour cost, whole economy (€/hour)
// scores 1–10 (10 = easiest / best): speed, cost (setup cost + minimum capital),
// tax, reg (rules for running paid youth sport), english
// ---------------------------------------------------------------------
const BIZ_FACTORS = [
  { k: "speed",   label: "Speed to register",          w: 20, src: "est" },
  { k: "cost",    label: "Setup cost & minimum capital", w: 15, src: "est" },
  { k: "tax",     label: "Corporate tax",               w: 15, src: "taxfound" },
  { k: "labour",  label: "Labour cost (lower = better)", w: 20, src: "eurostat_lc" },
  { k: "reg",     label: "Rules for paid youth sport",   w: 20, src: "est" },
  { k: "english", label: "Working in English",          w: 10, src: "est" },
];
const COUNTRIES = [
  { code: "EE", name: "Estonia", city: "Tallinn", labour: 21.1,
    entity: "OÜ (private limited)", time: "~1 working day, fully online", setup: "~€265 state fee", capital: "Effectively none (symbolic)",
    tax: "0% on reinvested profit; ~22% only when profit is paid out", s: { speed: 10, cost: 9, tax: 9, reg: 8, english: 8 },
    programmes: ["e-Residency: run the company online from anywhere", "Startup Estonia", "Enterprise Estonia (EAS) grants"],
    challenges: ["Small market: Tallinn has ~460k people", "Few indoor halls outside schools", "Winters drive demand indoors (which helps you)"],
    src: ["estonia_reg", "eurostat_lc", "taxfound"] },
  { code: "PT", name: "Portugal", city: "Lisbon", labour: 19.4,
    entity: "Lda (private limited)", time: "Same day with Empresa na Hora", setup: "~€220–360", capital: "€1 symbolic",
    tax: "~19–20% base, up to ~30% with surcharges", s: { speed: 9, cost: 8, tax: 5, reg: 7, english: 7 },
    programmes: ["Empresa na Hora (company in an hour)", "IAPMEI support for small businesses", "Startup Visa for non-EU founders"],
    challenges: ["Lower household incomes cap fees", "Basketball is a minor sport", "Tax and social-security admin can be slow for foreigners (NIF needed)"],
    src: ["pt_hora", "eurostat_lc", "taxfound"] },
  { code: "PL", name: "Poland", city: "Warsaw", labour: 19.1,
    entity: "sp. z o.o.", time: "~1–3 days online (S24 system)", setup: "Low (online)", capital: "PLN 5,000 (~€1.2k)",
    tax: "19% (9% for small taxpayers)", s: { speed: 8, cost: 7, tax: 7, reg: 7, english: 6 },
    programmes: ["‘Ulga na start’: no social insurance (ZUS) contributions for the first 6 months (sole traders)", "PARP (Polish Agency for Enterprise Development) programmes"],
    challenges: ["Polish-language admin and contracts", "Labour costs are rising fast", "Lower fee levels than Western Europe"],
    src: ["eurostat_lc", "taxfound", "est"] },
  { code: "GR", name: "Greece", city: "Athens", labour: 18.2,
    entity: "IKE (private company)", time: "~1–3 days via the GEMI one-stop shop", setup: "Low", capital: "€1",
    tax: "22%", s: { speed: 7, cost: 9, tax: 6, reg: 6, english: 7 },
    programmes: ["Elevate Greece (startup registry)", "Hellenic Development Bank loans"],
    challenges: ["Slow public administration and permits", "Lower incomes", "Lots of established basketball clubs"],
    src: ["eurostat_lc", "taxfound", "est"] },
  { code: "IE", name: "Ireland", city: "Cork / Limerick", labour: 44.2,
    entity: "LTD (private company)", time: "~5–10 working days (CRO, online)", setup: "~€50 online filing", capital: "None",
    tax: "12.5% on trading profit", s: { speed: 7, cost: 9, tax: 10, reg: 6, english: 10 },
    programmes: ["Local Enterprise Offices: grants, mentoring, start-your-own-business courses", "Enterprise Ireland", "Sports Capital & Equipment Programme (via a non-profit club)"],
    challenges: ["Garda vetting is required for every coach and volunteer working with kids (plan 2–4 weeks per person)", "High rent and insurance costs", "Very few indoor courts available"],
    src: ["ie_cro", "ie_vetting", "eurostat_lc", "taxfound"] },
  { code: "NL", name: "Netherlands", city: "Amsterdam", labour: 47.9,
    entity: "BV (private company)", time: "~1 week (needs a notary)", setup: "~€500–1,000 notary", capital: "€0.01",
    tax: "19% up to €200k profit, 25.8% above", s: { speed: 7, cost: 6, tax: 6, reg: 8, english: 9 },
    programmes: ["KVK (Chamber of Commerce) start-up support", "RVO (Netherlands Enterprise Agency) schemes"],
    challenges: ["Highest labour cost of these countries (€47.9/h)", "Halls are scarce and expensive", "Strong, cheap volunteer club culture"],
    src: ["eurostat_lc", "eurostat_news", "taxfound"] },
  { code: "ES", name: "Spain", city: "Madrid / Barcelona", labour: 26.4,
    entity: "SL (private limited)", time: "~1–4 weeks (CIRCE online + notary)", setup: "~€300–1,000", capital: "€1 (since 2022)",
    tax: "25% (15% for new companies' first profitable years)", s: { speed: 5, cost: 7, tax: 6, reg: 5, english: 5 },
    programmes: ["ENISA start-up loans", "Startups Law (Ley de Startups) tax benefits"],
    challenges: ["Coaching qualifications are regulated differently in each region (e.g. Catalonia)", "Foreigners need an NIE first", "Mature, competitive basketball market"],
    src: ["eurostat_lc", "taxfound", "est"] },
  { code: "IT", name: "Italy", city: "Milan", labour: 32.0,
    entity: "SRL / SRLS", time: "~1–2 weeks (notary)", setup: "~€1,000–2,500", capital: "€1 (SRLS)",
    tax: "~24% IRES + ~3.9% IRAP", s: { speed: 5, cost: 5, tax: 4, reg: 5, english: 4 },
    programmes: ["Invitalia programmes (e.g. zero-interest loans for new businesses)", "Amateur sport entities (ASD/SSD) get tax benefits once registered with the national registry"],
    challenges: ["Heavy bureaucracy and notary costs", "Sport entities must register in the national amateur sport registry to get the benefits", "Ageing population, so fewer kids"],
    src: ["eurostat_lc", "taxfound", "est"] },
  { code: "FR", name: "France", city: "Paris", labour: 44.3,
    entity: "SAS / SARL", time: "~1–2 weeks (online one-stop shop)", setup: "~€250–500", capital: "€1",
    tax: "25% (15% on the first ~€42.5k for small companies)", s: { speed: 6, cost: 8, tax: 6, reg: 3, english: 4 },
    programmes: ["Bpifrance loans & guarantees", "ACRE: reduced social charges for new business founders", "Agence nationale du Sport grants"],
    challenges: ["Every paid coach needs a recognised diploma and a professional card (Code du sport L212-1), the strictest rule in this list", "High employer social charges", "French-language admin"],
    src: ["fr_coach", "fr_coach2", "eurostat_lc", "taxfound"] },
  { code: "DE", name: "Germany", city: "Berlin / Munich", labour: 45.0,
    entity: "GmbH (or UG from €1)", time: "~2–4 weeks (notary + register)", setup: "~€800–1,500", capital: "€25,000 for a GmbH (half paid in)",
    tax: "~30% (corporate tax + trade tax)", s: { speed: 4, cost: 3, tax: 4, reg: 6, english: 6 },
    programmes: ["KfW start-up loans", "Start-up grant (Gründungszuschuss) for founders who were unemployed"],
    challenges: ["Youth sport is dominated by non-profit clubs (e.V.) with very low fees", "Municipal hall time usually goes to registered clubs first", "Bureaucracy and German-language admin"],
    src: ["eurostat_lc", "taxfound", "est"] },
];

// ---------------------------------------------------------------------
// PARTNER VENUES model (asset-light network)
// ---------------------------------------------------------------------
const VENUE_TYPES = [
  ["🏫", "Schools (incl. vacant or underused)", "Sports halls sit empty after 16:00, at weekends and for ~13 weeks of holidays a year. Closed or merged schools often keep a usable gym."],
  ["🏘️", "Community centres", "Multi-purpose halls run by councils or charities, often with low daytime and weekend use."],
  ["🎓", "Colleges & universities", "Large sports halls with spare hours outside term time and at weekends."],
  ["🏀", "Public & outdoor courts", "Council-owned courts with no programme running on them. Add lights and a schedule."],
  ["🏊", "Swimming pools", "Lane hire for learn-to-swim and fitness programmes run on the same booking platform."],
  ["🏓", "Table tennis & small sports halls", "Small spaces that suit table tennis, mini-basketball, yoga and fitness classes."],
  ["⛪", "Parish & church halls", "Common in every neighbourhood and often empty most of the week."],
  ["🏬", "Vacant buildings (‘meanwhile use’)", "Empty shops and warehouses used temporarily at low rent while the owner waits for a long-term tenant."],
];
const WE_BRING = [
  ["🧑‍🏫", "Trained coaches & support staff", "Recruited and certified at the hub's coach academy."],
  ["📋", "Programmes & curriculum", "Age-group sessions, camps, leagues and wellbeing classes ready to run."],
  ["💻", "Booking, payments & attendance software", "Parents book and pay online; the venue gets a live usage and revenue dashboard."],
  ["🛡️", "Safeguarding, vetting & insurance", "Background checks and child-protection policies, plus our own insurance."],
  ["📣", "Marketing & enrolment", "We fill the sessions: school outreach, social media, trial days."],
  ["🏀", "Equipment investment", "Balls, portable hoops, nets and mats, owned by us and stored on site."],
];
const VENUE_BRINGS = [
  ["🏟️", "The space", "Hall, court or room at agreed hours."],
  ["💡", "Utilities & access", "Heating, lighting, caretaker, opening and locking."],
  ["🤝", "Local trust", "Their families, pupils and community reach."],
];
const DEAL_TYPES = [
  ["Revenue share", "We keep ~70%, the venue gets ~30% of session revenue. No rent, no risk for the venue. The default model."],
  ["Low fixed rent + small share", "For venues that need predictable income: a low hourly rent plus 10–15% of revenue."],
  ["Community-hours swap", "Free or subsidised sessions for local kids in exchange for free space. Easy for councils and schools to approve, and strong for grant applications (ESF+, Erasmus+)."],
];
const ROADMAP = [
  { phase: "Phase 1", when: "Months 0–12", title: "The Hub: one warehouse academy",
    what: ["Lease a small warehouse: 1 court, office, small changing room, lockers and a big store room (fitness zone added later)", "Launch the kids academy (ages 8–18) and the multi-use timetable", "Prove the model: reach break-even before spending more"],
    kpi: "150+ kids enrolled · break-even occupancy reached" },
  { phase: "Phase 2", when: "Months 6–18", title: "Coach academy",
    what: ["Train and certify coaches in-house using the hub's own court", "Write the curriculum and session plans", "Build a bench of coaches ready to staff new sites"],
    kpi: "10+ certified coaches · curriculum v1" },
  { phase: "Phase 3", when: "Months 12–24", title: "Partner venues",
    what: ["Sign 5–10 schools and community centres within ~5 km of the hub", "Profit-share deals; our software, coaches and programmes", "Partner venues feed talented kids to the hub's elite squads"],
    kpi: "10 venues · 300+ kids across the network" },
  { phase: "Phase 4", when: "Years 2–3", title: "City network",
    what: ["20–30 partner venues and a 2nd hub in the same city", "Leagues and events across the network", "First Erasmus+ partnership with a club in another country"],
    kpi: "1,000+ kids · network profitable" },
  { phase: "Phase 5", when: "Years 3–5", title: "Across Europe",
    what: ["Copy the hub + partner-venue model into the top cities (see Best cities and Start a business)", "Local hub manager, shared software and coach academy", "Cross-country Erasmus+ projects and tournaments"],
    kpi: "5 cities · 5,000+ kids" },
];

// ---------------------------------------------------------------------
// Every parameter / requirement the owner has asked for so far,
// de-duplicated. [requirement, where it lives on the site]
// ---------------------------------------------------------------------
const PARAMS = [
  { group: "Website, hosting & quality", items: [
    ["A real website with cards that show the key numbers", "Whole site"],
    ["Hosted on GitHub, nothing kept locally, editable from anywhere", "GitHub repo + GitHub Pages"],
    ["A real backend (Supabase): save plans to the cloud and share them", "☁️ Cloud button in the header"],
    ["Tabs to move between sections", "Top navigation (grouped)"],
    ["A pitch deck that shows the whole plan clearly", "Deck"],
    ["A list of every parameter asked for, duplicates removed", "Parameters (this tab)"],
    ["Very detailed, beautiful and easy to understand; reviewed as an expert", "Whole site; expert recommendations in Mission"],
    ["A source for every figure, shown when you click", "“ⓘ Sources” buttons throughout"],
    ["Heavy data hidden by default, expandable in one click", "Collapsible sections throughout"],
  ]},
  { group: "Mission & strategy", items: [
    ["A clear, systematic mission", "Mission"],
    ["Start with a small warehouse hub first", "Mission roadmap · Calculator"],
    ["Use the hub to train coaches and run a coaching programme", "Mission: Phase 2"],
    ["Rent out trained coaches and staff", "Revenue streams · Partner venues"],
    ["Then expand to schools and community centres, raising engagement", "Mission: Phase 3 · Partner venues"],
    ["Eventually spread across Europe", "Mission: Phase 5 · Best cities · Start a business"],
  ]},
  { group: "Calculator: levers", items: [
    ["Several levers, and every card updates", "Calculator"],
    ["Number of academies (start with 1)", "Calculator"],
    ["Occupancy", "Calculator"],
    ["Price charged to students", "Calculator"],
    ["Cost to acquire a student", "Calculator"],
    ["Students per coach on one court (20–40)", "Calculator"],
  ]},
  { group: "Calculator: metrics", items: [
    ["Total investment needed", "Calculator · Mission · Deck"],
    ["Total cost to set up", "Calculator: investment breakdown"],
    ["Total area / space", "Calculator: space cards"],
    ["Every metric needed to start the business", "Calculator: cards, P&L, unit economics, sensitivity chart"],
  ]},
  { group: "Business model", items: [
    ["Start with one basketball academy", "Calculator default"],
    ["A CrossFit-style circuit-training zone (machines, dumbbells, bars)", "Calculator: fitness zone"],
    ["Target age group: kids 8–18", "Throughout"],
    ["Every possible revenue stream (pickup, adult training, kids coaching…)", "Revenue streams"],
    ["Partner-venue model: vacant schools, community centres, colleges, courts, pools, table tennis", "Partner venues"],
    ["We provide the investment, programmes, software and tech support, on a profit-sharing basis", "Partner venues: deal structures"],
    ["Hire talented coaches and support staff", "Partner venues · Mission"],
    ["Start lean: a small warehouse with a court, office, small changing room, lockers and a big store room for all equipment", "Hub calculator: Lean start build, floor plan, store room"],
    ["Investor-grade view of the money needed, month by month", "Hub calculator: 24-month cash flow"],
    ["Every number editable, saved, and linked numbers update", "✏️ edit fields in the calculator, timetable, kit lists, store room, sports, cities, countries, partners"],
  ]},
  { group: "Multi-use court & timetable", items: [
    ["Convert the court for other uses: badminton nets, yoga, dance, handball, pickleball", "Timetable"],
    ["Rent the court to dance academies", "Timetable"],
    ["A timetable tab that shows utilisation", "Timetable"],
    ["06–07 kids before school · 07–08 little kids · 08–09 women's yoga · 09–10 seniors", "Timetable: weekday mornings"],
    ["Afternoon badminton & handball · evening pickleball · pickup basketball after 16:00–17:00", "Timetable: afternoons and evenings"],
    ["Show it in a business way: what we can do at each level", "Timetable: revenue per hour, utilisation, mix"],
  ]},
  { group: "Why basketball", items: [
    ["Justify basketball over other academies", "Why basketball"],
    ["One court + one coach = 20–40 students", "Why basketball"],
    ["Squash, badminton, padel, pickleball: area, investment, investment per area", "Why basketball"],
    ["A clear visual of the space each sport needs", "Why basketball: to-scale plans"],
  ]},
  { group: "Funding & location", items: [
    ["What EU funding is available, and how much", "EU funding"],
    ["Top 5 EU cities and why, with the parameters used (tier 2 & 3 cities only)", "Cities"],
    ["Remove Dublin", "Cities (Cork and Limerick kept as cheaper Irish options)"],
    ["Focus on tier 2 & 3 cities; tier 1 cities are too expensive, so they're listed last", "Cities ranking"],
    ["Parameters: population density, near schools, near residential areas", "Best cities"],
    ["Which countries/cities are easiest to start a business in", "Start a business"],
    ["Business support programmes in each country", "Start a business"],
    ["The challenges in each place", "Start a business"],
  ]},
];
const DUPLICATES = [
  "“Create a new website / basketball academy planner” (asked twice; it's the same site)",
  "“Total investment needed” = “how much it will cost” = “the money that is needed”",
  "“Cards” and “cards with labels”",
  "“Levers” (asked in three messages)",
  "“Occupancy” (listed twice in one message)",
  "“Price charged” = “how much we charge the students”",
  "“One basketball academy, two…” = “let's begin with one basketball academy”",
  "“Space” = “total area”; “area required” = “how much area it is showing up”",
  "“Kids coaching centres” = the core kids coaching stream",
  "“Pickup games” (revenue streams) = “pickup basketball” (timetable): one activity, shown in both places",
  "“Detailed”, “beautiful”, “easy to understand”, “look at it as an expert” (asked twice) → one quality standard",
  "“Show the source of information” = “once you click on it, source of information”",
  "“How easy it is to start a business” = “which cities are top easy to start a business”",
  "“Spread across Europe” (strategy) = the Europe-wide expansion already in Best cities",
  "“Schools / community centres” appear in both the venue list and the expansion plan: one partner-venue model",
];
