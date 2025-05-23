import { memo } from 'react';
import { motion } from 'framer-motion';

export const SavingIndicator = memo(() => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex items-center gap-2 text-gray-500"
  >
    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500" />
    <span className="text-sm">Saving</span>
  </motion.div>
)); 