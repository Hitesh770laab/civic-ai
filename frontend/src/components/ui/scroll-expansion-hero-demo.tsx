"use client";

import { useState, useEffect } from "react";
import ScrollExpandMedia from "@/components/ui/scroll-expansion-hero";

interface MediaAbout {
  overview: string;
  conclusion: string;
}

interface MediaContent {
  src: string;
  poster?: string;
  background: string;
  title: string;
  date: string;
  scrollToExpand: string;
  about: MediaAbout;
}

interface MediaContentCollection {
  [key: string]: MediaContent;
}

const sampleMediaContent: MediaContentCollection = {
  video: {
    src: "https://me7aitdbxq.ufs.sh/f/2wsMIGDMQRdYuZ5R8ahEEZ4aQK56LizRdfBSqeDMsmUIrJN1",
    poster:
      "/chandigarh-pothole.jpg",
    background:
      "/chandigarh-avenue.jpg",
    title: "CIVIC AI CHANDIGARH",
    date: "Sector Road Accountability",
    scrollToExpand: "Scroll to Inspect Road Damage & Enter",
    about: {
      overview:
        "Civic AI empowers Chandigarh residents to document potholes, broken road berms, and hazardous drainage. In accordance with the Punjab Right to Service Act as extended to UT Chandigarh, road repair complaints have an official statutory redressal window of 10 working days with the MCC B&R Engineering division.",
      conclusion:
        "Every geotagged report automatically drafts an official Jansampark grievance reference, tracks municipal contractors, and ensures accountability across all Chandigarh sectors.",
    },
  },
  image: {
    src: "/chandigarh-pothole.jpg",
    background:
      "/chandigarh-avenue.jpg",
    title: "CHANDIGARH ROAD AUDIT",
    date: "Pothole & Surface Evidence",
    scrollToExpand: "Scroll to Expand Evidence Dossier",
    about: {
      overview:
        "High-definition photographic documentation of bitumen erosion and monsoon potholes. Civic AI coordinates with Chandigarh Administration engineering teams to prioritize repair work orders.",
      conclusion:
        "Empowering citizens with open data, contractor tender accountability, and automated grievance follow-through.",
    },
  },
};

const MediaContent = ({ mediaType }: { mediaType: "video" | "image" }) => {
  const currentMedia = sampleMediaContent[mediaType];

  return (
    <div
      style={{
        maxWidth: "860px",
        margin: "0 auto",
        padding: "32px",
        background: "rgba(36, 23, 16, 0.85)",
        backdropFilter: "blur(20px)",
        borderRadius: "20px",
        border: "1px solid rgba(245, 158, 11, 0.25)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b" }} />
        <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", color: "#fde68a", textTransform: "uppercase" }}>
          OFFICIAL CITIZEN REPORTING PROTOCOL
        </span>
      </div>
      <h2 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 16px", color: "#ffffff", fontFamily: "'Manrope', sans-serif" }}>
        Chandigarh Road Infrastructure & Pothole Enforcement
      </h2>
      <p style={{ fontSize: "16px", lineHeight: 1.7, color: "rgba(255, 255, 255, 0.85)", marginBottom: "20px" }}>
        {currentMedia.about.overview}
      </p>
      <p style={{ fontSize: "15px", lineHeight: 1.7, color: "rgba(255, 255, 255, 0.7)", marginBottom: "28px" }}>
        {currentMedia.about.conclusion}
      </p>
    </div>
  );
};

export function Demo() {
  const [mediaType, setMediaType] = useState<"video" | "image">("image");
  const currentMedia = sampleMediaContent[mediaType];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [mediaType]);

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <div style={{ position: "fixed", top: "16px", right: "16px", zIndex: 50, display: "flex", gap: "8px" }}>
        <button
          onClick={() => setMediaType("video")}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            background: mediaType === "video" ? "#ffffff" : "rgba(0,0,0,0.6)",
            color: mediaType === "video" ? "#000000" : "#ffffff",
            border: "1px solid rgba(255,255,255,0.3)",
            fontWeight: 700,
          }}
        >
          Video
        </button>

        <button
          onClick={() => setMediaType("image")}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            background: mediaType === "image" ? "#ffffff" : "rgba(0,0,0,0.6)",
            color: mediaType === "image" ? "#000000" : "#ffffff",
            border: "1px solid rgba(255,255,255,0.3)",
            fontWeight: 700,
          }}
        >
          Image (Potholes)
        </button>
      </div>

      <ScrollExpandMedia
        mediaType={mediaType}
        mediaSrc={currentMedia.src}
        posterSrc={mediaType === "video" ? currentMedia.poster : undefined}
        bgImageSrc={currentMedia.background}
        title={currentMedia.title}
        date={currentMedia.date}
        scrollToExpand={currentMedia.scrollToExpand}
      >
        <MediaContent mediaType={mediaType} />
      </ScrollExpandMedia>
    </div>
  );
}

export default Demo;
