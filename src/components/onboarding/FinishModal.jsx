import { motion, AnimatePresence } from 'framer-motion';

export default function FinishModal({ onFinish }) {
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
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">You're Ready!</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            Your farm is now ready. Start recording livestock, crops, production, expenses, and
            activities to unlock powerful reports and insights.
          </p>

          <button
            onClick={onFinish}
            className="w-full py-2.5 rounded-xl bg-green-700 text-white font-semibold hover:bg-green-800 transition-colors"
          >
            Go to Dashboard
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}