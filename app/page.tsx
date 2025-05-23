'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function Home() {
  const handleNavigation = (path: string) => {
    console.log('Navigating to:', path);
    window.location.href = path;
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-white text-black">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <motion.h1 
          className="mb-24 max-w-4xl mx-auto text-black"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          A Single Link
          <span style={{ marginTop: '1rem', display: 'block' }}>for all your Coding Projects.</span>
        </motion.h1>
        
        <div className="flex flex-col gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <button 
              onClick={() => handleNavigation('/signup')}
              className="btn-primary"
            >
              Create your Superfolio
            </button>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <button 
              onClick={() => handleNavigation('/login')}
              className="btn-text"
            >
              Log in
            </button>
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
} 