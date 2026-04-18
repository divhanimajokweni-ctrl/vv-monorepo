'use client';

import { useState, useEffect, useRef } from 'react';
import GamesPage from './games/page';

const NAV_LINKS = [
  { id: 'hero', label: 'Proposition' },
  { id: 'philosophy', label: 'Philosophy' },
  { id: 'network', label: 'Network' },
  { id: 'games', label: 'Games' },
  { id: 'lindiwe', label: 'LINDIWE' },
  { id: 'score', label: 'Score' },
  { id: 'collaborators', label: 'Collaborate' }
];

export default function LandingPage() {
  const [activeSection, setActiveSection] = useState('hero');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isSmartTV, setIsSmartTV] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsSmartTV(width >= 1440);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const sections = ['hero', 'philosophy', 'network', 'games', 'lindiwe', 'score', 'collaborators'];
    const sectionElements = sections.map(id => document.getElementById(id)).filter(Boolean);

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3, rootMargin: '-100px 0px -100px 0px' }
    );

    sectionElements.forEach((el) => {
      if (observerRef.current && el) observerRef.current.observe(el);
    });

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      setMobileMenuOpen(false);
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Glassmorphism Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => scrollToSection('hero')}
              className="text-xl sm:text-2xl font-bold text-white hover:text-violet-300 transition-colors"
            >
              UBUNTU
            </button>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-2 xl:space-x-6">
              {NAV_LINKS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className={`px-2 xl:px-3 py-2 rounded-lg text-sm xl:text-base transition-all duration-300 ${
                    activeSection === id
                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Mobile/Tablet Menu Button */}
            <div className="flex items-center space-x-2 lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-300 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              <button className="px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg transition-colors min-h-[44px]">
                Sign In
              </button>
            </div>

            {/* Desktop Sign In */}
            <div className="hidden lg:block">
              <button className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Slide-out Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="absolute inset-0 bg-slate-900/95 backdrop-blur-md"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute top-16 left-0 right-0 p-4 bg-slate-800/90 border-b border-slate-700/50">
            <div className="flex flex-col space-y-2">
              {NAV_LINKS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className={`w-full text-left px-4 py-4 rounded-lg text-lg transition-all duration-300 min-h-[48px] ${
                    activeSection === id
                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section id="hero" className="min-h-screen flex items-center justify-center px-4 sm:px-6 pt-16 sm:pt-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white mb-4 sm:mb-6 leading-tight">
              UBUNTU
              <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-light text-violet-400 mt-2">
                Collective Sovereignty
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-300 mb-6 sm:mb-8 max-w-2xl sm:max-w-3xl mx-auto leading-relaxed">
              A philosophical proposition: humanity flourishes not through individual accumulation,
              but through collective intelligence, earned authority, and proof of trust.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <button
              onClick={() => scrollToSection('games')}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-violet-600 hover:bg-violet-700 text-base sm:text-lg text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-violet-500/25 min-h-[48px] w-full sm:w-auto"
            >
              Enter the Games
            </button>
            <button
              onClick={() => scrollToSection('philosophy')}
              className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-slate-600 hover:border-violet-400 text-slate-300 hover:text-white text-base sm:text-lg font-semibold rounded-xl transition-all duration-300 min-h-[48px] w-full sm:w-auto"
            >
              Learn the Philosophy
            </button>
          </div>
        </div>
      </section>

      {/* Philosophy Band */}
      <section id="philosophy" className="py-12 sm:py-16 lg:py-24 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6">
              The Three Pillars
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl lg:max-w-3xl mx-auto">
              Ubuntu doctrine grounds every game, every transaction, every relationship in our ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/20 backdrop-blur-sm border border-emerald-700/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <svg className="w-6 h-6 sm:w-7 sm:w-8 lg:w-8 lg:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Collective Sovereignty</h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Individual power emerges from collective strength. Your sovereignty grows as you contribute to the network&apos;s intelligence and prosperity.
              </p>
            </div>

            <div className="bg-gradient-to-br from-violet-900/20 to-violet-800/20 backdrop-blur-sm border border-violet-700/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-violet-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <svg className="w-6 h-6 sm:w-7 sm:w-8 lg:w-8 lg:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Proof of Trust</h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Every action creates verifiable evidence of your reliability. Trust is earned through consistent, measurable contributions to the collective.
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-900/20 to-amber-800/20 backdrop-blur-sm border border-amber-700/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center md:col-span-2 xl:col-span-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <svg className="w-6 h-6 sm:w-7 sm:w-8 lg:w-8 lg:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Earned Authority</h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Authority is not given, it&apos;s earned. Your influence grows proportionally to your proven contributions to collective prosperity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ubuntu Network Diagram */}
      <section id="network" className="py-12 sm:py-16 lg:py-24 bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6">
              Systemic Architecture
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl lg:max-w-3xl mx-auto">
              Six interconnected nodes form the Ubuntu ecosystem, each representing a critical function in our collective intelligence platform.
            </p>
          </div>

          <div className="relative w-full aspect-[4/3] sm:aspect-[3/2] lg:aspect-[4/3] max-w-5xl mx-auto">
            <svg viewBox="0 0 800 600" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="ubuntuGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6"/>
                  <stop offset="100%" stopColor="#7c3aed"/>
                </linearGradient>
                <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981"/>
                  <stop offset="100%" stopColor="#059669"/>
                </linearGradient>
                <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4"/>
                  <stop offset="100%" stopColor="#0891b2"/>
                </linearGradient>
                <linearGradient id="violetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6"/>
                  <stop offset="100%" stopColor="#7c3aed"/>
                </linearGradient>
                <linearGradient id="amberGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b"/>
                  <stop offset="100%" stopColor="#d97706"/>
                </linearGradient>
                <linearGradient id="roseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ec4899"/>
                  <stop offset="100%" stopColor="#be185d"/>
                </linearGradient>
                <linearGradient id="slateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#64748b"/>
                  <stop offset="100%" stopColor="#475569"/>
                </linearGradient>
              </defs>

              {/* Central Ubuntu Node */}
              <circle cx="400" cy="300" r="60" fill="url(#ubuntuGradient)" stroke="#8b5cf6" strokeWidth="3" className=" sm:stroke-[3]"/>
              <text x="400" y="310" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" className=" sm:text-[14px]">UBUNTU</text>

              {/* Satellite Nodes */}
              <g id="stokvel">
                <circle cx="200" cy="150" r="45" fill="url(#emeraldGradient)" stroke="#10b981" strokeWidth="2"/>
                <text x="200" y="145" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" className=" sm:text-[10px]">STOKVEL</text>
                <text x="200" y="158" textAnchor="middle" fill="white" fontSize="8" className=" sm:text-[8px]">Rotating</text>
                <text x="200" y="168" textAnchor="middle" fill="white" fontSize="8" className=" sm:text-[8px]">Savings</text>
              </g>

              <g id="pools">
                <circle cx="600" cy="150" r="45" fill="url(#blueGradient)" stroke="#06b6d4" strokeWidth="2"/>
                <text x="600" y="145" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" className=" sm:text-[10px]">POOLS</text>
                <text x="600" y="158" textAnchor="middle" fill="white" fontSize="8" className=" sm:text-[8px]">Liquidity</text>
                <text x="600" y="168" textAnchor="middle" fill="white" fontSize="8" className=" sm:text-[8px]">Mining</text>
              </g>

              <g id="arcade">
                <circle cx="150" cy="450" r="45" fill="url(#violetGradient)" stroke="#8b5cf6" strokeWidth="2"/>
                <text x="150" y="445" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" className=" sm:text-[10px]">ARCADE</text>
                <text x="150" y="458" textAnchor="middle" fill="white" fontSize="8" className=" sm:text-[8px]">Gamified</text>
                <text x="150" y="468" textAnchor="middle" fill="white" fontSize="8" className=" sm:text-[8px]">Learning</text>
              </g>

              <g id="lindiwe">
                <circle cx="650" cy="450" r="45" fill="url(#amberGradient)" stroke="#f59e0b" strokeWidth="2"/>
                <text x="650" y="445" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" className=" sm:text-[10px]">LINDIWE</text>
                <text x="650" y="458" textAnchor="middle" fill="white" fontSize="8" className=" sm:text-[8px]">AI Coach</text>
                <text x="650" y="468" textAnchor="middle" fill="white" fontSize="8" className=" sm:text-[8px]">& Signals</text>
              </g>

              <g id="score">
                <circle cx="250" cy="500" r="45" fill="url(#roseGradient)" stroke="#ec4899" strokeWidth="2"/>
                <text x="250" y="495" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" className=" sm:text-[10px]">SCORE</text>
                <text x="250" y="508" textAnchor="middle" fill="white" fontSize="8" className=" sm:text-[8px]">Reputation</text>
                <text x="250" y="518" textAnchor="middle" fill="white" fontSize="8" className=" sm:text-[8px]">& Trust</text>
              </g>

              <g id="safestack">
                <circle cx="550" cy="500" r="45" fill="url(#slateGradient)" stroke="#64748b" strokeWidth="2"/>
                <text x="550" y="495" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" className=" sm:text-[10px]">SAFESTACK</text>
                <text x="550" y="508" textAnchor="middle" fill="white" fontSize="8" className=" sm:text-[8px]">Secure</text>
                <text x="550" y="518" textAnchor="middle" fill="white" fontSize="8" className=" sm:text-[8px]">Infrastructure</text>
              </g>

              {/* Animated dashed lines */}
              <path d="M 400 240 Q 300 195 200 150" stroke="#8b5cf6" strokeWidth="2" fill="none" strokeDasharray="8,4">
                <animate attributeName="stroke-dashoffset" values="0;12" dur="3s" repeatCount="indefinite"/>
              </path>
              <path d="M 400 240 Q 500 195 600 150" stroke="#8b5cf6" strokeWidth="2" fill="none" strokeDasharray="8,4">
                <animate attributeName="stroke-dashoffset" values="0;12" dur="3s" repeatCount="indefinite"/>
              </path>
              <path d="M 400 360 Q 275 405 150 450" stroke="#8b5cf6" strokeWidth="2" fill="none" strokeDasharray="8,4">
                <animate attributeName="stroke-dashoffset" values="0;12" dur="3s" repeatCount="indefinite"/>
              </path>
              <path d="M 400 360 Q 525 405 650 450" stroke="#8b5cf6" strokeWidth="2" fill="none" strokeDasharray="8,4">
                <animate attributeName="stroke-dashoffset" values="0;12" dur="3s" repeatCount="indefinite"/>
              </path>
              <path d="M 400 360 Q 325 430 250 500" stroke="#8b5cf6" strokeWidth="2" fill="none" strokeDasharray="8,4">
                <animate attributeName="stroke-dashoffset" values="0;12" dur="3s" repeatCount="indefinite"/>
              </path>
              <path d="M 400 360 Q 475 430 550 500" stroke="#8b5cf6" strokeWidth="2" fill="none" strokeDasharray="8,4">
                <animate attributeName="stroke-dashoffset" values="0;12" dur="3s" repeatCount="indefinite"/>
              </path>
            </svg>
          </div>
        </div>
      </section>

      {/* Games Section with SVG Icons */}
      <section id="games" className="py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <GamesPage />
        </div>
      </section>

      {/* LINDIWE Signal Dashboard */}
      <section id="lindiwe" className="py-12 sm:py-16 lg:py-24 bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6">
              LINDIWE Signal Dashboard
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl lg:max-w-3xl mx-auto">
              Your AI financial coach analyzes every decision, providing real-time insights and guidance toward collective prosperity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
            <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/20 backdrop-blur-sm border border-emerald-700/30 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-emerald-400 font-semibold">ACTIVE</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">Impulse Control</h3>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 mb-2">87%</div>
              <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{width: '87%'}}></div>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">Strong decision-making patterns detected</p>
            </div>

            <div className="bg-gradient-to-br from-violet-900/20 to-violet-800/20 backdrop-blur-sm border border-violet-700/30 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-3 h-3 bg-violet-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-violet-400 font-semibold">LEARNING</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">Altruistic Index</h3>
              <div className="text-xl sm:text-2xl font-black text-violet-400 mb-2">73%</div>
              <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                <div className="bg-violet-500 h-2 rounded-full" style={{width: '73%'}}></div>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">Above average community contributions</p>
            </div>

            <div className="bg-gradient-to-br from-amber-900/20 to-amber-800/20 backdrop-blur-sm border border-amber-700/30 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-amber-400 font-semibold">ANALYZING</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">Risk Profile</h3>
              <div className="text-xl sm:text-2xl font-black text-amber-400 mb-2">BALANCED</div>
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>Conservative</span>
                <span>Aggressive</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{width: '55%'}}></div>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">Optimal risk-reward balance maintained</p>
            </div>

            <div className="bg-gradient-to-br from-rose-900/20 to-rose-800/20 backdrop-blur-sm border border-rose-700/30 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-rose-400 font-semibold">COACHING</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">Session Insights</h3>
              <div className="text-lg font-bold text-rose-400 mb-2">12 Active</div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Pattern Recognition</span>
                  <span className="text-emerald-400">✓</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Trust Building</span>
                  <span className="text-emerald-400">✓</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Collective Focus</span>
                  <span className="text-amber-400">↻</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
              <h3 className="text-xl sm:text-2xl font-bold text-white">Current Coaching Signal</h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-emerald-400">LIVE ANALYSIS</span>
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 sm:p-6 border border-slate-700/30">
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-4">
                &ldquo;Your recent stokvel decisions show strong community orientation. Consider routing 15% of your gains to the Ubuntu Pools to amplify collective growth while maintaining personal sovereignty.&rdquo;
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423L16.5 15.75l.394 1.183a2.25 2.25 0 001.423 1.423L19.5 18.75l-1.183.394a2.25 2.25 0 00-1.423 1.423z"/>
                    </svg>
                  </div>
                  <span className="text-violet-400 font-semibold text-sm sm:text-base">LINDIWE AI Coach</span>
                </div>
                <button className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors min-h-[44px] w-full sm:w-auto">
                  Apply Suggestion
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ubuntu Score Section */}
      <section id="score" className="py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-slate-900 via-violet-900/20 to-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6">
              Ubuntu Score
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl lg:max-w-3xl mx-auto">
              Your earned authority in the collective. Every action contributes to your sovereignty and influence.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center">
              <div className="relative w-40 h-40 sm:w-48 sm:h-48 lg:w-64 lg:h-64 mx-auto mb-6 lg:mb-8">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#1f2937"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="url(#scoreGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 45 * 0.75} ${2 * Math.PI * 45}`}
                    className="animate-pulse"
                  >
                    <animate
                      attributeName="stroke-dasharray"
                      values={`0 ${2 * Math.PI * 45}; ${2 * Math.PI * 45 * 0.75} ${2 * Math.PI * 45}`}
                      dur="2s"
                      fill="freeze"
                    />
                  </circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">7,420</div>
                    <div className="text-xs sm:text-lg text-violet-400 font-semibold">UBUNTU SCORE</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-violet-900/20 to-violet-800/20 backdrop-blur-sm border border-violet-700/30 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Current Rank: SOVEREIGN</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Progress to ORACLE</span>
                    <span className="text-violet-400">2,580 XP</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-violet-500 h-2 rounded-full" style={{width: '74%'}}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Rank Progression</h3>
                <div className="space-y-2 sm:space-y-3">
                  {[
                    { rank: 'ORACLE', xp: '10,000+', color: 'from-amber-500 to-yellow-500', current: false },
                    { rank: 'SOVEREIGN', xp: '5,000-9,999', color: 'from-violet-500 to-purple-500', current: true },
                    { rank: 'MEMBER', xp: '1,000-4,999', color: 'from-blue-500 to-cyan-500', current: false },
                    { rank: 'RECRUIT', xp: '0-999', color: 'from-slate-500 to-slate-400', current: false }
                  ].map(({ rank, xp, color, current }) => (
                    <div key={rank} className={`flex items-center justify-between p-2 sm:p-3 rounded-lg ${current ? 'bg-violet-900/30 border border-violet-700/50' : 'bg-slate-800/30'}`}>
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gradient-to-r ${color}`}></div>
                        <span className={`font-semibold text-sm sm:text-base ${current ? 'text-violet-300' : 'text-slate-400'}`}>{rank}</span>
                      </div>
                      <span className="text-xs sm:text-sm text-slate-400">{xp} XP</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/20 backdrop-blur-sm border border-emerald-700/30 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Score Components</h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-sm sm:text-base">Game Performance</span>
                    <span className="text-emerald-400 font-semibold text-sm sm:text-base">+2,340 XP</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-sm sm:text-base">Community Contributions</span>
                    <span className="text-emerald-400 font-semibold text-sm sm:text-base">+1,890 XP</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-sm sm:text-base">Trust Building</span>
                    <span className="text-emerald-400 font-semibold text-sm sm:text-base">+1,560 XP</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-sm sm:text-base">Learning Achievements</span>
                    <span className="text-emerald-400 font-semibold text-sm sm:text-base">+1,630 XP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

{/* Collaborators Section */}
      <section id="collaborators" className="py-12 sm:py-16 lg:py-24 bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6">
              Join the Collective
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl lg:max-w-3xl mx-auto">
              Four paths to contribute to Ubuntu&apos;s mission. Each role strengthens the network and earns authority.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/20 backdrop-blur-sm border border-emerald-700/30 rounded-xl sm:rounded-2xl p-5 sm:p-8">
              <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">Affiliate Partner</h3>
                  <p className="text-emerald-400 text-xs sm:text-sm">Earn through network growth</p>
                </div>
              </div>
              <p className="text-slate-300 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
                Bring new communities into Ubuntu. Earn commissions on successful integrations and community growth.
              </p>
              <div className="space-y-1 sm:space-y-2 mb-4 sm:mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full shrink-0"></div>
                  <span className="text-xs sm:text-sm text-slate-400">15% commission on referrals</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full shrink-0"></div>
                  <span className="text-xs sm:text-sm text-slate-400">Priority access to new features</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full shrink-0"></div>
                  <span className="text-xs sm:text-sm text-slate-400">Dedicated support channel</span>
                </div>
              </div>
              <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-semibold min-h-[48px]">
                Apply as Partner
              </button>
            </div>

            <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 backdrop-blur-sm border border-blue-700/30 rounded-xl sm:rounded-2xl p-5 sm:p-8">
              <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.23 12.004a2.236 2.236 0 0 1 .177 1.07c0 .61-.293 1.165-.777 1.518L14.23 12.004zm2.563-2.824a3.728 3.728 0 0 0-1.328-2.406c-.194-.155-.38-.298-.558-.427-.265-.192-.54-.377-.82-.551-.28-.174-.565-.34-.852-.494-.287-.155-.578-.297-.87-.426-.292-.128-.59-.24-.883-.34-.293-.1-.59-.186-.89-.266-.3-.08-.605-.144-.91-.194-.306-.05-.615-.086-.927-.11-.312-.023-.628-.035-.947-.035-.318 0-.635.012-.947.035-.312.024-.621.058-.927.11-.305.05-.61.114-.91.194-.3.08-.597.166-.89.266-.293.1-.59.212-.883.34-.292.129-.583.271-.87.426-.287.154-.572.32-.852.494-.28.174-.555.359-.82.551-.178.129-.364.272-.558.427a3.728 3.728 0 0 0-1.328 2.406c0 .608.19 1.184.535 1.65.345.466.837.81 1.406.973.568.163 1.18.134 1.743-.082.562-.216 1.046-.599 1.37-1.085.325-.486.477-1.055.438-1.627a2.236 2.236 0 0 1 .177-1.07c.11-.304.28-.585.493-.825.213-.24.465-.43.734-.558.27-.128.55-.193.833-.193.283 0 .563.065.833.193.269.128.521.318.734.558.213.24.383.521.493.825z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">Developer/Builder</h3>
                  <p className="text-blue-400 text-xs sm:text-sm">Build the future of Ubuntu</p>
                </div>
              </div>
              <p className="text-slate-300 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
                Contribute code, design systems, and infrastructure. Shape the technical foundation of collective sovereignty.
              </p>
              <div className="space-y-1 sm:space-y-2 mb-4 sm:mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0"></div>
                  <span className="text-xs sm:text-sm text-slate-400">Direct protocol contributions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0"></div>
                  <span className="text-xs sm:text-sm text-slate-400">Governance voting rights</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0"></div>
                  <span className="text-xs sm:text-sm text-slate-400">Revenue sharing from contributions</span>
                </div>
              </div>
              <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold min-h-[48px]">
                Start Building
              </button>
            </div>

            <div className="bg-gradient-to-br from-violet-900/20 to-violet-800/20 backdrop-blur-sm border border-violet-700/30 rounded-xl sm:rounded-2xl p-5 sm:p-8">
              <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-violet-500 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.14,12.94c0.04-0.04,0.08-0.08,0.11-0.12c0.04-0.04,0.08-0.08,0.11-0.12c0.02-0.02,0.04-0.04,0.06-0.06 c0.04-0.04,0.08-0.08,0.11-0.12c0.02-0.02,0.04-0.04,0.06-0.06c0.04-0.04,0.08-0.08,0.11-0.12c0.02-0.02,0.04-0.04,0.06-0.06 c0.04-0.04,0.08-0.08,0.11-0.12c0.02-0.02,0.04-0.04,0.06-0.06c0.04-0.04,0.08-0.08,0.11-0.12c0.02-0.02,0.04-0.04,0.06-0.06 c0.04-0.04,0.08-0.08,0.11-0.12c0.02-0.02,0.04-0.04,0.06-0.06c0.04-0.04,0.08-0.08,0.11-0.12c0.02-0.02,0.04-0.04,0.06-0.06 C19.54,12.46,19.58,12.42,19.62,12.38z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">Promoter/DJ</h3>
                  <p className="text-violet-400 text-xs sm:text-sm">Amplify the Ubuntu sound</p>
                </div>
              </div>
              <p className="text-slate-300 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
                DJs and promoters bring Ubuntu to the dance floors. Create events, build communities, and earn through the music of collective prosperity.
              </p>
              <div className="space-y-1 sm:space-y-2 mb-4 sm:mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-violet-500 rounded-full shrink-0"></div>
                  <span className="text-xs sm:text-sm text-slate-400">Event hosting toolkit</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-violet-500 rounded-full shrink-0"></div>
                  <span className="text-xs sm:text-sm text-slate-400">Commission on event integrations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-violet-500 rounded-full shrink-0"></div>
                  <span className="text-xs sm:text-sm text-slate-400">Exclusive Ubuntu music drops</span>
                </div>
              </div>
              <button className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors font-semibold min-h-[48px]">
                Start Promoting
              </button>
            </div>

            <div className="bg-gradient-to-br from-rose-900/20 to-rose-800/20 backdrop-blur-sm border border-rose-700/30 rounded-xl sm:rounded-2xl p-5 sm:p-8">
              <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-500 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">Pool Host/Stokvel Organiser</h3>
                  <p className="text-rose-400 text-xs sm:text-sm">Lead community savings groups</p>
                </div>
              </div>
              <p className="text-slate-300 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
                Organize and lead stokvel groups. Build trust networks and earn through successful collective savings outcomes.
              </p>
              <div className="space-y-1 sm:space-y-2 mb-4 sm:mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-rose-500 rounded-full shrink-0"></div>
                  <span className="text-xs sm:text-sm text-slate-400">Management fee per member</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-rose-500 rounded-full shrink-0"></div>
                  <span className="text-xs sm:text-sm text-slate-400">Performance bonuses</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-rose-500 rounded-full shrink-0"></div>
                  <span className="text-xs sm:text-sm text-slate-400">Leadership training & support</span>
                </div>
              </div>
              <button className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors font-semibold min-h-[48px]">
                Organize a Pool
              </button>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        section {
          animation: fadeInUp 0.8s ease-out;
        }

        section:nth-child(odd) {
          animation-delay: 0.2s;
        }

        section:nth-child(even) {
          animation-delay: 0.4s;
        }
      `}</style>
    </div>
  );
}
