import { motion, AnimatePresence } from 'framer-motion';

export default function WelcomeModal({ onGetStarted, onSkip }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-8 text-center"
        >
          <div className="flex justify-center mb-5">
            <svg width="72" height="63" viewBox="0 0 110 96">
              <path d="M0 88 Q25 82 50 85 Q75 88 108 82" fill="none" stroke="#4CAF50" stroke-width="2" opacity="0.5" />
              <rect x="40" y="68" width="10" height="16" rx="2" fill="#4CAF50" />
              <rect x="54" y="58" width="10" height="26" rx="2" fill="#2E7D32" />
              <rect x="68" y="44" width="10" height="40" rx="2" fill="#4CAF50" />
              <rect x="82" y="30" width="10" height="54" rx="2" fill="#2E7D32" />
              <path d="M87 30 L87 22" stroke="#2E7D32" stroke-width="2" stroke-linecap="round" />
              <path d="M87 24 C83 22 82 17 85 14 C88 17 89 22 87 24 Z" fill="#4CAF50" />
              <path d="M87 24 C91 22 92 17 89 14 C86 17 85 22 87 24 Z" fill="#2E7D32" />
              <circle cx="98" cy="16" r="5" fill="none" stroke="#D4A017" stroke-width="2" />
              <line x1="98" y1="7" x2="98" y2="4" stroke="#D4A017" stroke-width="2" stroke-linecap="round" />
              <line x1="91" y1="11" x2="88" y2="8" stroke="#D4A017" stroke-width="2" stroke-linecap="round" />
              <line x1="105" y1="11" x2="108" y2="8" stroke="#D4A017" stroke-width="2" stroke-linecap="round" />
              <rect x="8" y="74" width="20" height="10" rx="5" fill="#8D6E63" />
              <circle cx="8" cy="76" r="5" fill="#8D6E63" />
              <line x1="6" y1="71" x2="5" y2="67" stroke="#8D6E63" stroke-width="1.5" stroke-linecap="round" />
              <line x1="10" y1="71" x2="11" y2="67" stroke="#8D6E63" stroke-width="1.5" stroke-linecap="round" />
              <path d="M28 78 Q31 80 29 84" fill="none" stroke="#8D6E63" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-green-900 mb-1">Welcome to FanakaCo</h2>
          <p className="text-sm font-medium text-green-700 mb-3">Grow smarter. Manage better. Earn more.</p>
          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            FanakaCo is your complete Farm Operating System that helps you manage livestock, crops,
            finances, inventory, production, farm activities, and business insights — all from one
            platform. Before you begin, let's personalize your farm and show you around.
          </p>

          <div className="flex flex-col gap-2">
            <button
              onClick={onGetStarted}
              className="w-full py-2.5 rounded-xl bg-green-700 text-white font-semibold hover:bg-green-800 transition-colors"
            >
              Get Started
            </button>
            <button
              onClick={onSkip}
              className="w-full py-2.5 rounded-xl text-gray-500 font-medium hover:bg-gray-50 transition-colors"
            >
              Skip Tour
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}