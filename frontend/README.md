# Frontend SaaS Avicole ERP

Frontend Next.js 14 App Router, TypeScript strict, shadcn/ui, Zustand persist, TanStack Query v5, TanStack Table v8, Recharts, React Hook Form + Zod.

## Démarrage local

```bash
npm install
npm run dev
```

Par défaut, le frontend écoute sur `http://localhost:3000`.

## Docker Compose

Le service `frontend` est intégré au `docker-compose.yml` racine.

```bash
docker compose up --build frontend nginx api
```

URLs utiles:

- Front via Nginx: `http://localhost:10080`
- Front direct: `http://localhost:13000`
- API Django directe: `http://localhost:18000`

## Variables

Créer `frontend/.env.local` si besoin:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:18000/api
```

En Docker Compose, `NEXT_PUBLIC_API_BASE_URL` pointe vers `http://localhost:18000/api`, qui correspond aux routes Django listées par `config.urls`.
