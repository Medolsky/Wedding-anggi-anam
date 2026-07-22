"use client";

import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

interface AnimatedTextProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: "fadeUp" | "maskReveal" | "scaleUp" | "slideRight" | "slideLeft";
}

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const maskRevealVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const scaleUpVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 15 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const slideRightVariants: Variants = {
  hidden: { opacity: 0, x: -25 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const slideLeftVariants: Variants = {
  hidden: { opacity: 0, x: 25 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export function AnimatedText({
  children,
  className = "",
  delay = 0,
  variant = "fadeUp",
}: AnimatedTextProps) {
  let variants = fadeUpVariants;
  if (variant === "maskReveal") variants = maskRevealVariants;
  if (variant === "scaleUp") variants = scaleUpVariants;
  if (variant === "slideRight") variants = slideRightVariants;
  if (variant === "slideLeft") variants = slideLeftVariants;

  return (
    <motion.div
      className={`transform-gpu ${className}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      custom={delay}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}

/**
 * Smooth hardware-accelerated name reveal
 */
interface CharRevealProps {
  text: string;
  className?: string;
  delay?: number;
  staggerDelay?: number;
}

export function CharReveal({
  text,
  className = "",
  delay = 0,
}: CharRevealProps) {
  return (
    <motion.span
      className={`inline-block transform-gpu ${className}`}
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{
        delay: delay,
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {text}
    </motion.span>
  );
}

/**
 * Stagger children animation wrapper
 */
interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  staggerDelay?: number;
}

export function StaggerContainer({
  children,
  className = "",
  delay = 0,
  staggerDelay = 0.08,
}: StaggerContainerProps) {
  return (
    <motion.div
      className={`transform-gpu ${className}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren: delay,
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Individual stagger child
 */
export function StaggerItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={`transform-gpu ${className}`}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
