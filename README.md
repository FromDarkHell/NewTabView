# new-tab-view

A self-hostable, customizable new-tab view. This includes simple features like: a clock, a cached news feed, and a Trello list
widget.

## Features

- **Clock**
- **News**: Pulls from [thenewsapi.com](https://thenewsapi.com), cached using Redis to stay within their free tier.
- **Trello**: Connect a Trello account, select a board + select a list, and view the list's cards.
- Simple multi-user authentication using Postgres.

## Stack

- [Next.js](https://nextjs.org) (App Router) + [Tailwind CSS](https://tailwindcss.com)
- [Prisma](https://www.prisma.io) + Postgres
- [Redis](https://redis.io) (via `ioredis`) for caching

## Getting started

```bash
npm install
cp .env.example .env   # fill in the values below
npx prisma migrate dev
npm run dev
```

### Environment variables

| Variable                     | Required for         | Notes                                            |
|------------------------------|----------------------|--------------------------------------------------|
| `DATABASE_URL`               | Accounts, Trello     | Postgres connection string                       |
| `REDIS_URL`                  | News, Trello caching | Redis connection string                          |
| `NEWS_API_KEY`               | News feed            | [thenewsapi.com](https://thenewsapi.com) API key |
| `NEXT_PUBLIC_TRELLO_API_KEY` | Trello integration   | Trello app key                                   |

Local Postgres/Redis can be run via `docker-compose.yml` (`docker compose up
redis postgres`) or point at your own instances.

## Docker

The `Dockerfile` builds a standalone image which includes Postgres + Redis internally. Optionally, you can plug it into other Redis/Postgres instances when
those env vars are provided.
```bash
docker compose up --build
```
