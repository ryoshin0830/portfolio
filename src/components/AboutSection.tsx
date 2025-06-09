"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  Briefcase,
  Star,
  Building,
  Users,
  Calendar,
  MapPin,
} from "lucide-react";
import Image from "next/image";

const AboutSection = () => {
  const t = useTranslations("about");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  const fields = t.raw("fields") as string[];
  const timelineEvents = t.raw("timelineEvents") as Array<{
    year: string;
    title: string;
    description: string;
  }>;

  return (
    <section
      id="about"
      className="py-20 bg-white dark:bg-slate-900"
      data-oid="jv-nk4d"
    >
      <div className="container mx-auto px-4" data-oid="-5-.yo9">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          data-oid="jjr5rxu"
        >
          <h2
            className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-white mb-4"
            data-oid="zrt_gwe"
          >
            {t("title")}
          </h2>
          <p
            className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
            data-oid="mg2yisn"
          >
            {t("subtitle")}
          </p>
        </motion.div>

        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20"
          data-oid="ngpt1mw"
        >
          {/* Profile Image */}
          <motion.div
            className="flex justify-center lg:justify-end"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            data-oid="fwh_l8o"
          >
            <div className="relative" data-oid="-lpbek4">
              <div
                className="w-80 h-80 relative rounded-2xl overflow-hidden shadow-2xl"
                data-oid="cjto_af"
              >
                <Image
                  src="/lab.jpeg"
                  alt="Research Activity"
                  fill
                  className="object-cover"
                  data-oid="k:zy2zz"
                />

                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"
                  data-oid="tiuz6q1"
                />
              </div>
              {/* Floating badges */}
              <motion.div
                className="absolute -top-4 -right-4 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                data-oid="86xdil3"
              >
                PhD Student
              </motion.div>
              <motion.div
                className="absolute -bottom-4 -left-4 bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg"
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                data-oid="o6jer.3"
              >
                CEO
              </motion.div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            data-oid="d:t:pu0"
          >
            {/* Current Status */}
            <motion.div variants={itemVariants} data-oid="ns7pzqx">
              <h3
                className="text-2xl font-bold text-slate-800 dark:text-white mb-4 flex items-center"
                data-oid="ozlk4ty"
              >
                <Building
                  className="mr-3 text-blue-600"
                  size={24}
                  data-oid="onzw4f7"
                />

                {t("currentStatus")}
              </h3>
              <div className="space-y-3" data-oid="mee_2eb">
                <div
                  className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                  data-oid="c7_67wr"
                >
                  <Image
                    src="/kyoto-u.png"
                    alt="Kyoto University"
                    width={40}
                    height={40}
                    className="rounded-full"
                    data-oid="3..r_gc"
                  />

                  <div data-oid="hca3wiy">
                    <p
                      className="font-medium text-slate-800 dark:text-white"
                      data-oid="ak8--t."
                    >
                      {t("kyotoUniversity")}
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
                  data-oid="us-db9."
                >
                  <Briefcase
                    className="text-purple-600"
                    size={24}
                    data-oid="l.5dt2p"
                  />

                  <p
                    className="font-medium text-slate-800 dark:text-white"
                    data-oid="cm7xv-t"
                  >
                    {t("eastLinker")}
                  </p>
                </div>
                <div
                  className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg"
                  data-oid="d:9u8ol"
                >
                  <Users
                    className="text-green-600"
                    size={24}
                    data-oid="n_flyro"
                  />

                  <p
                    className="font-medium text-slate-800 dark:text-white"
                    data-oid="egkw8_a"
                  >
                    {t("japaneseTeacher")}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Specialization */}
            <motion.div variants={itemVariants} data-oid="t3wgoqw">
              <h3
                className="text-2xl font-bold text-slate-800 dark:text-white mb-4 flex items-center"
                data-oid="maz4odt"
              >
                <Star
                  className="mr-3 text-yellow-600"
                  size={24}
                  data-oid="qwpv:-3"
                />

                {t("specialization")}
              </h3>
              <div className="grid grid-cols-1 gap-3" data-oid="61yzpbh">
                {fields.map((field, index) => (
                  <motion.div
                    key={index}
                    className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-lg border-l-4 border-blue-500"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    data-oid="ghjpm3v"
                  >
                    <p
                      className="text-slate-700 dark:text-slate-300 font-medium"
                      data-oid="blw:xky"
                    >
                      {field}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Stats Section */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          data-oid="2xbe5g5"
        >
          <div className="text-center" data-oid="3yh63qs">
            <motion.div
              className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              viewport={{ once: true }}
              data-oid="yfz2li1"
            >
              7+
            </motion.div>
            <p
              className="text-slate-600 dark:text-slate-400 font-medium"
              data-oid="7hp58iu"
            >
              年間の教育経験
            </p>
          </div>
          <div className="text-center" data-oid="9iqqnh2">
            <motion.div
              className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
              viewport={{ once: true }}
              data-oid="oklb3fa"
            >
              5000+
            </motion.div>
            <p
              className="text-slate-600 dark:text-slate-400 font-medium"
              data-oid="_q8wh0h"
            >
              指導時間
            </p>
          </div>
          <div className="text-center" data-oid=".pdm9m1">
            <motion.div
              className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.4 }}
              viewport={{ once: true }}
              data-oid="wh4x0mi"
            >
              300+
            </motion.div>
            <p
              className="text-slate-600 dark:text-slate-400 font-medium"
              data-oid="7wwjh.u"
            >
              指導学生数
            </p>
          </div>
          <div className="text-center" data-oid="qxq65p6">
            <motion.div
              className="text-4xl font-bold text-red-600 dark:text-red-400 mb-2"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
              viewport={{ once: true }}
              data-oid="pf_ui4n"
            >
              95%
            </motion.div>
            <p
              className="text-slate-600 dark:text-slate-400 font-medium"
              data-oid="kvj-56:"
            >
              JLPT合格率
            </p>
          </div>
        </motion.div>

        {/* Timeline Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          data-oid="fmlyh1w"
        >
          <h3
            className="text-3xl font-bold text-slate-800 dark:text-white mb-12 text-center flex items-center justify-center"
            data-oid="vm-xskn"
          >
            <Calendar
              className="mr-3 text-blue-600"
              size={32}
              data-oid="jpr12tx"
            />

            {t("timeline")}
          </h3>

          <div className="max-w-4xl mx-auto" data-oid="htn8ij2">
            <div className="relative" data-oid="7drw13-">
              {/* Timeline line */}
              <div
                className="absolute left-8 md:left-1/2 transform md:-translate-x-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500"
                data-oid="8ishmxl"
              />

              {timelineEvents.map((event, index) => (
                <motion.div
                  key={index}
                  className={`relative flex items-center mb-12 ${
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  data-oid="ym:sdne"
                >
                  {/* Timeline dot */}
                  <div
                    className="absolute left-8 md:left-1/2 transform md:-translate-x-1/2 w-4 h-4 bg-blue-600 rounded-full border-4 border-white dark:border-slate-900 shadow-lg z-10"
                    data-oid="5fkpd.t"
                  />

                  {/* Content */}
                  <div
                    className={`flex-1 ml-20 md:ml-0 ${index % 2 === 0 ? "md:pr-12" : "md:pl-12"}`}
                    data-oid="p7ljc.:"
                  >
                    <div
                      className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300"
                      data-oid="4uqmumx"
                    >
                      <div
                        className="flex items-center mb-3"
                        data-oid="_byur3m"
                      >
                        <div
                          className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-bold"
                          data-oid="uxrm2nn"
                        >
                          {event.year}
                        </div>
                        <MapPin
                          className="ml-3 text-slate-400"
                          size={16}
                          data-oid="yg1v7e1"
                        />
                      </div>
                      <h4
                        className="text-xl font-bold text-slate-800 dark:text-white mb-2"
                        data-oid="ys8bzud"
                      >
                        {event.title}
                      </h4>
                      <p
                        className="text-slate-600 dark:text-slate-400 leading-relaxed"
                        data-oid="e_vunf5"
                      >
                        {event.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
