// src/components/magicui/sparkles.jsx

"use client";
import React from "react";
import { cn } from "@/lib/utils";

const Sparkles = React.forwardRef(
  (
    {
      id,
      className,
      background,
      minSize = 0.4,
      maxSize = 1,
      particleDensity = 1200,
      particleColor = "#FFFFFF",
    },
    ref
  ) => {
    return (
      <div className={cn("relative h-full w-full", className)} ref={ref}>
        <div className="absolute inset-0 h-full w-full">
          <SparklesCore
            id={id}
            background={background}
            minSize={minSize}
            maxSize={maxSize}
            particleDensity={particleDensity}
            particleColor={particleColor}
          />
        </div>
      </div>
    );
  }
);

Sparkles.displayName = "Sparkles";

export const SparklesCore = (props) => {
  const {
    id,
    minSize,
    maxSize,
    particleDensity,
    className,
    particleColor,
  } = props;
  const [sparkles, setSparkles] = React.useState([]);
  const canvasRef = React.useRef(null);
  const sparkleRef = React.useRef(null);
  const sparkleLoopRef = React.useRef();

  React.useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      let animationFrameId;

      const initSparkles = () => {
        const devicePixelRatio = window.devicePixelRatio || 1;
        const width = canvas.offsetWidth * devicePixelRatio;
        const height = canvas.offsetHeight * devicePixelRatio;

        canvas.width = width;
        canvas.height = height;
        sparkleRef.current = [];
        const numParticles = width * (particleDensity / 10000);
        for (let i = 0; i < numParticles; i++) {
          const size = Math.random() * (maxSize - minSize) + minSize;
          const x = Math.random() * width;
          const y = Math.random() * height;
          const speed = Math.random() * 0.4 + 0.1;
          const opacity = Math.random() * 0.5 + 0.5;
          sparkleRef.current.push({ x, y, size, speed, opacity });
        }
      };

      const animateSparkles = () => {
        if (!canvasRef.current) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const sparkle of sparkleRef.current) {
          sparkle.y -= sparkle.speed;
          if (sparkle.y < 0) {
            sparkle.y = canvas.height;
            sparkle.x = Math.random() * canvas.width;
          }
          ctx.beginPath();
          ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${parseInt(
            particleColor.slice(1, 3),
            16
          )}, ${parseInt(particleColor.slice(3, 5), 16)}, ${parseInt(
            particleColor.slice(5, 7),
            16
          )}, ${sparkle.opacity})`;
          ctx.fill();
        }
        animationFrameId = requestAnimationFrame(animateSparkles);
      };

      initSparkles();
      animateSparkles();

      const handleResize = () => {
        cancelAnimationFrame(animationFrameId);
        initSparkles();
        animateSparkles();
      };

      window.addEventListener("resize", handleResize);
      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [
    canvasRef,
    id,
    minSize,
    maxSize,
    particleDensity,
    particleColor,
  ]);

  return (
    <canvas
      id={id}
      ref={canvasRef}
      className={cn("absolute inset-0 h-full w-full", className)}
    />
  );
};

export default Sparkles;