"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface OverScrollIndicatorProps {
  isVisible: boolean;
  progress: number; // 0-1の進行度
  direction: 'up' | 'down';
  targetSectionName?: string;
  isNavigating: boolean;
}

const OverScrollIndicator = ({ isVisible, progress, direction, targetSectionName, isNavigating }: OverScrollIndicatorProps) => {
  const t = useTranslations('nav');
  
  const isGoingUp = direction === 'up';
  const ArrowIcon = isGoingUp ? ChevronUp : ArrowRight;

  // 遷移可能かどうかのチェック
  const canNavigate = targetSectionName !== undefined;

  return (
    <AnimatePresence>
      {isVisible && canNavigate && (
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
            <div className={`relative h-3 bg-gradient-to-r ${
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
              {/* プログレス輝きエフェクト */}
              <motion.div
                className={`absolute top-0 h-full w-20 ${
                  isGoingUp 
                    ? 'bg-gradient-to-r from-transparent via-green-300/50 to-transparent'
                    : 'bg-gradient-to-r from-transparent via-blue-300/50 to-transparent'
                }`}
                animate={{
                  x: ['-100px', `${progress * 100}%`],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
          </motion.div>

          {/* 中央メッセージ */}
          <motion.div
            className={`fixed left-1/2 transform -translate-x-1/2 z-50 ${
              isGoingUp ? 'top-24' : 'bottom-24'
            }`}
            initial={{ opacity: 0, scale: 0.8, y: isGoingUp ? -20 : 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: isGoingUp ? -20 : 20 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 300 }}
          >
            <div className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl px-8 py-6 shadow-2xl border-2 ${
              isGoingUp 
                ? 'border-green-200/50 dark:border-green-700/50' 
                : 'border-blue-200/50 dark:border-blue-700/50'
            }`}>
              <div className="flex items-center gap-4">
                {/* 左側アイコン */}
                <motion.div
                  animate={isNavigating ? {
                    rotate: [0, 360],
                    scale: [1, 1.2, 1],
                  } : { 
                    y: isGoingUp ? [0, 8, 0] : [0, -8, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={isNavigating ? {
                    duration: 1,
                    ease: "easeInOut",
                  } : { 
                    duration: 1.5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                >
                  <ArrowIcon size={28} className={isGoingUp ? "text-green-500" : "text-blue-500"} />
                </motion.div>
                
                {/* 中央コンテンツ */}
                <div className="text-center">
                  <motion.p 
                    className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-2"
                    animate={isNavigating ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {isNavigating ? (
                      <span className={`${isGoingUp ? 'text-green-600' : 'text-blue-600'} dark:${isGoingUp ? 'text-green-400' : 'text-blue-400'}`}>
                        {t('navigating')}
                      </span>
                    ) : (
                      <>
                        {isGoingUp ? t('scrollToPrevious') : t('scrollToNext')} 
                        <span className={`font-bold ${
                          isGoingUp ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                        }`}>
                          {t(targetSectionName)}
                        </span>
                      </>
                    )}
                  </motion.p>
                  
                  {/* プログレス表示 */}
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {Math.round(progress * 100)}%
                    </span>
                  </div>
                  
                  {/* パルス効果またはローディング */}
                  <div className="flex items-center justify-center gap-2">
                    {isNavigating ? (
                      // ローディングスピナー
                      <motion.div
                        className={`w-6 h-6 border-2 border-t-transparent rounded-full ${
                          isGoingUp 
                            ? 'border-green-500' 
                            : 'border-blue-500'
                        }`}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    ) : (
                      // パルス効果
                      [0, 0.2, 0.4].map((delay, i) => (
                        <motion.div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            isGoingUp ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay }}
                        />
                      ))
                    )}
                  </div>
                </div>

                {/* 右側アイコン */}
                <motion.div
                  animate={isNavigating ? {
                    x: isGoingUp ? [-10, 0] : [10, 0],
                    opacity: [0.5, 1],
                  } : { 
                    x: isGoingUp ? [0, -5, 0] : [0, 5, 0],
                    y: isGoingUp ? [0, -3, 0] : [0, 0, 0]
                  }}
                  transition={isNavigating ? {
                    duration: 0.8,
                    ease: "easeOut",
                  } : { 
                    duration: 1.2, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                >
                  <ArrowIcon size={24} className={isGoingUp ? "text-emerald-500" : "text-purple-500"} />
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
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`absolute w-6 h-6 rounded-full ${
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
                    opacity: 1,
                  }}
                  animate={{
                    scale: [0, 1.5, 0],
                    x: Math.cos((i * Math.PI * 2) / 12) * 150,
                    y: Math.sin((i * Math.PI * 2) / 12) * 150,
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: 1.2,
                    ease: "easeOut",
                    delay: i * 0.08,
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