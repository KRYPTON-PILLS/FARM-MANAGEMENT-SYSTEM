import { useState, useEffect } from 'react';
import { Joyride, EVENTS, ACTIONS, STATUS } from 'react-joyride';
import { useOnboarding } from './OnboardingProvider';
import { tourSteps } from './tourSteps';
import TourTooltip from './TourTooltip';
import WelcomeModal from './WelcomeModal';
import FinishModal from './FinishModal';

export default function TourOverlay() {
  const { phase, getStarted, skipTour, finishTour, closeFinishScreen } = useOnboarding();
  const [stepIndex, setStepIndex] = useState(0);

  const running = phase === 'touring';

  // Always restart at step 0 whenever the tour (re)enters 'touring'.
  useEffect(() => {
    if (running) setStepIndex(0);
  }, [running]);

  function handleEvent(data) {
    const { type, action, index, status } = data;

    if (type === EVENTS.TARGET_NOT_FOUND) {
      // A data-tour attribute is missing for this step (or, on mobile, it's
      // inside the closed drawer and not currently in the DOM — see the
      // note in tourSteps.js). Don't get stuck — just move on.
      if (index + 1 >= tourSteps.length) {
        finishTour();
      } else {
        setStepIndex(index + 1);
      }
      return;
    }

    if (type === EVENTS.STEP_AFTER) {
      if (action === ACTIONS.PREV) {
        setStepIndex(Math.max(0, index - 1));
        return;
      }
      // NEXT (or CLOSE, treated the same as NEXT here)
      if (index + 1 >= tourSteps.length) {
        finishTour();
      } else {
        setStepIndex(index + 1);
      }
      return;
    }

    if (type === EVENTS.TOUR_END && status === STATUS.SKIPPED) {
      skipTour();
    }
  }

  return (
    <>
      {phase === 'welcome' && <WelcomeModal onGetStarted={getStarted} onSkip={skipTour} />}
      {phase === 'finished' && <FinishModal onFinish={closeFinishScreen} />}

      <Joyride
        steps={tourSteps}
        run={running}
        stepIndex={stepIndex}
        continuous
        onEvent={handleEvent}
        tooltipComponent={TourTooltip}
        options={{
          primaryColor: '#15803d', // green-700, matches FanakaCo branding
          overlayColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 10000,
          width: 400,
          spotlightRadius: 12,
          skipBeacon: true, // tooltip shows immediately, no beacon-click step
          overlayClickAction: false, // clicking the dark overlay does nothing —
          // this is the "prevent clicking outside the spotlight" requirement
          blockTargetInteraction: true, // can't accidentally click the highlighted
          // nav link and navigate away mid-tour
        }}
      />
    </>
  );
}