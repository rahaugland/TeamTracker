# FIFA-Style Player Card Component

A React component that displays volleyball player ratings in a FIFA Ultimate Team-inspired card format.

## Overview

The `FifaPlayerCard` component provides a visually striking way to display player statistics with a design inspired by FIFA Ultimate Team cards. It features:

- Gold gradient background with subtle glow effects
- Prominent overall rating display
- Player tier badges (Bronze, Silver, Gold, Diamond, Elite)
- Rating change indicators (↑/↓)
- Avatar with player initials or custom image
- 8 volleyball-specific skill ratings in a compact grid
- Individual skill trend indicators

## Component Structure

```
FifaPlayerCard/
├── FifaPlayerCard.tsx          # Main component
├── FifaPlayerCard.stories.tsx  # Demo/showcase examples
├── FifaPlayerCard.example.tsx  # Integration examples
└── FifaPlayerCard.README.md    # This file
```

## Basic Usage

```tsx
import { FifaPlayerCard } from '@/components/player';

function PlayerProfile() {
  return (
    <FifaPlayerCard
      playerName="Erik Hansen"
      initials="EH"
      overallRating={78}
      position="OH"
      tier="gold"
      clubName="Oslo Volley U19"
      ratingChange={{ value: 3, direction: 'up' }}
      skills={[
        { type: 'serve', value: 76, trend: 'up', label: 'Serve', abbr: 'SRV' },
        { type: 'receive', value: 72, trend: 'down', label: 'Receive', abbr: 'RCV' },
        { type: 'set', value: 65, label: 'Set', abbr: 'SET' },
        { type: 'block', value: 74, trend: 'up', label: 'Block', abbr: 'BLK' },
        { type: 'attack', value: 82, trend: 'up', label: 'Attack', abbr: 'ATK' },
        { type: 'dig', value: 68, label: 'Dig', abbr: 'DIG' },
        { type: 'mental', value: 80, label: 'Mental', abbr: 'MNT' },
        { type: 'physique', value: 77, trend: 'up', label: 'Physique', abbr: 'PHY' },
      ]}
    />
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `playerName` | `string` | Yes | Player's full name |
| `initials` | `string` | Yes | Player's initials for avatar (e.g., "EH") |
| `overallRating` | `number` | Yes | Overall rating from 0-99 |
| `position` | `string` | Yes | Position abbreviation (OH, MB, S, L, OPP) |
| `tier` | `PlayerTier` | No | Player tier: 'bronze', 'silver', 'gold', 'diamond', 'elite' (default: 'gold') |
| `clubName` | `string` | Yes | Club or team name |
| `ratingChange` | `object` | No | Rating change indicator `{ value: number, direction: 'up' \| 'down' \| 'stable' }` |
| `skills` | `SkillRating[]` | Yes | Array of 8 skill ratings |
| `className` | `string` | No | Additional CSS classes |
| `avatarUrl` | `string` | No | Custom avatar image URL |

## Skill Rating Object

```typescript
interface SkillRating {
  type: VolleyballSkill;  // 'serve' | 'receive' | 'set' | 'block' | 'attack' | 'dig' | 'mental' | 'physique'
  value: number;          // Rating value 0-99
  trend?: 'up' | 'down' | 'stable';  // Optional trend indicator
  label: string;          // Display label
  abbr: string;          // Abbreviation (SRV, RCV, etc.)
}
```

## Helper Functions

### createDefaultSkills

Creates a default skills array with ratings you specify and defaults for unspecified skills.

```tsx
import { createDefaultSkills } from '@/components/player';

const skills = createDefaultSkills({
  serve: 76,
  receive: 72,
  attack: 82,
  // Other skills will default to 50
});

<FifaPlayerCard
  playerName="Player Name"
  initials="PN"
  overallRating={75}
  position="MB"
  skills={skills}
  clubName="Team Name"
/>
```

## Integration Examples

### With Real Player Data

```tsx
import { PlayerFifaCardIntegration } from '@/components/player/FifaPlayerCard.example';

export function PlayerDetailPage() {
  const [player, setPlayer] = useState<PlayerWithMemberships | null>(null);
  const [currentRating, setCurrentRating] = useState<PlayerRating | null>(null);
  const [previousRating, setPreviousRating] = useState<PlayerRating | null>(null);

  return (
    <div className="flex gap-8">
      {player && currentRating && (
        <PlayerFifaCardIntegration
          player={player}
          playerRating={currentRating}
          previousRating={previousRating}
          teamName="Oslo Volley U19"
        />
      )}
      {/* Rest of content */}
    </div>
  );
}
```

### Quick Card for Roster

```tsx
import { QuickPlayerCard } from '@/components/player/FifaPlayerCard.example';

function TeamRoster({ players }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {players.map(player => (
        <QuickPlayerCard
          key={player.id}
          playerName={player.name}
          position={player.position}
          overallRating={player.rating}
          jerseyNumber={player.jersey}
        />
      ))}
    </div>
  );
}
```

### Player Comparison

```tsx
import { PlayerComparison } from '@/components/player/FifaPlayerCard.example';

function ComparePlayersPage() {
  return (
    <PlayerComparison
      player1={{
        name: "Erik Hansen",
        rating: 78,
        position: "OH",
        teamName: "Oslo Volley",
        skills: erikSkills
      }}
      player2={{
        name: "Anna Svensson",
        rating: 91,
        position: "MB",
        teamName: "Bergen VK",
        skills: annaSkills
      }}
    />
  );
}
```

## Design Tokens

The component uses these design tokens from the wireframe:

- **Navy Background**: `#0A1628`
- **Gold/Secondary**: `#FFB703`
- **Teal**: `#2EC4B6`
- **Success (green)**: `#22C55E`
- **Error (red)**: `#EF4444`

Font families:
- **Display**: Barlow Condensed
- **Body**: Barlow
- **Mono**: JetBrains Mono

## Styling

The component uses Tailwind CSS with custom gradients and effects. The card has:

- Fixed width: 280px
- Minimum height: 420px
- Dark golden/brown gradient background
- Subtle glow effects
- Golden border with opacity
- Shadow effects for depth

## Accessibility

- Semantic HTML structure
- Color contrast meets WCAG AA standards
- Trend indicators use both color and symbols (↑/↓)
- Alternative text support via `avatarUrl` alt attribute

## Browser Support

Supports all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Examples and Demo

To view all examples and variations:

1. Import the showcase component:
```tsx
import { FifaPlayerCardShowcase } from '@/components/player/FifaPlayerCard.stories';
```

2. Render it in your app or storybook

The showcase includes:
- Gold tier rising star
- Elite tier top performer
- Bronze tier developing player
- Silver tier consistent performer
- Diamond tier veteran
- Usage examples with code snippets

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  FifaPlayerCardProps,
  SkillRating,
  VolleyballSkill,
  PlayerTier
} from '@/components/player';
```

## Performance

- Optimized with React best practices
- No unnecessary re-renders
- Lightweight with minimal dependencies
- Uses CSS transforms for smooth animations

## Future Enhancements

Potential improvements for future versions:

- [ ] Animated rating changes
- [ ] Interactive hover states with detailed stats
- [ ] Print-friendly version
- [ ] Export as image functionality
- [ ] Multiple card themes (Team colors)
- [ ] Card flip animation to show back side with more details
- [ ] Comparison mode with two cards side-by-side
- [ ] Historical rating timeline view

## Related Components

- `PlayerAvatar` - Standard player avatar component
- `SkillRatingWidget` - Interactive skill rating input
- `SkillRatingsChart` - Detailed skills visualization
- `PlayerTrendPanel` - Performance trends over time

## Contributing

When modifying this component:

1. Maintain the FIFA card aesthetic
2. Keep the 8-skill layout
3. Preserve responsive behavior
4. Update TypeScript types
5. Add examples for new features
6. Update this README

## Questions?

For questions or issues with this component, check:
- The stories file for examples
- The integration examples for real-world usage
- The wireframe HTML file for design reference
