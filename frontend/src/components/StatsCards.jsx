import React from 'react';
import { motion } from 'framer-motion';
import { Play, Users, Clock, CheckCircle } from 'lucide-react';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: 'easeOut',
    },
  }),
};

function StatsCards({ status }) {
  const { currentToken, patientsWaiting, averageConsultationTime, patientsServed } = status;

  const cards = [
    {
      title: 'Current Token',
      value: currentToken || '0',
      description: 'Currently in consultation',
      icon: Play,
      iconColor: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-600',
      glowClass: 'text-glow-emerald',
    },
    {
      title: 'Patients Waiting',
      value: patientsWaiting || '0',
      description: 'Waiting in the queue',
      icon: Users,
      iconColor: 'from-indigo-500 to-blue-600',
      textColor: 'text-indigo-600',
      glowClass: 'text-glow-indigo',
    },
    {
      title: 'Average Time',
      value: `${averageConsultationTime || 10}m`,
      description: 'Per patient consultation',
      icon: Clock,
      iconColor: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-600',
    },
    {
      title: 'Patients Served',
      value: patientsServed || '0',
      description: 'Consultations completed',
      icon: CheckCircle,
      iconColor: 'from-purple-500 to-pink-650',
      textColor: 'text-purple-600',
      glowClass: 'text-glow-purple',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            custom={idx}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -5, scale: 1.02 }}
            variants={cardVariants}
            className="glass-panel rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:border-slate-350 shadow-md group"
          >
            {/* Top gradient glow overlay */}
            <div className={`absolute -right-10 -top-10 w-24 h-24 bg-gradient-to-br ${card.iconColor} opacity-5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500`} />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-bold tracking-wider uppercase">
                  {card.title}
                </p>
                <h3 className={`text-4xl font-black mt-2 tracking-tight ${card.textColor} ${card.glowClass || ''}`}>
                  {card.value}
                </h3>
                <p className="text-slate-400 text-[11px] mt-1 font-medium">
                  {card.description}
                </p>
              </div>

              <div className={`p-3.5 rounded-xl bg-gradient-to-br ${card.iconColor} text-white flex items-center justify-center shadow-md shadow-indigo-650/10`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default StatsCards;
