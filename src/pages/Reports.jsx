import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  HeartPulse,
  Milk,
  Sprout,
  ClipboardList,
} from 'lucide-react';
import { ReportsProvider } from '../context/ReportsContext';

const DESTINATIONS = [
  { to: '/reports', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/reports/financials', label: 'Financials', icon: Wallet },
  { to: '/reports/livestock-health', label: 'Livestock & Health', icon: HeartPulse },
  { to: '/reports/production', label: 'Production', icon: Milk },
  { to: '/reports/crops-feed', label: 'Crops & Feed', icon: Sprout },
  { to: '/reports/activity-inventory', label: 'Activity & Inventory', icon: ClipboardList },
];

export default function ReportsLayout() {
  return (
    <ReportsProvider>
      <div className="flex min-h-screen bg-gray-50">
        <aside className="hidden w-56 shrink-0 border-r border-gray-200 bg-white p-4 md:block">
          <h2 className="mb-4 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Reports & Analytics
          </h2>
          <nav className="space-y-1">
            {DESTINATIONS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-green-100 text-green-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-green-900'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Mobile nav — horizontal scroll tab bar */}
        <div className="fixed bottom-0 left-0 right-0 z-20 flex overflow-x-auto border-t border-gray-200 bg-white px-2 py-1.5 md:hidden">
          {DESTINATIONS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-w-[72px] flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium ${
                  isActive ? 'text-green-600' : 'text-gray-400'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>

        <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">
          <Outlet />
        </main>
      </div>
    </ReportsProvider>
  );
}