# Cold Mailing

Plateforme de prospection commerciale automatisée pour le marché français : découverte de leads, enrichissement (email / LinkedIn), envoi de messages personnalisés et suivi via un dashboard.

---

## Fonctionnalités

| Module | Description |
| --- | --- |
| **Découverte** | Scraping de job boards (Welcome to the Jungle, Indeed) pour identifier des entreprises qui recrutent (ex. React / Next.js). |
| **Enrichissement** | Normalisation de domaine, recherche d’emails sur les pages contact / about / mentions légales, génération de messages LinkedIn. |
| **Envoi** | Cold emails via Resend, templates personnalisables, suivi du statut des leads. |
| **Dashboard** | Authentification JWT, liste et détail des leads, mise à jour du pipeline commercial. |

Statuts lead : `NEW` → `CONTACTED` → `REPLIED` → `INTERESTED` → `CLOSED`.

---

## Stack

| Couche | Technologies |
| --- | --- |
| **API** | Fastify 5, TypeScript (ESM), Zod, Prisma 7, PostgreSQL 16, Redis 7, Resend, Playwright |
| **App** | Next.js 16 (App Router), React 19, Tailwind CSS 4, TanStack Query, shadcn/ui |
| **Qualité** | Vitest, Biome (API), ESLint (app), Husky + lint-staged |
| **Ops** | Docker Compose (dev / prod), pnpm |

Architecture : **Clean Architecture + DDD** (domain → application → adapters). La logique métier vit dans les use cases ; les routes et Prisma ne font que du mapping.

---

## Prérequis

- [Node.js](https://nodejs.org/) ≥ 22 (recommandé : 24, aligné Docker)
- [pnpm](https://pnpm.io/) ≥ 10
- [Docker](https://docs.docker.com/get-docker/) + Docker Compose (optionnel mais recommandé)

---

## Démarrage rapide

### 1. Configuration

```bash
cp .env.example .env
```

Renseigner au minimum `COOKIE_SECRET`, `JWT_SECRET`, et en prod des valeurs fortes. Voir [Variables d’environnement](#variables-denvironnement).

### 2. Mode développement (recommandé)

Infra (Postgres + Redis + API hot-reload) :

```bash
pnpm docker:dev
```

Frontend en local :

```bash
cd app && pnpm install && pnpm dev
```

| Service | URL |
| --- | --- |
| API | http://localhost:3000 |
| App | http://localhost:3001 |

Arrêt :

```bash
pnpm docker:dev:down
```

### 3. Mode production (stack complète)

```bash
pnpm docker:prod
```

Frontend : http://localhost:3001 — API : http://localhost:3000

```bash
pnpm docker:prod:down          # arrêt
pnpm docker:prod:delete        # arrêt + volumes
```

### 4. Sans Docker (API seule)

Prérequis : Postgres et Redis accessibles (`DATABASE_URL`, `REDIS_URL` dans `.env`).

```bash
cd api
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev
```

```bash
cd app
pnpm install
pnpm dev
```

---

## Structure du dépôt

```
cold-mailing/
├── api/                    # Backend Fastify
│   ├── prisma/             # Schema & migrations
│   ├── src/
│   │   ├── domain/         # Entités, repositories (interfaces)
│   │   ├── application/    # Use cases (command / query) & ports
│   │   ├── adapters/
│   │   │   ├── primary/    # HTTP (routes, plugins, schemas Zod)
│   │   │   └── secondary/  # Prisma, scrapers, email, JWT, etc.
│   │   └── pkg/            # Config, logger, cache, utilitaires
│   └── tests/
├── app/                    # Frontend Next.js
│   └── src/
│       ├── app/            # App Router (pages)
│       ├── components/
│       ├── hooks/
│       └── lib/            # Clients API, auth, query keys
├── docker-compose.dev.yml
├── docker-compose.prod.yml
└── .env.example
```

---

## Scripts

### Racine

| Commande | Description |
| --- | --- |
| `pnpm docker:dev` | Stack dev (Postgres, Redis, API) |
| `pnpm docker:prod` | Stack prod (Postgres, Redis, API, app) |
| `pnpm audit` | Audit dépendances api + app |

### `api/`

| Commande | Description |
| --- | --- |
| `pnpm dev` | Serveur avec rechargement (`tsx watch`) |
| `pnpm check` | Biome + vérification TypeScript |
| `pnpm test` | Tests Vitest |
| `pnpm test:e2e` | Tests Playwright |
| `pnpm db:migrate` | Migration Prisma (dev) |
| `pnpm db:studio` | Prisma Studio |

### `app/`

| Commande | Description |
| --- | --- |
| `pnpm dev` | Next.js en développement |
| `pnpm build` / `pnpm start` | Build & démarrage production |
| `pnpm lint` | ESLint |
| `pnpm test` | Tests Vitest |

---

## Qualité & Git hooks

Pre-commit (Husky) : `npx lint-staged`

- Fichiers `api/**` → Biome (`check --write`)
- Fichiers `app/**` → ESLint (`--fix`)

Toute évolution métier doit s’accompagner de tests (use cases, adapters, composants UI, routes).

---

## Variables d’environnement

Fichier de référence : [`.env.example`](.env.example).

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | Connexion PostgreSQL |
| `REDIS_URL` | Cache Redis |
| `BASE_URL_API` / `BASE_URL_APP` | Origines CORS & URLs publiques |
| `NEXT_PUBLIC_API_URL` | URL API côté navigateur (build Next.js) |
| `COOKIE_SECRET` / `JWT_SECRET` | Secrets auth (**obligatoires en prod**) |
| `JWT_ACCESS_TTL_SECONDS` / `JWT_REFRESH_TTL_SECONDS` | Durée de vie des tokens |
| `RESEND_API_KEY` / `FROM_EMAIL` | Envoi d’emails |
| `GOOGLE_MAPS_API_KEY` | Géocodage (si utilisé) |

En Docker Compose, `DATABASE_URL` pointe vers le service `postgres` du réseau interne ; en local hors Docker, utiliser `localhost`.

---

## Licence

ISC — ioTactile Cold Mailing
