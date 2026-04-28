'use client';

import { motion } from 'framer-motion';
import Hero3D from '@/components/Hero3D';
import Link from 'next/link';
import { Car, Package, ShoppingBag, ArrowRight } from 'lucide-react';

const features = [
  {
    title: "Taxi & Auto Booking",
    description: "Quick rides around campus with live driver tracking and gate pass timers.",
    icon: Car,
    color: "text-blue-400"
  },
  {
    title: "Vending Tracker",
    description: "Real-time stock status for all vending machines across NITC hostels.",
    icon: Package,
    color: "text-green-400"
  },
  {
    title: "Student Marketplace",
    description: "Buy and sell items within the campus community. Simple and secure.",
    icon: ShoppingBag,
    color: "text-purple-400"
  }
];

export default function LandingPage() {
  return (
    <main className="relative min-h-screen bg-[#0d0d0d] overflow-x-hidden">
      <Hero3D />
      
      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center h-screen px-4 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-6xl md:text-8xl font-bold tracking-tighter text-white mb-6"
        >
          Nest<span className="text-[#2E75B6]">C</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl md:text-2xl text-gray-400 max-w-2xl mb-10"
        >
          Your Campus, Your Home. The ultimate super app for NIT Calicut students.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link href="/auth/login" className="btn-primary flex items-center gap-2">
            Login with NITC Email <ArrowRight size={18} />
          </Link>
          <Link href="#features" className="btn-outline">
            Explore Features
          </Link>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24 px-4 bg-gradient-to-b from-transparent to-[#0d0d0d]">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="glass-card p-8 hover:border-white/20 transition-all group"
              >
                <div className={`mb-6 p-3 rounded-lg bg-white/5 w-fit group-hover:scale-110 transition-transform ${feature.color}`}>
                  <feature.icon size={32} />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-white">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-4 border-t border-white/5 text-center text-gray-500">
        <p>© 2026 NIT Calicut • NestC v2.0</p>
      </footer>
    </main>
  );
}
