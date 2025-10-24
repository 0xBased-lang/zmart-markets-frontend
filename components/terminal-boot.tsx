"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function TerminalBoot({ onComplete }: { onComplete: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const bootSequence = [
    "INITIALIZING NEURAL INTERFACE...",
    "LOADING QUANTUM ENCRYPTION... [OK]",
    "ESTABLISHING SECURE CONNECTION...",
    "BYPASSING FIREWALL... [OK]",
    "DECRYPTING MARKET DATA...",
    "SYNCHRONIZING BLOCKCHAIN NODES... [OK]",
    "INITIALIZING PREDICTION ALGORITHMS...",
    "CALIBRATING CONSPIRACY MATRIX... [OK]",
    "ACCESS GRANTED",
    "WELCOME TO ZMART",
  ];

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < bootSequence.length) {
        setLines((prev) => [...prev, bootSequence[currentIndex]]);
        currentIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsComplete(true);
          setTimeout(onComplete, 500);
        }, 1000);
      }
    }, 250);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
        >
          <div className="font-mono text-conspiracy-cyan space-y-2 max-w-2xl px-8">
            {lines.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2"
              >
                <span className="text-conspiracy-green">{">"}</span>
                <span>{line}</span>
                {i === lines.length - 1 && (
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  >
                    _
                  </motion.span>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
