# Blog App (React + Express + SQLite)

Egyszerű blog alkalmazás, amelyben kategória szerint lehet böngészni és új bejegyzéseket létrehozni. A frontend **React**-tel és **TailwindCSS**-szel készült, a backend **Express.js**-en fut, az adattárolás pedig **SQLite** relációs adatbázisban történik a Node.js beépített `node:sqlite` moduljával.

> 📖 **Részletes technikai dokumentáció:** [DOCS.md](DOCS.md) — architektúra, adatfolyam, komponens-szintű leírás, kibővített API referencia, fejlesztői útmutató és troubleshooting.

## Tartalom

- [Felépítés](#felépítés)
- [Követelmények teljesítése](#követelmények-teljesítése)
- [Telepítés és futtatás](#telepítés-és-futtatás)
- [Docker használat](#docker-használat)
- [Konfiguráció](#konfiguráció)
- [API végpontok](#api-végpontok)
- [Adatbázis-séma](#adatbázis-séma)
- [Tesztelés](#tesztelés)
- [CI/CD](#cicd)

---

## Felépítés

```
Blog-app-react/
├── .github/workflows/      # GitHub Actions CI konfiguráció
│   └── node.js.yml
├── Data/
│   └── db.json             # Seed adat (kezdeti blogok)
├── public/                 # Statikus assetek (favicon, index.html)
├── src/                    # React frontend
│   ├── api.js              # Backend hívások
│   ├── App.js              # Route-ok
│   ├── component/
│   │   ├── AddBlog/        # Új blog form
│   │   ├── BlogDetails/    # Egy blog részletei
│   │   ├── BlogList/       # Blog listanézet kereséssel + szűréssel
│   │   ├── Home/           # Főoldal (lista lekérése)
│   │   └── Navbar/         # Navigációs sáv
│   ├── App.test.js         # Integrációs frontend teszt (Jest)
│   └── ...
├── server/                 # Express backend
│   ├── src/
│   │   ├── app.js          # Express alkalmazás (route-ok, middleware)
│   │   ├── db.js           # SQLite kapcsolat + séma
│   │   ├── index.js        # Belépési pont
│   │   ├── seed.js         # Adat feltöltése db.json-ból
│   │   └── routes/
│   │       ├── blogs.js
│   │       └── categories.js
│   └── test/
│       └── blogs.test.js   # Mocha + Supertest integrációs tesztek
├── Dockerfile              # Multi-stage Docker build (kliens + szerver egy image-ben)
├── docker-compose.yml      # Egylépéses indítás Docker Compose-zal
├── .env.example            # Példa környezeti változók
└── package.json
```

A frontend a `localhost:3000` porton fut fejlesztés alatt (Create React App), és a `proxy` beállítás miatt az `/api/*` hívásokat a `localhost:4000`-en futó backend felé továbbítja. Production build esetén a backend statikus fájlként kiszolgálja a buildelt frontendet (`/build`).

## Követelmények teljesítése

| Követelmény | Megvalósítás |
|---|---|
| ≥2 API végpont | 6 végpont: `/api/health`, `/api/blogs` (GET + POST), `/api/blogs/:id` (GET + DELETE), `/api/blogs?category=`, `/api/categories` |
| Reszponzív kliens | TailwindCSS responsive grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`), reszponzív Navbar mobil hamburger menüvel |
| Relációs adatbázis | SQLite — `categories` ↔ `blogs` foreign key kapcsolattal |
| ≥2 unit/integrációs teszt | 13 backend integrációs teszt (Mocha + Supertest) + 8 frontend teszt (Jest + RTL) = 21 teszt |
| Git, ≥5 strukturált commit | Több commit a fejlesztés során — lásd `git log` |
| Markdown dokumentáció | Ez a README (felépítés, konfig, végpontok) |
| **Kiegészítő:** CI/CD | GitHub Actions workflow (frontend test + backend test + Docker build) |
| **Kiegészítő:** Konténerizáció | Multi-stage Dockerfile + docker-compose.yml |

## Telepítés és futtatás

### Előfeltételek
- **Node.js ≥ 22** (a backend a beépített `node:sqlite` modult használja)
- **pnpm ≥ 9** (`corepack enable && corepack prepare pnpm@9.15.0 --activate` ha még nincs)

### 1. Függőségek telepítése (root + server egyszerre)

```powershell
pnpm run install:all
```

Ez a root frontend és a `server/` backend függőségeit egyaránt telepíti.

### 2. Adatbázis feltöltése (seed)

```powershell
pnpm seed
```

Ez létrehozza a `server/data/blog.db` fájlt és feltölti a `Data/db.json` tartalmával.

### 3. Backend + frontend egyszerre indítása

```powershell
pnpm dev
```

Ez `concurrently`-vel párhuzamosan indítja a backend (4000) és a frontend (3001) szolgáltatásokat, prefix-szel megkülönböztetett naplókkal:

```
[SERVER] API fut: http://localhost:4000
[CLIENT] Compiled successfully!
```

Ha külön szeretnéd indítani őket:

```powershell
pnpm server   # csak backend
pnpm client   # csak frontend
```

A frontend a `proxy` beállítás miatt automatikusan a backendre továbbítja az API hívásokat.

## Docker használat

### Image építése és futtatása

```powershell
docker compose up --build
```

A `docker-compose.yml` egyetlen szolgáltatást definiál (`blog-app`), amely a `4000`-es porton elérhető. Az adatbázis egy named volume-ban (`blog-data`) kerül perzisztálásra, így a konténer újraindítása után megmaradnak a blogok.

Első indítás után seedeljük az adatbázist:

```powershell
docker compose exec blog-app node server/src/seed.js
```

A teljes alkalmazás (frontend + backend) a `http://localhost:4000` címen érhető el.

### Image kézi build

```powershell
docker build -t blog-app .
docker run -p 4000:4000 -v blog-data:/data blog-app
```

## Konfiguráció

Hozz létre egy `.env` fájlt a `.env.example` alapján. Támogatott változók:

| Változó | Alapérték | Leírás |
|---|---|---|
| `PORT` | `4000` | A backend HTTP port |
| `DB_PATH` | `./server/data/blog.db` | SQLite adatbázis fájl elérési útja |
| `REACT_APP_API_URL` | `http://localhost:4000/api` | A frontend által használt API gyökér |
| `NODE_ENV` | – | `production` esetén nincs source map, és tömör build készül |

## API végpontok

Az összes API-végpont az `/api` prefix alatt található. A válaszok JSON formátumúak.

### `GET /api/health`
Egészségügyi ellenőrzés.

**Válasz:** `200 OK`
```json
{ "status": "ok", "ts": "2026-05-17T12:34:56.000Z" }
```

### `GET /api/blogs`
Az összes blog listája. Opcionálisan szűrhető kategória szerint.

**Query paraméterek:**
- `category` (opcionális) — pl. `?category=sports`

**Válasz:** `200 OK`
```json
[
  {
    "id": 1,
    "title": "Bolt-On Security the Linux Way",
    "body": "Lorem ipsum...",
    "author": "Tasfia",
    "blogImage": "https://...",
    "category": "technology",
    "createdAt": "2026-05-17 12:00:00"
  }
]
```

### `GET /api/blogs/:id`
Egy konkrét blog lekérése.

**Válasz:**
- `200 OK` — blog objektum
- `400 Bad Request` — érvénytelen id
- `404 Not Found` — nincs ilyen blog

### `POST /api/blogs`
Új blog létrehozása. Ha a `category` még nem létezik, automatikusan létrejön.

**Request body:**
```json
{
  "title":     "Cím (kötelező)",
  "body":      "Tartalom (kötelező)",
  "author":    "Szerző neve (kötelező)",
  "category":  "kategoria-neve (kötelező)",
  "blogImage": "https://... (opcionális)"
}
```

**Válasz:**
- `201 Created` — a létrehozott blog objektum
- `400 Bad Request` — hiányzó kötelező mező, válasz tartalmazza a `missing` tömböt

### `DELETE /api/blogs/:id`
Blog törlése.

**Válasz:**
- `204 No Content` — sikeres törlés
- `400 Bad Request` — érvénytelen id
- `404 Not Found` — nincs ilyen blog

### `GET /api/categories`
Az összes kategória lekérése a hozzájuk tartozó blogok számával.

**Válasz:** `200 OK`
```json
[
  { "id": 1, "name": "technology", "blogCount": 2 },
  { "id": 2, "name": "sports", "blogCount": 1 }
]
```

## Adatbázis-séma

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
  blog_image  TEXT,
  category_id INTEGER NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE INDEX idx_blogs_category ON blogs(category_id);
```

A `blogs.category_id` egy idegenkulcs a `categories.id`-re — ez a klasszikus 1:N relációs kapcsolat.

## Tesztelés

### Backend (Mocha + Chai + Supertest)
13 integrációs teszt, amelyek egy ideiglenes SQLite adatbázis (`os.tmpdir()` alatt) ellen futnak.

```powershell
pnpm server:test
```

Lefedett esetek:
- `/api/health` válaszidő és státusz
- `GET /api/blogs` — összes lekérés, kategória szűrés, üres lista
- `GET /api/blogs/:id` — siker, 404, 400
- `POST /api/blogs` — létrehozás, hiányzó mezők, új kategória létrehozása
- `DELETE /api/blogs/:id` — siker, 404
- `GET /api/categories` — kategóriák blogszámmal

### Frontend (Jest + React Testing Library)
8 unit teszt (5 `BlogList` + 3 `App`).

```powershell
pnpm client:test
```

Lefedett esetek:
- `BlogList` — blogok renderelése, linkek a részletekre, kereső és kategória handler-ek
- `App` — header megjelenítése, fetch hívás a backendre, hibakezelés

Mindkettő egyben:

```powershell
pnpm test
```

## CI/CD

A `.github/workflows/node.js.yml` workflow három párhuzamos / szekvenciális job-ot futtat minden push és pull request esetén:

1. **frontend** — `pnpm install --frozen-lockfile`, `pnpm run client:build`, `CI=true pnpm run client:test` (Node 22)
2. **backend** — `pnpm install --frozen-lockfile` a `server/`-ben, majd `pnpm test` (Node 22)
3. **docker** — Docker image építése (csak akkor fut le, ha az előző kettő zöld)

A workflow a `main` és `master` ágakra történő push-ra és PR-re fut.

## Licenc

MIT
