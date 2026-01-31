# TeamTracker

**Volleyball team management made simple.** Track rosters, schedule practices, manage attendance, and plan effective training sessions with a comprehensive drill library.

TeamTracker is designed for volleyball coaches who need a centralized system to manage teams across seasons while working seamlessly offline at gyms and fields.

---

## Features

### For Coaches

- **Roster Management**: Track players across seasons with continuous profiles
- **Schedule & Attendance**: Create events with RSVP system and attendance tracking
- **Practice Planning**: Build structured practice plans using your custom drill library
- **Drill Library**: Organize volleyball drills with skill tags, progression levels, and execution tracking
- **Analytics Dashboard**: Monitor attendance patterns, drill effectiveness, and team insights
- **Spond Import**: Migrate historical attendance data from Spond CSV exports
- **Team Invite Codes**: Share codes with players and parents to join teams easily
- **Multi-Team Support**: Manage multiple teams within seasons

### For Players

- **View Schedule**: See all upcoming practices, games, and events
- **RSVP to Events**: Let coaches know your availability in advance
- **Track Stats**: Monitor your attendance percentage and personal statistics
- **Profile Management**: Update your contact information and preferences

### For Parents

- **Link to Players**: Connect to your child's player profile
- **Manage RSVPs**: Respond to events on behalf of your child
- **View Schedule**: See your child's complete team schedule
- **Monitor Progress**: Track attendance and participation

### Technical Highlights

- **Offline-First**: Works without internet, syncs when connected
- **Progressive Web App**: Install on any device, works like a native app
- **Real-time Sync**: Changes sync automatically across all devices
- **Multi-Language**: Supports English and Norwegian (easily extensible)
- **Role-Based Access**: Granular permissions for coaches, players, and parents
- **Mobile Optimized**: Touch-friendly interface for phones and tablets

---

## Quick Start

### For Users

1. **Open the app** in your web browser
2. **Sign in with Google** - no password needed
3. **Select your role** (Coach, Player, or Parent)
4. **Join or create a team** and start tracking

**Coaches:** Create a season, add your team, invite players with a code
**Players/Parents:** Use the invite code from your coach to join

See the [Quick Start Guide](./docs/QUICK_START.md) for detailed instructions.

---

## Documentation

### User Documentation

- **[User Guide](./docs/USER_GUIDE.md)** - Comprehensive guide for all users
- **[Quick Start Guide](./docs/QUICK_START.md)** - Get up and running in 5 minutes
- **[FAQ](./docs/FAQ.md)** - Frequently asked questions

### Feature Documentation

- **[Teams & Roster Management](./docs/features/TEAMS.md)** - Managing teams, seasons, and players
- **[Schedule & Events](./docs/features/SCHEDULE.md)** - Creating and managing events
- **[Attendance Tracking](./docs/features/ATTENDANCE.md)** - RSVP and attendance system
- **[Drill Library](./docs/features/DRILLS.md)** - Building your drill collection
- **[Practice Planning](./docs/features/PRACTICE_PLANS.md)** - Creating structured practice plans
- **[Import Feature](./docs/import-feature.md)** - Importing data from Spond

### Technical Documentation

- **[SPEC.md](./SPEC.md)** - Complete product specification
- **[Deployment Guide](DEPLOYMENT.md)** - Deployment instructions
- **[Architecture](#tech-stack)** - Technical architecture details

---

## Tech Stack

### Frontend

- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4.0
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router
- **i18n**: react-i18next

### Backend & Data

- **Backend**: Supabase
  - PostgreSQL database
  - Authentication (Google OAuth)
  - Real-time subscriptions
  - Row-level security
- **Offline Storage**: Dexie.js (IndexedDB wrapper)
- **Sync Strategy**: Optimistic updates with background sync

### Build & Development

- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Linting**: ESLint
- **Formatting**: Prettier
- **Testing**: Vitest + React Testing Library

### Deployment

- **Hosting**: Vercel (recommended) or Cloudflare Pages
- **PWA**: Service Worker for offline functionality
- **CDN**: Automatic via hosting platform

---

## Getting Started (Development)

### Prerequisites

- **Node.js** 18 or higher
- **pnpm** 8 or higher
- **Supabase Account** (free tier works)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd TeamTracker
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Start development server**

```bash
pnpm dev
```

The app will be available at `http://localhost:5173`

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build locally |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format code with Prettier |
| `pnpm test` | Run tests in watch mode |
| `pnpm test:run` | Run tests once |
| `pnpm deploy` | Deploy to Vercel (production) |
| `pnpm deploy:preview` | Deploy to Vercel (preview) |

---

## Project Structure

```
TeamTracker/
├── docs/                    # User and feature documentation
│   ├── features/           # Feature-specific guides
│   ├── USER_GUIDE.md       # Comprehensive user guide
│   ├── QUICK_START.md      # Quick start guide
│   └── FAQ.md              # Frequently asked questions
├── public/                  # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── ui/            # Base UI components (shadcn/ui)
│   │   ├── teams/         # Team-specific components
│   │   ├── players/       # Player-specific components
│   │   ├── schedule/      # Schedule and events
│   │   ├── attendance/    # Attendance tracking
│   │   ├── drills/        # Drill library
│   │   └── practices/     # Practice planning
│   ├── hooks/              # Custom React hooks
│   ├── i18n/               # Internationalization
│   │   └── locales/       # Translation files (en, no)
│   ├── lib/                # Utility functions and helpers
│   ├── pages/              # Page components (routes)
│   ├── services/           # API and data services
│   │   ├── supabase.ts    # Supabase client
│   │   ├── offline.ts     # Offline sync service
│   │   └── *.service.ts   # Domain-specific services
│   ├── store/              # Zustand state stores
│   ├── types/              # TypeScript type definitions
│   ├── App.tsx             # Root component
│   └── main.tsx            # Application entry point
├── .env.example            # Environment variable template
├── SPEC.md                 # Product specification
├── package.json            # Dependencies and scripts
└── vite.config.ts          # Vite configuration
```

---

## Development Philosophy

TeamTracker is built with these core principles:

1. **Offline-First**: Must work fully without internet at gyms/fields, syncing when connected
2. **Clean UX**: Avoid feature overload; focus on essential workflows for coaches
3. **Continuous Player History**: Athletes tracked across seasons and teams as single identities
4. **Coach-Centric**: Optimized for coach workflows; player/parent access is secondary
5. **Low Cost**: Architecture designed to stay within free tiers or very low-cost hosting

See [SPEC.md](./SPEC.md) for complete product requirements and design decisions.

---

## Deployment

TeamTracker is configured for deployment on Vercel with automatic CI/CD via GitHub Actions.

### Quick Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
pnpm run deploy
```

### Required Environment Variables

Set these in Vercel dashboard before deploying:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_ENVIRONMENT` - Set to `production`

### Full Documentation

- **[Deployment Guide](DEPLOYMENT.md)** - Complete step-by-step deployment instructions
- **[GitHub Actions Setup](.github/GITHUB_ACTIONS_SETUP.md)** - Configure automatic deployments
- **[Quick Reference](.github/DEPLOYMENT_QUICK_REFERENCE.md)** - Common commands and troubleshooting
- **[Pre-Deployment Checklist](.github/PRE_DEPLOYMENT_CHECKLIST.md)** - Verify before deploying

---

## Contributing

We welcome contributions! Here's how to get started:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Test thoroughly** (unit tests, integration tests, manual testing)
5. **Commit your changes** (`git commit -m 'Add amazing feature'`)
6. **Push to your branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Code Style

- Follow the existing code style
- Use TypeScript for all new code
- Add JSDoc comments for complex functions
- Use meaningful variable and function names
- Keep components focused and single-purpose

### Commit Messages

Use clear, descriptive commit messages:

- `feat: Add drill progression tracking`
- `fix: Resolve RSVP sync issue`
- `docs: Update user guide with new features`
- `refactor: Simplify attendance service`
- `test: Add tests for import feature`

### Testing

- Write unit tests for utilities and services
- Add component tests for complex UI
- Test offline functionality
- Verify across browsers and devices
- Check mobile responsiveness

---

## Roadmap

### Current Version (MVP - Phase 1)

- Core roster and team management
- Schedule and attendance tracking
- Practice planning with drill library
- Basic analytics
- Spond import
- User management

### Planned Features (Phase 2)

- Live game statistics entry
- Enhanced analytics and visualizations
- Practice plan sharing between coaches
- Advanced drill library features
- Player development tracking

### Future Considerations (Phase 3)

- Lineup and rotation planning tools
- Full Spond replacement features
- Push notifications
- Public team pages
- Mobile native apps (if needed)

See [SPEC.md](./SPEC.md) for detailed roadmap.

---

## Browser Support

TeamTracker supports modern browsers:

- **Chrome** 90+
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+
- **Mobile Safari** (iOS 14+)
- **Chrome Mobile** (Android 8+)

### Progressive Web App

Install as a PWA on:

- iOS (Safari)
- Android (Chrome)
- Windows (Chrome, Edge)
- macOS (Safari, Chrome)
- Linux (Chrome, Firefox)

---

## Security

- **Authentication**: OAuth 2.0 via Google
- **Data Encryption**: HTTPS for all connections
- **Database Security**: Supabase Row-Level Security (RLS)
- **Access Control**: Role-based permissions
- **Data Privacy**: GDPR compliant

Report security issues to your administrator or repository owner.

---

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## Support

### For Users

- Read the [User Guide](./docs/USER_GUIDE.md)
- Check the [FAQ](./docs/FAQ.md)
- Contact your team's head coach

### For Developers

- Review the [SPEC.md](./SPEC.md)
- Check existing issues
- Read the code documentation
- Join development discussions

---

## Acknowledgments

TeamTracker is built with:

- [React](https://react.dev/) - UI framework
- [Supabase](https://supabase.com/) - Backend platform
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Dexie.js](https://dexie.org/) - IndexedDB wrapper
- [Vite](https://vitejs.dev/) - Build tool

Special thanks to the open-source community for making this possible.

---

*Built with care for volleyball coaches everywhere.*
