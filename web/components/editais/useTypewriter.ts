"use client";

import { useEffect, useState, useRef } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";

/**
 * Efeito "decifrando texto" — shuffle rápido de caracteres até estabilizar
 * no valor final. Usado no IA Pulse para campos extraídos do edital.
 */
export function useTypewriter(target: string, start: boolean, delay = 0) {
  const [display, setDisplay] = useState("");
  const [done, setDone] = useState(false);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!start) return;

    timerRef.current = setTimeout(() => {
      const totalDuration = Math.min(600 + target.length * 18, 1200);
      const startTime = performance.now();

      function tick(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / totalDuration, 1);
        // Quantos caracteres já "travaram" no valor correto
        const locked = Math.floor(progress * target.length);

        const result = target
          .split("")
          .map((char, i) => {
            if (i < locked) return char;
            if (char === " ") return " ";
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("");

        setDisplay(result);

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setDisplay(target);
          setDone(true);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, start, delay]);

  return { display: display || (done ? target : ""), done };
}
