import { visibleTarget } from './visibleTarget';

/**
 * This is a true single-page walkthrough: every target below is part of
 * FarmShell's persistent sidebar/topbar, which renders on every route. The
 * tour never calls navigate() — it just moves the spotlight from one nav
 * element to the next while the user's actual page never changes.
 *
 * Shape matches react-joyride's Step type: { target, title, content,
 * placement, disableBeacon }, plus a `data.bullets` / `data.footnote`
 * extension that our custom TourTooltip component reads (react-joyride
 * passes the whole step through, custom fields included).
 */
export const tourSteps = [
  {
    target: visibleTarget('[data-tour="nav-dashboard"]'),
    placement: 'right',
    title: 'Dashboard',
    content: "This is your farm's command center.",
    data: {
      bullets: ['Animal population', 'Crop performance', 'Revenue', 'Expenses', 'Production', 'Upcoming activities'],
    },
  },
  {
    target: visibleTarget('[data-tour="nav-animals"]'),
    placement: 'right',
    title: 'Livestock Management',
    content: 'This module helps you manage every animal on your farm.',
    data: {
      bullets: ['Register animals', 'Record births', 'Track weight', 'Vaccinations', 'Treatments', 'Breeding', 'Sales', 'Mortality'],
    },
  },
  {
    target: visibleTarget('[data-tour="nav-crops"]'),
    placement: 'right',
    title: 'Crop Management',
    content: 'Manage every crop from planting to harvest.',
    data: {
      bullets: ['Planting dates', 'Harvest dates', 'Fertilizer', 'Irrigation', 'Expected yields', 'Revenue'],
    },
  },
  {
    target: visibleTarget('[data-tour="nav-reports"]'),
    placement: 'right',
    title: 'Reports & Analytics',
    content: 'Convert your farm records into useful insights.',
    data: {
      bullets: ['Financial reports', 'Livestock reports', 'Production reports', 'Crop reports', 'Feed reports', 'Inventory reports'],
      footnote: 'Use these insights to make informed business decisions.',
    },
  },
  {
    target: visibleTarget('[data-tour="nav-sales"]'),
    placement: 'right',
    title: 'Sales & Marketplace',
    content: 'Track everything you sell.',
    data: {
      bullets: ['Livestock sales', 'Milk', 'Eggs', 'Crops', 'Farm produce', 'Customer records', 'Profit trends'],
    },
  },
  {
    target: visibleTarget('[data-tour="nav-marketplace"]'),
    placement: 'right',
    title: 'Marketplace',
    content: 'Buy and sell livestock, crops, machinery, and farm supplies with other farmers.',
  },
  {
    target: visibleTarget('[data-tour="nav-assistant"]'),
    placement: 'right',
    title: 'AI Farm Assistant',
    content: 'Ask questions about your farm.',
    data: {
      bullets: ['Farm records', 'Livestock management', 'Crop management', 'Reports', 'Daily activities', 'Farm recommendations'],
    },
  },
  {
    target: visibleTarget('[data-tour="notification-bell"]'),
    placement: 'bottom',
    title: 'Alerts & Reminders',
    content: 'Never miss important farm tasks.',
    data: {
      bullets: ['Vaccinations', 'Feeding', 'Breeding', 'Harvests', 'Low inventory', 'Upcoming activities'],
    },
  },
  {
    target: visibleTarget('[data-tour="nav-profile"]'),
    placement: 'right',
    title: 'Your Farm Profile',
    content: 'Manage your farm information and personal details.',
    data: {
      bullets: ['Farm details', 'Contact information', 'Preferences', 'Account settings'],
    },
  },
];

/**
 * data-tour attributes needed — all on persistent nav elements in
 * FarmShell.jsx, so there's exactly one file to wire this into (plus
 * wherever your notification bell actually lives):
 *
 *   nav-dashboard, nav-animals, nav-crops, nav-reports, nav-sales,
 *   nav-marketplace, nav-assistant, nav-profile  -> FarmShell.jsx nav links
 *   notification-bell                             -> wherever your bell icon is
 *
 * KNOWN LIMITATION: on mobile, FarmShell's bottom nav only surfaces
 * Dashboard/Animals/Crops/Market/Profile — Sales, Reports, and Assistant
 * only exist in the slide-in drawer, which isn't in the DOM at all until
 * the user opens it (not just hidden — actually unmounted while closed).
 * Those three steps will gracefully auto-skip on mobile (TourOverlay
 * treats "target not found" as "move on"), so the tour still completes,
 * just shorter. Fixing this properly means either always rendering the
 * drawer's contents (hidden via a CSS transform instead of a conditional
 * `{mobileMenuOpen && ...}`) or having the tour auto-open the drawer while
 * running — neither is done here since it's a FarmShell layout decision,
 * not just an onboarding one. Worth a conscious call rather than a silent
 * change.
 */