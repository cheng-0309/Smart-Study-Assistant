import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import { motion } from "framer-motion";
import { NotePencil, CalendarDots, Exam, Clock, Lightning, Brain, RocketLaunch, ArrowRight, Sparkle, Fire } from "@phosphor-icons/react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FEATURES = [
  {
    icon: NotePencil,
    title: "Smart Notes",
    description: "Generate comprehensive, AI-powered study notes tailored to any subject and topic in seconds.",
    path: "/notes",
    accent: "primary",
  },
  {
    icon: CalendarDots,
    title: "Study Planner",
    description: "Get a personalized study plan — regular or exam-focused — with daily schedules and Notion export.",
    path: "/planner",
    accent: "accent",
  },
  {
    icon: Exam,
    title: "Practice Tests",
    description: "MCQs, True/False, Numerical, Short & Long answer — test your knowledge with AI-generated quizzes.",
    path: "/practice",
    accent: "secondary",
  },
  {
    icon: Clock,
    title: "History",
    description: "Access all your generated notes, plans, and tests in one unified timeline. Never lose your progress.",
    path: "/history",
    accent: "primary",
  },
];

const STEPS = [
  {
    num: "01",
    icon: Sparkle,
    title: "Choose a Tool",
    description: "Pick from Notes, Planner, or Practice Tests based on what you need right now.",
  },
  {
    num: "02",
    icon: Brain,
    title: "Enter Your Topic",
    description: "Tell our AI what subject, chapter, or concept you're studying. Be as specific as you like.",
  },
  {
    num: "03",
    icon: RocketLaunch,
    title: "Get AI Results",
    description: "Receive beautifully formatted, comprehensive study material in seconds — ready to use.",
  },
];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

function HeroSection() {
  const navigate = useNavigate();
  const [streak, setStreak] = useState(null);

  useEffect(() => {
    axios.get(`${API}/analytics`)
      .then((res) => setStreak(res.data?.streaks))
      .catch(() => {});
  }, []);

  return (
    <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 px-4" data-testid="hero-section">
      {/* Decorative glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      <motion.div
        className="relative max-w-3xl mx-auto text-center"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.div variants={fadeUp} className="mb-6 flex items-center justify-center gap-3">
          <span className="overline text-[hsl(var(--primary))] inline-flex items-center gap-2">
            <Lightning weight="fill" className="w-3.5 h-3.5" />
            AI-Powered Study Assistant
          </span>
          {streak && streak.current_streak > 0 && (
            <span
              data-testid="hero-streak-badge"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
              style={{ background: "hsl(25, 95%, 53%, 0.1)", color: "hsl(25, 95%, 53%)" }}
            >
              <Fire weight="fill" className="w-3 h-3" />
              {streak.current_streak} day streak
            </span>
          )}
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight mb-6"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Study Smarter with{" "}
          <span className="gradient-text">StudyForge</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed"
        >
          Generate notes, plan your study schedule, and practice with AI-crafted quizzes — all in one place. Your personal study engine.
        </motion.p>

        <motion.div variants={fadeUp} className="flex items-center justify-center gap-4 flex-wrap">
          <button
            data-testid="hero-cta-primary"
            onClick={() => navigate("/notes")}
            className="gradient-btn px-7 py-3 rounded-full text-sm font-bold inline-flex items-center gap-2"
          >
            Start Studying
            <ArrowRight weight="bold" className="w-4 h-4" />
          </button>
          <button
            data-testid="hero-cta-secondary"
            onClick={() => {
              document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-7 py-3 rounded-full text-sm font-bold border border-[hsl(var(--border))] text-foreground hover:border-[hsl(var(--primary)/0.3)] hover:bg-[hsl(var(--primary)/0.04)] transition-all"
          >
            Explore Features
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
}

function FeatureCard({ icon: Icon, title, description, path, accent, index }) {
  const navigate = useNavigate();

  const glowColor = accent === "accent"
    ? "var(--glow-accent)"
    : "var(--glow-primary)";

  return (
    <motion.div
      variants={fadeUp}
      className="glass-card group cursor-pointer p-6 flex flex-col gap-4"
      data-testid={`feature-card-${title.toLowerCase().replace(/\s/g, "-")}`}
      onClick={() => navigate(path)}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      style={{ "--hover-glow": glowColor }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `hsl(var(--${accent}) / 0.1)` }}
      >
        <Icon weight="duotone" className="w-5 h-5" style={{ color: `hsl(var(--${accent}))` }} />
      </div>
      <div>
        <h3 className="text-base font-bold mb-1.5 group-hover:text-[hsl(var(--primary))] transition-colors" style={{ fontFamily: "var(--font-heading)" }}>
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
      <div className="mt-auto pt-2">
        <span className="text-xs font-semibold text-[hsl(var(--primary))] inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          Open tool <ArrowRight weight="bold" className="w-3 h-3" />
        </span>
      </div>
    </motion.div>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-4" data-testid="features-section">
      <motion.div
        className="max-w-5xl mx-auto"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger}
      >
        <motion.div variants={fadeUp} className="text-center mb-14">
          <span className="overline text-[hsl(var(--accent))] mb-3 block">Core Features</span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            Everything You Need to <span className="gradient-text">Ace Your Studies</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} {...f} index={i} />
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="py-20 px-4" data-testid="how-it-works-section">
      <motion.div
        className="max-w-4xl mx-auto"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger}
      >
        <motion.div variants={fadeUp} className="text-center mb-14">
          <span className="overline text-[hsl(var(--primary))] mb-3 block">How It Works</span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            Three Steps to <span className="gradient-text">Better Studying</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((step) => (
            <motion.div
              key={step.num}
              variants={fadeUp}
              className="glass-card p-6 text-center relative"
              data-testid={`step-${step.num}`}
            >
              <span
                className="absolute top-4 right-5 text-5xl font-black opacity-[0.04]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {step.num}
              </span>
              <div
                className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: "hsl(var(--primary) / 0.08)" }}
              >
                <step.icon weight="duotone" className="w-6 h-6 text-[hsl(var(--primary))]" />
              </div>
              <h3 className="text-base font-bold mb-2" style={{ fontFamily: "var(--font-heading)" }}>{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4" data-testid="cta-section">
      <motion.div
        className="max-w-2xl mx-auto text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={stagger}
      >
        <motion.div
          variants={fadeUp}
          className="glass-card p-10 md:p-14 relative overflow-hidden"
        >
          {/* Background glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at center, hsl(var(--primary) / 0.06) 0%, transparent 70%)" }}
            aria-hidden="true"
          />

          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-4" style={{ fontFamily: "var(--font-heading)" }}>
              Ready to <span className="gradient-text">Level Up</span>?
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
              Stop wasting hours on unstructured studying. Let AI generate the notes, plans, and tests you need — instantly.
            </p>
            <button
              data-testid="cta-start-btn"
              onClick={() => navigate("/notes")}
              className="gradient-btn px-8 py-3.5 rounded-full text-sm font-bold inline-flex items-center gap-2"
            >
              Get Started Now
              <ArrowRight weight="bold" className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-8 px-4 border-t border-[hsl(var(--border))]" data-testid="footer">
      <div className="max-w-5xl mx-auto text-center">
        <span className="text-sm text-muted-foreground">
          StudyForge — AI-powered study tools for smarter learning.
        </span>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col" data-testid="home-page">
      <Header />

      <main className="flex-1 overflow-y-auto">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
