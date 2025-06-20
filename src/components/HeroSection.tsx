"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { Mail } from "lucide-react";
import { FaGithub, FaLinkedin, FaFacebook, FaInstagram, FaLine, FaWeixin, FaWhatsapp } from "react-icons/fa";
import { SiQiita, SiX, SiXiaohongshu } from "react-icons/si";
import Image from "next/image";

const HeroSection = () => {
  const [currentNameIndex, setCurrentNameIndex] = useState(0);
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
  const [showWeChatQR, setShowWeChatQR] = useState(false);
  const [showWhatsAppQR, setShowWhatsAppQR] = useState(false);
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);
  const t = useTranslations("hero");
  const tNames = useTranslations("names");
  const tCommon = useTranslations("common");
  const tHeroCategories = useTranslations("heroCategories");
  const tSocialActions = useTranslations("socialActions");
  const locale = useLocale();

  const names = [
    tNames("japanese"),
    tNames("japaneseFurigana"),
    tNames("english"),
    tNames("chinese")
  ];
  const roles = t.raw("roles") as string[];

  // Email components (obfuscation)
  const emailUser = "ryo.shin.j85";
  const emailDomain = "kyoto-u.jp";

  // Handler to construct mailto link at runtime
  const handleEmailClick = () => {
    const email = `${emailUser}@${emailDomain}`;
    const subject = encodeURIComponent(t("email_subject"));
    const body = encodeURIComponent(t("email_body"));
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  // Social platforms with locale-based priorities
  const socialPlatforms = [
    {
      id: 'github',
      name: 'GitHub',
      href: 'https://github.com/ryoshin0830',
      icon: FaGithub,
      color: 'slate',
      priority: { ja: 7, en: 8, zh: 7 },
      category: 'professional'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      href: 'https://www.linkedin.com/in/ryoshin',
      icon: FaLinkedin,
      color: 'blue',
      priority: { ja: 8, en: 9, zh: 8 },
      category: 'professional'
    },
    {
      id: 'x',
      name: 'X',
      href: 'https://x.com/ryoshin0830',
      icon: SiX,
      color: 'slate',
      priority: { ja: 8, en: 7, zh: 6 },
      category: 'social'
    },
    {
      id: 'zenn',
      name: 'Zenn',
      href: 'https://zenn.dev/ryoushin',
      iconPath: '/logo-only.svg',
      color: 'sky',
      priority: { ja: 9, en: 5, zh: 4 },
      category: 'professional'
    },
    {
      id: 'qiita',
      name: 'Qiita',
      href: 'https://qiita.com/ryoshin0830',
      icon: SiQiita,
      color: 'green',
      priority: { ja: 6, en: 4, zh: 3 },
      category: 'professional'
    },
    {
      id: 'line',
      name: 'LINE',
      href: 'https://line.me/ti/p/J7cd9CqhvX',
      icon: FaLine,
      color: 'green',
      priority: { ja: 10, en: 3, zh: 5 },
      category: 'messaging'
    },
    {
      id: 'wechat',
      name: 'WeChat',
      href: '#',
      icon: FaWeixin,
      color: 'green',
      priority: { ja: 4, en: 5, zh: 10 },
      category: 'messaging',
      qrCode: '/wechat-qr.png'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      href: '#',
      icon: FaWhatsapp,
      color: 'green',
      priority: { ja: 5, en: 9, zh: 4 },
      category: 'messaging',
      qrCode: '/whatsapp-qr.png'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      href: 'https://www.facebook.com/ryoshin0830',
      icon: FaFacebook,
      color: 'blue',
      priority: { ja: 4, en: 6, zh: 5 },
      category: 'social'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      href: 'https://www.instagram.com/ryoshin0830',
      icon: FaInstagram,
      color: 'pink',
      priority: { ja: 5, en: 5, zh: 6 },
      category: 'social'
    },
    {
      id: 'xiaohongshu',
      name: '小红书',
      href: 'https://www.xiaohongshu.com/user/profile/5a0e90b211be1056202b808f?xsec_token=YBERRMVpcYr3fOe_IO5v-tr9JY5mUTiZ4O0J_11Q_DwII=&xsec_source=app_share&xhsshare=CopyLink&appuid=5a0e90b211be1056202b808f&apptime=1749915336&share_id=ba7caa0644c54d339241e3b501b3fede',
      icon: SiXiaohongshu,
      color: 'red',
      priority: { ja: 2, en: 2, zh: 8 },
      category: 'social'
    }
  ];

  // Sort platforms based on current locale
  const sortedPlatforms = [...socialPlatforms].sort((a, b) => {
    const currentLocale = locale as 'ja' | 'en' | 'zh';
    return (b.priority[currentLocale] || 0) - (a.priority[currentLocale] || 0);
  });

  useEffect(() => {
    const nameInterval = setInterval(() => {
      setCurrentNameIndex((prev) => (prev + 1) % names.length);
    }, 4000);
    return () => clearInterval(nameInterval);
  }, [names.length]);

  useEffect(() => {
    const roleInterval = setInterval(() => {
      setCurrentRoleIndex((prev) => (prev + 1) % roles.length);
    }, 3500);
    return () => clearInterval(roleInterval);
  }, [roles.length]);

  // Close QR codes when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.qr-container')) {
        setShowWeChatQR(false);
        setShowWhatsAppQR(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Modern gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/50 to-purple-50/30 dark:from-slate-950 dark:via-blue-950/20 dark:to-purple-950/10" />
      
      {/* Minimal background elements */}
      <div className="absolute inset-0 opacity-20 dark:opacity-10">
        <div className="absolute top-20 right-20 w-64 h-64 bg-blue-400/10 rounded-full blur-2xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-purple-400/10 rounded-full blur-2xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10 w-full max-w-7xl">
        <div className="text-center max-w-5xl mx-auto pt-32">

          {/* Name */}
          <div className="mb-12">
            <AnimatePresence mode="wait">
              <motion.h1
                key={currentNameIndex}
                className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black gradient-text mb-4 tracking-tight px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                {names[currentNameIndex]}
              </motion.h1>
            </AnimatePresence>
          </div>

          {/* Role */}
          <div className="mb-12 px-4">
            <div className="flex items-center justify-center gap-4 sm:gap-8 mb-6">
              <div className="h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent flex-1 max-w-16 sm:max-w-32" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentRoleIndex}
                  className="relative px-4 sm:px-8 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full border border-blue-200/50 dark:border-blue-700/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-sm sm:text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {roles[currentRoleIndex]}
                  </span>
                </motion.div>
              </AnimatePresence>
              <div className="h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent flex-1 max-w-16 sm:max-w-32" />
            </div>
          </div>

          {/* Subtitle */}
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-slate-700 dark:text-slate-300 mb-6 font-light tracking-wide px-4">
            {t("subtitle")}
          </h2>

          {/* Description */}
          <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-3xl mx-auto leading-relaxed px-4">
            {t("description")}
          </p>

          {/* Personal Details */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-8 text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 px-4">
            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-full border border-slate-200/30 dark:border-slate-700/30">
              <span className="font-semibold">{t("origin")}</span>
              <span className="text-slate-700 dark:text-slate-300">{t("beijing")}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-full border border-slate-200/30 dark:border-slate-700/30">
              <span className="font-semibold">{t("current")}</span>
              <span className="text-slate-700 dark:text-slate-300">{t("kyoto")}</span>
            </div>
          </div>

          {/* Contact Section */}
          <div className="mb-12 px-4">
            {/* Primary Email CTA */}
            <button
              onClick={handleEmailClick}
              className="inline-flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-200 mb-6 hover:scale-105 text-sm sm:text-base"
            >
              <Mail size={18} className="sm:w-6 sm:h-6" />
              <span>{t("connect")}</span>
            </button>

            {/* Social Links - Responsive Layout */}
            <div className="flex flex-wrap justify-center items-start gap-3 sm:gap-6 max-w-6xl mx-auto">
              {/* Group platforms by category */}
              {(() => {
                const grouped = sortedPlatforms.reduce((acc, platform) => {
                  const category = platform.category;
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(platform);
                  return acc;
                }, {} as Record<string, typeof sortedPlatforms>);

                // Define category order and names based on locale
                const categoryConfig = {
                  ja: {
                    order: ['messaging', 'professional', 'social'],
                    names: { 
                      messaging: tHeroCategories('messaging'), 
                      professional: tHeroCategories('professional'), 
                      social: tHeroCategories('social') 
                    }
                  },
                  zh: {
                    order: ['messaging', 'social', 'professional'],
                    names: { 
                      messaging: tHeroCategories('messaging'), 
                      professional: tHeroCategories('professional'), 
                      social: tHeroCategories('social') 
                    }
                  },
                  en: {
                    order: ['professional', 'social', 'messaging'],
                    names: { 
                      messaging: tHeroCategories('messaging'), 
                      professional: tHeroCategories('professional'), 
                      social: tHeroCategories('social') 
                    }
                  }
                };

                const config = categoryConfig[locale as keyof typeof categoryConfig] || categoryConfig.en;

                return config.order.map((category) => {
                  const platforms = grouped[category] || [];
                  if (platforms.length === 0) return null;

                  return (
                    <div key={category} className="flex flex-col items-center min-w-0 w-auto">
                      {/* Category name */}
                      <h4 className={`text-xs font-medium mb-2 ${
                        category === 'professional' ? 'text-blue-600 dark:text-blue-400' :
                        category === 'social' ? 'text-purple-600 dark:text-purple-400' :
                        'text-green-600 dark:text-green-400'
                      }`}>
                        {config.names[category as keyof typeof config.names]}
                      </h4>
                      
                      {/* Platforms in this category */}
                      <div className="flex flex-wrap justify-center gap-1 sm:gap-2 max-w-40 sm:max-w-none">
                        {platforms.map((platform, index) => {
                          const isQRPlatform = platform.qrCode !== undefined;
                          
                          // Define color classes
                          const colorClasses = {
                            slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
                            sky: 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
                            green: 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
                            blue: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
                            pink: 'bg-pink-50 dark:bg-pink-950 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800',
                            red: 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                          };
                          
                          if (isQRPlatform) {
                            return (
                              <motion.div
                                key={platform.id}
                                className="relative"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03, type: "spring", stiffness: 300 }}
                              >
                                <motion.button
                                  onClick={() => platform.id === 'wechat' ? setShowWeChatQR(!showWeChatQR) : setShowWhatsAppQR(!showWhatsAppQR)}
                                  className={`relative p-2 sm:p-3 ${colorClasses[platform.color as keyof typeof colorClasses]} rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 group border`}
                                  whileHover={{ y: -2, scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onHoverStart={() => setHoveredPlatform(platform.id)}
                                  onHoverEnd={() => setHoveredPlatform(null)}
                                >
                                  <motion.div
                                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                    style={{
                                      background: platform.color === 'green' 
                                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                                        : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                                    }}
                                  />
                                  {platform.icon && <platform.icon size={16} className="sm:w-6 sm:h-6 relative z-10 group-hover:text-white transition-colors duration-300" />}
                                  {/* Tooltip on hover */}
                                  <AnimatePresence>
                                    {hoveredPlatform === platform.id && (
                                      <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 text-xs rounded whitespace-nowrap z-10"
                                      >
                                        {platform.name}
                                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                                          <div className="border-4 border-transparent border-t-slate-800 dark:border-t-slate-200"></div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.button>
                                <AnimatePresence>
                                  {((platform.id === 'wechat' && showWeChatQR) || (platform.id === 'whatsapp' && showWhatsAppQR)) && (
                                    <>
                                      {/* Backdrop */}
                                      <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                                        onClick={() => platform.id === 'wechat' ? setShowWeChatQR(false) : setShowWhatsAppQR(false)}
                                      />
                                      {/* Modal */}
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-4 sm:p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl z-50 max-w-sm mx-4"
                                      >
                                        <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4 sm:mb-6 text-center">
                                          {platform.id === 'wechat' ? tSocialActions('wechatQR') : tSocialActions('whatsappQR')}
                                        </h3>
                                        <div className="bg-white p-2 sm:p-4 rounded-xl">
                                          <Image 
                                            src={platform.qrCode} 
                                            alt={`${platform.name} QR Code`} 
                                            width={200} 
                                            height={200} 
                                            className="rounded-lg w-full max-w-60 mx-auto"
                                          />
                                        </div>
                                        <button
                                          onClick={() => platform.id === 'wechat' ? setShowWeChatQR(false) : setShowWhatsAppQR(false)}
                                          className="mt-4 sm:mt-6 w-full px-4 sm:px-6 py-2 sm:py-3 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm sm:text-base"
                                        >
                                          {tCommon('close')}
                                        </button>
                                      </motion.div>
                                    </>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            );
                          }

                          return (
                            <motion.a
                              key={platform.id}
                              href={platform.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`relative p-2 sm:p-3 ${colorClasses[platform.color as keyof typeof colorClasses]} rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 group border`}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.03, type: "spring", stiffness: 300 }}
                              whileHover={{ y: -2, scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onHoverStart={() => setHoveredPlatform(platform.id)}
                              onHoverEnd={() => setHoveredPlatform(null)}
                            >
                              <motion.div
                                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{
                                  background: platform.color === 'slate' ? 'linear-gradient(135deg, #475569 0%, #1e293b 100%)' 
                                    : platform.color === 'green' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                                    : platform.color === 'blue' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                                    : platform.color === 'pink' ? 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)' 
                                    : platform.color === 'red' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                                    : 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)'
                                }}
                              />
                              {platform.icon ? (
                                <platform.icon size={16} className="sm:w-6 sm:h-6 relative z-10 group-hover:text-white transition-colors duration-300" />
                              ) : (
                                <Image 
                                  src={platform.iconPath!} 
                                  alt={platform.name} 
                                  width={16} 
                                  height={16} 
                                  className="relative z-10 w-4 h-4 sm:w-6 sm:h-6"
                                />
                              )}
                              {/* Tooltip on hover */}
                              <AnimatePresence>
                                {hoveredPlatform === platform.id && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 text-xs rounded whitespace-nowrap z-10"
                                  >
                                    {platform.name}
                                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                                      <div className="border-4 border-transparent border-t-slate-800 dark:border-t-slate-200"></div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.a>
                          );
                        })}
                      </div>
                    </div>
                  );
                }).filter(Boolean);
              })()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
