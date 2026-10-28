'use client';

import React, { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';
import { ZoomParallax, ImageItem } from './zoom-parallax';
import {
  ShieldAlert,
  FileCheck2,
  Building2,
  Users2,
  Clock,
  ArrowRight,
  Sparkles,
  MapPin,
  TrendingUp,
  Scale
} from 'lucide-react';

interface CivicZoomHeroProps {
  onEnterDashboard: () => void;
}

const AUTHENTIC_CHANDIGARH_IMAGES: ImageItem[] = [
  {
    src: '/chandigarh-capitol.jpg',
    alt: 'Capitol Complex and Open Hand Monument, Sector 1 Chandigarh',
  },
  {
    src: '/chandigarh-avenue.jpg',
    alt: 'Jan Marg Green Tree-Lined Avenues, Chandigarh',
  },
  {
    src: '/chandigarh-road-audit.jpg',
    alt: 'Chandigarh Municipal Road Quality & Pavement Inspection with GIS',
  },
  {
    src: '/chandigarh-sukhna.jpg',
    alt: 'Sukhna Lake Promenade and Shivalik Foothills Sunset',
  },
  {
    src: '/chandigarh-command-center.jpg',
    alt: 'Chandigarh Administration Smart City Operations Control Center',
  },
  {
    src: '/chandigarh-sector17.jpg',
    alt: 'Sector 17 Plaza Brutalist Architecture and Fountains',
  },
  {
    src: '/chandigarh-solar-parks.jpg',
    alt: 'Sector 10 Solar Streetlights and Landscaped Parks',
  },
];

export default function CivicZoomHero({ onEnterDashboard }: CivicZoomHeroProps) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="civic-zoom-wrapper">
      {/* Tricolour Accent Line at the very top */}
      <div className="civic-tricolour-bar" />

      {/* Floating Top Navigation */}
      <header className="civic-zoom-nav">
        <div className="civic-zoom-brand">
          <div className="civic-zoom-logo-mark">
            <span className="civic-pulse-dot" />
            <span className="civic-brand-text">CIVIC AI</span>
          </div>
          <span className="civic-badge-ut">
            <MapPin size={12} className="inline-icon" /> CHANDIGARH UT · 2026
          </span>
        </div>

        <button
          type="button"
          onClick={onEnterDashboard}
          className="civic-skip-btn"
          aria-label="Skip to dashboard"
        >
          <span>Open Dashboard</span>
          <ArrowRight size={15} />
        </button>
      </header>

      {/* Hero Intro Header Section - Spaced CLEANLY above the images */}
      <section className="civic-zoom-intro-section">
        <div className="civic-spotlight" aria-hidden="true" />

        <div className="civic-intro-inner">
          <div className="civic-pill-tag">
            <Sparkles size={14} className="accent-amber" />
            <span>CHANDIGARH CIVIC PLATFORM · 2026</span>
          </div>

          <h1 className="civic-zoom-heading">
            Explore <span className="highlight-amber">Chandigarh</span>
            <br />
            Through <span className="highlight-sage">Civic Intelligence</span>
          </h1>

          <p className="civic-zoom-subheading">
            From Le Corbusier&apos;s Capitol Complex to your local sector roads.
            Documenting infrastructure, auditing municipal tenders, and keeping Chandigarh accountable.
          </p>
        </div>
      </section>

      {/* Pure, Unobstructed Zoom Parallax Section */}
      <section className="civic-zoom-parallax-container">
        <ZoomParallax
          images={AUTHENTIC_CHANDIGARH_IMAGES}
          containerHeight="160vh"
        />
      </section>

      {/* Revealed Civic AI Data & Features Section - Directly docked below parallax */}
      <section className="civic-data-showcase">
        <div className="civic-data-inner">
          <div className="civic-data-header">
            <span className="civic-tag-pill">LIVE MUNICIPAL METRICS & LEGAL TEETH</span>
            <h2>Empowering Chandigarh Citizens with Legal Teeth</h2>
            <p>
              Civic AI bridges residents with the Municipal Corporation of Chandigarh (MCC)
              and Engineering Department, transforming complaints into legally binding statutory
              actions.
            </p>
          </div>

          {/* Key Metrics Grid */}
          <div className="civic-metrics-grid">
            <div className="civic-metric-card">
              <div className="metric-icon-wrap amber"><Clock size={24} /></div>
              <div className="metric-val">10 Days</div>
              <div className="metric-label">Legal Redressal Guarantee</div>
              <div className="metric-desc">Potholes & road berms must be resolved under RTS Act 2018</div>
            </div>

            <div className="civic-metric-card">
              <div className="metric-icon-wrap sage"><ShieldAlert size={24} /></div>
              <div className="metric-val">94.2%</div>
              <div className="metric-label">Municipal Timely Compliance</div>
              <div className="metric-desc">Tracked across MCC Building & Roads (B&R) division</div>
            </div>

            <div className="civic-metric-card">
              <div className="metric-icon-wrap walnut"><Building2 size={24} /></div>
              <div className="metric-val">₹48.6 Cr</div>
              <div className="metric-label">Active e-Tenders Audited</div>
              <div className="metric-desc">Cross-checked with road defect liability periods</div>
            </div>

            <div className="civic-metric-card">
              <div className="metric-icon-wrap sage"><Users2 size={24} /></div>
              <div className="metric-val">54 Sectors</div>
              <div className="metric-label">Geotagged Network</div>
              <div className="metric-desc">Active neighborhood watch from Sector 1 to Sector 60</div>
            </div>
          </div>

          {/* Feature Pillars */}
          <div className="civic-features-grid">
            <div className="civic-feature-box">
              <div className="feature-icon"><MapPin size={22} /></div>
              <h3>1. Geotagged Road Damage Radar</h3>
              <p>
                Snap road fractures or drainage overflows. Civic AI embeds sub-meter GPS
                coordinates and visual severity scoring, preventing disputes over exact road locations.
              </p>
            </div>

            <div className="civic-feature-box">
              <div className="feature-icon"><FileCheck2 size={22} /></div>
              <h3>2. Automated Jansampark Grievance</h3>
              <p>
                Generates a formal complaint drafted specifically for the MCC Executive Engineer,
                ready to be filed with an official tracking ID timestamped into law.
              </p>
            </div>

            <div className="civic-feature-box">
              <div className="feature-icon"><TrendingUp size={22} /></div>
              <h3>3. Tender Defect Liability Tracker</h3>
              <p>
                Did a freshly carpeted road wash away in the monsoon? Civic AI pulls the tender work
                order to check if the contractor is still bound by the 3-year guarantee.
              </p>
            </div>

            <div className="civic-feature-box">
              <div className="feature-icon"><Scale size={22} /></div>
              <h3>4. Right to Information (RTI) Ready</h3>
              <p>
                If municipal officers miss the statutory 10-day deadline, one click compiles the
                formal Section 6(1) RTI application demanding officer accountability.
              </p>
            </div>
          </div>

          {/* Large Final CTA Banner */}
          <div className="civic-cta-banner">
            <div className="civic-cta-text">
              <h3>Ready to keep Chandigarh clean, green, and accountable?</h3>
              <p>Join your sector community, report issues, and monitor live city tenders.</p>
            </div>
            <button
              type="button"
              onClick={onEnterDashboard}
              className="civic-primary-enter-btn"
            >
              <span>Enter Civic AI Dashboard</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
