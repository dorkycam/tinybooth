'use client';

import { Card } from '../../ui/Card';

export interface EventStats {
  posts: number;
  strips: number;
  photos: number;
  retentionDaysRemaining: number;
  emailDeliveries: number;
  smsDeliveries: number;
  tier: 'FREE' | 'EVENT_PASS' | 'EVENT_PASS_PLUS';
}

interface OverviewTabProps {
  stats: EventStats;
}

/** Stats grid for the overview tab. */
export function OverviewTab({ stats }: OverviewTabProps): JSX.Element {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard label="Guest uploads" value={stats.posts} hint="TinyWall guest posts" />
      <StatCard label="Booth strips" value={stats.strips} hint="TinyBooth photostrips" />
      <StatCard label="Photos total" value={stats.photos} hint="Across posts and strips" />
      <StatCard
        label="Retention countdown"
        value={`${stats.retentionDaysRemaining}d`}
        hint="Until photos delete"
      />
      <StatCard
        label="Email deliveries"
        value={stats.emailDeliveries}
        hint="Counted toward your tier cap"
      />
      <StatCard
        label="SMS deliveries"
        value={stats.smsDeliveries}
        hint="Counted toward your tier cap"
      />
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  hint: string;
}

function StatCard({ label, value, hint }: StatCardProps): JSX.Element {
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-graphite">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      <p className="text-xs text-graphite mt-1">{hint}</p>
    </Card>
  );
}
