'use client';

import { useEffect, useRef, useState, useMemo, useCallback, Suspense } from 'react';
import { motion, useScroll, useTransform, useInView, useSpring } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Wireframe, Edges } from '@react-three/drei';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import { TypeAnimation } from 'react-type-animation';
import * as THREE from 'three';
import {
  Shield, Activity, Network, Zap, ArrowRight,
  Brain, Eye, Globe, Lock, Cpu,
  AlertTriangle, CheckCircle, GitBranch, Layers,
  Search, BarChart3, Users, Database, Server, Code,
  TrendingUp, FileText, Fingerprint, Workflow, Check, X, Menu, Sun, Moon
} from 'lucide-react';
import { isAuthenticated } from '@/lib/api';
import { useTheme } from '@/components/ThemeProvider';

/* ═══════════════════════════════════════════════ */
/* ═══         3D WIREFRAME GLOBE              ═══ */
/* ═══════════════════════════════════════════════ */

function RotatingGlobe() {
  const meshRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);

  // Generate random points on sphere surface for "nodes"
  const nodePositions = useMemo(() => {
    const positions = new Float32Array(60 * 3);
    for (let i = 0; i < 60; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      const r = 1.55;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.003;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <group>
      {/* Wireframe sphere */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.5, 2]} />
        <meshBasicMaterial color="#71717a" wireframe transparent opacity={0.15} />
      </mesh>

      {/* Inner glowing sphere */}
      <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
        <mesh>
          <sphereGeometry args={[0.4, 32, 32]} />
          <MeshDistortMaterial color="#f87171" emissive="#f87171" emissiveIntensity={0.3} transparent opacity={0.6} distort={0.3} speed={2} />
        </mesh>
      </Float>

      {/* Orbiting ring */}
      <mesh rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[1.8, 0.008, 8, 100]} />
        <meshBasicMaterial color="#71717a" transparent opacity={0.3} />
      </mesh>
      <mesh rotation={[Math.PI / 5, Math.PI / 4, 0]}>
        <torusGeometry args={[2.0, 0.006, 8, 100]} />
        <meshBasicMaterial color="#71717a" transparent opacity={0.2} />
      </mesh>

      {/* Scattered node points */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={60}
            array={nodePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.04} color="#f87171" transparent opacity={0.7} sizeAttenuation />
      </points>
    </group>
  );
}

function GlobeScene() {
  return (
    <div className="w-full h-[380px] md:h-[420px]">
      <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.2} />
        <pointLight position={[5, 5, 5]} intensity={0.5} color="#ffffff" />
        <Suspense fallback={null}>
          <RotatingGlobe />
        </Suspense>
      </Canvas>
    </div>
  );
}

/* ═══════════════════════════════════════════════ */
/* ═══       TSPARTICLES BACKGROUND            ═══ */
/* ═══════════════════════════════════════════════ */

function ParticleNetwork() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setInit(true));
  }, []);

  const options = useMemo(() => ({
    fullScreen: false,
    background: { color: { value: 'transparent' } },
    fpsLimit: 60,
    particles: {
      number: { value: 50, density: { enable: true } },
      color: { value: '#71717a' },
      links: {
        enable: true,
        color: '#71717a',
        distance: 150,
        opacity: 0.15,
        width: 0.5,
      },
      move: {
        enable: true,
        speed: 0.4,
        direction: 'none' as const,
        outModes: { default: 'bounce' as const },
      },
      opacity: { value: 0.3 },
      size: { value: { min: 1, max: 2 } },
    },
    interactivity: {
      events: {
        onHover: { enable: true, mode: 'grab' as const },
      },
      modes: {
        grab: { distance: 180, links: { opacity: 0.3 } },
      },
    },
    detectRetina: true,
  }), []);

  if (!init) return null;

  return (
    <Particles
      className="fixed inset-0 z-0 pointer-events-auto"
      options={options}
    />
  );
}

/* ═══════════════════════════════════════════════ */
/* ═══         REUSABLE COMPONENTS             ═══ */
/* ═══════════════════════════════════════════════ */

function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setRotateX(-((e.clientY - rect.top) / rect.height - 0.5) * 12);
    setRotateY(((e.clientX - rect.left) / rect.width - 0.5) * 12);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { setRotateX(0); setRotateY(0); }}
      style={{ perspective: 800, transformStyle: 'preserve-3d' }}
    >
      <motion.div
        animate={{ rotateX, rotateY }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const spring = useSpring(0, { duration: 2000 });
  const [display, setDisplay] = useState(0);
  useEffect(() => { if (isInView) spring.set(value); }, [isInView, value, spring]);
  useEffect(() => {
    const unsub = spring.on('change', (v: number) => setDisplay(Math.round(v)));
    return unsub;
  }, [spring]);
  return <span ref={ref}>{display}{suffix}</span>;
}

function SectionHeader({ icon: Icon, label, title, desc }: {
  icon: React.ElementType; label: string; title: string; desc?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="mb-10"
    >
      <div className="flex items-center gap-2.5 mb-3">
        <Icon size={13} strokeWidth={1.5} className="text-[var(--text-secondary)]" />
        <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest">{label}</span>
      </div>
      <h2 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight mb-2">{title}</h2>
      {desc && <p className="text-[11px] font-mono text-[var(--text-secondary)] max-w-lg">{desc}</p>}
    </motion.div>
  );
}

function FeatureCard({ icon: Icon, title, description, delay, accent }: {
  icon: React.ElementType; title: string; description: string; delay: number; accent: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <TiltCard>
        <div className="group rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 h-full hover:border-zinc-600 transition-all duration-200">
          <div className={`w-8 h-8 rounded-md flex items-center justify-center mb-3 ${accent}`}>
            <Icon size={14} strokeWidth={1.5} />
          </div>
          <h3 className="text-[11px] font-mono font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-1.5">{title}</h3>
          <p className="text-[10px] font-mono text-[var(--text-secondary)] leading-relaxed">{description}</p>
        </div>
      </TiltCard>
    </motion.div>
  );
}

function PipelineStep({ step, title, desc, delay, isLast }: {
  step: number; title: string; desc: string; delay: number; isLast?: boolean;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} className="flex items-start gap-3 relative" initial={{ opacity: 0, x: -30 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.4, delay }}>
      <div className="flex flex-col items-center">
        <motion.div className="w-8 h-8 rounded-md bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] font-mono font-bold text-xs flex-shrink-0" whileHover={{ scale: 1.1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>{step}</motion.div>
        {!isLast && <motion.div className="w-px h-12 bg-[var(--border)] mt-1" initial={{ scaleY: 0 }} animate={isInView ? { scaleY: 1 } : {}} transition={{ duration: 0.4, delay: delay + 0.2 }} />}
      </div>
      <div className="pt-1">
        <h4 className="text-[11px] font-mono font-semibold text-[var(--text-primary)]">{title}</h4>
        <p className="text-[10px] font-mono text-[var(--text-secondary)] mt-0.5">{desc}</p>
      </div>
    </motion.div>
  );
}

function StatCard({ value, suffix, label, delay }: { value: number; suffix: string; label: string; delay: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay }}>
      <TiltCard>
        <div className="text-center p-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:border-zinc-600 transition-all duration-200">
          <div className="text-2xl md:text-3xl font-mono font-bold text-[var(--text-primary)] mb-1"><AnimatedNumber value={value} suffix={suffix} /></div>
          <div className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest">{label}</div>
        </div>
      </TiltCard>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════ */
/* ═══            MAIN LANDING PAGE            ═══ */
/* ═══════════════════════════════════════════════ */

export default function LandingPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  useEffect(() => { setAuthed(isAuthenticated()); }, []);

  const features = [
    { icon: Network, title: 'Graph-Based Detection', description: 'Real-time transaction network analysis using SAGRA algorithm to uncover hidden fraud clusters and money laundering rings.', accent: 'bg-red-500/10 text-red-400' },
    { icon: Brain, title: 'AI Risk Scoring', description: 'Multi-dimensional risk assessment combining graph centrality, temporal patterns, and behavioral anomaly detection.', accent: 'bg-amber-500/10 text-amber-400' },
    { icon: Zap, title: 'Real-Time Alerts', description: 'Instant alert generation when suspicious patterns are detected, with configurable thresholds and escalation rules.', accent: 'bg-emerald-500/10 text-emerald-400' },
    { icon: Eye, title: 'Visual Intelligence', description: 'Interactive force-directed graphs reveal transaction patterns invisible to traditional rule-based systems.', accent: 'bg-blue-500/10 text-blue-400' },
    { icon: Shield, title: 'Bank-Grade Security', description: 'End-to-end encryption, RBAC, comprehensive audit logging, and SSRF protection built into every layer.', accent: 'bg-amber-500/10 text-amber-400' },
    { icon: Globe, title: 'Multi-Bank Integration', description: 'Connect multiple CBS feeds via secure API endpoints. CSV upload and real-time streaming support.', accent: 'bg-red-500/10 text-red-400' },
  ];

  const pipelineSteps = [
    { title: 'Ingest Transactions', desc: 'Bank CBS feeds, CSV uploads, or API streams flow into the pipeline.' },
    { title: 'Build Transaction Graph', desc: 'Accounts become nodes, transactions become edges — forming a living network.' },
    { title: 'Run SAGRA Analysis', desc: 'Graph algorithm detects clusters, computes risk scores, identifies anomalies.' },
    { title: 'Generate Alerts', desc: 'High-risk clusters trigger instant alerts with full audit trails.' },
  ];

  const useCases = [
    { icon: Users, title: 'Fraud Ring Detection', desc: 'Uncover coordinated fraud rings by identifying tightly-connected account clusters with abnormal transaction velocity and circular money flows.', accent: 'bg-red-500/10 text-red-400', tag: 'Critical' },
    { icon: TrendingUp, title: 'Money Laundering (Layering)', desc: 'Detect layering schemes where funds pass through multiple intermediary accounts to obscure origins — visible only through graph topology.', accent: 'bg-amber-500/10 text-amber-400', tag: 'High' },
    { icon: Fingerprint, title: 'Identity Fraud Patterns', desc: 'Spot synthetic identities by analyzing account creation patterns, shared PII signals, and connection anomalies across the network.', accent: 'bg-blue-500/10 text-blue-400', tag: 'Medium' },
    { icon: Search, title: 'Fan-Out / Fan-In Attacks', desc: 'Detect rapid distribution of funds from a single source to many accounts (fan-out) or consolidation from many to one (fan-in).', accent: 'bg-emerald-500/10 text-emerald-400', tag: 'High' },
  ];

  const comparisonRows = [
    { feature: 'Detection Method', quantora: 'Graph + AI Hybrid', traditional: 'Rule-Based' },
    { feature: 'Fraud Ring Detection', quantora: true, traditional: false },
    { feature: 'Real-Time Processing', quantora: true, traditional: false },
    { feature: 'Layering Scheme Detection', quantora: true, traditional: false },
    { feature: 'Network Topology Analysis', quantora: true, traditional: false },
    { feature: 'Adaptive Scoring', quantora: true, traditional: false },
    { feature: 'Visual Investigation', quantora: true, traditional: false },
    { feature: 'False Positive Rate', quantora: '<2%', traditional: '15-30%' },
  ];

  const techStack = [
    { icon: Server, name: 'FastAPI', desc: 'Async Python backend', accent: 'bg-emerald-500/10 text-emerald-400' },
    { icon: Network, name: 'NetworkX', desc: 'Graph computation engine', accent: 'bg-red-500/10 text-red-400' },
    { icon: Database, name: 'SQLAlchemy', desc: 'Async ORM + aiosqlite', accent: 'bg-blue-500/10 text-blue-400' },
    { icon: Code, name: 'Next.js 14', desc: 'React SSR framework', accent: 'bg-amber-500/10 text-amber-400' },
    { icon: BarChart3, name: 'D3 + Recharts', desc: 'Data visualization', accent: 'bg-emerald-500/10 text-emerald-400' },
    { icon: Lock, name: 'JWT + bcrypt', desc: 'Auth & encryption', accent: 'bg-red-500/10 text-red-400' },
  ];

  const sagraFormula = [
    { label: 'Ts', name: 'Transaction Signal', formula: 'amount_z × frequency_factor × velocity_score', color: 'bg-red-500/10 text-red-400 border border-red-500/25' },
    { label: 'Gt', name: 'Graph Topological', formula: 'degree_centrality × betweenness × clustering_coeff', color: 'bg-amber-500/10 text-amber-400 border border-amber-500/25' },
    { label: 'Nd', name: 'Network Density', formula: 'community_density × inter_cluster_flow × fan_ratio', color: 'bg-blue-500/10 text-blue-400 border border-blue-500/25' },
    { label: 'Bh', name: 'Behavioral Anomaly', formula: 'temporal_deviation × pattern_entropy × recency_weight', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--bg)]">

      {/* ── Interactive Particle Network Background ── */}
      <ParticleNetwork />

      {/* ─────── NAVBAR ─────── */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[var(--bg)]/80 border-b border-[var(--border)]"
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <motion.div className="flex items-center gap-2.5 cursor-pointer" whileHover={{ scale: 1.02 }}>
            <div className="w-6 h-6 bg-[var(--btn-primary-bg)] rounded-sm flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 bg-[var(--logo-inner)] rounded-[2px]" />
            </div>
            <span className="text-[var(--text-primary)] font-semibold text-sm tracking-tight">Quantora</span>
            <span className="hidden sm:inline text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest">v3.0</span>
          </motion.div>

          <div className="hidden md:flex items-center gap-6">
            {['Features', 'Algorithm', 'Use Cases', 'Pipeline', 'Metrics', 'Stack'].map((label) => (
              <a key={label} href={`#${label.toLowerCase().replace(' ', '-')}`} className="text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-150">
                {label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-1.5 mr-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span className="text-[9px] font-mono text-emerald-400">Online</span>
            </div>
            {authed ? (
              <motion.button onClick={() => router.push('/dashboard')} className="px-3 sm:px-4 py-2 rounded-md bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] text-[11px] font-mono font-semibold uppercase tracking-widest hover:bg-[var(--btn-primary-hover)] transition-all duration-150" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                Dashboard
              </motion.button>
            ) : (
              <>
                <motion.button onClick={() => router.push('/login')} className="hidden sm:block px-3 py-2 text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-150" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  Sign In
                </motion.button>
                <motion.button onClick={() => router.push('/login')} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-md bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] text-[10px] sm:text-[11px] font-mono font-semibold uppercase tracking-widest hover:bg-[var(--btn-primary-hover)] transition-all duration-150" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  Get Started <ArrowRight size={11} strokeWidth={2} />
                </motion.button>
              </>
            )}
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-md border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-all duration-200"
            >
              {theme === 'dark' ? <Sun size={14} strokeWidth={1.5} /> : <Moon size={14} strokeWidth={1.5} />}
            </button>
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-md px-4 py-3 space-y-2">
            {['Features', 'Algorithm', 'Use Cases', 'Pipeline', 'Metrics', 'Stack'].map((label) => (
              <a
                key={label}
                href={`#${label.toLowerCase().replace(' ', '-')}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] py-1.5 transition-colors duration-150"
              >
                {label}
              </a>
            ))}
          </div>
        )}
      </motion.nav>

      {/* ─────── HERO ─────── */}
      <motion.section className="relative z-10 min-h-screen flex items-center pt-14" style={{ opacity: heroOpacity }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center w-full">

          {/* Left — Copy with Typewriter */}
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-emerald-500/25 bg-emerald-500/10 mb-6">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest">SAGRA v2.0 · Active</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[var(--text-primary)] leading-tight mb-2 tracking-tight">
                Network Risk Intelligence
              </h1>
              <div className="h-6 mb-6">
                <TypeAnimation
                  sequence={[
                    'Detecting Fraud Rings in Real-Time',
                    3000,
                    'Analyzing Transaction Networks',
                    3000,
                    'Scoring Risk with Graph AI',
                    3000,
                    'Uncovering Money Laundering Patterns',
                    3000,
                    'Protecting Financial Systems 24/7',
                    3000,
                  ]}
                  wrapper="span"
                  speed={40}
                  repeat={Infinity}
                  className="text-[12px] font-mono text-[var(--text-muted)]"
                />
              </div>
            </motion.div>

            <motion.p
              className="text-[12px] font-mono text-[var(--text-secondary)] mb-8 max-w-md leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Quantora uses graph-based AI to detect fraud clusters, money laundering patterns, and
              financial anomalies in real-time — before they cause damage.
            </motion.p>

            <motion.div className="flex flex-wrap gap-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
              <motion.button onClick={() => router.push('/login')} className="group flex items-center gap-2 px-5 py-2.5 rounded-md bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] text-[11px] font-mono font-semibold uppercase tracking-widest hover:bg-[var(--btn-primary-hover)] transition-all duration-150" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                Launch Dashboard <ArrowRight size={12} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform" />
              </motion.button>
              <motion.button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center gap-2 px-5 py-2.5 rounded-md border border-[var(--border)] text-[var(--text-secondary)] text-[11px] font-mono hover:bg-[var(--surface)] hover:text-[var(--text-primary)] transition-all duration-150" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                Explore Features
              </motion.button>
            </motion.div>

            <motion.div className="flex items-center gap-5 mt-8 pt-6 border-t border-[var(--border)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.6 }}>
              {[
                { icon: Lock, label: 'Encrypted', color: 'text-emerald-500' },
                { icon: Cpu, label: 'Real-Time' },
                { icon: Shield, label: 'RBAC' },
                { icon: Activity, label: 'Graph-Native' },
              ].map((badge, i) => (
                <div key={badge.label} className="flex items-center gap-1.5 text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest">
                  {i > 0 && <div className="w-px h-3 bg-[var(--border)] -ml-2.5 mr-0" />}
                  <badge.icon size={10} className={badge.color || 'text-[var(--text-muted)]'} />
                  {badge.label}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — 3D Globe */}
          <motion.div className="relative" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }} style={{ y: y1 }}>
            <GlobeScene />
            <motion.div className="absolute top-4 right-4 px-2 py-1 rounded-sm bg-red-500/10 border border-red-500/25 text-red-400 text-[9px] font-mono uppercase tracking-widest" animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
              <AlertTriangle className="inline w-2.5 h-2.5 mr-1" /> 3 Clusters
            </motion.div>
            <motion.div className="absolute bottom-4 left-4 px-2 py-1 rounded-sm bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[9px] font-mono uppercase tracking-widest" animate={{ y: [0, 5, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}>
              <CheckCircle className="inline w-2.5 h-2.5 mr-1" /> SAGRA Active
            </motion.div>
          </motion.div>
        </div>

        <motion.div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5" animate={{ y: [0, 6, 0], opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2.5, repeat: Infinity }}>
          <span className="text-[8px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Scroll</span>
          <div className="w-4 h-6 rounded-full border border-[var(--border)] flex items-start justify-center p-0.5">
            <motion.div className="w-1 h-1 rounded-full bg-[var(--text-muted)]" animate={{ y: [0, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
          </div>
        </motion.div>
      </motion.section>

      {/* ─────── FEATURES ─────── */}
      <section id="features" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHeader icon={Layers} label="Capabilities" title="Intelligence at Every Layer" desc="From raw transaction data to actionable intelligence — Quantora's AI-powered pipeline catches what rules-based systems miss." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => <FeatureCard key={f.title} {...f} delay={i * 0.08} />)}
          </div>
        </div>
      </section>

      {/* ─────── SAGRA ALGORITHM ─────── */}
      <section id="algorithm" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHeader icon={Brain} label="Algorithm" title="SAGRA Risk Scoring Engine" desc="Sentinel Adaptive Graph Risk Algorithm — four weighted components produce a deterministic risk score per transaction." />

          {/* Formula overview */}
          <motion.div
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Workflow size={13} strokeWidth={1.5} className="text-[var(--text-secondary)]" />
              <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Master Formula</span>
            </div>
            <div className="font-mono text-[var(--text-primary)] text-sm mb-4 p-3 rounded-md bg-[var(--bg)] border border-[var(--border)]">
              <span className="text-red-400">Risk</span>(n) = <span className="text-red-400">α</span>·Ts + <span className="text-amber-400">β</span>·Gt + <span className="text-blue-400">γ</span>·Nd + <span className="text-emerald-400">δ</span>·Bh
            </div>
            <p className="text-[10px] font-mono text-[var(--text-secondary)] leading-relaxed">
              Where α=0.25, β=0.30, γ=0.25, δ=0.20 are adaptive weights that shift based on network topology changes. Each component normalizes to [0, 1] before weighted aggregation.
            </p>
          </motion.div>

          {/* Component cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            {sagraFormula.map((comp, i) => (
              <motion.div
                key={comp.label}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className={`w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-mono font-bold ${comp.color}`}>
                    {comp.label}
                  </span>
                  <div>
                    <h4 className="text-[11px] font-mono font-semibold text-[var(--text-primary)]">{comp.name}</h4>
                  </div>
                </div>
                <code className="text-[10px] font-mono text-[var(--text-secondary)] block p-2 rounded-md bg-[var(--bg)] border border-[var(--border)]">
                  {comp.formula}
                </code>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── USE CASES ─────── */}
      <section id="use-cases" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHeader icon={Search} label="Use Cases" title="What Quantora Catches" desc="Real-world fraud scenarios that graph-based detection exposes while traditional systems remain blind." />

          <div className="grid sm:grid-cols-2 gap-4">
            {useCases.map((uc, i) => (
              <motion.div
                key={uc.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <TiltCard>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 h-full hover:border-zinc-600 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${uc.accent}`}>
                          <uc.icon size={14} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-[11px] font-mono font-semibold text-[var(--text-primary)] uppercase tracking-wide">{uc.title}</h3>
                      </div>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-sm ${
                        uc.tag === 'Critical' ? 'bg-red-500/10 border border-red-500/25 text-red-400' :
                        uc.tag === 'High' ? 'bg-amber-500/10 border border-amber-500/25 text-amber-400' :
                        'bg-blue-500/10 border border-blue-500/25 text-blue-400'
                      }`}>{uc.tag}</span>
                    </div>
                    <p className="text-[10px] font-mono text-[var(--text-secondary)] leading-relaxed">{uc.desc}</p>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── COMPARISON TABLE ─────── */}
      <section className="relative z-10 py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto overflow-x-auto">
          <SectionHeader icon={BarChart3} label="Comparison" title="Quantora vs Traditional Systems" desc="Why graph-based intelligence outperforms legacy rule-based fraud detection at every level." />

          <motion.div
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            {/* Table header */}
            <div className="grid grid-cols-3 border-b border-[var(--border)] bg-[var(--bg)]">
              <div className="px-5 py-3 text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Feature</div>
              <div className="px-5 py-3 text-[9px] font-mono text-emerald-400 uppercase tracking-widest text-center">Quantora AI</div>
              <div className="px-5 py-3 text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest text-center">Traditional</div>
            </div>
            {/* Table rows */}
            {comparisonRows.map((row, i) => (
              <motion.div
                key={row.feature}
                className="grid grid-cols-3 border-b border-[var(--border)] last:border-0"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <div className="px-5 py-3 text-[10px] font-mono text-[var(--text-primary)]">{row.feature}</div>
                <div className="px-5 py-3 flex justify-center items-center">
                  {typeof row.quantora === 'boolean' ? (
                    row.quantora ? <Check size={14} className="text-emerald-400" /> : <X size={14} className="text-red-400" />
                  ) : (
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold">{row.quantora}</span>
                  )}
                </div>
                <div className="px-5 py-3 flex justify-center items-center">
                  {typeof row.traditional === 'boolean' ? (
                    row.traditional ? <Check size={14} className="text-emerald-400" /> : <X size={14} className="text-red-400/50" />
                  ) : (
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">{row.traditional}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─────── PIPELINE ─────── */}
      <section id="pipeline" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
          <div>
            <SectionHeader icon={GitBranch} label="Pipeline" title="How Quantora Works" desc="Four stages from data ingestion to actionable fraud intelligence." />
            <div className="space-y-1">
              {pipelineSteps.map((s, i) => <PipelineStep key={s.title} step={i + 1} title={s.title} desc={s.desc} delay={i * 0.1} isLast={i === pipelineSteps.length - 1} />)}
            </div>
          </div>

          {/* Dashboard Preview */}
          <motion.div className="relative" initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} style={{ y: y2 }}>
            <TiltCard>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-[var(--btn-primary-bg)] rounded-sm flex items-center justify-center"><div className="w-2.5 h-2.5 bg-[var(--logo-inner)] rounded-[1px]" /></div>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">quantora / dashboard</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" /></span>
                    <span className="text-[8px] font-mono text-emerald-400">Live</span>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Active Clusters', val: '24', color: 'text-red-400' },
                      { label: 'Risk Score', val: '87.3', color: 'text-amber-400' },
                      { label: 'Transactions', val: '12.4K', color: 'text-emerald-400' },
                    ].map((kpi) => (
                      <motion.div key={kpi.label} className="rounded-md border border-[var(--border)] bg-[var(--bg)] p-2.5" whileHover={{ scale: 1.03 }}>
                        <div className={`text-base font-mono font-bold ${kpi.color}`}>{kpi.val}</div>
                        <div className="text-[8px] font-mono text-[var(--text-muted)] mt-0.5 uppercase tracking-widest">{kpi.label}</div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="rounded-md border border-[var(--border)] bg-[var(--bg)] p-3 h-28">
                    <div className="flex items-end gap-1 h-full">
                      {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 50].map((h, i) => (
                        <motion.div key={i} className="flex-1 rounded-t" style={{ backgroundColor: h > 80 ? 'rgba(248,113,113,0.6)' : h > 60 ? 'rgba(245,158,11,0.4)' : 'rgba(34,197,94,0.3)' }} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.04 }} />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { text: 'High-risk cluster — 7 accounts', risk: 'Critical' },
                      { text: 'Velocity anomaly: ACC-9821 → ACC-4417', risk: 'High' },
                    ].map((alert, i) => (
                      <motion.div key={i} className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2" initial={{ opacity: 0, x: 15 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.6 + i * 0.1 }}>
                        <span className="text-[10px] font-mono text-[var(--text-secondary)]">{alert.text}</span>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-sm ${alert.risk === 'Critical' ? 'bg-red-500/10 border border-red-500/25 text-red-400' : 'bg-amber-500/10 border border-amber-500/25 text-amber-400'}`}>{alert.risk}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </TiltCard>
          </motion.div>
        </div>
      </section>

      {/* ─────── METRICS ─────── */}
      <section id="metrics" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <SectionHeader icon={Activity} label="Performance" title="Built for Scale" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard value={99} suffix="%" label="Detection Accuracy" delay={0} />
            <StatCard value={50} suffix="ms" label="Avg Response Time" delay={0.08} />
            <StatCard value={10} suffix="M+" label="Txns Analyzed" delay={0.16} />
            <StatCard value={24} suffix="/7" label="Monitoring" delay={0.24} />
          </div>
        </div>
      </section>

      {/* ─────── TECH STACK ─────── */}
      <section id="stack" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHeader icon={Code} label="Architecture" title="Technology Stack" desc="Purpose-built with modern, battle-tested technologies for reliability and performance." />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {techStack.map((tech, i) => (
              <motion.div
                key={tech.name}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-center hover:border-zinc-600 transition-all duration-200"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className={`w-8 h-8 rounded-md flex items-center justify-center mx-auto mb-2 ${tech.accent}`}>
                  <tech.icon size={14} strokeWidth={1.5} />
                </div>
                <div className="text-[11px] font-mono font-semibold text-[var(--text-primary)]">{tech.name}</div>
                <div className="text-[9px] font-mono text-[var(--text-muted)] mt-0.5">{tech.desc}</div>
              </motion.div>
            ))}
          </div>

          {/* Architecture diagram */}
          <motion.div
            className="mt-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <Server size={13} strokeWidth={1.5} className="text-[var(--text-secondary)]" />
              <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest">System Architecture</span>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {[
                { label: 'Bank CBS Feed', sub: 'Data Source', color: 'text-amber-400 border-amber-500/25 bg-amber-500/10' },
                { label: 'FastAPI Backend', sub: 'Processing', color: 'text-emerald-400 border-emerald-500/25 bg-emerald-500/10' },
                { label: 'SAGRA Engine', sub: 'Graph Analysis', color: 'text-red-400 border-red-500/25 bg-red-500/10' },
                { label: 'SQLite + NetworkX', sub: 'Storage & Graph', color: 'text-blue-400 border-blue-500/25 bg-blue-500/10' },
                { label: 'Next.js Dashboard', sub: 'Visualization', color: 'text-amber-400 border-amber-500/25 bg-amber-500/10' },
              ].map((node, i, arr) => (
                <div key={node.label} className="flex items-center gap-3">
                  <motion.div
                    className={`rounded-md border px-4 py-3 text-center ${node.color}`}
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-[11px] font-mono font-semibold">{node.label}</div>
                    <div className="text-[8px] font-mono opacity-60 uppercase tracking-widest mt-0.5">{node.sub}</div>
                  </motion.div>
                  {i < arr.length - 1 && (
                    <ArrowRight size={14} className="text-[var(--text-muted)] hidden md:block flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─────── CTA ─────── */}
      <section className="relative z-10 py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-10 md:p-14 text-center" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
            <motion.div className="w-10 h-10 mx-auto mb-6 rounded-md bg-[var(--btn-primary-bg)] flex items-center justify-center" animate={{ rotate: [0, 3, 0, -3, 0] }} transition={{ duration: 8, repeat: Infinity }}>
              <Shield size={18} strokeWidth={1.5} className="text-[var(--btn-primary-text)]" />
            </motion.div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Ready to Detect the Undetectable?</h2>
            <p className="text-[11px] font-mono text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
              Start analyzing your transaction networks today. Quantora&apos;s graph intelligence catches fraud patterns that traditional systems miss.
            </p>
            <motion.button onClick={() => router.push('/login')} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] text-[11px] font-mono font-semibold uppercase tracking-widest hover:bg-[var(--btn-primary-hover)] transition-all duration-150" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              Get Started <ArrowRight size={12} strokeWidth={2} />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ─────── FOOTER ─────── */}
      <footer className="relative z-10 border-t border-[var(--border)] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 bg-[var(--btn-primary-bg)] rounded-sm flex items-center justify-center"><div className="w-2.5 h-2.5 bg-[var(--logo-inner)] rounded-[1px]" /></div>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">Quantora AI — Network Risk Intelligence</span>
          </div>
          <div className="flex items-center gap-4 text-[9px] font-mono text-[var(--text-muted)]">
            <span>&copy; {new Date().getFullYear()} Quantora</span>
            <div className="w-px h-3 bg-[var(--border)]" />
            <span>SAGRA v2.0</span>
            <div className="w-px h-3 bg-[var(--border)]" />
            <span>Three.js · tsParticles · Framer Motion</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
