import { SignInButton, UserButton } from "@clerk/nextjs";

export default function Page() {
  return (
    <>

      {/* Navigation Rail */}
      <nav className="fixed left-0 top-0 h-full w-20 border-r border-black/5 bg-white z-50 flex flex-col items-center py-10 gap-10 hidden lg:flex">
        <div className="w-10 h-10 organic-shape bg-emerald-900"></div>
        <div className="flex-1 flex flex-col gap-12 justify-center">
          <a href="#philosophy" className="nav-link [writing-mode:vertical-rl] rotate-180">Philosophy</a>
          <a href="#visuals" className="nav-link [writing-mode:vertical-rl] rotate-180">Visuals</a>
          <a href="#layouts" className="nav-link [writing-mode:vertical-rl] rotate-180 active">Layouts</a>
          <a href="#tech" className="nav-link [writing-mode:vertical-rl] rotate-180">Technical</a>
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest opacity-20 [writing-mode:vertical-rl] rotate-180">
          v1.0.4 • POPIA
        </div>
      </nav>

      <main className="lg:ml-20">
        {/* Hero Section */}
        <section id="philosophy" className="min-h-screen flex flex-col justify-center px-10 md:px-24 py-20 relative overflow-hidden">
          <div className="pattern-dots absolute inset-0 opacity-[0.03] pointer-events-none"></div>

          <div className="max-w-4xl relative z-10">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-900/5 text-emerald-900 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-10">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Sovereign System Blueprint
            </div>

            <h1 className="text-7xl md:text-9xl font-serif italic leading-[0.85] tracking-tight mb-10">
              The Architecture of <span className="text-emerald-800 not-italic">Ubuntu</span>
            </h1>

            <p className="text-2xl text-muted-foreground font-medium max-w-2xl leading-relaxed mb-16">
              A technical and aesthetic guide to building the world's first meritocratic community wealth governance platform, rooted in South African POPIA compliance and AWS Cape Town sovereignty.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="space-y-4">
                <h4 className="font-black uppercase tracking-widest text-xs text-emerald-800">01. Meritocracy</h4>
                <p className="text-sm text-muted-foreground">The "Ubuntu Score" determines platform authority, not pure capital. Reputation is the new collateral.</p>
              </div>
              <div className="space-y-4">
                <h4 className="font-black uppercase tracking-widest text-xs text-emerald-800">02. Sovereignty</h4>
                <p className="text-sm text-muted-foreground">Zero-latency compliance via AWS Africa (Cape Town). Data never leaves the jurisdiction.</p>
              </div>
              <div className="space-y-4">
                <h4 className="font-black uppercase tracking-widest text-xs text-emerald-800">03. Transparency</h4>
                <p className="text-sm text-muted-foreground">Immutable audit trails combined with Zero-Knowledge identity guards.</p>
              </div>
            </div>

            <div className="mt-16">
              <SignInButton mode="modal">
                <button className="px-8 py-4 bg-emerald-900 text-white rounded-full font-black uppercase tracking-widest text-sm hover:bg-emerald-800 transition-colors">
                  Access Sovereign Vault
                </button>
              </SignInButton>
            </div>
          </div>
        </section>

        {/* Visual Language */}
        <section id="visuals" className="min-h-screen bg-white py-32 px-10 md:px-24 border-y border-black/5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
            <div>
              <h2 className="text-5xl font-serif italic mb-8">Visual <span className="text-emerald-800 not-italic">DNA</span></h2>
              <p className="text-lg text-muted-foreground mb-12">We avoid generic "SaaS Blue." Our palette is rooted in the earth, utilizing sage greens, ochres, and deep charcoal in contrast with ethereal whites.</p>

              <div className="space-y-12">
                <div className="flex items-center gap-8">
                  <div className="w-24 h-24 organic-shape bg-emerald-900 flex items-center justify-center text-white font-black text-xs">SAGE</div>
                  <div>
                    <h4 className="font-bold">Organic Shapes</h4>
                    <p className="text-xs text-muted-foreground">Custom blob-radii for avatars and icons to denote community growth.</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="w-24 h-24 organic-shape bg-[#d4a373] flex items-center justify-center text-white font-black text-xs">OCHRE</div>
                  <div>
                    <h4 className="font-bold">Intentional Pairings</h4>
                    <p className="text-xs text-muted-foreground">Inter (Sans) for data nodes, Playfair (Serif) for narrative headings.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="blueprint-card p-10 h-64 flex flex-col justify-end">
                <span className="text-[10px] font-black uppercase opacity-20">Typography</span>
                <h3 className="text-3xl font-serif italic">Ubuntu Score</h3>
              </div>
              <div className="blueprint-card p-10 h-64 bg-emerald-900 text-white flex flex-col justify-end">
                <span className="text-[10px] font-black uppercase opacity-40">Accent</span>
                <h3 className="text-3xl font-serif italic">Sovereignty</h3>
              </div>
              <div className="blueprint-card p-10 h-64 border-2 border-dashed border-black/10 flex flex-col justify-end">
                <span className="text-[10px] font-black uppercase opacity-20">Layout</span>
                <h3 className="text-3xl font-serif italic">Visible Grids</h3>
              </div>
              <div className="blueprint-card p-10 h-64 bg-slate-50 flex flex-col justify-end">
                <span className="text-[10px] font-black uppercase opacity-20">Identity</span>
                <div className="w-10 h-10 organic-shape bg-emerald-800 mb-4"></div>
                <h3 className="text-3xl font-serif italic">Manager</h3>
              </div>
            </div>
          </div>
        </section>

        {/* Layout Structures */}
        <section id="layouts" className="py-32 px-10 md:px-24 space-y-32">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-6xl font-serif italic mb-6">Structural <span className="text-emerald-800 not-italic">Anatomy</span></h2>
            <p className="text-muted-foreground">Our layout is designed for high-density monitoring and zero-friction onboarding.</p>
          </div>

          {/* Page 1: Split Onboarding */}
          <div className="space-y-10">
            <div className="flex items-center gap-6">
              <span className="w-12 h-12 flex items-center justify-center border border-black/10 rounded-full font-bold">01</span>
              <h3 className="text-3xl font-serif italic">The Split Onboarding (5 Click Rule)</h3>
            </div>
            <div className="blueprint-card overflow-hidden shadow-2xl">
              <div className="split-layout">
                <div className="p-20 flex flex-col justify-center bg-white border-r">
                  <h4 className="text-4xl font-serif italic mb-6 text-emerald-900">Governance Login</h4>
                  <p className="text-sm text-muted-foreground mb-10">Enter the vault via Zero-Knowledge credentials.</p>
                  <div className="space-y-6">
                    <div className="h-14 bg-slate-50 rounded-2xl border"></div>
                    <div className="h-14 bg-slate-50 rounded-2xl border"></div>
                    <div className="h-14 bg-emerald-900 rounded-2xl shadow-lg"></div>
                  </div>
                </div>
                <div className="hidden lg:block bg-zinc-950 p-20 relative overflow-hidden">
                  <div className="organic-shape bg-emerald-500/10 w-[500px] h-[500px] absolute -top-40 -right-40 blur-3xl"></div>
                  <div className="relative z-10 space-y-10">
                    <div className="w-20 h-20 organic-shape bg-emerald-500"></div>
                    <h1 className="text-6xl font-serif italic text-white leading-tight">Securing the Narrative of Wealth</h1>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-emerald-500 text-xs font-black uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Ubuntu Rep: 88/100
                      </div>
                      <div className="flex items-center gap-4 text-slate-500 text-xs font-black uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                        AWS Cape Town Connected
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Page 2: Analytical Dashboard */}
          <div className="space-y-10">
            <div className="flex items-center gap-6">
              <span className="w-12 h-12 flex items-center justify-center border border-black/10 rounded-full font-bold">02</span>
              <h3 className="text-3xl font-serif italic">Analytical Dashboard Hierarchy</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-3 space-y-8">
                {/* Chart Area */}
                <div className="blueprint-card aspect-video border-2 border-dashed border-emerald-900/10 p-10 relative">
                  <div className="absolute inset-0 pattern-dots opacity-5"></div>
                  <h4 className="text-xs font-black uppercase tracking-widest mb-10">Collective Growth Trends</h4>
                  <div className="h-full w-full flex items-end gap-2 pb-10">
                    <div className="flex-1 bg-emerald-900/10 rounded-t-xl" style={{height: '40%'}}></div>
                    <div className="flex-1 bg-emerald-900/20 rounded-t-xl" style={{height: '60%'}}></div>
                    <div className="flex-1 bg-emerald-900/40 rounded-t-xl" style={{height: '30%'}}></div>
                    <div className="flex-1 bg-emerald-900/60 rounded-t-xl" style={{height: '80%'}}></div>
                    <div className="flex-1 bg-emerald-900 rounded-t-xl" style={{height: '95%'}}></div>
                  </div>
                </div>
              </div>
              <div className="space-y-8">
                <div className="blueprint-card p-8 bg-emerald-900 text-white organic-shape aspect-square flex flex-col justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">Avg Score</h4>
                  <div className="text-6xl font-serif italic">82.5</div>
                  <p className="text-[10px] uppercase font-bold opacity-60">Harmonized Provincial Node</p>
                </div>
                <div className="blueprint-card p-8 border border-accent/20">
                  <h4 className="text-[10px] font-black uppercase tracking-widest mb-4">Live Friction Log</h4>
                  <div className="space-y-3">
                    <div className="h-2 bg-slate-100 rounded-full w-full"></div>
                    <div className="h-2 bg-slate-100 rounded-full w-[80%]"></div>
                    <div className="h-2 bg-emerald-500 rounded-full w-[40%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Configuration */}
        <section id="tech" className="bg-zinc-950 py-32 px-10 md:px-24 text-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-6xl font-serif italic mb-16 underline underline-offset-8">Technical <span className="text-emerald-500">Inventory</span></h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {/* Column 1: AI & Auth */}
              <div className="space-y-12">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-4">01. AI Fallback Tiers</h4>
                  <div className="space-y-4 font-mono text-[11px] text-slate-400">
                    <div className="p-4 bg-white/5 rounded border border-white/10">
                      <span className="text-white">Tier 1: Claude 3 Opus</span><br/>
                      Executive Strategy generation.
                    </div>
                    <div className="p-4 bg-white/5 rounded border border-white/10">
                      <span className="text-white">Tier 2: Gemini 1.5 Flash</span><br/>
                      Real-time insight extraction.
                    </div>
                    <div className="p-4 bg-white/5 rounded border border-white/10">
                      <span className="text-white">Tier 3: Local Gemma 3</span><br/>
                      Offline/On-edge privacy compute.
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: Data & Sovereignty */}
              <div className="space-y-12">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-4">02. Environment Vars</h4>
                  <div className="space-y-2">
                    <div className="token-tag">NEXT_PUBLIC_APP_URL</div>
                    <div className="token-tag">DATABASE_URL</div>
                    <div className="token-tag">DODO_PAYMENTS_CLIENT_ID</div>
                    <div className="token-tag">OPENCLAW_API_KEY</div>
                    <div className="token-tag">SENTRY_DSN</div>
                    <div className="token-tag">Gemini_API_Key</div>
                  </div>
                </div>
              </div>

              {/* Column 3: Compliance */}
              <div className="space-y-12">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-4">03. Compliance Hooks</h4>
                  <ul className="space-y-4 text-sm text-slate-400">
                    <li className="flex items-center gap-3">
                      <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                      POPIA: Cryptographic Shredding hook
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                      Sovereignty: AWS Cape Town stickiness
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                      Identity: Zero-Knowledge MFA
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-20 pt-20 border-t border-white/10">
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest text-center">
                Generated by AI Studio Build • Ubuntu Pools Design System v1.0.4
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-10 px-10 md:px-24 border-t bg-white">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[10px] font-black uppercase tracking-widest">Village Governance • 2026</div>
          <div className="flex gap-10">
            <a href="#" className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100">POPIA Policy</a>
            <a href="#" className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100">Audit Node</a>
            <a href="#" className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100">Contact Chief</a>
          </div>
        </div>
      </footer>
    </>
  );
}