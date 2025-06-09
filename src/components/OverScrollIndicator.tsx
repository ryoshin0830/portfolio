"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface OverScrollIndicatorProps {
  isVisible: boolean;
  progress: number; // 0-1の進行度
  direction: 'up' | 'down';
  targetSectionName?: string;
}

const OverScrollIndicator = ({ isVisible, progress, direction, targetSectionName }: OverScrollIndicatorProps) => {
  const t = useTranslations('nav');
  
  const isGoingUp = direction === 'up';
  const ArrowIcon = isGoingUp ? ChevronUp : ArrowRight;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* プログレスバー */}
          <motion.div
            className={`fixed left-0 right-0 z-50 ${
              isGoingUp ? 'top-0' : 'bottom-0'
            }`}
            initial={{ opacity: 0, y: isGoingUp ? -20 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isGoingUp ? -20 : 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className={`relative h-2 bg-gradient-to-r ${
              isGoingUp 
                ? 'from-green-500/20 to-emerald-500/20' 
                : 'from-blue-500/20 to-purple-500/20'
            } backdrop-blur-sm`}>
              <motion.div
                className={`h-full shadow-lg ${
                  isGoingUp 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-500'
                }`}
                style={{
                  width: `${progress * 100}%`,
                }}
                transition={{ duration: 0.1 }}
              />
              <div className={`absolute inset-0 opacity-50 animate-pulse ${
                isGoingUp 
                  ? 'bg-gradient-to-r from-green-400 to-emerald-400' 
                  : 'bg-gradient-to-r from-blue-400 to-purple-400'
              }`} />
            </div>
          </motion.div>

          {/* 中央メッセージ */}
          <motion.div
            className={`fixed left-1/2 transform -translate-x-1/2 z-50 ${
              isGoingUp ? 'top-20' : 'bottom-20'
            }`}
            initial={{ opacity: 0, scale: 0.8, y: isGoingUp ? -20 : 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: isGoingUp ? -20 : 20 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 300 }}
          >
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl px-6 py-4 shadow-2xl border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ 
                    y: isGoingUp ? [0, 8, 0] : [0, -8, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                >
                  <ArrowIcon size={24} className={isGoingUp ? "text-green-500" : "text-blue-500"} />
                </motion.div>
                
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {targetSectionName ? (
                      <>
                        {isGoingUp ? t('scrollToPrevious') : t('scrollToNext')} <span className={`font-semibold ${
                          isGoingUp ? 'text-green-500' : 'text-blue-500'
                        }`}>{t(targetSectionName)}</span>
                      </>
                    ) : (
                      isGoingUp ? 'Going back...' : 'Continue scrolling...'
                    )}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <motion.div
                      className={`w-2 h-2 rounded-full ${
                        isGoingUp ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                      className={`w-2 h-2 rounded-full ${
                        isGoingUp ? 'bg-emerald-500' : 'bg-purple-500'
                      }`}
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div
                      className={`w-2 h-2 rounded-full ${
                        isGoingUp ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                    />
                  </div>
                </div>

                <motion.div
                  animate={{ 
                    x: isGoingUp ? [0, -5, 0] : [0, 5, 0],
                    y: isGoingUp ? [0, -3, 0] : [0, 0, 0]
                  }}
                  transition={{ 
                    duration: 1.2, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                >
                  <ArrowIcon size={20} className={isGoingUp ? "text-emerald-500" : "text-purple-500"} />
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* 完了時のバースト効果 */}
          {progress >= 1 && (
            <motion.div
              className="fixed inset-0 pointer-events-none z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`absolute w-4 h-4 rounded-full ${
                    isGoingUp 
                      ? 'bg-gradient-to-r from-green-400 to-emerald-400' 
                      : 'bg-gradient-to-r from-blue-400 to-purple-400'
                  }`}
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                  initial={{ 
                    scale: 0,
                    x: 0,
                    y: 0,
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    x: Math.cos((i * Math.PI * 2) / 8) * 100,
                    y: Math.sin((i * Math.PI * 2) / 8) * 100,
                  }}
                  transition={{
                    duration: 0.8,
                    ease: "easeOut",
                    delay: i * 0.1,
                  }}
                />
              ))}
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

export default OverScrollIndicator;