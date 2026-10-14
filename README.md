# 🏀 Basketball Academy Planner

Strategy and planning site for a network of youth basketball academies (ages 8–18) across Europe:
a warehouse **hub** that trains coaches and runs a multi-use court all day, then an asset-light network
of **partner venues** (schools, community centres, colleges, courts) on a profit-share basis.

**Live site:** https://anuroopbs.github.io/basketball-academy-planner/

## Tabs

| Group | Tab | What it shows |
|---|---|---|
| Strategy | Mission | Mission, hub-first strategy, flywheel, 5-phase roadmap, expert review & risks |
| Strategy | Partner venues | Spaces we activate, who brings what, deal structures, network calculator, hub vs network |
| Strategy | Why basketball | Same floor space, 5 sports, drawn to scale: kids per coach, area, investment |
| Numbers | Hub calculator | 12 levers + scenarios → investment, P&L, profit-vs-occupancy chart, area, unit economics |
| Numbers | Timetable | Editable weekly court timetable (yoga, seniors, badminton, dance…) → utilisation & revenue per hour |
| Numbers | Revenue streams | Every possible revenue stream with typical prices |
| Market | Best cities | Top EU cities by demand, with adjustable factor weights |
| Market | Start a business | Ease of starting a business by country, programmes, challenges, launch matrix |
| Market | EU funding | Erasmus+ Sport, ERDF, ESF+, InvestEU and national schemes with amounts |
| Pitch | Deck | 15-slide pitch deck built from the live numbers |
| Pitch | Parameters | Every requirement asked for so far, de-duplicated |

## Editing

Plain HTML/CSS/JS, no build step. Edit straight on GitHub (press `.` in the repo for the web editor).
GitHub Pages redeploys in about a minute.

- `assets/data.js`: all content, numbers and **sources** (every outside figure has a source key)
- `assets/app.js`: calculators, charts, timetable, deck
- `assets/styles.css`: styling
- `index.html`: page structure. After editing any asset, bump the `?v=` number on its link so browsers fetch the new file

Figures without an outside source are labelled as planner estimates and can be changed in the site.

## Backend (Supabase)

- Project: **Basketball Academy Planner** (`hzvuzhrdxenmotuehnpz`, EU · Ireland, free plan)
- Feature: **☁️ Save to cloud** in the header saves the whole plan (levers, timetable, weights) and gives
  a **view link** (`?s=<id>`, read-only copy, safe to share) and a private **edit link** (`?s=<id>&k=<token>`, autosaves).
- Security: the `scenarios` table is closed to the API; the site can only call 4 functions
  (`create_scenario`, `get_scenario`, `update_scenario`, `delete_scenario`). Update/delete require the edit token.
  Loaded data is coerced to numbers / known keys before rendering. Schema: `supabase/001_scenarios.sql`.
- Code: `assets/cloud.js`. The publishable key in it is meant to be public.

## Hosting

Front end: **GitHub Pages** (free, redeploys on every push to `main`). Back end: **Supabase**.
No server to run.
