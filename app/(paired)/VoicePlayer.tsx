"use client";

import { useRef, useState } from "react";

// Decorative — not derived from real amplitude data. A 20-second clip
// doesn't justify decoding audio just to draw a waveform; the mockup's own
// bars are the same fixed pseudo-random shape.
const WAVE_BARS = Array.from({ length: 28 }, (_, i) =>
  8 + Math.round(14 * Math.abs(Math.sin(i * 0.7)) + 6 * Math.abs(Math.sin(i * 1.9)))
);

export function fmt(seconds: number) {
  return `0:${String(seconds).padStart(2, "0")}`;
}

export function VoicePlayer({ src, duration }: { src: string; duration: number | null }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) el.pause();
    else el.play();
  };

  return (
    <div className="ss-voice-player">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          if (el.duration) setProgress((el.currentTime / el.duration) * 100);
        }}
      />
      <button type="button" className="ss-voice-play" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
        {playing ? "❚❚" : "▶"}
      </button>
      <div className="ss-voice-wave" aria-hidden="true">
        {WAVE_BARS.map((h, i) => (
          <i key={i} className={(i / WAVE_BARS.length) * 100 < progress ? "played" : ""} style={{ height: h }} />
        ))}
      </div>
      <span className="ss-voice-dur">{duration ? fmt(duration) : ""}</span>
    </div>
  );
}
