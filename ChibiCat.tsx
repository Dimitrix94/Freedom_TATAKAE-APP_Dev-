import { motion, useAnimation } from 'motion/react';
import { useEffect, useState } from 'react';

interface ChibiCatProps {
  message?: string;
}

export function ChibiCat({ message = "Hi!! Let's track student progress" }: ChibiCatProps) {
  const [animationPhase, setAnimationPhase] = useState<'walking' | 'idle'>('walking');
  const [showBubble, setShowBubble] = useState(false);
  const controls = useAnimation();

  useEffect(() => {
    // Start walking animation
    controls.start({
      x: [0, 300],
      transition: { duration: 2, ease: "linear" }
    }).then(() => {
      // After walking, switch to idle and show bubble
      setAnimationPhase('idle');
      setTimeout(() => setShowBubble(true), 300);
    });
  }, [controls]);

  return (
    <div className="relative mb-8 h-40">
      <motion.div
        animate={controls}
        className="absolute left-0 flex items-end gap-4"
      >
        {/* 3D Realistic Cat Character */}
        <div className="relative" style={{ filter: 'drop-shadow(0 20px 25px rgba(0, 0, 0, 0.15))' }}>
          <motion.svg
            width="120"
            height="130"
            viewBox="0 0 120 130"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            animate={
              animationPhase === 'walking' 
                ? { y: [0, -4, 0, -4, 0] }
                : { y: [0, -2, 0] }
            }
            transition={
              animationPhase === 'walking'
                ? { duration: 0.4, repeat: Infinity, ease: "easeInOut" }
                : { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }
          >
            {/* Shadow - 3D effect */}
            <motion.ellipse 
              cx="60" 
              cy="118" 
              rx="35" 
              ry="8" 
              fill="rgba(0,0,0,0.2)"
              animate={
                animationPhase === 'walking'
                  ? { rx: [35, 40, 35, 40, 35] }
                  : { rx: [35, 37, 35] }
              }
              transition={
                animationPhase === 'walking'
                  ? { duration: 0.4, repeat: Infinity }
                  : { duration: 2, repeat: Infinity }
              }
            />
            
            {/* Body - 3D layered structure */}
            <defs>
              <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff9557" />
                <stop offset="50%" stopColor="#ff8c42" />
                <stop offset="100%" stopColor="#ff7425" />
              </linearGradient>
              <linearGradient id="bellyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffd4b3" />
                <stop offset="100%" stopColor="#ffcc99" />
              </linearGradient>
              <linearGradient id="headGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffa861" />
                <stop offset="50%" stopColor="#ff8c42" />
                <stop offset="100%" stopColor="#ff7425" />
              </linearGradient>
              
              {/* 3D highlight effect */}
              <radialGradient id="highlight" cx="30%" cy="30%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </radialGradient>
            </defs>

            {/* Back legs - 3D depth */}
            <motion.g
              animate={
                animationPhase === 'walking'
                  ? { rotate: [0, -20, 0, 20, 0] }
                  : {}
              }
              transition={
                animationPhase === 'walking'
                  ? { duration: 0.4, repeat: Infinity, ease: "easeInOut" }
                  : {}
              }
              style={{ transformOrigin: "45px 85px" }}
            >
              <ellipse cx="45" cy="95" rx="7" ry="14" fill="url(#bodyGradient)" opacity="0.8" />
              <ellipse cx="45" cy="105" rx="8" ry="6" fill="#ff7425" />
              <ellipse cx="45" cy="105" rx="5" ry="3" fill="#ff6020" />
            </motion.g>
            
            <motion.g
              animate={
                animationPhase === 'walking'
                  ? { rotate: [0, 20, 0, -20, 0] }
                  : {}
              }
              transition={
                animationPhase === 'walking'
                  ? { duration: 0.4, repeat: Infinity, ease: "easeInOut" }
                  : {}
              }
              style={{ transformOrigin: "75px 85px" }}
            >
              <ellipse cx="75" cy="95" rx="7" ry="14" fill="url(#bodyGradient)" opacity="0.8" />
              <ellipse cx="75" cy="105" rx="8" ry="6" fill="#ff7425" />
              <ellipse cx="75" cy="105" rx="5" ry="3" fill="#ff6020" />
            </motion.g>

            {/* Main body with 3D gradient */}
            <ellipse cx="60" cy="78" rx="32" ry="28" fill="url(#bodyGradient)" />
            <ellipse cx="60" cy="78" rx="28" ry="24" fill="url(#highlight)" />
            
            {/* Belly with realistic shading */}
            <ellipse cx="60" cy="85" rx="18" ry="16" fill="url(#bellyGradient)" />
            <ellipse cx="60" cy="82" rx="12" ry="10" fill="rgba(255,255,255,0.3)" />
            
            {/* Tail with 3D curve and motion */}
            <motion.g
              animate={
                animationPhase === 'walking'
                  ? {
                      rotate: [0, -8, 0, 8, 0]
                    }
                  : {
                      rotate: [0, -5, 5, -5, 0]
                    }
              }
              transition={
                animationPhase === 'walking'
                  ? { duration: 0.4, repeat: Infinity }
                  : { duration: 2, repeat: Infinity }
              }
              style={{ transformOrigin: "30px 75px" }}
            >
              <motion.path
                d="M 30 75 Q 18 68 15 55 Q 14 42 20 32"
                stroke="url(#bodyGradient)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
              />
              <motion.path
                d="M 30 75 Q 20 68 17 55 Q 16 42 21 32"
                stroke="rgba(255,149,87,0.6)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
              />
              {/* Tail tip with highlight */}
              <motion.circle
                cx="20"
                cy="32"
                r="6"
                fill="#ff7425"
              />
              <motion.circle
                cx="21"
                cy="31"
                r="3"
                fill="#ffa861"
              />
            </motion.g>
            
            {/* Front legs with 3D depth */}
            <motion.g
              animate={
                animationPhase === 'walking'
                  ? { rotate: [0, 18, 0, -18, 0] }
                  : {}
              }
              transition={
                animationPhase === 'walking'
                  ? { duration: 0.4, repeat: Infinity }
                  : {}
              }
              style={{ transformOrigin: "50px 88px" }}
            >
              <ellipse cx="50" cy="93" rx="6" ry="11" fill="url(#bodyGradient)" />
              <ellipse cx="50" cy="100" rx="7" ry="5" fill="#ff7425" />
              <circle cx="48" cy="101" r="1.5" fill="#ff6020" />
              <circle cx="52" cy="101" r="1.5" fill="#ff6020" />
              <circle cx="50" cy="103" r="1.5" fill="#ff6020" />
            </motion.g>
            
            <motion.g
              animate={
                animationPhase === 'walking'
                  ? { rotate: [0, -18, 0, 18, 0] }
                  : {}
              }
              transition={
                animationPhase === 'walking'
                  ? { duration: 0.4, repeat: Infinity }
                  : {}
              }
              style={{ transformOrigin: "70px 88px" }}
            >
              <ellipse cx="70" cy="93" rx="6" ry="11" fill="url(#bodyGradient)" />
              <ellipse cx="70" cy="100" rx="7" ry="5" fill="#ff7425" />
              <circle cx="68" cy="101" r="1.5" fill="#ff6020" />
              <circle cx="72" cy="101" r="1.5" fill="#ff6020" />
              <circle cx="70" cy="103" r="1.5" fill="#ff6020" />
            </motion.g>
            
            {/* Head with 3D gradient and shading */}
            <ellipse cx="60" cy="50" rx="26" ry="24" fill="url(#headGradient)" />
            <ellipse cx="60" cy="48" rx="22" ry="20" fill="url(#highlight)" />
            
            {/* Fur texture stripes */}
            <path d="M 42 42 Q 48 39 54 42" stroke="#ff7425" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M 66 42 Q 72 39 78 42" stroke="#ff7425" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M 52 35 Q 60 33 68 35" stroke="#ff7425" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            
            {/* 3D Ears with inner detail */}
            <motion.g
              animate={
                animationPhase === 'idle'
                  ? { rotate: [0, -6, 0, 6, 0] }
                  : {}
              }
              transition={
                animationPhase === 'idle'
                  ? { duration: 3, repeat: Infinity, ease: "easeInOut" }
                  : {}
              }
              style={{ transformOrigin: "42px 28px" }}
            >
              <path d="M 42 30 L 32 15 L 50 26 Z" fill="url(#bodyGradient)" />
              <path d="M 42 30 L 36 18 L 48 27 Z" fill="#ffa861" />
              <path d="M 40 28 L 38 22 L 44 26 Z" fill="#ffcc99" />
            </motion.g>
            
            <motion.g
              animate={
                animationPhase === 'idle'
                  ? { rotate: [0, 6, 0, -6, 0] }
                  : {}
              }
              transition={
                animationPhase === 'idle'
                  ? { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.2 }
                  : {}
              }
              style={{ transformOrigin: "78px 28px" }}
            >
              <path d="M 78 30 L 88 15 L 70 26 Z" fill="url(#bodyGradient)" />
              <path d="M 78 30 L 84 18 L 72 27 Z" fill="#ffa861" />
              <path d="M 80 28 L 82 22 L 76 26 Z" fill="#ffcc99" />
            </motion.g>
            
            {/* Face with 3D features */}
            {/* Expressive 3D eyes with shine */}
            <motion.g
              animate={{ 
                scaleY: [1, 0.2, 1],
                y: [0, 1, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 5,
                repeatDelay: 2
              }}
              style={{ transformOrigin: "48px 47px" }}
            >
              <ellipse cx="48" cy="47" rx="5" ry="7" fill="#2d3748" />
              <ellipse cx="48" cy="46" rx="4" ry="5.5" fill="#1a202c" />
              <circle cx="49.5" cy="45" r="2" fill="white" opacity="0.9" />
              <circle cx="50" cy="44" r="1" fill="white" />
            </motion.g>
            
            <motion.g
              animate={{ 
                scaleY: [1, 0.2, 1],
                y: [0, 1, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 5,
                repeatDelay: 2
              }}
              style={{ transformOrigin: "72px 47px" }}
            >
              <ellipse cx="72" cy="47" rx="5" ry="7" fill="#2d3748" />
              <ellipse cx="72" cy="46" rx="4" ry="5.5" fill="#1a202c" />
              <circle cx="73.5" cy="45" r="2" fill="white" opacity="0.9" />
              <circle cx="74" cy="44" r="1" fill="white" />
            </motion.g>
            
            {/* 3D Nose with gradient */}
            <ellipse cx="60" cy="54" rx="4" ry="3" fill="#ff6b6b" />
            <ellipse cx="60" cy="53" rx="2.5" ry="2" fill="#ff8787" />
            <path d="M 60 54 L 58 57 L 62 57 Z" fill="#ff5252" />
            
            {/* Smiling mouth with depth */}
            <path 
              d="M 58 57 Q 58 60 55 60" 
              stroke="#2d3748" 
              strokeWidth="2" 
              fill="none"
              strokeLinecap="round"
            />
            <path 
              d="M 62 57 Q 62 60 65 60" 
              stroke="#2d3748" 
              strokeWidth="2" 
              fill="none"
              strokeLinecap="round"
            />
            <path 
              d="M 65 60 Q 68 62 70 61" 
              stroke="#2d3748" 
              strokeWidth="2" 
              fill="none"
              strokeLinecap="round"
            />
            
            {/* Realistic whiskers with gradient */}
            <line x1="35" y1="50" x2="20" y2="48" stroke="#2d3748" strokeWidth="1.5" opacity="0.8" />
            <line x1="35" y1="54" x2="20" y2="56" stroke="#2d3748" strokeWidth="1.5" opacity="0.8" />
            <line x1="36" y1="58" x2="22" y2="62" stroke="#2d3748" strokeWidth="1.5" opacity="0.7" />
            <line x1="85" y1="50" x2="100" y2="48" stroke="#2d3748" strokeWidth="1.5" opacity="0.8" />
            <line x1="85" y1="54" x2="100" y2="56" stroke="#2d3748" strokeWidth="1.5" opacity="0.8" />
            <line x1="84" y1="58" x2="98" y2="62" stroke="#2d3748" strokeWidth="1.5" opacity="0.7" />
            
            {/* Cute blush marks */}
            <ellipse cx="38" cy="52" rx="4" ry="3" fill="#ff9999" opacity="0.4" />
            <ellipse cx="82" cy="52" rx="4" ry="3" fill="#ff9999" opacity="0.4" />
            
            {/* Waving paw - only when idle with 3D effect */}
            {animationPhase === 'idle' && (
              <motion.g
                animate={{ 
                  rotate: [0, 30, -15, 30, 0] 
                }}
                transition={{ 
                  duration: 1.2,
                  repeat: 3,
                  ease: "easeInOut"
                }}
                style={{ transformOrigin: "85px 68px" }}
              >
                <ellipse cx="90" cy="76" rx="6" ry="12" fill="url(#bodyGradient)" />
                <motion.ellipse 
                  cx="93" 
                  cy="84" 
                  rx="7" 
                  ry="7" 
                  fill="#ffb380"
                  animate={{
                    scale: [1, 1.15, 1]
                  }}
                  transition={{
                    duration: 0.3,
                    repeat: 12,
                    ease: "easeInOut"
                  }}
                />
                {/* Detailed paw pads */}
                <circle cx="91" cy="83" r="1.8" fill="#ff8c42" />
                <circle cx="95" cy="83" r="1.8" fill="#ff8c42" />
                <circle cx="93" cy="85" r="2" fill="#ff8c42" />
                <circle cx="93" cy="82" r="1.5" fill="#ff8c42" />
                {/* 3D highlight on paw */}
                <ellipse cx="93" cy="82" rx="4" ry="3" fill="rgba(255,255,255,0.3)" />
              </motion.g>
            )}
          </motion.svg>
        </div>

        {/* Enhanced Speech Bubble with 3D effect */}
        {showBubble && (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotateY: -90 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 15,
              delay: 0.2
            }}
            className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl px-6 py-4 shadow-xl border-2 border-orange-200 ml-2"
            style={{
              filter: 'drop-shadow(0 10px 15px rgba(0, 0, 0, 0.1))'
            }}
          >
            <p className="text-gray-800 whitespace-nowrap">
              {message}
            </p>
            {/* 3D Speech bubble tail */}
            <div className="absolute left-0 top-1/2 -translate-x-2 -translate-y-1/2">
              <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
                <defs>
                  <linearGradient id="bubbleTail" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f9fafb" />
                    <stop offset="100%" stopColor="white" />
                  </linearGradient>
                </defs>
                <path d="M 20 12 L 0 0 L 0 24 Z" fill="url(#bubbleTail)" />
                <path d="M 20 12 L 0 0 L 0 24 Z" stroke="#fed7aa" strokeWidth="2" />
              </svg>
            </div>
            
            {/* Animated floating emoji */}
            <motion.div 
              className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md"
              animate={{ 
                rotate: [0, 15, -15, 0],
                scale: [1, 1.15, 1],
                y: [0, -3, 0]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <span className="text-2xl">📊</span>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
