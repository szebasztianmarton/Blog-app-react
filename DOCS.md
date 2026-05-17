# Blog App — Részletes dokumentáció

> Ez a dokumentum a Blog App belső felépítését, működését és bővítését tárgyalja. A gyors telepítéshez és a követelmény-mátrixhoz lásd a [README.md](README.md)-t.

## Tartalom

1. [Áttekintés](#1-áttekintés)
2. [Architektúra](#2-architektúra)
3. [Adatfolyam](#3-adatfolyam)
4. [Backend modulok](#4-backend-modulok)
5. [Frontend komponensek](#5-frontend-komponensek)
6. [Design rendszer (editorial brutalism)](#6-design-rendszer-editorial-brutalism)
7. [Adatbázis](#7-adatbázis)
8. [API referencia](#8-api-referencia)
9. [Konfiguráció és környezeti változók](#9-konfiguráció-és-környezeti-változók)
10. [Tesztelési stratégia](#10-tesztelési-stratégia)
11. [CI/CD pipeline](#11-cicd-pipeline)
12. [Konténerizáció](#12-konténerizáció)
13. [Fejlesztői útmutató](#13-fejlesztői-útmutató)
14. [Hibakeresés (troubleshooting)](#14-hibakeresés-troubleshooting)

---

## 1. Áttekintés

A Blog App egy editorial hangulatú, kategorizált blogbejegyzéseket kezelő webalkalmazás, amely a következő funkciókat kínálja:

- **Listanézet**: az összes blog megjelenítése responsive grid-ben, brutalist card layouttal
- **Kereső + kategória szűrés**: a listán élőben szűrhet a felhasználó, dedikált toolbar a Home hero alatt
- **Részletek nézet**: egy konkrét blog editorial layoutban (oversized headline, pull-quote lede, pre-formatted body)
- **Új bejegyzés**: brutalist form inline validációval, kötelező mezők piros csillaggal
- **Törlés**: blog eltávolítása a részletek nézetből, megerősítő dialog
- **Theme toggle**: light és dark mode, system preference alapján induló, manuális override-bal, FOUC-mentes inicializálással
- **Állapot-UX**: Skeleton (loading), EmptyState (üres lista vagy szűrés), ErrorState (retry gombbal)
- **Akadálymentes**: skip-link, focus-visible accent ring, aria-label-ek mindenhol

### Technológiai stack

| Réteg | Eszköz | Verzió |
|---|---|---|
| Frontend keretrendszer | React | 18.x |
| Routing | react-router-dom | 6.x |
| Stílus | TailwindCSS (class-based dark mode) | 3.x |
| Tipográfia | Space Grotesk + Inter + JetBrains Mono (Google Fonts) | — |
| Build / dev server | Create React App (react-scripts) | 5.x |
| Backend keretrendszer | Express.js | 4.x |
| Adatbázis | SQLite (`node:sqlite`) | 3.51 |
| Tesztelés (backend) | Mocha + Chai + Supertest | 10.x / 4.x / 7.x |
| Tesztelés (frontend) | Jest + React Testing Library | 27.x / 13.x |
| Csomagkezelő | pnpm | 9.15.0 |
| Párhuzamos futtatás | concurrently | 9.x |
| Konténerizáció | Docker (multi-stage) | — |
| CI/CD | GitHub Actions | — |

### Tervezési alapelvek

- **Egy szolgáltatás production-ben**: az Express szerver kiszolgálja a buildelt frontendet is — nem kell külön webszerver (nginx).
- **Beépített SQLite**: a `node:sqlite` modul használata azt jelenti, hogy nincs natív build, nincs extra dependency, nincs Python-igény.
- **Migrációs séma**: a `db.js` modul betöltésekor automatikusan futnak a `CREATE TABLE IF NOT EXISTS` utasítások — nincs külön migráció.
- **Stateless API**: nincs session, nincs auth (egyszerű projekt). Minden kérés független.
- **Editorial brutalism**: minimal brutalist design rendszer (lásd 6. szekció) — 2px borderek, currentColor, offset shadow-k, semmi glow vagy soft startup UI. A vizuális vocabularium a `tailwind.css` `@layer components` rétegében koncentrálódik.
- **Theme rendszer CSS-osztály alapon**: `<html class="dark">` toggling, FOUC-mentes inline bootstrap a `<head>`-ben — a böngésző még a React mount előtt eldönti a témát.

---

## 2. Architektúra

### Magas szintű komponens-diagram

```
+--------------------------------------------------------+
|                    FELHASZNÁLÓ BÖNGÉSZŐ                |
|        (<head> theme-bootstrap dönt: light / dark)     |
|                  http://localhost:3001                 |
+--------------------------------------------------------+
                          |
                          | HTTP (proxy: /api/* -> :4000)
                          v
+--------------------------------------------------------+
|              REACT FRONTEND (CRA dev server)           |
|                                                        |
|  +-----------+   +-----------+   +-----------------+   |
|  |  App      |   |  Navbar   |   |  Footer         |   |
|  |  + Router |   | (sticky,  |   |  (rule + meta)  |   |
|  |  + skip   |   | toggle)   |   |                 |   |
|  +-----------+   +-----------+   +-----------------+   |
|        |              ^                                |
|        v              |                                |
|  +-----------+   +-------------+   +---------------+   |
|  | Home /    |   | ThemeToggle |   | ui/Skeleton   |   |
|  | AddBlog / |-->| useTheme()  |   | ui/EmptyState |   |
|  | Details   |   +-------------+   | ui/ErrorState |   |
|  +-----------+                     +---------------+   |
|        |                                               |
|        v                                               |
|  +-----------------+                                   |
|  |  src/api.js     |                                   |
|  | (fetch wrapper) |                                   |
|  +-----------------+                                   |
+--------------------------------------------------------+
                          |
                          | fetch('/api/blogs')
                          v
+--------------------------------------------------------+
|              EXPRESS BACKEND (port 4000)               |
|                                                        |
|  +----------+   +-----------+   +-------------------+  |
|  | app.js   |-->| routes/   |-->|  db.js (sqlite)   |  |
|  | (cors,   |   | blogs.js  |   |  prepared stmts   |  |
|  | json,    |   | categories|   |                   |  |
|  | static)  |   +-----------+   +-------------------+  |
|  +----------+                          |               |
|                                        v               |
|                          +--------------------------+  |
|                          |  server/data/blog.db     |  |
|                          |  (SQLite fájl)           |  |
|                          +--------------------------+  |
+--------------------------------------------------------+
```

### Production deploy (Docker)

Production-ben a frontend `npm run build` parancs eredménye (a `build/` mappa) Express static middleware-ként kerül kiszolgálásra, így minden a `4000`-es porton fut:

```
http://localhost:4000/           -> build/index.html (React app)
http://localhost:4000/api/blogs  -> Express handler
http://localhost:4000/api/health -> JSON
```

A `app.js`-ben a non-API request-ek SPA fallback-kel `index.html`-t kapnak (`router-aware` React app).

---

## 3. Adatfolyam

### Blogok listájának betöltése (GET /api/blogs)

```
User megnyitja http://localhost:3001
   |
   v
App (BrowserRouter) -> "/"
   |
   v
Home komponens mount -> useEffect()
   |
   v
api.listBlogs()                       (src/api.js)
   |
   v
fetch('http://localhost:4000/api/blogs')
   |
   v
[CORS middleware] -> [json middleware] -> blogsRouter
   |
   v
GET '/' handler
   |
   v
db.prepare(SELECT JOIN).all()
   |
   v
SQLite kiolvasás -> JSON tömb
   |
   v
res.json(rows)
   |
   v
fetch.then(data) -> setBlogs(data) -> React rerender
   |
   v
BlogList kirajzol minden bloghoz egy <article>-t
```

### Új blog létrehozása (POST /api/blogs)

```
User AddBlog formot kitölti és submitálja
   |
   v
handleSubmit() -> api.createBlog(form)
   |
   v
fetch POST '/api/blogs' Content-Type: application/json
   |
   v
Express bodyparser feldolgozza a JSON-t
   |
   v
POST '/' handler validál (missing fields check)
   |
   v
TRANSACTION:
   - INSERT OR IGNORE INTO categories
   - SELECT id FROM categories WHERE name = ?
   - INSERT INTO blogs VALUES (...)
   - SELECT az új blogot a JOIN-nal
COMMIT
   |
   v
res.status(201).json(created)
   |
   v
React: navigate(`/blogs/${created.id}`) -> BlogDetails mount
```

### Hibakezelés

```
fetch -> 404 / 400 / 500
   |
   v
res.ok === false -> throw new Error('API hiba (status): message')
   |
   v
.catch(err) -> setError(err.message)
   |
   v
React render error UI
```

---

## 4. Backend modulok

### `server/src/index.js` — Belépési pont

```js
const { createApp } = require('./app');
const PORT = process.env.PORT || 4000;
const app = createApp();
app.listen(PORT, ...);
```

Egyszerű boot — a `createApp()` függvény külön van definiálva, hogy a tesztek is használhassák port nélkül (Supertest egy callable Express app-ot vár).

### `server/src/app.js` — Express alkalmazás builder

A `createApp()` egy új Express példányt épít fel:

1. **Middleware-ek**: `cors()`, `express.json({ limit: '1mb' })`
2. **Health endpoint**: `GET /api/health`
3. **Router-ek**: `blogsRouter` a `/api/blogs`-re, `categoriesRouter` a `/api/categories`-re
4. **Static**: kiszolgálja a `build/` mappát (production)
5. **SPA fallback**: minden non-API GET request a `build/index.html`-t kapja
6. **Error handler**: 500-as válasz a futtatási hibákra

### `server/src/db.js` — Adatbázis-kapcsolat és séma

```js
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; ...');
db.exec('CREATE TABLE IF NOT EXISTS ...');
```

**Kulcs döntések:**
- **`node:sqlite`** (Node.js beépített modul) helyett `better-sqlite3` — nincs natív build, nincs Python függőség.
- **`PRAGMA journal_mode = WAL`** — több írás párhuzamosan, jobb teljesítmény.
- **`PRAGMA foreign_keys = ON`** — SQLite alapból kikapcsolva, kötelező bekapcsolni.
- **`DB_PATH` env változó** — tesztkörnyezetben `os.tmpdir()` alá kerül a DB.
- **`transaction(fn)` helper** — `node:sqlite` nem ad beépített tranzakciós API-t, ezért kézzel `BEGIN`/`COMMIT`/`ROLLBACK`.

### `server/src/seed.js` — Adatfeltöltés a `Data/db.json`-ból

Egyszer kell futtatni az első indításnál. Tranzakcióban törli a meglévő blogokat és kategóriákat, majd újra beilleszti őket a JSON fájlból.

### `server/src/routes/blogs.js` — Blog endpointok

Az összes lekérdezés `db.prepare()`-rel előre fordítva (prepared statements) — gyorsabb és **SQL injection ellen védett**.

| Funkció | Megvalósítás |
|---|---|
| `GET /` | `selectAll` vagy `selectByCategory` ha van `?category=` |
| `GET /:id` | `Number(id)` validáció → `selectById` |
| `POST /` | Mező-validáció (`missing` lista), kategória upsert, tranzakcióban |
| `DELETE /:id` | `id` validáció, `info.changes === 0` → 404 |

A `Number(result.lastInsertRowid)` konverzió fontos: a `node:sqlite` `BigInt`-et ad vissza, amit `Number`-re kell castolni a `selectById` paraméterhez.

### `server/src/routes/categories.js` — Kategória lista

Egy lekérdezés: `LEFT JOIN` a `blogs` táblával, `COUNT(b.id) AS blogCount`. A kategóriák ABC-rendben.

---

## 5. Frontend komponensek

### Útvonalak (`src/App.js`)

```
/                    -> Home          (hero + filter + lista)
/blogs/add           -> AddBlog       (brutalist form)
/blogs/:id           -> BlogDetails   (editorial layout + delete)
```

Az `App` a `Router` mellett render egy **skip-link**et a billentyűzettel navigálóknak, a `Navbar`-t (sticky), a `<main>` tagben a route-okat, és egy footer-t a wordmarkkal és licencsorral.

### `src/api.js` — Központi fetch wrapper

```js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
async function request(path, options) { ... }
export const api = { listBlogs, getBlog, createBlog, deleteBlog, listCategories };
```

**Miért így?**
- Egy helyen van minden URL — átírni egy sor.
- Egységes hibakezelés: nem 2xx → `throw new Error('API hiba (status): message')`.
- 204 No Content → `null` (a `DELETE` endpoint így működik).
- A `REACT_APP_API_URL` env változó override-olja a default URL-t (Docker, production).

### `src/theme.js` — Theme rendszer

```js
export function getInitialTheme() { /* localStorage → matchMedia → 'light' */ }
export function useTheme() {
  return { theme, setTheme, toggle };
}
```

**Kulcs döntések:**
- **FOUC-mentes**: a `public/index.html` `<head>`-ben futó inline IIFE már az első festés előtt felteszi a `dark` class-t a `<html>`-re, így nincs "fehér felvillanás" sötét módban.
- **Manuális override flag**: a `theme:manual` localStorage kulcs jelzi, hogy a user kifejezetten választott — ha igen, a system pref későbbi változása **nem** írja felül.
- **`color-scheme` CSS property**: a `:root` / `html.dark` beállítja, hogy a böngésző natív elemei (scrollbar, form auto-fill) is illeszkedjenek a témához.

### `src/component/ThemeToggle/ThemeToggle.jsx`

Square brutalist icon button (`btn-brutal btn-brutal--icon`), Sun ↔ Moon SVG ikon váltással. `aria-label` és `aria-pressed` attribútumokkal akadálymentes. Mind a Navbar desktop, mind a mobile branch-éhez beépítve.

### `src/component/ui/` — Megosztott állapot-komponensek

| Komponens | Mit csinál |
|---|---|
| `Skeleton.jsx` | `SkeletonLine`, `SkeletonCard`, `SkeletonGrid` — animated pulse blokkok a loading állapotokhoz. A `SkeletonCard` ugyanazokat az arányokat tartja, mint a valódi `BlogCard`, így nincs layout shift. |
| `EmptyState.jsx` | Szakadt-szegélyes (dashed border) blokk eyebrow + display headline + leírás + opcionális action gombbal. A Home dinamikusan vált a copy között: szűrésnél "Nincs talalat", egyébként "Meg nincs bejegyzes". |
| `ErrorState.jsx` | Accent-bordered alert role-lal, retry callback gombbal. A Home és a BlogDetails közös módon használja. |

### `Navbar.js`

**Sticky** header `top-0`-val, `border-b-2 border-current`-tel, `backdrop-blur`-rel és `bg-paper/95` (light) / `bg-night/95` (dark) félig-átlátszó hátérrel. A bal oldalon a `WRITEUP.` wordmark — az utolsó pont accent színű, ez a brand mikro-akcentus.

A jobb oldalon desktop nézetben `NavLink`-ek (`react-router-dom` v6 — automatikus aktív állapot kezelés accent színnel), majd a `ThemeToggle`. Mobilon hamburger ikon ami close-ra (X) vált, a menü egy `border-t-2`-vel szeparált blokkban nyílik. Útvonalváltáskor automatikusan bezáródik (`useLocation` figyelés).

### `Home.js`

Kétrészes layout:

1. **Hero** — `eyebrow` ("Issue 01 / 2026") + `heading-display` (clamp 2.75–5.5rem) + lede paragraph + két CTA (`btn-brutal--accent` "Irok valamit" + `btn-brutal--ghost` "Goerdulj le" — utóbbi `href="#blogs"` belső horgonyra).
2. **Archive szekció** — bal oldalon eyebrow + count + h2, jobb oldalon a `<SearchControls>` (icon-prefixed search input + custom-arrow select). A három terminális állapot egymást kizárva renderelődik:
   - `loading` → `<SkeletonGrid count={6} />`
   - `error` → `<ErrorState message onRetry />`
   - `!loading && filtered.length === 0` → `<EmptyState>` ami dinamikusan vált copy között (szűrés vs. üres adatbázis), és a megfelelő action gomb (szűrők törlése vs. új bejegyzés CTA).
   - különben → `<BlogList hideToolbar />`

A szűrés `useMemo`-val cache-elt, kliensoldalon, `Object.values(...).join(' ').toLowerCase().includes(...)` heurisztikával.

### `BlogList.jsx`

**Pure component** props-szal vezérelve. A `BlogCard` minden bloghoz:

- 16:10 grayscale `<img>` ami hover-re `scale-103` és teli színűvé telítődik (`grayscale-0`)
- `tag-mono` kategória chip + zero-padded id (`#001`, `#002`)
- balanced display title (`text-balance` CSS property)
- 3 soros line-clamp-1 leírás
- meta footer: author + lokalizált dátum (`hu-HU` locale)
- stagger fade-in animáció (`animation-delay: ${i * 40}ms`)

Hover state: `-translate-x-1 -translate-y-1 + shadow-brutal` — a card "fölfelé balra" emelkedik az offset shadow-ja előtt.

A toolbar (search + select) megjelenik default-ban, de `hideToolbar` prop-pal elrejthető — a `Home` ezt használja, mert ott a `<SearchControls>` a hero alatt felelős a szűrésért.

### `AddBlog.js`

Editorial form layout: back-link, eyebrow + display heading + lede, majd a mezők. Egy belső `<Field>` primitive komponens egységesíti a label + input + inline hint/error renderelést:

```jsx
<Field id="title" label="Cim" required error={fieldErrors.title}>
  <input id="title" className="input-brutal" ... />
</Field>
```

A kötelező mezők piros `*`-ot kapnak, az inline error sor `↳` glyph-szel kezdődik. A submit gomb `btn-brutal--accent` forward-arrow ikonnal, mellette ghost `Cancel` link. Validáció (`title`, `body`, `author`, `category` non-empty) kliensoldalon, de a backend `400` válaszára is felkészülve van (`error` state).

### `BlogDetails.js`

Szerkesztőségi cikk-layout:

1. Back-link a tetején
2. Meta sor: kategória chip + id + dátum
3. Oversized headline (`text-4xl md:text-6xl`)
4. Szerző + Delete gomb sor, **dupla rule-lal** (border-t-2 + border-b-2) elválasztva
5. Opcionális wide cover image (max 70vh)
6. **Pull-quote lede**: az első mondat kiemelve `border-l-4 border-accent`-tel, nagyobb betűkkel
7. Pre-formatted body — `split(/\n\n+/)` az üres soros bekezdésekre
8. Záró rule + "Tovabbi bejegyzesek" CTA

Loading állapotban a `BlogDetailsSkeleton` ugyanazt a layoutot reprodukálja Skeleton blokkokkal (nincs layout shift). Hibára `<ErrorState onRetry>`.

---

## 6. Design rendszer (editorial brutalism)

A vizuális vocabularium minimal brutalist — szögletes formák, vastag (2px) borderek, currentColor-os ritmus (light/dark automatikus váltás), offset shadow-k és **egy** visszafogott accent szín. A design rétege a `src/tailwind.css` `@layer base/components/utilities` blokkjaiban koncentrálódik, így JSX-ben főleg utility class neveket használunk.

### Színpaletta

| Token | Light mode | Dark mode | Szerep |
|---|---|---|---|
| `paper` | `#fafaf7` | — | háttér (oat / parchment) |
| `paper-muted` | `#f0eee8` | — | másodlagos felület |
| `night` | — | `#0e0e0c` | háttér |
| `night-muted` | — | `#1a1a18` | card felület |
| `ink` | `#0a0a0a` | — | primary szöveg / border |
| `ink-muted` | `#6b6b66` | — | másodlagos szöveg |
| `bone` | — | `#fafaf7` | primary szöveg / border (dark) |
| `bone-muted` | — | `#9b9b95` | másodlagos szöveg (dark) |
| `accent` | `#dc2626` | — | egyetlen visszafogott hangsúlyszín |
| `accent-dark` | — | `#ef4444` | accent dark módban (jobb kontraszt) |

A trükk: a borderek mindenhol `border-current`-tel mennek, így a téma váltásakor a CSS `currentColor` szabálya miatt a borderek automatikusan megfordulnak — nincs külön `dark:border-*` szelektor.

### Tipográfia

| Token | Font | Súly | Mire |
|---|---|---|---|
| `font-display` | Space Grotesk | 500/600/700 | minden heading, navigáció, button label |
| `font-sans` | Inter | 400/500/600 | body szöveg, paragraphok |
| `font-mono` | JetBrains Mono | 400/500 | meta információk (dátum, kategória, id) |

A `text-display` token egy `clamp(2.75rem, 7vw, 5.5rem)` méretű, `letter-spacing: -0.04em`, `line-height: 0.95` — ez az editorial-szintű hero headline. A `text-eyebrow` egy `0.75rem` méretű, `letter-spacing: 0.18em` uppercase mini-felirat (Google Fonts pre-loaded a `<head>`-ben).

### Border / radius / shadow szabályok

- **Border**: mindenhol `border-2 border-current` — nincs vékony 1px határ, nincs opacity-trükk
- **Radius**: alapból `rounded-none`, ritkán `rounded-sm`. A brutalist DNA-hez tartozik a derékszögű forma.
- **Shadow**: csak offset brutal (`box-shadow: 4px 4px 0 0 currentColor`), kizárólag hover/focus állapotokban — semmi soft drop shadow, semmi glow.

### Interaction nyelv

- **Card hover**: `-translate-x-1 -translate-y-1` + `shadow-brutal` — a card balra-fölfelé emelkedik, mögötte az offset shadow látszik
- **Button hover**: `-translate-x-[3px] -translate-y-[3px]` + `shadow-brutal`
- **Button active**: visszacsattan (`translate-x-0 translate-y-0 shadow-none`) — fizikai gomb érzet
- **Title hover**: alulról kinövő 3px-es underline (`title-link::after` width 0 → 100%)
- **Image hover**: grayscale → színes, kicsi `scale-103`
- **Focus**: `focus-visible:ring-2 ring-offset-2 ring-accent` — minden interaktív elem accent színű outline-t kap

### Utility-k áttekintése

Minden a `src/tailwind.css` `@layer components` rétegében van definiálva, JSX-ben `className`-ben hivatkozható.

| Class | Mire |
|---|---|
| `container-zine` | `max-w-5xl mx-auto px-5 md:px-8` — feszes editorial szélesség |
| `container-wide` | `max-w-7xl` — wide cover image-ekhez |
| `heading-display` | A hero szintű h1 |
| `eyebrow` | Uppercase mono mini-felirat |
| `meta-mono` | Mono dátum/id/kategória meta |
| `tag-mono` | Inline border-elt kategória chip |
| `label-brutal` | Form label (uppercase mono) |
| `btn-brutal` | Default gomb (invertálódó hover) |
| `btn-brutal--accent` | Filled accent gomb (primary CTA) |
| `btn-brutal--danger` | Outline accent gomb (Delete) |
| `btn-brutal--ghost` | Transzparens gomb |
| `btn-brutal--sm` | Kisebb (px-3 py-2 text-xs) |
| `btn-brutal--icon` | Square ikon gomb |
| `input-brutal` | Vastag-bordered input/select/textarea |
| `card-brutal` | Border-2 + hover lift + offset shadow |
| `title-link` | Cím underline-növő hover effekttel |
| `rule` / `rule-accent` | 2px-es horizontális divider |
| `skeleton-line` | Pulse loader sor |

### Theme rendszer flow

```
1. <html> renderelése (még React előtt)
   |
   v
2. <head> inline IIFE:
     stored = localStorage.getItem('theme')
     prefers = matchMedia('(prefers-color-scheme: dark)').matches
     theme = stored || (prefers ? 'dark' : 'light')
     if (theme === 'dark') html.classList.add('dark')
     html.dataset.theme = theme
   |
   v
3. React mount — Tailwind már a helyes osztállyal rendereli
   |
   v
4. useTheme() szinkronizálódik az aktuális state-tel
   |
   v
5. User <ThemeToggle> kattintás:
     localStorage.setItem('theme:manual', '1')
     setTheme(other)  -> applyTheme() átdobja a class-t
```

A `theme:manual` flag miatt a system pref későbbi változása (`matchMedia change` event) nem írja felül a felhasználó manuális választását.

---

## 7. Adatbázis

### Séma

```sql
CREATE TABLE categories (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT    NOT NULL UNIQUE
);

CREATE TABLE blogs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  body        TEXT    NOT NULL,
  author      TEXT    NOT NULL,
  blog_image  TEXT,                   -- nullable: lehet kép nélküli blog
  category_id INTEGER NOT NULL,       -- FK
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE INDEX idx_blogs_category ON blogs(category_id);
```

### ER diagram

```
+--------------+              +------------------+
| categories   |              | blogs            |
|--------------|              |------------------|
| id   PK      |<---+         | id          PK   |
| name UNIQUE  |    |         | title            |
+--------------+    |         | body             |
                    +---------| category_id FK   |
                              | author           |
                              | blog_image       |
                              | created_at       |
                              +------------------+
```

### Relációs invariánsok

- **`categories.name` UNIQUE** — `INSERT OR IGNORE` használata az upsert-hez.
- **`blogs.category_id` NOT NULL** — minden blogban kell lennie kategóriának.
- **FK kényszer** — egy nem létező `category_id` `INSERT`-et SQLite visszautasít (ha `PRAGMA foreign_keys = ON`).
- **`idx_blogs_category`** — a kategória szerinti szűrés gyorsabb.

### Hol van fizikailag a DB?

| Környezet | `DB_PATH` |
|---|---|
| Dev (default) | `server/data/blog.db` |
| Teszt | `${os.tmpdir()}/blog-test-<pid>.db` |
| Docker | `/data/blog.db` (volume-ban perzisztált) |

---

## 8. API referencia

Minden végpont az `/api` prefix alatt érhető el. Az alkalmazás JSON-t fogad és JSON-t ad vissza (kivéve `204 No Content`-et).

### `GET /api/health`

Egyszerű health check, nem érinti a DB-t.

**Kérés:** nincs body
**Válasz `200 OK`:**
```json
{ "status": "ok", "ts": "2026-05-17T19:42:11.123Z" }
```

### `GET /api/blogs`

Az összes blog listája, kategória szerint opcionálisan szűrve.

**Query paraméterek:**
- `category` (string, opcionális) — pl. `?category=sports`. Case-insensitive.

**Példa:** `GET /api/blogs?category=sports`
**Válasz `200 OK`:**
```json
[
  {
    "id": 3,
    "title": "Michael Laudrup - The best of a generation",
    "body": "Lorem ipsum...",
    "author": "Nubayra",
    "blogImage": "https://cdn.swanseacity.com/...",
    "category": "sports",
    "createdAt": "2026-05-17 19:30:00"
  }
]
```

### `GET /api/blogs/:id`

Egyetlen blog részletes lekérése.

**URL paraméter:** `id` (integer, > 0)
**Válaszok:**
- `200 OK` — blog objektum (lásd fent)
- `400 Bad Request` — `id` nem szám / negatív / nulla
  ```json
  { "error": "Ervenytelen id" }
  ```
- `404 Not Found` — nincs ilyen blog
  ```json
  { "error": "Blog nem talalhato" }
  ```

### `POST /api/blogs`

Új blog létrehozása. Ha a `category` még nem létezik, automatikusan létrejön.

**Request body (JSON):**
```json
{
  "title":     "Új cím",
  "body":      "Hosszabb tartalom...",
  "author":    "Szerző neve",
  "category":  "kategoria-neve",
  "blogImage": "https://example.com/kep.jpg"
}
```

| Mező | Típus | Kötelező | Megjegyzés |
|---|---|---|---|
| `title` | string | ✓ | nem lehet üres |
| `body` | string | ✓ | nem lehet üres |
| `author` | string | ✓ | nem lehet üres |
| `category` | string | ✓ | ha nem létezik, létrejön |
| `blogImage` | string (URL) | – | opcionális, `null`-ként tárolódik |

**Válaszok:**
- `201 Created` — visszaadja a frissen létrehozott blog objektumot (a generált `id`-vel)
- `400 Bad Request` — hiányzó vagy üres kötelező mezők
  ```json
  { "error": "Hianyzo mezok", "missing": ["body", "category"] }
  ```

### `DELETE /api/blogs/:id`

Blog törlése.

**URL paraméter:** `id` (integer, > 0)
**Válaszok:**
- `204 No Content` — siker, üres body
- `400 Bad Request` — érvénytelen `id`
- `404 Not Found` — nincs ilyen blog

### `GET /api/categories`

Az összes kategória, hozzájuk tartozó blogszámmal.

**Válasz `200 OK`:**
```json
[
  { "id": 1, "name": "beauty", "blogCount": 2 },
  { "id": 2, "name": "sports", "blogCount": 1 },
  { "id": 3, "name": "technology", "blogCount": 2 },
  { "id": 4, "name": "travel", "blogCount": 1 }
]
```

### Hibakezelési konvenciók

| HTTP kód | Mikor | Body |
|---|---|---|
| `200 OK` | sikeres GET | JSON adat |
| `201 Created` | sikeres POST | a létrehozott entitás |
| `204 No Content` | sikeres DELETE | – |
| `400 Bad Request` | validációs hiba | `{ error, missing? }` |
| `404 Not Found` | nem létező erőforrás | `{ error }` |
| `500 Internal Server Error` | unexpected | `{ error: "Belso szerver hiba" }` |

---

## 9. Konfiguráció és környezeti változók

### Backend (server/)

| Változó | Default | Leírás |
|---|---|---|
| `PORT` | `4000` | HTTP port |
| `DB_PATH` | `./data/blog.db` (relatív) | SQLite fájl elérési útja |
| `NODE_ENV` | – | `production` esetén nincs source map |

### Frontend (CRA)

| Változó | Default | Leírás |
|---|---|---|
| `PORT` | `3000` | Dev server port |
| `HOST` | `0.0.0.0` | A `webpack-dev-server` host beállítása |
| `WDS_SOCKET_HOST` | – | HMR socket host (lásd `allowedHosts` bug) |
| `REACT_APP_API_URL` | `http://localhost:4000/api` | API gyökér URL |
| `DANGEROUSLY_DISABLE_HOST_CHECK` | – | Csak fejlesztéshez |

### Példa `.env`

```env
# Backend
PORT=4000
DB_PATH=./server/data/blog.db

# Frontend (dev)
HOST=localhost
WDS_SOCKET_HOST=localhost
PORT=3001
REACT_APP_API_URL=http://localhost:4000/api
```

> **Megjegyzés:** a `.env` fájl `.gitignore`-ban van. Az `.env.example`-t szabad commitolni.

---

## 10. Tesztelési stratégia

### Backend integrációs tesztek (Mocha + Chai + Supertest)

**Fájl:** `server/test/blogs.test.js`

**Stratégia:**
- Minden teszt egy **friss, ideiglenes SQLite DB-vel** indul (`os.tmpdir()` alatt, `process.env.DB_PATH` állítva _mielőtt_ a `db.js` betöltődne).
- A `beforeEach` újra `seed`-eli a táblákat 2 előre definiált bloggal.
- A `Supertest` direkt az Express app példányra rácsap, nincs valódi HTTP socket — gyorsabb és determinisztikus.

**13 teszt eloszlása:**
- `GET /api/health` — 1
- `GET /api/blogs` — 3 (összes, szűrés, üres)
- `GET /api/blogs/:id` — 3 (siker, 404, 400)
- `POST /api/blogs` — 3 (siker, validáció, új kategória)
- `DELETE /api/blogs/:id` — 2 (siker, 404)
- `GET /api/categories` — 1

```powershell
pnpm server:test
```

### Frontend unit tesztek (Jest + React Testing Library)

**Fájlok:** `src/App.test.js`, `src/component/BlogList/BlogList.test.jsx`, `src/setupTests.js`

**Stratégia:**
- **BlogList** — pure component, props-szal renderelve, eventek mock handler-ekkel (`jest.fn()`).
- **App** — `global.fetch`-et mockoljuk, így a Home komponens `useEffect`-je is determinisztikus.
- **`window.matchMedia` mock** a `setupTests.js`-ben — a `useTheme()` hook a `'(prefers-color-scheme: dark)'` query-t kérdezi le, ami a jsdom-ban alapból nincs implementálva. Mock nélkül a teszt fájl import-szinten elhasalna.
- **Akadálymentes szelektorok** — `getByLabelText` használata `getByPlaceholderText` helyett, mert a brutalist form `aria-label`-eket ad a sr-only label-eken kívül is.

**9 teszt:**
- `BlogList` (6): rendering, linkek a részletekre, kereső handler, kategória handler, üres lista, `hideToolbar` viselkedés
- `App` (3): WRITEUP wordmark, fetch hívás `/api/blogs`-ra, ErrorState 500-as válaszra

```powershell
pnpm client:test
```

### Mindkettő futtatása

```powershell
pnpm test
```

### Lefedetlen területek (tudatos kihagyás)

- **End-to-end teszt (Playwright/Cypress)** — egy ilyen kis projektnél overkill.
- **DB modul direkt unit teszt** — az integrációs tesztek úgyis lefedik.
- **CSS / vizuális regresszió** — manuálisan teszteljük a böngészőben dark / light módban.
- **Theme toggle interakció teszt** — a `useTheme` hook localStorage + matchMedia integrációja jól tesztelhető lenne, de jelenleg manuálisan verifikáljuk.

---

## 11. CI/CD pipeline

A `.github/workflows/node.js.yml` minden push és pull request esetén lefut a `main` és `master` ágakon.

### Job-ok és függőségek

```
   +-----------+       +-----------+
   | frontend  |       | backend   |
   +-----------+       +-----------+
         \                  /
          \                /
           v              v
           +---------------+
           |    docker     |
           +---------------+
```

A `docker` job a `needs: [frontend, backend]` miatt csak akkor fut le, ha a tesztek zöldek.

### Lépések részletesen

#### `frontend`
1. `actions/checkout@v4`
2. `pnpm/action-setup@v4` (pin: 9.15.0)
3. `actions/setup-node@v4` (Node 22, cache: pnpm)
4. `pnpm install --frozen-lockfile`
5. `pnpm run client:build`
6. `CI=true pnpm run client:test`

#### `backend`
1. ugyanaz a setup, csak `cache-dependency-path: server/pnpm-lock.yaml`
2. `pnpm install --frozen-lockfile` a `server/`-ben
3. `pnpm test`

#### `docker`
1. `docker/setup-buildx-action@v3`
2. `docker/build-push-action@v6` GHA cache-szel, `push: false` (csak verifikáció)

### A `--frozen-lockfile` miért fontos

A pnpm `--frozen-lockfile` flag-je biztosítja, hogy a CI-ben **pontosan ugyanazok a verziók** legyenek telepítve, mint a fejlesztő gépen. Ha valami eltér a `pnpm-lock.yaml`-tól, a CI piros — ez catch-eli a "működött nálam" típusú hibákat.

---

## 12. Konténerizáció

### Dockerfile szerkezete

A `Dockerfile` **3 stage**-re bontva, hogy a final image minél kisebb legyen:

```
┌─────────────────────────────────────────────────────────┐
│ base                                                    │
│   node:22-alpine + corepack enable + pnpm@9.15.0        │
└─────────────────────────────────────────────────────────┘
              │                              │
              v                              v
   ┌────────────────────┐         ┌────────────────────┐
   │ client-build       │         │ server-deps        │
   │   pnpm install     │         │   pnpm install     │
   │   pnpm client:build│         │   --prod           │
   │   -> build/        │         │   -> node_modules/ │
   └────────────────────┘         └────────────────────┘
              │                              │
              └──────────────┬───────────────┘
                             v
              ┌─────────────────────────────────┐
              │ runtime (node:22-alpine, no pnpm)│
              │   COPY build/                   │
              │   COPY server/node_modules/     │
              │   COPY server/src/, Data/       │
              │   USER node                     │
              │   CMD node server/src/index.js  │
              └─────────────────────────────────┘
```

### Miért így

- **`corepack enable`**: a Node.js beépített csomagkezelő-shim — automatikusan letölti a `packageManager` mezőben jelzett pnpm-et, nincs `npm install -g pnpm`.
- **`--ignore-scripts`**: a build során nincs szükség lifecycle scriptekre (preinstall, postinstall) — biztonsági és gyorsasági okból kikapcsoljuk.
- **`--frozen-lockfile`**: ugyanaz mint a CI-ben.
- **`USER node`**: nem root-ként futunk — security best practice.
- **`/data` volume**: a `docker-compose.yml`-ben definiált named volume itt mountolódik, így a DB perzisztens.

### `docker-compose.yml`

Egyetlen `blog-app` service. A `healthcheck` minden 30 másodpercben kéri a `/api/health`-et — ha sikertelen 3-szor, a konténer `unhealthy` állapotba kerül.

### Operatív parancsok

```powershell
docker compose up --build       # build + start
docker compose down             # stop
docker compose down -v          # stop + volume törlése (DB elveszik!)
docker compose logs -f          # log követés
docker compose exec blog-app sh # shell a konténerben
```

---

## 13. Fejlesztői útmutató

### Új API endpoint hozzáadása

Példa: `GET /api/blogs/recent?limit=5` — a legutóbbi 5 blog.

1. **Új prepared statement** `server/src/routes/blogs.js`-ben:
   ```js
   const selectRecent = db.prepare(`
     SELECT b.id, b.title, ... FROM blogs b
     JOIN categories c ON c.id = b.category_id
     ORDER BY b.created_at DESC LIMIT ?
   `);
   ```
2. **Handler regisztrálása**:
   ```js
   router.get('/recent', (req, res) => {
     const limit = Math.min(Number(req.query.limit) || 5, 50);
     res.json(selectRecent.all(limit));
   });
   ```
3. **Teszt írása** `server/test/blogs.test.js`-be:
   ```js
   describe('GET /api/blogs/recent', () => {
     it('a legutobbi N blogot adja vissza', async () => {
       const res = await request(app).get('/api/blogs/recent?limit=1');
       expect(res.body).to.have.lengthOf(1);
     });
   });
   ```
4. **`src/api.js`** bővítése:
   ```js
   listRecent: (limit = 5) => request(`/blogs/recent?limit=${limit}`),
   ```

### Új tábla hozzáadása

1. **Séma kiegészítése** `server/src/db.js`-ben (`CREATE TABLE IF NOT EXISTS comments ...`).
2. **Új router fájl** `server/src/routes/comments.js`.
3. **Regisztrálás** `app.js`-ben: `app.use('/api/comments', commentsRouter)`.
4. **Tesztek hozzáadása**.
5. **(Opcionális)** seed adatok az `server/src/seed.js`-be.

### Új frontend oldal

1. **Komponens** `src/component/Foo/Foo.js`.
2. **Route bejegyzés** `src/App.js`-ben: `<Route path="/foo" element={<Foo />} />`.
3. **Navigációs link** `src/component/Navbar/Navbar.js`-ben.
4. **Teszt** `Foo.test.js`.

### Hot reload

- **Frontend**: CRA dev server automatikusan reloadol.
- **Backend**: `pnpm server:dev` használata — Node.js `--watch` flag-ja figyeli a fájlokat.

---

## 14. Hibakeresés (troubleshooting)

### `options.allowedHosts[0] should be a non-empty string`

**Ok:** CRA 5 + webpack-dev-server 4 bug, ha a `HOST` env változó üres.
**Megoldás:** a `.env`-ben legyen `HOST=localhost` és `WDS_SOCKET_HOST=localhost`.

### `node-gyp` / `Python` hiba `pnpm install` során

**Ok:** valami natív build-et igénylő dep került be (pl. `better-sqlite3`).
**Megoldás:** ellenőrizd hogy a `server/package.json`-ban *csak* `cors`, `express` van dep-ként. Az SQLite-ot a `node:sqlite` beépített modul adja.

### `port 4000 already in use`

**Ok:** előző backend nem állt le tisztán.
**Megoldás (Windows):**
```powershell
netstat -ano | findstr :4000
taskkill /F /PID <PID>
```

### `Hiba: API hiba (500)` a UI-on

**Ok:** backend exception. Ellenőrizd a backend log-ot — ott látszik a stack trace.

### `Compiled successfully` de a böngészőben üres oldal

**Ok:** általában import hiba a runtime-ban (pl. nem létező komponens). Nyisd a böngésző DevTools console-ját — ott látszik.

### A blogok nem jelennek meg, csak `Nincs blog bejegyzes`

**Ok:** az adatbázis üres.
**Megoldás:** `pnpm seed`

### Docker `wget: not found` healthcheck

**Ok:** `node:22-alpine` általában tartalmazza, de ha minimal image-et használsz, lehet hogy hiányzik. Akkor cseréld le:
```dockerfile
HEALTHCHECK CMD node -e "require('http').get('http://localhost:4000/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"
```

### Tesztek timeout-olnak

**Ok:** a `mocha --timeout 10000` 10 másodperc, ami bőven elég. Ha mégis kifut: lehet hogy a DB lock-olva van egy másik process-től.
**Megoldás:** ellenőrizd hogy nem fut-e a backend a háttérben (ami foglalja a DB fájlt). A tesztek tmp DB-t használnak, ott nem lehet konfliktus.

---

## Függelék: hasznos linkek

- [Express dokumentáció](https://expressjs.com/)
- [node:sqlite API](https://nodejs.org/api/sqlite.html)
- [React Router v6](https://reactrouter.com/en/main)
- [TailwindCSS](https://tailwindcss.com/docs)
- [pnpm dokumentáció](https://pnpm.io/)
- [Supertest README](https://github.com/ladjs/supertest)
- [Mocha](https://mochajs.org/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
