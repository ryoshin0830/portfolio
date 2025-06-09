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
      data-oid="471glyr"
    >
      <div className="container mx-auto px-4" data-oid="_20e::7">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          data-oid="uzp2x5p"
        >
          <h2
            className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-white mb-4"
            data-oid="zweykfn"
          >
            {t("title")}
          </h2>
          <p
            className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
            data-oid="dxd1j1g"
          >
            {t("subtitle")}
          </p>
        </motion.div>

        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20"
          data-oid="p8vypej"
        >
          {/* Profile Image */}
          <motion.div
            className="flex justify-center lg:justify-end"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            data-oid="4odpvzt"
          >
            <div className="relative" data-oid="tc28yl.">
              <div
                className="w-80 h-80 relative rounded-2xl overflow-hidden shadow-2xl"
                data-oid="cky4ulx"
              >
                <Image
                  src="/lab.jpeg"
                  alt="Research Activity"
                  fill
                  className="object-cover"
                  data-oid="jsy26n7"
                />

                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"
                  data-oid="dw.fund"
                />
              </div>
              {/* Floating badges */}
              <motion.div
                className="absolute -top-4 -right-4 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                data-oid="d-9dg1:"
              >
                PhD Student
              </motion.div>
              <motion.div
                className="absolute -bottom-4 -left-4 bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg"
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                data-oid="s-:7zo2"
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
            data-oid="f054su2"
          >
            {/* Current Status */}
            <motion.div variants={itemVariants} data-oid="kjtszqy">
              <h3
                className="text-2xl font-bold text-slate-800 dark:text-white mb-4 flex items-center"
                data-oid="nxkj51w"
              >
                <Building
                  className="mr-3 text-blue-600"
                  size={24}
                  data-oid="1_o9cm1"
                />

                {t("currentStatus")}
              </h3>
              <div className="space-y-3" data-oid="wc4v759">
                <div
                  className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                  data-oid=":4mjgwp"
                >
                  <Image
                    src="/kyoto-u.png"
                    alt="Kyoto University"
                    width={40}
                    height={40}
                    className="rounded-full"
                    data-oid="o2dozx2"
                  />

                  <div data-oid="dwbjc5b">
                    <p
                      className="font-medium text-slate-800 dark:text-white"
                      data-oid="xm8dfzj"
                    >
                      {t("kyotoUniversity")}
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
                  data-oid="c-hpn6u"
                >
                  <Briefcase
                    className="text-purple-600"
                    size={24}
                    data-oid=".j._-09"
                  />

                  <p
                    className="font-medium text-slate-800 dark:text-white"
                    data-oid="c9vu2fb"
                  >
                    {t("eastLinker")}
                  </p>
                </div>
                <div
                  className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg"
                  data-oid="qthw5jv"
                >
                  <Users
                    className="text-green-600"
                    size={24}
                    data-oid="3d4fdlk"
                  />

                  <p
                    className="font-medium text-slate-800 dark:text-white"
                    data-oid="d3w_cum"
                  >
                    {t("japaneseTeacher")}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Specialization */}
            <motion.div variants={itemVariants} data-oid="-jfdp:o">
              <h3
                className="text-2xl font-bold text-slate-800 dark:text-white mb-4 flex items-center"
                data-oid="hzifkd:"
              >
                <Star
                  className="mr-3 text-yellow-600"
                  size={24}
                  data-oid="r78yoaa"
                />

                {t("specialization")}
              </h3>
              <div className="grid grid-cols-1 gap-3" data-oid="qgbl8po">
                {fields.map((field, index) => (
                  <motion.div
                    key={index}
                    className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-lg border-l-4 border-blue-500"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    data-oid="49d1qv4"
                  >
                    <p
                      className="text-slate-700 dark:text-slate-300 font-medium"
                      data-oid="oubrm83"
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
          data-oid="bv_xmu0"
        >
          <div className="text-center" data-oid="yt-n_nq">
            <motion.div
              className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              viewport={{ once: true }}
              data-oid="ni:dka3"
            >
              7+
            </motion.div>
            <p
              className="text-slate-600 dark:text-slate-400 font-medium"
              data-oid="j65wlum"
            >
              年間の教育経験
            </p>
          </div>
          <div className="text-center" data-oid="7iovi77">
            <motion.div
              className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
              viewport={{ once: true }}
              data-oid="h25vxnq"
            >
              5000+
            </motion.div>
            <p
              className="text-slate-600 dark:text-slate-400 font-medium"
              data-oid=":d16srp"
            >
              指導時間
            </p>
          </div>
          <div className="text-center" data-oid="l9zbflg">
            <motion.div
              className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.4 }}
              viewport={{ once: true }}
              data-oid="uow48ec"
            >
              300+
            </motion.div>
            <p
              className="text-slate-600 dark:text-slate-400 font-medium"
              data-oid="x:spu4u"
            >
              指導学生数
            </p>
          </div>
          <div className="text-center" data-oid="jkf7t8h">
            <motion.div
              className="text-4xl font-bold text-red-600 dark:text-red-400 mb-2"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
              viewport={{ once: true }}
              data-oid="oov3my4"
            >
              95%
            </motion.div>
            <p
              className="text-slate-600 dark:text-slate-400 font-medium"
              data-oid="b_7sta6"
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
          data-oid="3t9ybzh"
        >
          <h3
            className="text-3xl font-bold text-slate-800 dark:text-white mb-12 text-center flex items-center justify-center"
            data-oid="d-.wr9."
          >
            <Calendar
              className="mr-3 text-blue-600"
              size={32}
              data-oid="1-6zxcj"
            />

            {t("timeline")}
          </h3>

          <div className="max-w-4xl mx-auto" data-oid="-u9_x7w">
            <div className="relative" data-oid="5nmlrb.">
              {/* Timeline line */}
              <div
                className="absolute left-8 md:left-1/2 transform md:-translate-x-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500"
                data-oid="v7j4xpk"
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
                  data-oid="x_2eca9"
                >
                  {/* Timeline dot */}
                  <div
                    className="absolute left-8 md:left-1/2 transform md:-translate-x-1/2 w-4 h-4 bg-blue-600 rounded-full border-4 border-white dark:border-slate-900 shadow-lg z-10"
                    data-oid="j7_xc0o"
                  />

                  {/* Content */}
                  <div
                    className={`flex-1 ml-20 md:ml-0 ${index % 2 === 0 ? "md:pr-12" : "md:pl-12"}`}
                    data-oid="kbeklby"
                  >
                    <div
                      className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300"
                      data-oid="8xr1avy"
                    >
                      <div
                        className="flex items-center mb-3"
                        data-oid="q8i2:5v"
                      >
                        <div
                          className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-bold"
                          data-oid="vdj74q:"
                        >
                          {event.year}
                        </div>
                        <MapPin
                          className="ml-3 text-slate-400"
                          size={16}
                          data-oid="7p66ls2"
                        />
                      </div>
                      <h4
                        className="text-xl font-bold text-slate-800 dark:text-white mb-2"
                        data-oid="0h9cfa9"
                      >
                        {event.title}
                      </h4>
                      <p
                        className="text-slate-600 dark:text-slate-400 leading-relaxed"
                        data-oid="fc_lmf7"
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
