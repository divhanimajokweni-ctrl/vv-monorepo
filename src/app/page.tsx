export default function Page() {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ubuntu Pools — Arcade v3.0</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Syne:wght@400;700;800&display=swap');

:root {
  --ink: #0d1117;
  --ink2: #1c2333;
  --ink3: #2d3748;
  --surface: #f7f5f0;
  --surface2: #ede9e0;
  --surface3: #e0dbd0;
  --gold: #c9a227;
  --gold2: #f0c040;
  --gold-dim: rgba(201,162,39,0.15);
  --teal: #0d9488;
  --teal2: #14b8a6;
  --teal-dim: rgba(13,148,136,0.12);
  --amber: #d97706;
  --red: #dc2626;
  --green: #16a34a;
  --white: #fefefe;
  --border: rgba(13,17,23,0.12);
  --border-gold: rgba(201,162,39,0.3);
  --radius: 12px;
  --radius-lg: 20px;
  --radius-xl: 28px;
  --shadow: 0 2px 16px rgba(13,17,23,0.08);
  --shadow-lg: 0 8px 40px rgba(13,17,23,0.14);
  --font-display: 'Syne', sans-serif;
  --font-body: 'Space Grotesk', sans-serif;
  --transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (prefers-color-scheme: dark) {
  :root {
    --ink: #f0ece4;
    --ink2: #c8c2b8;
    --ink3: #9a9488;
    --surface: #12100e;
    --surface2: #1a1814;
    --surface3: #22201c;
    --border: rgba(240,236,228,0.1);
    --border-gold: rgba(201,162,39,0.25);
    --shadow: 0 2px 16px rgba(0,0,0,0.3);
    --shadow-lg: 0 8px 40px rgba(0,0,0,0.45);
    --white: #1a1814;
  }
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 15px;
  line-height: 1.6;
  overflow-x: hidden;
}

html { scroll-behavior: smooth; }

section {
  scroll-margin-top: 72px;
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
section.visible { opacity: 1; transform: translateY(0); }

/* NAV */
nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 28px;
  background: rgba(247,245,240,0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 0.5px solid var(--border);
  justify-content: space-between;
}

@media (prefers-color-scheme: dark) {
  nav { background: rgba(18,16,14,0.88); }
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  cursor: pointer;
}

.nav-logomark {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.nav-wordmark {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 800;
  color: var(--ink);
  letter-spacing: 0.04em;
  line-height: 1.1;
}

.nav-wordmark span {
  display: block;
  font-size: 9px;
  font-weight: 400;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--gold);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-link {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink2);
  cursor: pointer;
  transition: var(--transition);
  border: none;
  background: none;
  font-family: var(--font-body);
}
.nav-link:hover { background: var(--surface2); color: var(--ink); }
.nav-link.active { color: var(--gold); }

.nav-cta {
  padding: 8px 20px;
  border-radius: 10px;
  background: var(--gold);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  border: none;
  font-family: var(--font-body);
  letter-spacing: 0.02em;
}
.nav-cta:hover { background: var(--amber); transform: translateY(-1px); }

/* HERO */
.hero {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  padding-top: 64px;
  position: relative;
  overflow: hidden;
}

.hero-left {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 80px 56px 80px 40px;
  position: relative;
  z-index: 2;
}

.hero-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 999px;
  background: var(--gold-dim);
  border: 0.5px solid var(--border-gold);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 28px;
  width: fit-content;
}

.hero-tag-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--gold);
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.7); }
}

.hero-title {
  font-family: var(--font-display);
  font-size: clamp(40px, 5.5vw, 72px);
  font-weight: 800;
  line-height: 1.0;
  letter-spacing: -0.02em;
  color: var(--ink);
  margin-bottom: 24px;
}

.hero-title em {
  font-style: normal;
  color: var(--teal);
}

.hero-title .gold-word {
  position: relative;
  color: var(--gold);
}

.hero-sub {
  font-size: 17px;
  color: var(--ink2);
  line-height: 1.7;
  max-width: 440px;
  margin-bottom: 40px;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-primary {
  padding: 14px 28px;
  background: var(--teal);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-primary:hover { background: var(--teal2); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(13,148,136,0.3); }

.btn-secondary {
  padding: 14px 28px;
  background: transparent;
  color: var(--ink);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}
.btn-secondary:hover { background: var(--surface2); border-color: var(--ink3); }

.hero-stats {
  display: flex;
  gap: 32px;
  margin-top: 48px;
  padding-top: 32px;
  border-top: 0.5px solid var(--border);
}

.hero-stat-value {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1;
  margin-bottom: 4px;
}

.hero-stat-label {
  font-size: 12px;
  color: var(--ink3);
  font-weight: 400;
  letter-spacing: 0.04em;
}

/* Hero Right — Visual */
.hero-right {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  position: relative;
}

.hero-visual {
  width: 100%;
  max-width: 480px;
  aspect-ratio: 1;
  position: relative;
}

/* Ubuntu Network SVG - Simplified for brevity */
.network-svg {
  width: 100%;
  height: 100%;
}

/* Additional styles would go here... */

/* FOOTER */
.footer-cta {
  padding: 100px 40px;
  text-align: center;
  background: var(--surface);
  position: relative;
  overflow: hidden;
}

.footer-cta-title {
  font-family: var(--font-display);
  font-size: clamp(32px, 4vw, 56px);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--ink);
  margin-bottom: 20px;
  line-height: 1.1;
}

.footer-cta-sub {
  font-size: 17px;
  color: var(--ink2);
  max-width: 520px;
  margin: 0 auto 40px;
  line-height: 1.65;
}
</style>
</head>
<body>
<!-- NAV -->
<nav>
  <div class="nav-logo" onclick="scrollToSection('hero')">
    <svg class="nav-logomark" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="17" stroke="#c9a227" stroke-width="1.2"/>
      <circle cx="18" cy="18" r="5" fill="#c9a227" opacity="0.9"/>
      <circle cx="18" cy="5.5" r="3" fill="#c9a227" opacity="0.6"/>
      <circle cx="29" cy="12" r="3" fill="#c9a227" opacity="0.6"/>
      <circle cx="29" cy="24.5" r="3" fill="#c9a227" opacity="0.6"/>
      <circle cx="18" cy="30.5" r="3" fill="#c9a227" opacity="0.6"/>
      <circle cx="7" cy="24.5" r="3" fill="#c9a227" opacity="0.6"/>
      <circle cx="7" cy="12" r="3" fill="#c9a227" opacity="0.6"/>
      <line x1="18" y1="13" x2="18" y2="8.5" stroke="#c9a227" stroke-width="0.8" opacity="0.5"/>
      <line x1="21.6" y1="15.9" x2="26.2" y2="13.5" stroke="#c9a227" stroke-width="0.8" opacity="0.5"/>
      <line x1="21.6" y1="20.1" x2="26.2" y2="22.5" stroke="#c9a227" stroke-width="0.8" opacity="0.5"/>
      <line x1="18" y1="23" x2="18" y2="27.5" stroke="#c9a227" stroke-width="0.8" opacity="0.5"/>
      <line x1="14.4" y1="20.1" x2="9.8" y2="22.5" stroke="#c9a227" stroke-width="0.8" opacity="0.5"/>
      <line x1="14.4" y1="15.9" x2="9.8" y2="13.5" stroke="#c9a227" stroke-width="0.8" opacity="0.5"/>
    </svg>
    <div class="nav-wordmark">
      Ubuntu Pools
      <span>Arcade v3.0</span>
    </div>
  </div>

  <div class="nav-links">
    <button class="nav-link" onclick="scrollToSection('philosophy')">Philosophy</button>
    <button class="nav-link" onclick="scrollToSection('arcade')">Arcade</button>
    <button class="nav-link" onclick="scrollToSection('lindiwe')">LINDIWE</button>
    <button class="nav-link" onclick="scrollToSection('ranks')">Ranks</button>
    <button class="nav-link" onclick="scrollToSection('join')">Join Us</button>
  </div>

  <button class="nav-cta" onclick="scrollToSection('join')">Enter the Pool</button>
</nav>

<!-- HERO -->
<section id="hero" class="hero">
  <div class="hero-left">
    <div class="hero-tag">
      <div class="hero-tag-dot"></div>
      Ubuntu Protocol · Eastern Cape, ZA
    </div>
    <h1 class="hero-title">
      Collective<br>
      <em>wealth</em> is the<br>
      <span class="gold-word">real game.</span>
    </h1>
    <p class="hero-sub">
      Ubuntu Pools transforms traditional stokvel savings into a living financial intelligence platform — where every play, every pool, every decision builds towards sovereign prosperity.
    </p>
    <div class="hero-actions">
      <button class="btn-primary" onclick="scrollToSection('arcade')">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z" fill="currentColor"/></svg>
        Play Now
      </button>
      <button class="btn-secondary" onclick="scrollToSection('philosophy')">Learn the Ubuntu Way</button>
    </div>
    <div class="hero-stats">
      <div>
        <div class="hero-stat-value">7</div>
        <div class="hero-stat-label">Active Games</div>
      </div>
      <div>
        <div class="hero-stat-value">5</div>
        <div class="hero-stat-label">Authority Tiers</div>
      </div>
      <div>
        <div class="hero-stat-value">POPIA</div>
        <div class="hero-stat-label">Compliant</div>
      </div>
      <div>
        <div class="hero-stat-value">R0</div>
        <div class="hero-stat-label">Lost to Nowhere</div>
      </div>
    </div>
  </div>

  <div class="hero-right">
    <div class="hero-visual">
      <svg class="network-svg" viewBox="0 0 460 460" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="230" cy="230" r="200" stroke="#c9a227" stroke-width="0.5" stroke-dasharray="4 8" opacity="0.2"/>
        <circle cx="230" cy="230" r="150" stroke="#0d9488" stroke-width="0.5" stroke-dasharray="3 6" opacity="0.15"/>
        <circle cx="230" cy="230" r="90" stroke="#c9a227" stroke-width="0.5" opacity="0.1"/>
        <circle cx="230" cy="230" r="32" fill="#c9a227" opacity="0.12"/>
        <circle cx="230" cy="230" r="20" fill="#c9a227" opacity="0.25"/>
        <circle class="network-node" cx="230" cy="230" r="12" fill="#c9a227"/>
        <text x="230" y="275" text-anchor="middle" font-family="Syne,sans-serif" font-size="10" font-weight="700" fill="#c9a227" letter-spacing="0.1em">UBUNTU</text>
        <circle cx="230" cy="58" r="10" fill="#0d9488"/>
        <circle cx="379" cy="122" r="10" fill="#c9a227"/>
        <circle cx="379" cy="338" r="10" fill="#0d9488"/>
        <circle cx="81" cy="338" r="10" fill="#0d9488"/>
        <circle cx="81" cy="122" r="10" fill="#c9a227"/>
      </svg>
    </div>
  </div>
</section>

<!-- PHILOSOPHY BAND -->
<section id="philosophy" class="philosophy-band">
  <div class="philosophy-inner">
    <div>
      <div class="philosophy-label">Foundational Doctrine</div>
      <h2 class="philosophy-quote">"I am because we are."</h2>
      <div style="width:32px;height:2px;background:var(--gold);border-radius:999px;margin:20px 0;"></div>
      <p style="font-size:15px;color:rgba(240,236,228,0.6);line-height:1.7;max-width:340px;">Ubuntu is not an idea — it is architecture. Every protocol in this system is designed so that individual growth is inseparable from collective uplift.</p>
    </div>
    <div class="philosophy-pillars">
      <div class="pillar">
        <svg class="pillar-icon" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="18" stroke="#c9a227" stroke-width="1" opacity="0.4"/>
          <circle cx="20" cy="20" r="6" fill="#c9a227" opacity="0.7"/>
          <circle cx="20" cy="7" r="3" fill="#c9a227" opacity="0.4"/>
          <circle cx="20" cy="33" r="3" fill="#c9a227" opacity="0.4"/>
          <circle cx="7" cy="20" r="3" fill="#c9a227" opacity="0.4"/>
          <circle cx="33" cy="20" r="3" fill="#c9a227" opacity="0.4"/>
        </svg>
        <div class="pillar-title">Collective Sovereignty</div>
        <div class="pillar-desc">Savings pools where redirected losses become community capital — not profit for a third party.</div>
      </div>
      <div class="pillar">
        <svg class="pillar-icon" viewBox="0 0 40 40" fill="none">
          <rect x="4" y="24" width="8" height="12" rx="2" fill="#0d9488" opacity="0.7"/>
          <rect x="16" y="16" width="8" height="20" rx="2" fill="#0d9488" opacity="0.5"/>
          <rect x="28" y="8" width="8" height="28" rx="2" fill="#0d9488" opacity="0.8"/>
          <path d="M8 20L20 14L32 8" stroke="#0d9488" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
        </svg>
        <div class="pillar-title">Proof of Trust</div>
        <div class="pillar-desc">Ubuntu Score makes community trust legible on its own terms — no credit bureaus, no exclusion.</div>
      </div>
      <div class="pillar">
        <svg class="pillar-icon" viewBox="0 0 40 40" fill="none">
          <path d="M20 4L24.5 15.5H36.5L27 23L30.5 34.5L20 27.5L9.5 34.5L13 23L3.5 15.5H15.5L20 4Z" stroke="#c9a227" stroke-width="1.2" fill="none" opacity="0.7"/>
          <path d="M20 10L23 17H30.5L24.5 21.5L26.5 29L20 24.5L13.5 29L15.5 21.5L9.5 17H17L20 10Z" fill="#c9a227" opacity="0.2"/>
        </svg>
        <div class="pillar-title">Earned Authority</div>
        <div class="pillar-desc">Five tiers from Member to Sovereign — unlocked through participation, accuracy, and mentorship.</div>
      </div>
    </div>
  </div>
</section>

<!-- FOOTER CTA -->
<section class="footer-cta">
  <p class="footer-cta-title">The pool is open.<br><span style="color:var(--teal);">Dive in.</span></p>
  <p class="footer-cta-sub">Ubuntu Pools is live in pilot. You are early. The communities built in this phase become the founding stokvel of a new financial layer for Africa.</p>
  <div class="footer-cta-actions">
    <button class="btn-primary" style="font-size:16px;padding:16px 36px;" onclick="scrollToSection('arcade')">
      Play a Game
    </button>
    <button class="btn-secondary" style="font-size:16px;padding:16px 36px;" onclick="scrollToSection('join')">
      Join the Protocol
    </button>
  </div>
  <p class="footer-note">Ubuntu Pools · Vaguely Vanity LLC · Pro Installations Pty Ltd · Eastern Cape, South Africa · POPIA Compliant</p>
</section>

<script>
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('section').forEach(s => {
  observer.observe(s);
  if (s.id === 'hero') s.classList.add('visible');
});
</script>

</body>
</html>`
      }}
      style={{ margin: 0, padding: 0 }}
    />
  );
}