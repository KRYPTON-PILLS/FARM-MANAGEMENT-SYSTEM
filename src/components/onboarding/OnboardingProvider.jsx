import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY_PREFIX = 'fanakaco_onboarding_completed';

function storageKey(userId) {
  return userId ? `${STORAGE_KEY_PREFIX}_${userId}` : STORAGE_KEY_PREFIX;
}

const OnboardingContext = createContext(null);

/**
 * Only one navigation ever happens in the whole onboarding flow: "Get
 * Started" takes the user to /profile to fill in their farm details. Once
 * that's done, the spotlight tour runs entirely on whatever page the user
 * is already on — it highlights persistent sidebar/nav elements, so it
 * never needs to navigate again.
 *
 * @param {string} [userId] - see note in earlier versions; tracks tour
 *   completion per-account rather than per-device if provided.
 */
export function OnboardingProvider({ children, userId }) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('idle'); // 'idle' | 'welcome' | 'awaiting-profile' | 'touring' | 'finished'

  const key = storageKey(userId);

  useEffect(() => {
    const completed = localStorage.getItem(key) === 'true';
    if (!completed) {
      setPhase('welcome');
    }
  }, [key]);

  const markCompleted = useCallback(() => {
    try {
      localStorage.setItem(key, 'true');
    } catch (err) {
      // localStorage can throw in private-browsing/quota-exceeded edge cases —
      // not worth failing the tour over.
    }
  }, [key]);

  /** "Get Started" on the welcome modal — the tour's only navigation. */
  const getStarted = useCallback(() => {
    setPhase('awaiting-profile');
    navigate('/profile');
  }, [navigate]);

  /** Called from your ProfilePage's save handler once the profile is
   * actually saved — this is what starts the spotlight tour. */
  const startTour = useCallback(() => {
    setPhase('touring');
  }, []);

  const skipTour = useCallback(() => {
    markCompleted();
    setPhase('idle');
  }, [markCompleted]);

  const finishTour = useCallback(() => {
    markCompleted();
    setPhase('finished');
  }, [markCompleted]);

  /** Called from the FinishModal's "Go to Dashboard" button. */
  const closeFinishScreen = useCallback(() => {
    setPhase('idle');
    navigate('/dashboard');
  }, [navigate]);

  /** "Take the Product Tour Again" in the Help Center — skips Welcome/
   * Profile Setup since this is an existing user, and goes straight into
   * the spotlight tour on whatever page they're currently on. */
  const restartTour = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      // ignore, see markCompleted
    }
    setPhase('touring');
  }, [key]);

  const value = useMemo(
    () => ({
      phase,
      getStarted,
      startTour,
      skipTour,
      finishTour,
      closeFinishScreen,
      restartTour,
    }),
    [phase, getStarted, startTour, skipTour, finishTour, closeFinishScreen, restartTour]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return ctx;
}