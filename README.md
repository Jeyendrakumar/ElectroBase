# ElectroBase

The ultimate all-in-one electronics and hardware component reference library for engineers, professional designers, and makers. Browse, search, and instantly access specifications, pin configurations, footprint dimensions, and datasheet downloads for a massive catalog of components in one place.

## Features

- **Component Catalog** — Look up detailed specifications, packages, and dimensions across **16 component categories** (ICs, microcontrollers, sensors, passive components, motor drivers, voltage references, display modules, etc.).
- **Dynamic Stats Dashboard** — Home screen displays real-time breakdowns of components, total categories, direct datasheet downloads, and user favorites.
- **Enhanced Search & Filtering** — Filter and narrow down parts quickly by **Category**, **Footprint**, and **Manufacturer** (Texas Instruments, Microchip, STMicroelectronics, Espressif, Bosch, etc.).
- **Interactive Pin Configuration** — Clear pin numbers, names, and descriptions for all component connections.
- **Interactive Detail Sidebar** — Quick reference sidebar details package type, category, manufacturer, footprint, and pin counts.
- **Reference Footprints** — Browse standard PCB footprints (DIP, SOIC, QFN, BGA, SOT, etc.) with dimension info and recommended layout parameters.
- **Clickable Search Tags** — Hashtags on component details link back to related search terms.
- **Favorites** — Save components to your personal favorites list (saved locally in browser storage).
- **Admin Panel** — Dedicated admin portal to create, modify, or delete parts and footprints.

## Tech Stack

- **Framework** — [Next.js](https://nextjs.org) 16 (App Router)
- **Database** — [Turso](https://turso.tech) (serverless SQLite) / SQLite (local dev)
- **ORM** — [Prisma](https://prisma.io) 5
- **Styling** — [Tailwind CSS](https://tailwindcss.com) 4
- **Icons** — [Lucide React](https://lucide.dev)
- **Deployment** — [Vercel](https://vercel.com)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Local Development

```bash
# Install dependencies
npm install

# Setup env variables
# Create a .env file with DATABASE_URL="file:./dev.db"

# Sync schema and generate client
npx prisma db push

# Seed the database (Populates 16 categories, 11 footprints, and 81+ real components)
npm run seed

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables

Configure these variables in your `.env` or Vercel dashboard:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Local SQLite path (`file:./dev.db`) |
| `TURSO_DATABASE_URL` | Turso database URL (production) |
| `TURSO_AUTH_TOKEN` | Turso authentication token (production) |
| `ADMIN_PASSWORD` | Password for admin panel access |

## Developers

- **Jeyendrakumar** — Project Lead & Developer
- **Selva.Ux** — Developer & Designer

