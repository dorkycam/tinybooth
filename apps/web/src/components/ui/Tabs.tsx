'use client';

import { useState, type ReactNode } from 'react';

export interface TabSpec {
  id: string;
  label: string;
  /** Lazy renderer; only invoked when the tab is active. */
  render: () => ReactNode;
}

interface TabsProps {
  tabs: TabSpec[];
  initialTabId?: string;
}

/**
 * Brand tab strip. Pure CSS (no headlessui) for tighter bundle size.
 *
 * Active tab is tracked in local state; `initialTabId` lets the caller deep
 * link from a query param if needed. Keyboard navigation is the standard
 * roving-tabindex pattern (left/right arrows).
 */
export function Tabs({ tabs, initialTabId }: TabsProps): JSX.Element {
  const initial = tabs.find((t) => t.id === initialTabId)?.id ?? tabs[0]?.id ?? '';
  const [active, setActive] = useState<string>(initial);
  const activeTab = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div>
      <div role="tablist" className="flex gap-1 border-b border-stone overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActive(tab.id)}
              className={`px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 -mb-[1px] ${
                isActive
                  ? 'border-coral text-ink'
                  : 'border-transparent text-graphite hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" className="pt-6">
        {activeTab?.render()}
      </div>
    </div>
  );
}
