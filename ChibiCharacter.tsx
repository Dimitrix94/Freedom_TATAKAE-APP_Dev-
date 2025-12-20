import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface ChibiCharacterProps {
  message?: string;
}

export function ChibiCharacter({ message = "Hi!! Let's see your progress" }: ChibiCharacterProps) {
  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    // Show bubble after character finishes sliding in
    const timer = setTimeout(() => setShowBubble(true), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative mb-8">
      <motion.div
        initial={{ x: -200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 100, 
          damping: 15,
          duration: 0.6 
        }}
        className="flex items-end gap-4"
      >
        {/* Chibi Character */}
        <div className="relative">
          {/* Character SVG */}
          <motion.svg
            width="120"
            height="140"
            viewBox="0 0 120 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-lg"
          >
            {/* Body - School uniform */}
            <ellipse cx="60" cy="100" rx="28" ry="32" fill="#1e3a8a" />
            <rect x="45" y="85" width="30" height="35" fill="#1e3a8a" rx="5" />
            
            {/* Collar */}
            <path d="M 50 88 L 60 95 L 70 88" stroke="white" strokeWidth="3" fill="none" />
            <circle cx="60" cy="95" r="3" fill="#ef4444" />
            
            {/* Arms */}
            <motion.ellipse 
              cx="35" 
              cy="95" 
              rx="8" 
              ry="18" 
              fill="#ffd4a3"
              animate={{ rotate: [0, -15, 0] }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5,
                ease: "easeInOut"
              }}
              style={{ transformOrigin: "35px 85px" }}
            />
            <motion.ellipse 
              cx="85" 
              cy="95" 
              rx="8" 
              ry="18" 
              fill="#ffd4a3"
              animate={{ rotate: [0, 15, 0, -10, 0] }}
              transition={{ 
                repeat: Infinity, 
                duration: 1,
                ease: "easeInOut"
              }}
              style={{ transformOrigin: "85px 85px" }}
            />
            
            {/* Waving hand */}
            <motion.g
              animate={{ rotate: [0, 20, -20, 20, 0] }}
              transition={{ 
                repeat: Infinity, 
                duration: 0.8,
                ease: "easeInOut"
              }}
              style={{ transformOrigin: "85px 85px" }}
            >
              <circle cx="85" cy="80" r="7" fill="#ffd4a3" />
            </motion.g>
            
            {/* Skirt */}
            <path 
              d="M 45 115 Q 60 125 75 115 L 75 128 Q 60 132 45 128 Z" 
              fill="#dc2626"
            />
            
            {/* Legs */}
            <rect x="50" y="125" width="8" height="12" fill="#ffd4a3" rx="4" />
            <rect x="62" y="125" width="8" height="12" fill="#ffd4a3" rx="4" />
            
            {/* Shoes */}
            <ellipse cx="54" cy="137" rx="6" ry="3" fill="#1e293b" />
            <ellipse cx="66" cy="137" rx="6" ry="3" fill="#1e293b" />
            
            {/* Head */}
            <circle cx="60" cy="45" r="28" fill="#ffd4a3" />
            
            {/* Pink Hair */}
            <ellipse cx="60" cy="30" rx="32" ry="28" fill="#ff7aa2" />
            <ellipse cx="35" cy="40" rx="15" ry="20" fill="#ff7aa2" />
            <ellipse cx="85" cy="40" rx="15" ry="20" fill="#ff7aa2" />
            
            {/* Hair highlights */}
            <ellipse cx="55" cy="25" rx="8" ry="6" fill="#ffb3d1" opacity="0.6" />
            <ellipse cx="70" cy="28" rx="6" ry="5" fill="#ffb3d1" opacity="0.6" />
            
            {/* Face */}
            {/* Eyes */}
            <motion.g
              animate={{ scaleY: [1, 0.1, 1] }}
              transition={{ 
                repeat: Infinity, 
                duration: 3,
                repeatDelay: 2
              }}
              style={{ transformOrigin: "50px 43px" }}
            >
              <circle cx="50" cy="43" r="5" fill="#2d3748" />
              <circle cx="48" cy="41" r="2" fill="white" />
            </motion.g>
            
            <motion.g
              animate={{ scaleY: [1, 0.1, 1] }}
              transition={{ 
                repeat: Infinity, 
                duration: 3,
                repeatDelay: 2
              }}
              style={{ transformOrigin: "70px 43px" }}
            >
              <circle cx="70" cy="43" r="5" fill="#2d3748" />
              <circle cx="68" cy="41" r="2" fill="white" />
            </motion.g>
            
            {/* Blush */}
            <ellipse cx="42" cy="50" rx="6" ry="4" fill="#ff9999" opacity="0.6" />
            <ellipse cx="78" cy="50" rx="6" ry="4" fill="#ff9999" opacity="0.6" />
            
            {/* Mouth - Happy smile */}
            <path 
              d="M 52 52 Q 60 58 68 52" 
              stroke="#2d3748" 
              strokeWidth="2" 
              fill="none"
              strokeLinecap="round"
            />
            
            {/* Small shine on eyes for sparkle effect */}
            <circle cx="71" cy="42" r="1.5" fill="white" opacity="0.8" />
            <circle cx="51" cy="42" r="1.5" fill="white" opacity="0.8" />
          </motion.svg>
          
          {/* Sparkles around character */}
          <motion.div
            className="absolute top-2 right-2"
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 1.5,
              delay: 0.2
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 0 L9 7 L16 8 L9 9 L8 16 L7 9 L0 8 L7 7 Z" fill="#fbbf24" />
            </svg>
          </motion.div>
          
          <motion.div
            className="absolute top-10 -left-2"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 1.5,
              delay: 0.5
            }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M8 0 L9 7 L16 8 L9 9 L8 16 L7 9 L0 8 L7 7 Z" fill="#f472b6" />
            </svg>
          </motion.div>
        </div>

        {/* Speech Bubble */}
        {showBubble && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 15 
            }}
            className="relative bg-white rounded-2xl px-6 py-4 shadow-lg border-2 border-indigo-200"
          >
            <p className="text-gray-800 whitespace-nowrap">
              {message}
            </p>
            {/* Speech bubble tail */}
            <div className="absolute left-0 top-1/2 -translate-x-2 -translate-y-1/2">
              <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                <path d="M 16 10 L 0 0 L 0 20 Z" fill="white" />
                <path d="M 16 10 L 0 0 L 0 20 Z" stroke="#c7d2fe" strokeWidth="2" />
              </svg>
            </div>
            
            {/* Animated dots for excitement */}
            <motion.div 
              className="absolute -top-1 -right-1 flex gap-1"
              animate={{ y: [-2, 2, -2] }}
              transition={{ 
                repeat: Infinity, 
                duration: 1,
                ease: "easeInOut"
              }}
            >
              <span className="text-pink-500">✨</span>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
