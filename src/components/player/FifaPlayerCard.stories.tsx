import { FifaPlayerCard, createDefaultSkills, type SkillRating } from './FifaPlayerCard';

/**
 * Example usage and demo of the FifaPlayerCard component
 */

// Example 1: Erik Hansen - The rising star with overall improvement
const erikHansenSkills: SkillRating[] = [
  { type: 'serve', value: 76, trend: 'up', label: 'Serve', abbr: 'SRV' },
  { type: 'receive', value: 72, trend: 'down', label: 'Receive', abbr: 'RCV' },
  { type: 'set', value: 65, label: 'Set', abbr: 'SET' },
  { type: 'block', value: 74, trend: 'up', label: 'Block', abbr: 'BLK' },
  { type: 'attack', value: 82, trend: 'up', label: 'Attack', abbr: 'ATK' },
  { type: 'dig', value: 68, label: 'Dig', abbr: 'DIG' },
  { type: 'mental', value: 80, label: 'Mental', abbr: 'MNT' },
  { type: 'physique', value: 77, trend: 'up', label: 'Physique', abbr: 'PHY' },
];

// Example 2: Elite player with high ratings
const elitePlayerSkills: SkillRating[] = [
  { type: 'serve', value: 92, trend: 'up', label: 'Serve', abbr: 'SRV' },
  { type: 'receive', value: 88, label: 'Receive', abbr: 'RCV' },
  { type: 'set', value: 85, label: 'Set', abbr: 'SET' },
  { type: 'block', value: 91, trend: 'up', label: 'Block', abbr: 'BLK' },
  { type: 'attack', value: 95, trend: 'up', label: 'Attack', abbr: 'ATK' },
  { type: 'dig', value: 89, label: 'Dig', abbr: 'DIG' },
  { type: 'mental', value: 93, label: 'Mental', abbr: 'MNT' },
  { type: 'physique', value: 90, label: 'Physique', abbr: 'PHY' },
];

// Example 3: Developing player with mixed trends
const developingPlayerSkills: SkillRating[] = [
  { type: 'serve', value: 58, trend: 'up', label: 'Serve', abbr: 'SRV' },
  { type: 'receive', value: 62, trend: 'up', label: 'Receive', abbr: 'RCV' },
  { type: 'set', value: 55, trend: 'down', label: 'Set', abbr: 'SET' },
  { type: 'block', value: 60, label: 'Block', abbr: 'BLK' },
  { type: 'attack', value: 65, trend: 'up', label: 'Attack', abbr: 'ATK' },
  { type: 'dig', value: 54, trend: 'down', label: 'Dig', abbr: 'DIG' },
  { type: 'mental', value: 70, trend: 'up', label: 'Mental', abbr: 'MNT' },
  { type: 'physique', value: 63, label: 'Physique', abbr: 'PHY' },
];

/**
 * FifaPlayerCardShowcase
 *
 * Demo component showing various player card examples
 */
export function FifaPlayerCardShowcase() {
  return (
    <div className="min-h-screen bg-navy p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-display font-bold text-white mb-2">
          FIFA-Style Player Cards
        </h1>
        <p className="text-lg text-[#8B95A5] mb-12">
          VolleyQuest player rating cards inspired by FIFA Ultimate Team
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Example 1: Gold tier player with overall improvement */}
          <div className="flex flex-col items-center">
            <FifaPlayerCard
              playerName="Erik Hansen"
              initials="EH"
              overallRating={78}
              position="OH"
              tier="gold"
              clubName="Oslo Volley U19"
              ratingChange={{ value: 3, direction: 'up' }}
              skills={erikHansenSkills}
            />
            <div className="mt-4 text-center">
              <p className="text-sm font-display font-semibold text-club-secondary">
                RISING STAR
              </p>
              <p className="text-xs text-[#8B95A5]">
                Gold tier • +3 rating improvement
              </p>
            </div>
          </div>

          {/* Example 2: Elite tier player */}
          <div className="flex flex-col items-center">
            <FifaPlayerCard
              playerName="Anna Svensson"
              initials="AS"
              overallRating={91}
              position="MB"
              tier="elite"
              clubName="Bergen VK Elite"
              ratingChange={{ value: 2, direction: 'up' }}
              skills={elitePlayerSkills}
            />
            <div className="mt-4 text-center">
              <p className="text-sm font-display font-semibold text-[#9333EA]">
                ELITE PLAYER
              </p>
              <p className="text-xs text-[#8B95A5]">
                Elite tier • Top performer
              </p>
            </div>
          </div>

          {/* Example 3: Bronze tier developing player */}
          <div className="flex flex-col items-center">
            <FifaPlayerCard
              playerName="Lars Johansen"
              initials="LJ"
              overallRating={62}
              position="S"
              tier="bronze"
              clubName="Trondheim Youth"
              ratingChange={{ value: 4, direction: 'up' }}
              skills={developingPlayerSkills}
            />
            <div className="mt-4 text-center">
              <p className="text-sm font-display font-semibold text-[#CD7F32]">
                DEVELOPING TALENT
              </p>
              <p className="text-xs text-[#8B95A5]">
                Bronze tier • +4 rating growth
              </p>
            </div>
          </div>

          {/* Example 4: Silver tier stable player */}
          <div className="flex flex-col items-center">
            <FifaPlayerCard
              playerName="Maria Berg"
              initials="MB"
              overallRating={74}
              position="OPP"
              tier="silver"
              clubName="Stavanger VBK"
              ratingChange={{ value: 0, direction: 'stable' }}
              skills={createDefaultSkills({
                serve: 72,
                receive: 70,
                set: 65,
                block: 76,
                attack: 78,
                dig: 71,
                mental: 75,
                physique: 74,
              })}
            />
            <div className="mt-4 text-center">
              <p className="text-sm font-display font-semibold text-[#C0C0C0]">
                CONSISTENT PERFORMER
              </p>
              <p className="text-xs text-[#8B95A5]">
                Silver tier • Stable ratings
              </p>
            </div>
          </div>

          {/* Example 5: Diamond tier player with decline */}
          <div className="flex flex-col items-center">
            <FifaPlayerCard
              playerName="Thomas Nilsen"
              initials="TN"
              overallRating={85}
              position="L"
              tier="diamond"
              clubName="Kristiansand Elite"
              ratingChange={{ value: -1, direction: 'down' }}
              skills={createDefaultSkills({
                serve: 80,
                receive: 90,
                set: 78,
                block: 82,
                attack: 84,
                dig: 92,
                mental: 88,
                physique: 83,
              })}
            />
            <div className="mt-4 text-center">
              <p className="text-sm font-display font-semibold text-[#B9F2FF]">
                VETERAN SPECIALIST
              </p>
              <p className="text-xs text-[#8B95A5]">
                Diamond tier • Minor decline
              </p>
            </div>
          </div>

          {/* Example 6: Using helper function */}
          <div className="flex flex-col items-center">
            <FifaPlayerCard
              playerName="Sofia Andersen"
              initials="SA"
              overallRating={69}
              position="OH"
              tier="silver"
              clubName="Drammen VK"
              skills={createDefaultSkills({
                serve: 68,
                receive: 71,
                attack: 73,
                block: 65,
                dig: 67,
              })}
            />
            <div className="mt-4 text-center">
              <p className="text-sm font-display font-semibold text-[#8B95A5]">
                BALANCED PLAYER
              </p>
              <p className="text-xs text-[#8B95A5]">
                Using default skills helper
              </p>
            </div>
          </div>
        </div>

        {/* Usage Examples */}
        <div className="mt-16 bg-navy-90 border border-white/[0.06] rounded-xl p-8">
          <h2 className="text-2xl font-display font-bold text-white mb-6">
            Usage Examples
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-display font-semibold text-club-secondary mb-2">
                Basic Usage
              </h3>
              <pre className="bg-navy p-4 rounded-lg overflow-x-auto text-sm text-[#8B95A5] font-mono">
{`<FifaPlayerCard
  playerName="Erik Hansen"
  initials="EH"
  overallRating={78}
  position="OH"
  tier="gold"
  clubName="Oslo Volley U19"
  ratingChange={{ value: 3, direction: 'up' }}
  skills={erikHansenSkills}
/>`}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-display font-semibold text-club-secondary mb-2">
                Using Helper Function
              </h3>
              <pre className="bg-navy p-4 rounded-lg overflow-x-auto text-sm text-[#8B95A5] font-mono">
{`import { createDefaultSkills } from '@/components/player';

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
/>`}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-display font-semibold text-club-secondary mb-2">
                Available Props
              </h3>
              <ul className="space-y-2 text-[#8B95A5]">
                <li><code className="text-vq-teal">playerName</code>: string - Player's full name</li>
                <li><code className="text-vq-teal">initials</code>: string - Player's initials for avatar</li>
                <li><code className="text-vq-teal">overallRating</code>: number - Overall rating (0-99)</li>
                <li><code className="text-vq-teal">position</code>: string - Position abbreviation (OH, MB, S, L, OPP)</li>
                <li><code className="text-vq-teal">tier</code>: PlayerTier - bronze | silver | gold | diamond | elite</li>
                <li><code className="text-vq-teal">clubName</code>: string - Club/team name</li>
                <li><code className="text-vq-teal">ratingChange</code>: object (optional) - Rating trend indicator</li>
                <li><code className="text-vq-teal">skills</code>: SkillRating[] - Array of 8 skill ratings</li>
                <li><code className="text-vq-teal">avatarUrl</code>: string (optional) - Custom avatar image</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FifaPlayerCardShowcase;
