"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type FloatingImage = {
  id: string;
  src: string;
  x: number;
  width: number;
  height: number;
  delay: number;
  tilt: number;
  depth: number;
  fallSpeed: number;
  startOffset: number;
  swayAmp: number;
  swaySpeed: number;
  driftAmp: number;
  driftSpeed: number;
  pulseAmp: number;
  pulseSpeed: number;
  seed: number;
};

type HeartParticle = {
  id: string;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
};

type TreeHeart = {
  id: string;
  left: number;
  top: number;
  delay: number;
};

const REMOTE_TRACKS = [
  "https://image2url.com/r2/default/audio/1771012148604-dee6232f-27d1-479b-819e-962e21f6fd66.mp3",
  "https://image2url.com/r2/default/audio/1771012189470-60cce2f3-ae22-4a8b-910d-1ae603594523.mp3",
  "https://image2url.com/r2/default/audio/1771012204545-27f39c32-d1d3-4dcb-bf2b-b89d9f8e5daf.mp3"
];
const FIRST_IMAGE_BASENAME = "img_2398-1";
const MAX_FLOATING_IMAGES_DESKTOP = 30;
const MAX_FLOATING_IMAGES_MOBILE = 18;

const ROMANTIC_LINES = [
  "ჩემი პატარა სტიჩუნია, ჩემს გულში ყველაზე თბილად ცხოვრობ.",
  "მიყვარხარ სტიჩუ, ჩემო სუნთქვავ და სიმშვიდევ.",
  "ჩემი ლამაზი პრინცესა ხარ, ჩემს ცაში ყველაზე ნათელი ვარსკვლავი.",
  "ვგიჟდები შენზე ჩემო პატარა, ყოველ წამს უფრო ძლიერად.",
  "ბედნიერი ვარ, როდესაც შენს ღიმილს ვხედავ, ყველაფერი ინთება.",
  "მეკეტება შენს ლამაზ თვალებზე, იქ ჩემი სამყარო იწყება.",
  "შენი დანახვის პირველივე წამიდან ვიცოდი, რომ ჩემი იქნებოდი.",
  "მუდამ ჩემი იქნები, როგორც ჩემი გულის ყველაზე ნაზი მუსიკა.",
  "მიყვარხარ ჩემო პატარა ფერია, ჩემი ოცნების სინათლე.",
  "მალე გნახავ პატარა და ისევ გულით ჩაგეხუტები."
];

function makeFloat(src: string, idx: number, total: number, compact = false): FloatingImage {
  const columns = compact ? 7 : 9;
  const lane = idx % columns;
  const row = Math.floor(idx / columns);
  const rows = Math.max(1, Math.ceil(total / columns));
  const laneWidth = 100 / columns;
  const jitter = (((idx * 37) % 100) / 100 - 0.5) * laneWidth * 0.24;
  const x = Math.max(4, Math.min(96, laneWidth * (lane + 0.5) + jitter));
  const seed = (idx + 1) * 0.83;

  const sizeFactor = compact ? 0.8 : 1;
  const motionFactor = compact ? 0.78 : 1;

  return {
    id: `${idx}-${Math.random().toString(16).slice(2)}`,
    src,
    x,
    width: (122 + (idx % 4) * 18) * sizeFactor,
    height: (160 + (idx % 5) * 20) * sizeFactor,
    delay: (idx % 5) * 0.6,
    tilt: -10 + (idx % 7) * 3.2,
    depth: 72 + (idx % 8) * 18,
    fallSpeed: 0.043 + (idx % 7) * 0.007,
    startOffset: (row / rows + (idx % 5) * 0.055) % 1,
    swayAmp: (6 + (idx % 5) * 2.2) * motionFactor,
    swaySpeed: 0.62 + (idx % 6) * 0.16,
    driftAmp: (4 + (idx % 4) * 1.6) * motionFactor,
    driftSpeed: 0.26 + (idx % 5) * 0.085,
    pulseAmp: (0.008 + (idx % 3) * 0.004) * (compact ? 0.85 : 1),
    pulseSpeed: 1.08 + (idx % 5) * 0.17,
    seed
  };
}

function makeHearts(count: number): HeartParticle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `heart-${i}-${Math.random().toString(16).slice(2)}`,
    x: Math.random() * 100,
    y: 62 + Math.random() * 35,
    size: 10 + Math.random() * 24,
    delay: Math.random() * 6,
    duration: 8 + Math.random() * 9
  }));
}

function makeTreeHearts(count: number): TreeHeart[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `tree-${i}-${Math.random().toString(16).slice(2)}`,
    left: 8 + Math.random() * 84,
    top: 6 + Math.random() * 76,
    delay: Math.random() * 4
  }));
}

export function LoveArcade() {
  const [images, setImages] = useState<string[]>([]);
  const [lineIndex, setLineIndex] = useState(0);
  const [centerIndex, setCenterIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imagesReady, setImagesReady] = useState(false);
  const [imagesFetched, setImagesFetched] = useState(false);
  const [mediaStarted, setMediaStarted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [tracks] = useState<string[]>(REMOTE_TRACKS);
  const [audioSources, setAudioSources] = useState<{ a: string; b: string }>({ a: "", b: "" });
  const [activeAudio, setActiveAudio] = useState<"a" | "b">("a");

  const audioARef = useRef<HTMLAudioElement | null>(null);
  const audioBRef = useRef<HTMLAudioElement | null>(null);
  const activeAudioRef = useRef<"a" | "b">("a");
  const queueRef = useRef<number[]>([]);
  const currentTrackRef = useRef(0);
  const crossfadingRef = useRef(false);
  const rafCrossfadeRef = useRef<number | null>(null);
  const orbitRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pointerTargetRef = useRef({ x: 0, y: 0 });
  const pointerSmoothRef = useRef({ x: 0, y: 0 });

  const maxFloating = isMobile ? MAX_FLOATING_IMAGES_MOBILE : MAX_FLOATING_IMAGES_DESKTOP;
  const visibleImages = useMemo(() => images.slice(0, maxFloating), [images, maxFloating]);
  const floating = useMemo(() => visibleImages.map((src, i) => makeFloat(src, i, visibleImages.length, isMobile)), [visibleImages, isMobile]);
  const hearts = useMemo(() => makeHearts(26), []);
  const treeHearts = useMemo(() => makeTreeHearts(18), []);

  const hasTracks = tracks.length > 0;

  function shuffleIndices(size: number, exclude: number | null = null) {
    const arr = Array.from({ length: size }, (_, i) => i).filter((i) => i !== exclude);
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function nextTrackIndex() {
    if (!tracks.length) return 0;
    if (!queueRef.current.length) {
      queueRef.current = shuffleIndices(tracks.length, currentTrackRef.current);
    }
    const next = queueRef.current.shift();
    return next ?? 0;
  }

  function tryUnlockAudio() {
    const activeEl = activeAudioRef.current === "a" ? audioARef.current : audioBRef.current;
    if (!activeEl) return;
    const p = activeEl.play();
    if (p && typeof p.catch === "function") p.catch(() => undefined);
  }

  useEffect(() => {
    fetch("/api/images", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { images?: string[] }) => {
        if (!d.images?.length) {
          setImages([]);
          setImagesReady(true);
          return;
        }
        const prioritized = [...d.images].sort((a, b) => {
          const aName = a.toLowerCase();
          const bName = b.toLowerCase();
          const aPinned = aName.includes(FIRST_IMAGE_BASENAME) ? 0 : 1;
          const bPinned = bName.includes(FIRST_IMAGE_BASENAME) ? 0 : 1;
          if (aPinned !== bPinned) return aPinned - bPinned;
          return a.localeCompare(b);
        });
        setImages(prioritized);
        setCenterIndex(0);
      })
      .catch(() => {
        setImages([]);
        setImagesReady(true);
      })
      .finally(() => setImagesFetched(true));
  }, []);

  useEffect(() => {
    if (!tracks.length) return;
    const initial = Math.floor(Math.random() * tracks.length);
    currentTrackRef.current = initial;
    queueRef.current = shuffleIndices(tracks.length, initial);
    const upcoming = nextTrackIndex();
    setAudioSources({
      a: tracks[initial],
      b: tracks[upcoming] || tracks[initial]
    });
    setActiveAudio("a");
    activeAudioRef.current = "a";
    crossfadingRef.current = false;
  }, [tracks]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const apply = () => setIsMobile(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    activeAudioRef.current = activeAudio;
  }, [activeAudio]);

  useEffect(() => {
    if (!hasTracks || !audioSources.a) return;
    const a = audioARef.current;
    const b = audioBRef.current;
    if (!a || !b) return;
    a.volume = activeAudioRef.current === "a" ? 1 : 0;
    b.volume = activeAudioRef.current === "b" ? 1 : 0;
    a.load();
    b.load();
    const activeEl = activeAudioRef.current === "a" ? a : b;
    const p = activeEl.play();
    if (p && typeof p.catch === "function") p.catch(() => undefined);
  }, [hasTracks, audioSources]);

  useEffect(() => {
    if (!hasTracks) return;
    const a = audioARef.current;
    const b = audioBRef.current;
    if (!a || !b) return;

    const runCrossfade = () => {
      if (crossfadingRef.current) return;
      crossfadingRef.current = true;

      const activeKey = activeAudioRef.current;
      const currentEl = activeKey === "a" ? a : b;
      const nextEl = activeKey === "a" ? b : a;
      const nextKey = activeKey === "a" ? "b" : "a";

      nextEl.currentTime = 0;
      nextEl.volume = 0;
      const playPromise = nextEl.play();
      if (playPromise && typeof playPromise.catch === "function") playPromise.catch(() => undefined);

      const duration = 2200;
      const start = performance.now();

      const fade = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        currentEl.volume = 1 - t;
        nextEl.volume = t;
        if (t < 1) {
          rafCrossfadeRef.current = requestAnimationFrame(fade);
          return;
        }

        currentEl.pause();
        currentEl.currentTime = 0;
        currentEl.volume = 0;
        nextEl.volume = 1;

        setActiveAudio(nextKey);
        activeAudioRef.current = nextKey;
        currentTrackRef.current = nextTrackIndex();
        const preload = tracks[nextTrackIndex()] || tracks[0];
        if (activeKey === "a") {
          setAudioSources((prev) => ({ ...prev, a: preload }));
        } else {
          setAudioSources((prev) => ({ ...prev, b: preload }));
        }

        crossfadingRef.current = false;
      };

      rafCrossfadeRef.current = requestAnimationFrame(fade);
    };

    const onTime = () => {
      const activeEl = activeAudioRef.current === "a" ? a : b;
      if (!Number.isFinite(activeEl.duration) || activeEl.duration <= 0) return;
      if (activeEl.duration - activeEl.currentTime <= 2.9) {
        runCrossfade();
      }
    };

    const onEnded = () => runCrossfade();
    a.addEventListener("timeupdate", onTime);
    b.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnded);
    b.addEventListener("ended", onEnded);

    return () => {
      a.removeEventListener("timeupdate", onTime);
      b.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnded);
      b.removeEventListener("ended", onEnded);
      if (rafCrossfadeRef.current) cancelAnimationFrame(rafCrossfadeRef.current);
      rafCrossfadeRef.current = null;
    };
  }, [hasTracks, tracks]);

  useEffect(() => {
    const onUnlock = () => tryUnlockAudio();
    window.addEventListener("pointerdown", onUnlock, { passive: true });
    window.addEventListener("keydown", onUnlock);
    return () => {
      window.removeEventListener("pointerdown", onUnlock);
      window.removeEventListener("keydown", onUnlock);
    };
  }, [audioSources, activeAudio]);

  useEffect(() => {
    const timer = setInterval(() => {
      setLineIndex((v) => (v + 1) % ROMANTIC_LINES.length);
    }, 5200);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!images.length) return;
    const timer = setInterval(() => {
      setCenterIndex((v) => (v + 1) % images.length);
    }, 6200);
    return () => clearInterval(timer);
  }, [images]);

  useEffect(() => {
    if (!images.length) return;
    setImagesReady(false);
    let done = 0;
    let cancelled = false;
    const mark = () => {
      done += 1;
      if (!cancelled && done >= images.length) setImagesReady(true);
    };

    images.forEach((src) => {
      const img = new window.Image();
      img.onload = mark;
      img.onerror = mark;
      img.src = src;
    });

    return () => {
      cancelled = true;
    };
  }, [images]);

  useEffect(() => {
    if (!floating.length) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

    const updateTargetByPoint = (clientX: number, clientY: number) => {
      const x = (clientX / window.innerWidth) * 2 - 1;
      const y = (clientY / window.innerHeight) * 2 - 1;
      pointerTargetRef.current.x = clamp(x, -1, 1);
      pointerTargetRef.current.y = clamp(y, -1, 1);
    };

    const onPointerMove = (event: PointerEvent) => {
      updateTargetByPoint(event.clientX, event.clientY);
    };

    const onTouchMove = (event: TouchEvent) => {
      const t = event.touches[0];
      if (!t) return;
      updateTargetByPoint(t.clientX, t.clientY);
    };

    const onPointerLeave = () => {
      pointerTargetRef.current.x = 0;
      pointerTargetRef.current.y = 0;
    };

    const onOrientation = (event: DeviceOrientationEvent) => {
      const gamma = event.gamma ?? 0;
      const beta = event.beta ?? 0;
      pointerTargetRef.current.x = clamp(gamma / 30, -1, 1);
      pointerTargetRef.current.y = clamp(beta / 40, -1, 1);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("deviceorientation", onOrientation, { passive: true });

    let raf = 0;
    const start = performance.now();
    const animate = (now: number) => {
      const t = (now - start) / 1000;
      const vh = window.innerHeight;
      const smooth = pointerSmoothRef.current;
      const target = pointerTargetRef.current;

      smooth.x += (target.x - smooth.x) * 0.075;
      smooth.y += (target.y - smooth.y) * 0.075;

      for (let i = 0; i < floating.length; i += 1) {
        const el = orbitRefs.current[i];
        const item = floating[i];
        if (!el || !item) continue;

        const progress = (item.startOffset + t * item.fallSpeed + item.delay * 0.03) % 1;
        const ySpan = vh + item.height * 2 + 260;
        const y = progress * ySpan - item.height - 130;
        const sway = Math.sin(t * item.swaySpeed + item.seed) * item.swayAmp;
        const drift = Math.sin(t * item.driftSpeed + item.seed * 1.7) * item.driftAmp;
        const pointerX = smooth.x * (5 + item.depth * 0.045);
        const pointerY = smooth.y * (3 + item.depth * 0.028);
        const z = item.depth + Math.sin(t * 0.9 + item.seed) * 14;
        const rotation = item.tilt + Math.sin(t * 1.15 + item.seed) * 3 + smooth.x * 3.5;
        const scaleBase = 0.94 + (item.depth / 220) * 0.12;
        const pulse = 1 + Math.sin(t * item.pulseSpeed + item.seed) * item.pulseAmp;
        const scale = scaleBase * pulse;

        el.style.transform = `translate3d(calc(-50% + ${sway + drift + pointerX}px), ${y + pointerY}px, ${z}px) rotateZ(${rotation}deg) scale(${scale})`;
      }

      raf = window.requestAnimationFrame(animate);
    };

    raf = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("deviceorientation", onOrientation);
      window.cancelAnimationFrame(raf);
      orbitRefs.current = [];
    };
  }, [floating]);

  useEffect(() => {
    if (!imagesFetched || !imagesReady || !mediaStarted) return;
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, [imagesFetched, imagesReady, mediaStarted]);

  function renderAnimatedLetters(text: string) {
    return text.split("").map((ch, i) => (
      <span
        // eslint-disable-next-line react/no-array-index-key
        key={`${text}-${i}`}
        className="phrase-letter"
        style={{ animationDelay: `${i * 0.04}s` }}
      >
        {ch === " " ? "\u00A0" : ch}
      </span>
    ));
  }

  return (
    <main className="love-ocean relative min-h-[100dvh] overflow-hidden">
      {hasTracks ? (
        <>
          <audio ref={audioARef} src={audioSources.a} playsInline preload="auto" onPlaying={() => setMediaStarted(true)} className="hidden" />
          <audio ref={audioBRef} src={audioSources.b} playsInline preload="auto" onPlaying={() => setMediaStarted(true)} className="hidden" />
        </>
      ) : null}

      <div className={`pointer-events-none absolute inset-0 z-0 transition-opacity duration-500 ${loading ? "opacity-0" : "opacity-100"}`}>
        <div className="nebula-layer" />
        <div className="wave-layer wave-back" />
        <div className="wave-layer wave-mid" />
        <div className="wave-layer wave-front" />

        <div className="love-tree" aria-hidden>
          <div className="tree-trunk" />
          <div className="tree-crown">
            {treeHearts.map((h) => (
              <span
                key={h.id}
                className="tree-heart"
                style={{
                  left: `${h.left}%`,
                  top: `${h.top}%`,
                  animationDelay: `${h.delay}s`
                }}
              />
            ))}
          </div>
        </div>

        {hearts.map((h) => (
          <span
            key={h.id}
            className="ocean-heart"
            style={{
              left: `${h.x}%`,
              top: `${h.y}%`,
              width: `${h.size}px`,
              height: `${h.size}px`,
              animationDelay: `${h.delay}s`,
              animationDuration: `${h.duration}s`
            }}
          />
        ))}

        <div className="photo-space">
          {floating.map((img, idx) => {
            const cardClass = idx % 3 === 0 ? "card-float-a" : idx % 3 === 1 ? "card-float-b" : "card-float-c";

            return (
              <div
                key={img.id}
                ref={(el) => {
                  orbitRefs.current[idx] = el;
                }}
                className="photo-orbit"
                style={{
                  left: `${img.x}%`,
                  top: "0%",
                  width: `${img.width}px`,
                  height: `${img.height}px`,
                  zIndex: 20 + idx
                }}
              >
                <div
                  className={`photo-card ${cardClass}`}
                >
                <Image
                  src={img.src}
                  alt="სიყვარულის ფოტო"
                  fill
                  sizes="(max-width: 768px) 42vw, 260px"
                  className="photo-card-image"
                  loading="lazy"
                />

                {idx % 4 === 0 ? (
                  <div className="girl-phrase girl-phrase-float">{renderAnimatedLetters(ROMANTIC_LINES[(lineIndex + idx) % ROMANTIC_LINES.length])}</div>
                ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {images.length ? (
          <div className="center-heart-wrap">
            <svg className="center-heart-svg" viewBox="0 0 100 100" aria-hidden>
              <defs>
                <clipPath id="center-heart-clip">
                  <path d="M50 18 C35 2 8 8 8 34 C8 57 26 73 50 92 C74 73 92 57 92 34 C92 8 65 2 50 18 Z" />
                </clipPath>
              </defs>

              <image
                href={images[centerIndex] || images[0]}
                x="0"
                y="0"
                width="100"
                height="100"
                preserveAspectRatio="xMidYMin slice"
                clipPath="url(#center-heart-clip)"
                className="center-heart-photo"
              />

              <path
                d="M50 18 C35 2 8 8 8 34 C8 57 26 73 50 92 C74 73 92 57 92 34 C92 8 65 2 50 18 Z"
                className="center-heart-outline"
              />
            </svg>
          </div>
        ) : null}

        <div className="romantic-line-track">
          <p className="girl-phrase girl-phrase-main romantic-line-main">{renderAnimatedLetters(ROMANTIC_LINES[lineIndex])}</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-romance">
          <div className="loading-heart" />
          <p className="loading-text">დაელოდე პატარავ</p>
        </div>
      ) : null}
    </main>
  );
}
