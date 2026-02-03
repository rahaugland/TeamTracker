import { StatCard } from '@/components/dashboard/StatCard';
import { TodayEventCard } from '@/components/dashboard/TodayEventCard';
import { ScheduleItem } from '@/components/schedule/ScheduleItem';
import { PlayerAvatar } from '@/components/player/PlayerAvatar';
import { RSVPStatusBadge } from '@/components/common/RSVPStatusBadge';

/**
 * Showcase component for testing the new wireframe-based shared components.
 * This component demonstrates all variants and states of the new components.
 */
export function ComponentShowcaseWireframe() {
  return (
    <div className="min-h-screen bg-navy p-8 space-y-12">
      <div>
        <h1 className="font-display text-3xl font-bold text-white mb-2">
          Wireframe Components Showcase
        </h1>
        <p className="text-gray-400">
          Testing shared components from coach wireframes
        </p>
      </div>

      {/* StatCard Examples */}
      <section>
        <h2 className="font-display text-2xl font-bold text-white mb-4">
          StatCard Component
        </h2>
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Attendance Rate"
            value="87%"
            delta="+3.2% vs last month"
            deltaType="positive"
            accent="success"
          />
          <StatCard
            label="Win Rate"
            value="72%"
            delta="+8% vs last season"
            deltaType="positive"
            accent="primary"
          />
          <StatCard
            label="Active Players"
            value={16}
            delta="of 18 registered"
            deltaType="neutral"
            accent="secondary"
          />
          <StatCard
            label="Next Match"
            value="3 days"
            delta="vs Bergen VBK"
            deltaType="neutral"
            accent="teal"
            onClick={() => alert('Clicked!')}
          />
        </div>
        <div className="grid grid-cols-4 gap-4 mt-4">
          <StatCard
            label="Total Points"
            value="1,234"
            delta="-12 vs last week"
            deltaType="negative"
            accent="primary"
          />
          <StatCard
            label="Gray Accent"
            value="99"
            accent="gray"
          />
        </div>
      </section>

      {/* TodayEventCard Examples */}
      <section>
        <h2 className="font-display text-2xl font-bold text-white mb-4">
          TodayEventCard Component
        </h2>
        <div className="max-w-md">
          <TodayEventCard
            title="Team Practice"
            location="Lambertseter Hall"
            time="18:00 - 20:00"
            rsvpSummary={{
              coming: 12,
              notComing: 2,
              pending: 4,
            }}
            onViewDetails={() => alert('View details clicked!')}
          />
        </div>
        <div className="max-w-md mt-4">
          <TodayEventCard
            title="Championship Match"
            location="National Arena"
            time="19:00 - 21:00"
            rsvpSummary={{
              coming: 18,
              notComing: 0,
              pending: 0,
            }}
          />
        </div>
      </section>

      {/* ScheduleItem Examples */}
      <section>
        <h2 className="font-display text-2xl font-bold text-white mb-4">
          ScheduleItem Component
        </h2>
        <div className="max-w-md space-y-2">
          <ScheduleItem
            day="03"
            month="Feb"
            title="Team Practice"
            meta="Lambertseter Hall, 18:00"
            type="practice"
            isToday={true}
            onClick={() => alert('Today practice clicked')}
          />
          <ScheduleItem
            day="06"
            month="Feb"
            title="vs Bergen VBK"
            meta="Ekeberg Hallen, 19:00"
            type="match"
            onClick={() => alert('Match clicked')}
          />
          <ScheduleItem
            day="08"
            month="Feb"
            title="Team Practice"
            meta="Lambertseter Hall, 18:00"
            type="practice"
          />
          <ScheduleItem
            day="13"
            month="Feb"
            title="vs Trondheim VBK"
            meta="Away - Trondheim Arena, 18:30"
            type="match"
          />
        </div>
      </section>

      {/* PlayerAvatar Examples */}
      <section>
        <h2 className="font-display text-2xl font-bold text-white mb-4">
          PlayerAvatar Component
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-white font-semibold mb-2">Small (default)</h3>
            <div className="flex gap-3">
              <PlayerAvatar initials="EH" />
              <PlayerAvatar initials="SN" position="S" />
              <PlayerAvatar initials="KL" position="MB" />
              <PlayerAvatar initials="IJ" position="OPP" />
            </div>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-2">Medium</h3>
            <div className="flex gap-3">
              <PlayerAvatar initials="EH" size="md" />
              <PlayerAvatar initials="SN" position="S" size="md" />
              <PlayerAvatar initials="KL" position="MB" size="md" />
              <PlayerAvatar initials="OB" position="L" size="md" />
            </div>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-2">Large</h3>
            <div className="flex gap-3">
              <PlayerAvatar initials="EH" size="lg" />
              <PlayerAvatar initials="SN" position="S" size="lg" />
              <PlayerAvatar initials="AK" position="OH" size="lg" />
            </div>
          </div>
        </div>
      </section>

      {/* RSVPStatusBadge Examples */}
      <section>
        <h2 className="font-display text-2xl font-bold text-white mb-4">
          RSVPStatusBadge Component
        </h2>
        <div className="flex gap-3 flex-wrap">
          <RSVPStatusBadge status="coming" />
          <RSVPStatusBadge status="not-coming" />
          <RSVPStatusBadge status="pending" />
          <RSVPStatusBadge status="coming" label="Confirmed" />
          <RSVPStatusBadge status="not-coming" label="Declined" />
          <RSVPStatusBadge status="pending" label="No Response" />
        </div>
      </section>

      {/* Combined Example: Player RSVP List */}
      <section>
        <h2 className="font-display text-2xl font-bold text-white mb-4">
          Combined Example: Player RSVP List
        </h2>
        <div className="max-w-md space-y-2">
          {[
            { name: 'Erik Hansen', initials: 'EH', position: 'OH', status: 'coming' as const },
            { name: 'Sofia Nilsen', initials: 'SN', position: 'S', status: 'coming' as const },
            { name: 'Kristian Larsen', initials: 'KL', position: 'MB', status: 'not-coming' as const },
            { name: 'Ingrid Johansen', initials: 'IJ', position: 'OPP', status: 'pending' as const },
            { name: 'Ole Berg', initials: 'OB', position: 'L', status: 'coming' as const },
          ].map((player) => (
            <div
              key={player.initials}
              className="flex items-center justify-between p-3 bg-navy-90 rounded-lg border border-white/[0.06] hover:border-white/[0.12] transition-all"
            >
              <div className="flex items-center gap-3">
                <PlayerAvatar
                  initials={player.initials}
                  position={player.position}
                  size="md"
                />
                <div>
                  <p className="font-display font-semibold text-white">
                    {player.name}
                  </p>
                  <p className="text-xs text-gray-400">{player.position}</p>
                </div>
              </div>
              <RSVPStatusBadge status={player.status} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
