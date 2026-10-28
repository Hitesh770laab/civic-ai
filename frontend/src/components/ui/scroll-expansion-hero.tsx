"use client";

import React, {
  useEffect,
  useRef,
  useState,
  ReactNode,
  TouchEvent,
  WheelEvent,
} from "react";
import { motion } from "framer-motion";

interface ImageProps {
  src: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  [key: string]: any;
}

const Image = ({
  src,
  alt = "",
  width,
  height,
  className = "",
  style = {},
  priority,
  ...props
}: ImageProps) => (
  <img
    src={src}
    alt={alt}
    width={width}
    height={height}
    className={className}
    style={style}
    loading={priority ? "eager" : "lazy"}
    {...props}
  />
);

export interface ScrollExpandMediaProps {
  mediaType?: "video" | "image";
  mediaSrc: string;
  posterSrc?: string;
  bgImageSrc: string;
  title?: string;
  date?: string;
  scrollToExpand?: string;
  textBlend?: boolean;
  onEnterDashboard?: () => void;
  children?: ReactNode;
}

const ScrollExpandMedia = ({
  mediaType = "video",
  mediaSrc,
  posterSrc,
  bgImageSrc,
  title,
  date,
  scrollToExpand,
  textBlend,
  onEnterDashboard,
  children,
}: ScrollExpandMediaProps) => {
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [showContent, setShowContent] = useState<boolean>(false);
  const [mediaFullyExpanded, setMediaFullyExpanded] = useState<boolean>(false);
  const [touchStartY, setTouchStartY] = useState<number>(0);
  const [isMobileState, setIsMobileState] = useState<boolean>(false);

  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setScrollProgress(0);
    setShowContent(false);
    setMediaFullyExpanded(false);
  }, [mediaType]);

  useEffect(() => {
    const handleWheel = (e: globalThis.WheelEvent) => {
      if (mediaFullyExpanded && e.deltaY < 0 && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!mediaFullyExpanded) {
        e.preventDefault();
        const scrollDelta = e.deltaY * 0.0009;
        const newProgress = Math.min(
          Math.max(scrollProgress + scrollDelta, 0),
          1,
        );
        setScrollProgress(newProgress);

        if (newProgress >= 1) {
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else if (newProgress < 0.75) {
          setShowContent(false);
        }
      }
    };

    const handleTouchStart = (e: globalThis.TouchEvent) => {
      setTouchStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: globalThis.TouchEvent) => {
      if (!touchStartY) return;

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;

      if (mediaFullyExpanded && deltaY < -20 && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!mediaFullyExpanded) {
        e.preventDefault();
        const scrollFactor = deltaY < 0 ? 0.008 : 0.005;
        const scrollDelta = deltaY * scrollFactor;
        const newProgress = Math.min(
          Math.max(scrollProgress + scrollDelta, 0),
          1,
        );
        setScrollProgress(newProgress);

        if (newProgress >= 1) {
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else if (newProgress < 0.75) {
          setShowContent(false);
        }

        setTouchStartY(touchY);
      }
    };

    const handleTouchEnd = (): void => {
      setTouchStartY(0);
    };

    const handleScroll = (): void => {
      if (!mediaFullyExpanded) {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [scrollProgress, mediaFullyExpanded, touchStartY]);

  useEffect(() => {
    const checkIfMobile = (): void => {
      setIsMobileState(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const mediaWidth = 320 + scrollProgress * (isMobileState ? 650 : 1250);
  const mediaHeight = 420 + scrollProgress * (isMobileState ? 200 : 400);
  const textTranslateX = scrollProgress * (isMobileState ? 180 : 150);

  const firstWord = title ? title.split(" ")[0] : "";
  const restOfTitle = title ? title.split(" ").slice(1).join(" ") : "";

  return (
    <div
      ref={sectionRef}
      className="scroll-expand-container transition-colors duration-700 ease-in-out overflow-x-hidden"
      style={{
        position: "relative",
        background: "#1c140d",
        color: "#ffffff",
        minHeight: "100vh",
      }}
    >
      <section className="relative flex flex-col items-center justify-start min-h-[100dvh]">
        <div className="relative w-full flex flex-col items-center min-h-[100dvh]">
          {/* Background Image with Atmospheric Tint */}
          <motion.div
            className="absolute inset-0 z-0 h-full w-full"
            style={{ position: "fixed", inset: 0 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 - scrollProgress * 0.7 }}
            transition={{ duration: 0.15 }}
          >
            <Image
              src={bgImageSrc}
              alt="Background"
              width={1920}
              height={1080}
              className="w-screen h-screen object-cover object-center"
              style={{
                width: "100vw",
                height: "100vh",
                objectFit: "cover",
                objectPosition: "center",
                filter: "brightness(0.65) saturate(1.1)",
              }}
              priority
            />
            {/* Warm Amber-Walnut Vignette Overlay */}
            <div
              className="absolute inset-0"
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(ellipse 90% 90% at 50% 50%, rgba(36, 23, 16, 0.45) 0%, rgba(18, 12, 8, 0.88) 100%)",
              }}
            />
          </motion.div>

          <div
            className="container mx-auto flex flex-col items-center justify-start relative z-10 w-full"
            style={{ width: "100%", maxWidth: "1280px" }}
          >
            <div
              className="flex flex-col items-center justify-center w-full relative"
              style={{ minHeight: "100vh" }}
            >
              {/* Expanding Media Box */}
              <div
                className="absolute z-0 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-2xl overflow-hidden"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: `${mediaWidth}px`,
                  height: `${mediaHeight}px`,
                  maxWidth: "96vw",
                  maxHeight: "86vh",
                  borderRadius: "20px",
                  boxShadow:
                    "0 25px 60px -10px rgba(0, 0, 0, 0.65), 0 0 40px rgba(245, 158, 11, 0.25)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  background: "#18120c",
                }}
              >
                {mediaType === "video" ? (
                  mediaSrc.includes("youtube.com") ? (
                    <div className="relative w-full h-full pointer-events-none" style={{ width: "100%", height: "100%" }}>
                      <iframe
                        width="100%"
                        height="100%"
                        src={
                          mediaSrc.includes("embed")
                            ? mediaSrc +
                              (mediaSrc.includes("?") ? "&" : "?") +
                              "autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1"
                            : mediaSrc.replace("watch?v=", "embed/") +
                              "?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1&playlist=" +
                              mediaSrc.split("v=")[1]
                        }
                        className="w-full h-full rounded-xl"
                        style={{ width: "100%", height: "100%", border: "none" }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                      <motion.div
                        className="absolute inset-0 bg-black/30 rounded-xl"
                        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }}
                        initial={{ opacity: 0.7 }}
                        animate={{ opacity: 0.5 - scrollProgress * 0.3 }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  ) : (
                    <div className="relative w-full h-full pointer-events-none" style={{ width: "100%", height: "100%" }}>
                      <video
                        src={mediaSrc}
                        poster={posterSrc}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                        className="w-full h-full object-cover rounded-xl"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        controls={false}
                        disablePictureInPicture
                        disableRemotePlayback
                      />
                      <motion.div
                        className="absolute inset-0 bg-black/30 rounded-xl"
                        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }}
                        initial={{ opacity: 0.7 }}
                        animate={{ opacity: 0.5 - scrollProgress * 0.3 }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  )
                ) : (
                  <div className="relative w-full h-full" style={{ width: "100%", height: "100%", position: "relative" }}>
                    <Image
                      src={mediaSrc}
                      alt={title || "Chandigarh Road Damage and Pothole Evidence"}
                      width={1280}
                      height={720}
                      className="w-full h-full object-cover rounded-xl"
                      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 75%" }}
                    />
                    <motion.div
                      className="absolute inset-0 bg-black/40 rounded-xl"
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)",
                      }}
                      initial={{ opacity: 0.7 }}
                      animate={{ opacity: Math.max(0.2, 0.7 - scrollProgress * 0.5) }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                )}

                {/* Road Inspection HUD Overlay on the Expanding Media */}
                <div
                  className="flex flex-col items-center text-center relative z-10 transition-none"
                  style={{
                    position: "absolute",
                    bottom: "20px",
                    left: "20px",
                    right: "20px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textShadow: "0 2px 10px rgba(0,0,0,0.8)",
                  }}
                >
                  {date && (
                    <span
                      style={{
                        transform: `translateX(-${textTranslateX * 0.5}vw)`,
                        fontSize: "13px",
                        letterSpacing: "1.5px",
                        textTransform: "uppercase",
                        color: "#fde68a",
                        fontWeight: 700,
                        background: "rgba(0,0,0,0.45)",
                        padding: "4px 12px",
                        borderRadius: "20px",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(245, 158, 11, 0.4)",
                        marginBottom: "6px",
                      }}
                    >
                      {date}
                    </span>
                  )}
                  {scrollToExpand && !mediaFullyExpanded && (
                    <p
                      style={{
                        transform: `translateX(${textTranslateX * 0.5}vw)`,
                        fontSize: "14px",
                        color: "#ffffff",
                        fontWeight: 600,
                        letterSpacing: "0.2px",
                        margin: 0,
                      }}
                    >
                      {scrollToExpand}
                    </p>
                  )}
                </div>
              </div>

              {/* Title Splitting Animation across Screen */}
              <div
                className={`flex items-center justify-center text-center gap-2 w-full relative z-10 transition-none flex-col ${
                  textBlend ? "mix-blend-difference" : "mix-blend-normal"
                }`}
                style={{
                  position: "relative",
                  zIndex: 10,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  pointerEvents: "none",
                }}
              >
                <motion.h2
                  className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
                  style={{
                    transform: `translateX(-${textTranslateX}vw)`,
                    fontFamily:
                      "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    fontSize: "clamp(34px, 5.5vw, 68px)",
                    fontWeight: 850,
                    letterSpacing: "-1.5px",
                    color: "#ffffff",
                    margin: 0,
                    textShadow: "0 4px 24px rgba(0, 0, 0, 0.7)",
                  }}
                >
                  {firstWord}
                </motion.h2>
                <motion.h2
                  className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
                  style={{
                    transform: `translateX(${textTranslateX}vw)`,
                    fontFamily:
                      "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    fontSize: "clamp(34px, 5.5vw, 68px)",
                    fontWeight: 850,
                    letterSpacing: "-1.5px",
                    color: "#f59e0b",
                    margin: 0,
                    textShadow:
                      "0 4px 24px rgba(0, 0, 0, 0.7), 0 0 32px rgba(245, 158, 11, 0.4)",
                  }}
                >
                  {restOfTitle}
                </motion.h2>
              </div>

              {/* Quick Jump to Dashboard Pill Button */}
              {onEnterDashboard && (
                <button
                  type="button"
                  onClick={onEnterDashboard}
                  style={{
                    position: "absolute",
                    top: "24px",
                    right: "28px",
                    zIndex: 30,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 20px",
                    borderRadius: "999px",
                    background:
                      "linear-gradient(135deg, rgba(45, 82, 66, 0.9) 0%, rgba(24, 46, 36, 0.95) 100%)",
                    backdropFilter: "blur(14px)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 700,
                    boxShadow:
                      "inset 0 1px 1px rgba(255,255,255,0.7), 0 8px 24px rgba(0,0,0,0.3), 0 0 14px rgba(245,158,11,0.25)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <span>Skip to Dashboard</span>
                  <span>→</span>
                </button>
              )}
            </div>

            {/* Revealed Content Section when Fully Expanded */}
            <motion.section
              className="flex flex-col w-full px-6 py-10 md:px-16 lg:py-16 relative z-20"
              style={{
                width: "100%",
                padding: "40px 24px 80px",
                maxWidth: "1000px",
                margin: "0 auto",
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{
                opacity: showContent ? 1 : 0,
                y: showContent ? 0 : 30,
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {children}
            </motion.section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ScrollExpandMedia;
