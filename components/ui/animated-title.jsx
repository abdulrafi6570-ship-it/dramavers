'use client';
import { motion } from 'motion/react';

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const letterVariant = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function AnimatedTitle({ text = 'DramaVers', className = '' }) {
  const letters = text.split('');

  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <motion.h1
        variants={container}
        initial="hidden"
        animate="show"
        aria-label={text}
        className="text-4xl md:text-6xl font-display font-black tracking-tight text-foreground flex"
      >
        {letters.map((ch, i) => (
          <motion.span
            key={i}
            variants={letterVariant}
            className="inline-block"
            style={ch === ' ' ? { width: '0.3em' } : undefined}
          >
            {ch}
          </motion.span>
        ))}
      </motion.h1>

      <motion.svg
        viewBox="0 0 240 20"
        className="h-3 w-40 md:w-56 mt-2 text-primary"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
      >
        <motion.path
          d="M6 12C40 4 80 18 120 10C160 2 200 16 234 8"
          style={{ strokeLinecap: 'round' }}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeInOut', delay: letters.length * 0.06 + 0.3 }}
        />
      </motion.svg>
    </div>
  );
}