"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type FloatingImage = {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  duration: number;
  delay: number;
  tilt: number;
  depth: number;
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

const MUSIC_IDS = ["z4nhDtkzhRg", "v29hLQnr1fo", "hlh6hczDdKM"];
const FIRST_IMAGE_BASENAME = "img_2398-1";
const MAX_FLOATING_IMAGES = 22;

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

function makeFloat(src: string, idx: number, total: number): FloatingImage {
  const angle = (idx / Math.max(total, 1)) * Math.PI * 2;
  const ring = 24 + (idx % 5) * 9;
  const x = 50 + Math.cos(angle * 1.3) * ring;
  const y = 44 + Math.sin(angle * 1.8) * (ring * 0.62);

  return {
    id: `${idx}-${Math.random().toString(16).slice(2)}`,
    src,
    x,
    y,
    width: 130 + (idx % 4) * 20,
    height: 170 + (idx % 5) * 22,
    duration: 22 + (idx % 6) * 4,
    delay: (idx % 5) * 0.6,
    tilt: -12 + (idx % 9) * 3,
    depth: 80 + (idx % 8) * 24
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
  const [mediaReady, setMediaReady] = useState(false);
  const [youtubeReady, setYoutubeReady] = useState(false);
  const [tracks, setTracks] = useState<string[]>([]);
  const [audioSources, setAudioSources] = useState<{ a: string; b: string }>({ a: "", b: "" });
  const [activeAudio, setActiveAudio] = useState<"a" | "b">("a");

  const playerRef = useRef<HTMLIFrameElement | null>(null);
  const audioARef = useRef<HTMLAudioElement | null>(null);
  const audioBRef = useRef<HTMLAudioElement | null>(null);
  const activeAudioRef = useRef<"a" | "b">("a");
  const queueRef = useRef<number[]>([]);
  const currentTrackRef = useRef(0);
  const crossfadingRef = useRef(false);
  const rafCrossfadeRef = useRef<number | null>(null);

  const visibleImages = useMemo(() => images.slice(0, MAX_FLOATING_IMAGES), [images]);
  const floating = useMemo(() => visibleImages.map((src, i) => makeFloat(src, i, visibleImages.length)), [visibleImages]);
  const hearts = useMemo(() => makeHearts(26), []);
  const treeHearts = useMemo(() => makeTreeHearts(18), []);

  const hasLocalTracks = tracks.length > 0;

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

  function playerCmd(func: string, args: unknown[] = []) {
    const win = playerRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(JSON.stringify({ event: "command", func, args }), "https://www.youtube.com");
  }

  function tryUnlockAudio() {
    if (hasLocalTracks) {
      const activeEl = activeAudioRef.current === "a" ? audioARef.current : audioBRef.current;
      if (!activeEl) return;
      const p = activeEl.play();
      if (p && typeof p.catch === "function") p.catch(() => undefined);
      return;
    }

    if (youtubeReady) {
      playerCmd("playVideo");
      playerCmd("unMute");
      playerCmd("setVolume", [90]);
    }
  }

  useEffect(() => {
    fetch("/api/images")
      .then((r) => r.json())
      .then((d: { images?: string[] }) => {
        if (!d.images?.length) return;
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
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    fetch("/api/music")
      .then((r) => r.json())
      .then((d: { tracks?: string[] }) => {
        if (!d.tracks?.length) return;
        setTracks(d.tracks);
      })
      .catch(() => undefined);
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
    if (!youtubeReady || hasLocalTracks) return;
    // Autoplay starts muted to satisfy browser policies.
    playerCmd("playVideo");
    playerCmd("mute");
  }, [youtubeReady, hasLocalTracks]);

  useEffect(() => {
    if (hasLocalTracks) return;
    if (youtubeReady) setMediaReady(true);
  }, [hasLocalTracks, youtubeReady]);

  useEffect(() => {
    activeAudioRef.current = activeAudio;
  }, [activeAudio]);

  useEffect(() => {
    if (!hasLocalTracks || !audioSources.a) return;
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
    setMediaReady(true);
  }, [hasLocalTracks, audioSources]);

  useEffect(() => {
    if (!hasLocalTracks) return;
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
  }, [hasLocalTracks, tracks]);

  useEffect(() => {
    const onUnlock = () => tryUnlockAudio();
    window.addEventListener("pointerdown", onUnlock, { passive: true });
    window.addEventListener("keydown", onUnlock);
    return () => {
      window.removeEventListener("pointerdown", onUnlock);
      window.removeEventListener("keydown", onUnlock);
    };
  }, [hasLocalTracks, youtubeReady, audioSources, activeAudio]);

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
    if (!visibleImages.length) return;
    let done = 0;
    let cancelled = false;
    const mark = () => {
      done += 1;
      if (!cancelled && done >= visibleImages.length) setImagesReady(true);
    };

    visibleImages.forEach((src) => {
      const img = new window.Image();
      img.onload = mark;
      img.onerror = mark;
      img.src = src;
    });

    return () => {
      cancelled = true;
    };
  }, [visibleImages]);

  useEffect(() => {
    if (!imagesReady || !mediaReady) return;
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, [imagesReady, mediaReady]);

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
    <main className="love-ocean relative min-h-screen overflow-hidden">
      {!hasLocalTracks ? (
        <iframe
          ref={playerRef}
          title="სიყვარულის მუსიკა"
          className="hidden"
          src={`https://www.youtube.com/embed/${MUSIC_IDS[0]}?autoplay=1&mute=1&loop=1&playlist=${MUSIC_IDS.join(",")}&controls=0&modestbranding=1&rel=0&enablejsapi=1`}
          allow="autoplay; encrypted-media"
          onLoad={() => setYoutubeReady(true)}
        />
      ) : null}

      {hasLocalTracks ? (
        <>
          <audio ref={audioARef} src={audioSources.a} playsInline preload="auto" className="hidden" />
          <audio ref={audioBRef} src={audioSources.b} playsInline preload="auto" className="hidden" />
        </>
      ) : null}

      <div className="pointer-events-none absolute inset-0 z-0">
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
            const orbitClass = idx % 4 === 0 ? "orbit-a" : idx % 4 === 1 ? "orbit-b" : idx % 4 === 2 ? "orbit-c" : "orbit-d";
            const cardClass = idx % 3 === 0 ? "card-float-a" : idx % 3 === 1 ? "card-float-b" : "card-float-c";
            const wobble = ((idx % 9) - 4) * 0.6;

            return (
              <div
                key={img.id}
                className={`photo-orbit ${orbitClass}`}
                style={{
                  left: `${img.x}%`,
                  top: `${img.y}%`,
                  width: `${img.width}px`,
                  height: `${img.height}px`,
                  animationDuration: `${img.duration}s`,
                  animationDelay: `${img.delay}s`,
                  ["--tilt" as string]: img.tilt,
                  ["--depth" as string]: img.depth,
                  ["--wobble" as string]: wobble,
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
          <p className="loading-text">დაიელოდე პატარავ...</p>
          <p className="loading-sub">გული ბრუნავს შენთვის, კიდევ ერთი წამი...</p>
        </div>
      ) : null}
    </main>
  );
}
