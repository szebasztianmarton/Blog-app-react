# Blog App — Részletes dokumentáció

> Ez a dokumentum a Blog App belső felépítését, működését és bővítését tárgyalja. A gyors telepítéshez és a követelmény-mátrixhoz lásd a [README.md](README.md)-t.

## Tartalom

1. [Áttekintés](#1-áttekintés)
2. [Architektúra](#2-architektúra)
3. [Adatfolyam](#3-adatfolyam)
4. [Backend modulok](#4-backend-modulok)
5. [Frontend komponensek](#5-frontend-komponensek)
6. [Adatbázis](#6-adatbázis)
7. [API referencia](#7-api-referencia)
8. [Konfiguráció és környezeti változók](#8-konfiguráció-és-környezeti-változók)
9. [Tesztelési stratégia](#9-tesztelési-stratégia)
10. [CI/CD pipeline](#10-cicd-pipeline)
11. [Konténerizáció](#11-konténerizáció)
12. [Fejlesztői útmutató](#12-fejlesztői-útmutató)
13. [Hibakeresés (troubleshooting)](#13-hibakeresés-troubleshooting)

---

## 1. Áttekintés

A Blog App egy egyszerű, kategorizált blogbejegyzéseket kezelő webalkalmazás, amely a következő funkciókat kínálja:

- **Listanézet**: az összes blog megjelenítése responsive grid layoutban
- **Kereső + kategória szűrés**: a listán élőben szűrhet a felhasználó
- **Részletek nézet**: egy konkrét blog teljes szövege
- **Új bejegyzés**: form a backend felé `POST` kéréssel
- **Törlés**: blog eltávolítása a részletek nézetből

### Technológiai stack

| Réteg | Eszköz | Verzió |
|---|---|---|
| Frontend keretrendszer | React | 18.x |
| Routing | react-router-dom | 6.x |
| Stílus | TailwindCSS | 3.x |
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

---

## 2. Architektúra

### Magas szintű komponens-diagram

```
+--------------------------------------------------------+
|                    FELHASZNÁLÓ BÖNGÉSZŐ                |
|                  http://localhost:3001                 |
+--------------------------------------------------------+
                          |
                          | HTTP (proxy: /api/* -> :4000)
                          v
+--------------------------------------------------------+
|              REACT FRONTEND (CRA dev server)           |
|                                                        |
|  +-------------+    +---------+    +-----------------+ |
|  | App + Router|--->| Home /  |--->|  src/api.js     | |
|  | (routes)    |    | AddBlog |    |  (fetch helper) | |
|  +-------------+    +---------+    +-----------------+ |
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
/                    -> Home          (lista + szűrés)
/blogs/add           -> AddBlog       (form)
/blogs/:id           -> BlogDetails   (egyetlen blog + delete)
```

A `Navbar` minden oldalon megjelenik, a `Routes` blokk a `Navbar` után.

### `src/api.js` — Központi fetch wrapper

```js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
async function request(path, options) { ... }
export const api = { listBlogs, getBlog, createBlog, deleteBlog, listCategories };
```

**Miért így?**
- Egy helyen van minden URL — átírni egy sor.
- Egységes hibakezelés: nem 2xx → `throw new Error(...)`.
- 204 No Content → `null` (a `DELETE` endpoint így működik).
- A `REACT_APP_API_URL` env változó override-olja a default URL-t (Docker, production).

### `Home.js`

`useEffect` mount-kor letölti a blogokat. Lokális state-ben tartja:
- `blogs` — összes
- `loading` / `error` — UI állapotok
- `searchTerm` / `searchCategory` — kontrollált inputok

A szűrés **kliensoldali** — egyszerű projektnél jobb a lista cache-elése, mint minden szűréskor új API-hívás. Az `Object.values(blog).join(' ').toLowerCase().includes(searchTerm)` heurisztikus, de elég, mivel kevés blog van.

### `BlogList.jsx`

**Pure component** — props alapján rendererel. A keresőmező és a kategória select onChange-eseményei a parent által átadott handlerekre delegálnak. Ez teszi könnyen tesztelhetővé.

Responsive grid:
- `grid-cols-1` (mobil)
- `md:grid-cols-2` (tablet)
- `lg:grid-cols-3` (desktop)

### `AddBlog.js`

Kontrollált form: a `form` objektum minden mezője state-ben van, az `update(key)` helper egységesíti az onChange handler-eket. Submit után `navigate(`/blogs/${created.id}`)` a részletek oldalra.

### `BlogDetails.js`

A `useParams()` kiolvassa az `:id`-t az URL-ből, és a `useEffect`-tel letölti. A `Delete` gomb `window.confirm`-mal kérdez vissza, majd `api.deleteBlog(id)` után visszanavigál a fő listára.

### `Navbar.js`

Mobil hamburger menü `useState`-tel. Tailwind responsive helpereket használ (`md:hidden`, `md:block`, `md:flex`).

---

## 6. Adatbázis

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

## 7. API referencia

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
  { "error": "Érvénytelen id" }
  ```
- `404 Not Found` — nincs ilyen blog
  ```json
  { "error": "Blog nem található" }
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
  { "error": "Hiányzó mezők", "missing": ["body", "category"] }
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
| `500 Internal Server Error` | unexpected | `{ error: "Belső szerver hiba" }` |

---

## 8. Konfiguráció és környezeti változók

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

## 9. Tesztelési stratégia

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

**Fájlok:** `src/App.test.js`, `src/component/BlogList/BlogList.test.jsx`

**Stratégia:**
- **BlogList** — pure component, props-szal renderelve, eventek mock handler-ekkel (`jest.fn()`).
- **App** — `global.fetch`-et mockoljuk, így a Home komponens `useEffect`-je is determinisztikus.

**8 teszt:**
- `BlogList`: rendering, linkek, kereső handler, kategória handler, üres lista
- `App`: header megjelenítés, fetch hívás `/api/blogs`-ra, hiba-UI 500-as válaszra

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
- **CSS / vizuális regresszió** — nincs design system.

---

## 10. CI/CD pipeline

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

## 11. Konténerizáció

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

## 12. Fejlesztői útmutató

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

## 13. Hibakeresés (troubleshooting)

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

### A blogok nem jelennek meg, csak `Nincs bejegyzés`

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
