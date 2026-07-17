import { motion, AnimatePresence } from 'framer-motion';

const FIELDS = ['Farm Name', 'Owner Name', 'Farm Location', 'Farm Size', 'Main Farming Activity', 'Phone Number'];

/**
 * Rendered from your ProfilePage itself (not TourOverlay) — it's tied to
 * "has the user saved a profile yet", not to onboarding phase, so it needs
 * to live where you actually have that information.
 *
 * @param {boolean} show - your ProfilePage decides this, e.g.
 *   `!profile?.farmName` (adjust to whatever field reliably indicates an
 *   incomplete profile in your actual data model)
 * @param {() => void} onDismiss
 */
export default function ProfileSetupCard({ show, onDismiss }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl bg-white shadow-md border border-green-100 p-6 mb-6"
        >
          <h2 className="text-lg font-bold text-green-900 mb-1">Let's Set Up Your Farm</h2>
          <p className="text-sm text-gray-600 mb-3">Complete your farm profile before using FanakaCo. This helps us:</p>
          <ul className="text-sm text-gray-700 space-y-1 mb-4">
            <li>• Personalize your dashboard</li>
            <li>• Generate accurate reports</li>
            <li>• Improve recommendations</li>
            <li>• Track your farm correctly</li>
          </ul>
          <p className="text-xs text-gray-500 mb-3">
            You'll need: {FIELDS.join(', ')}.
          </p>
          <button
            onClick={onDismiss}
            className="text-sm font-medium text-green-700 hover:text-green-800"
          >
            Got it, I'll fill this in below ↓
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}