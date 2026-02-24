'use client'

import { Heart } from 'lucide-react'

interface HeartParticle {
  id: number
  left: number
  top: number
  size: number
  delay: number
  duration: number
  opacity: number
  color: string
}

// Generated once at module load - stable across renders, no side effects
const HEART_COLORS = ['#f87171', '#fb7185', '#f43f5e', '#ef4444']
const HEARTS: HeartParticle[] = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  top: Math.random() * 100,
  size: 6 + Math.random() * 10,
  delay: Math.random() * 6,
  duration: 4 + Math.random() * 3,
  opacity: 0.1 + Math.random() * 0.2,
  color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
}))

export default function AnimatedHearts() {
  const hearts = HEARTS

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {hearts.map((heart) => (
        <Heart
          key={heart.id}
          className="absolute heart-float"
          style={{
            left: `${heart.left}%`,
            top: `${heart.top}%`,
            width: `${heart.size}px`,
            height: `${heart.size}px`,
            color: heart.color,
            opacity: heart.opacity,
            animationDelay: `${heart.delay}s`,
            animationDuration: `${heart.duration}s`,
          }}
          fill="currentColor"
        />
      ))}
    </div>
  )
}

