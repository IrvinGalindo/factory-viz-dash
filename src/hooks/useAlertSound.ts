import { useCallback, useRef } from "react";

export const useAlertSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playAlertSound = useCallback((severity?: string | null) => {
    try {
      // Create or reuse AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      
      // Resume context if suspended (browser autoplay policy)
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies based on severity
      const frequency = severity === "critical" ? 880 : severity === "warning" ? 660 : 440;
      const beepCount = severity === "critical" ? 3 : 2;

      oscillator.frequency.value = frequency;
      oscillator.type = "sine";

      // Create beep pattern
      const now = audioContext.currentTime;
      const beepDuration = 0.15;
      const beepGap = 0.1;

      gainNode.gain.setValueAtTime(0, now);

      for (let i = 0; i < beepCount; i++) {
        const beepStart = now + i * (beepDuration + beepGap);
        gainNode.gain.linearRampToValueAtTime(0.3, beepStart + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, beepStart + beepDuration);
      }

      oscillator.start(now);
      oscillator.stop(now + beepCount * (beepDuration + beepGap));

      console.log("🔔 Alert sound played:", severity || "info");
    } catch (error) {
      console.error("Error playing alert sound:", error);
    }
  }, []);

  return { playAlertSound };
};
