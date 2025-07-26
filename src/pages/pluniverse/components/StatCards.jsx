import { motion } from 'framer-motion';
import { Clock, Award, Users } from 'lucide-react';

const statData = [
  {
    icon: <Clock size={28} className='text-purple-400' />,
    label: 'Horas Ahorradas',
    value: '12.5',
  },
  {
    icon: <Award size={28} className='text-green-400' />,
    label: 'Retos Completados',
    value: '7',
  },
  {
    icon: <Users size={28} className='text-amber-400' />,
    label: 'Ranking Global',
    value: '#42',
  },
];

const StatCards = () => (
  <motion.div
    className='stat-cards-grid'
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5, delay: 0.2 }}
  >
    {statData.map((stat) => (
      <div key={stat.label} className='stat-card'>
        {stat.icon}
        <h3>{stat.label}</h3>
        <p className='metric-value'>{stat.value}</p>
      </div>
    ))}
  </motion.div>
);

export default StatCards;
