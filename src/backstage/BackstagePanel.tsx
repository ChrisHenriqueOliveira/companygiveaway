import { Gift, History, Settings, UserX, Users } from 'lucide-react';
import { useState } from 'react';
import { Tabs } from '../ui';
import { EventTab } from './EventTab';
import { ExclusionsTab } from './ExclusionsTab';
import { HistoryTab } from './HistoryTab';
import { ParticipantsTab } from './ParticipantsTab';
import { PrizesTab } from './PrizesTab';

export type BackstageTab = 'prizes' | 'participants' | 'exclusions' | 'history' | 'event';

const ICON = { size: 16, strokeWidth: 3 } as const;

export function BackstagePanel({ initialTab = 'prizes' }: { initialTab?: BackstageTab }) {
  const [tab, setTab] = useState<BackstageTab>(initialTab);
  return (
    <div className="flex flex-col gap-6">
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'prizes', label: 'Prêmios', icon: <Gift {...ICON} /> },
          { id: 'participants', label: 'Participantes', icon: <Users {...ICON} /> },
          { id: 'exclusions', label: 'Exclusões', icon: <UserX {...ICON} /> },
          { id: 'history', label: 'Histórico', icon: <History {...ICON} /> },
          { id: 'event', label: 'Evento', icon: <Settings {...ICON} /> },
        ]}
      />
      {tab === 'prizes' && <PrizesTab />}
      {tab === 'participants' && <ParticipantsTab />}
      {tab === 'exclusions' && <ExclusionsTab />}
      {tab === 'history' && <HistoryTab />}
      {tab === 'event' && <EventTab />}
    </div>
  );
}
