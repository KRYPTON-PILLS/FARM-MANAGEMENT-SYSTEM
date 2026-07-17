/**
 * Returns a function usable as a react-joyride `target` — resolves to the
 * first *visible* element matching `selector`, not just the first DOM
 * match. Needed because FarmShell renders some nav links twice (once in
 * the desktop sidebar, once in the mobile bottom nav/drawer), hidden via
 * CSS on the inactive breakpoint rather than omitted from the DOM. Passing
 * a function (rather than a plain selector string) is how react-joyride
 * supports custom target resolution — see the `target` type in its docs.
 *
 * Returns null if nothing visible matches, which react-joyride treats as
 * "target not found" — TourOverlay listens for that and auto-advances
 * instead of getting stuck.
 */
export function visibleTarget(selector) {
  return () => {
    const candidates = document.querySelectorAll(selector);
    for (const el of candidates) {
      if (el.offsetParent !== null) return el;
    }
    return null;
  };
}