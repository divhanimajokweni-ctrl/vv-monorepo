import { useState } from "react";

const TABS = [
  { id: "diagram", label: "Ops Diagram", icon: "◈" },
  { id: "models", label: "Model Insight", icon: "◉" },
  { id: "transfer", label: "Transfer Roadmap", icon: "⇢" },
  { id: "scripts", label: "Command Scripts", icon: "⌨" },
  { id: "justification", label: "Justification", icon: "✦" },
];

const C = {
  bg: "#06080a",
  panel: "#0b0f13",
  border: "#192819",
  sg: "#00e676",
  ubuntu: "#ffab40",
  stake: "#ce93d8",
  red: "#ff5252",
  blue: "#40c4ff",
  text: "#d8eed8",
  dim: "#3a5a3a",
  dimU: "#6a4a1a",
  dimS: "#5a3a7a",
};

// ─────────────────────────────────────────────
//  DIAGRAM
// ─────────────────────────────────────────────
function DiagramTab() {
  const [active, setActive] = useState(null);

  const entities = {
    safegrid: {
      label: "SAFEGRID SA",
      sub: "Hybrid Security Intelligence Platform",
      color: C.sg,
      desc: "The primary entity. Software-first security intelligence — geospatial risk scoring, autonomous agent architecture, B2B API platform. Formerly operating under the Pro Installations brand for physical work.",
    },
    ubuntu: {
      label: "UBUNTU POOLS",
      sub: "Community Savings & Gamification Engine",
      color: C.ubuntu,
      desc: "Community-owned savings infrastructure built on the stokvel model. Gamification layer drives contribution discipline. Currently holds the gambling redirect roadmap — pending transfer to SafeStake.",
    },
    safestake: {
      label: "SAFESTAKE",
      sub: "Responsible Wagering Intelligence Module",
      color: C.stake,
      desc: "SafeGrid's harm-reduction overlay for licensed gambling operators. Loss Velocity Engine, Redirect-to-Earn, Probability Transparency, Community Accountability Circles. The gambling roadmap migrates HERE from Ubuntu Pools.",
    },
    brain: {
      label: "SAFEGRID BRAIN API",
      sub: "Node.js · Fastify · PostGIS · Redis",
      color: C.blue,
      desc: "The core infrastructure. All three product lines call this API. JWT/API key auth, WebSocket streaming, geospatial endpoints, cron jobs, SAPD ingestion pipeline.",
    },
    agents: {
      label: "AGENT SYSTEM",
      sub: "Risk Engine · SafeGrid Agent · Red Alert Executor · Kilo",
      color: C.sg,
      desc: "Four-component autonomous AI layer. Risk Engine scores zones. SafeGrid Agent orchestrates responses. Red Alert fires parallel emergency actions. Kilo OpenClaw is the admin intelligence interface.",
    },
    b2b: {
      label: "B2B CLIENTS",
      sub: "Security Cos · Property · Municipalities",
      color: "#78909c",
      desc: "Commercial API subscribers. ZAR-tiered pricing. Managed service contracts. Each client embeds SafeGrid intelligence into their own operations.",
    },
    community: {
      label: "COMMUNITY LAYER",
      sub: "Stokvels · Neighbourhood Circles · USSD Reach",
      color: C.ubuntu,
      desc: "The Ubuntu substrate. Community members are both data contributors and primary beneficiaries. Safety scores improve with density. Savings pools build with contributions. No individual can replicate this alone.",
    },
  };

  const Box = ({ id, x, y, w = 180 }) => {
    const e = entities[id];
    const isActive = active === id;
    return (
      <g
        style={{ cursor: "pointer" }}
        onClick={() => setActive(isActive ? null : id)}
      >
        <rect
          x={x}
          y={y}
          width={w}
          height={56}
          rx={3}
          fill={isActive ? e.color + "22" : "#0c1410"}
          stroke={e.color}
          strokeWidth={isActive ? 2 : 1}
          style={{ transition: "all 0.2s" }}
        />
        <text
          x={x + w / 2}
          y={y + 20}
          textAnchor="middle"
          fill={e.color}
          fontSize={10}
          fontFamily="'Courier New',monospace"
          fontWeight="bold"
          letterSpacing={1}
        >
          {e.label}
        </text>
        <text
          x={x + w / 2}
          y={y + 36}
          textAnchor="middle"
          fill="#4a6a4a"
          fontSize={8.5}
          fontFamily="'Courier New',monospace"
        >
          {e.sub.length > 28 ? e.sub.slice(0, 27) + "…" : e.sub}
        </text>
        {isActive && (
          <rect
            x={x}
            y={y + 56}
            width={w}
            height={4}
            rx={1}
            fill={e.color}
            opacity={0.6}
          />
        )}
      </g>
    );
  };

  const Arrow = ({
    x1,
    y1,
    x2,
    y2,
    color = C.dim,
    label = "",
    dashed = false,
  }) => {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    return (
      <g>
        <defs>
          <marker
            id={`arr-${color.replace("#", "")}`}
            markerWidth={6}
            markerHeight={6}
            refX={5}
            refY={3}
            orient="auto"
          >
            <path d="M0,0 L0,6 L6,3 z" fill={color} />
          </marker>
        </defs>
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth={1.5}
          opacity={0.7}
          strokeDasharray={dashed ? "5,4" : "none"}
          markerEnd={`url(#arr-${color.replace("#", "")})`}
        />
        {label && (
          <text
            x={mx}
            y={my - 5}
            textAnchor="middle"
            fill={color}
            fontSize={8}
            fontFamily="'Courier New',monospace"
            opacity={0.8}
          >
            {label}
          </text>
        )}
      </g>
    );
  };

  const activeEntity = active ? entities[active] : null;

  return (
    <div>
      <SectionHeader
        title="Full Operations Structure"
        sub="SafeGrid SA ecosystem — entities, data flows, and the Ubuntu-to-SafeStake migration vector"
      />
      <div
        style={{
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 4,
          overflow: "hidden",
          marginBottom: 20,
        }}
      >
        <svg
          viewBox="0 0 700 480"
          style={{ width: "100%", fontFamily: "'Courier New',monospace" }}
        >
          {/* Grid lines */}
          {[100, 200, 300, 400].map((y) => (
            <line
              key={y}
              x1={0}
              y1={y}
              x2={700}
              y2={y}
              stroke="#1a2a1a"
              strokeWidth={0.5}
              strokeDasharray="3,6"
            />
          ))}

          {/* Layer labels */}
          {[
            [8, 46, "PRODUCT", C.sg],
            [8, 146, "INFRA", C.blue],
            [8, 246, "INTELLIGENCE", C.sg],
            [8, 346, "MARKET", "#78909c"],
            [8, 436, "COMMUNITY", C.ubuntu],
          ].map(([x, y, t, c]) => (
            <text
              key={t}
              x={x}
              y={y}
              fill={c}
              fontSize={7}
              fontFamily="'Courier New',monospace"
              letterSpacing={2}
              opacity={0.5}
            >
              {t}
            </text>
          ))}

          {/* Row 1 — Product Entities */}
          <Box id="safegrid" x={60} y={20} w={175} />
          <Box id="ubuntu" x={265} y={20} w={175} />
          <Box id="safestake" x={470} y={20} w={175} />

          {/* Row 2 — Infrastructure */}
          <Box id="brain" x={60} y={120} w={280} />

          {/* Row 3 — Intelligence */}
          <Box id="agents" x={60} y={220} w={280} />

          {/* Row 4 — Market */}
          <Box id="b2b" x={60} y={330} w={175} />

          {/* Row 5 — Community */}
          <Box id="community" x={60} y={420} w={280} />

          {/* ARROWS */}
          {/* SafeGrid → Brain */}
          <Arrow x1={150} y1={76} x2={150} y2={120} color={C.sg} label="owns" />
          {/* Brain → Agents */}
          <Arrow
            x1={200}
            y1={176}
            x2={200}
            y2={220}
            color={C.blue}
            label="powers"
          />
          {/* Agents → B2B */}
          <Arrow
            x1={180}
            y1={276}
            x2={130}
            y2={330}
            color={C.sg}
            label="serves"
          />
          {/* SafeGrid → B2B */}
          <Arrow
            x1={100}
            y1={76}
            x2={100}
            y2={330}
            color={C.dim}
            label=""
            dashed
          />
          {/* Ubuntu → Community */}
          <Arrow
            x1={352}
            y1={76}
            x2={200}
            y2={420}
            color={C.ubuntu}
            label="pools"
          />
          {/* SafeStake ← Ubuntu (transfer) */}
          <Arrow
            x1={465}
            y1={48}
            x2={445}
            y2={48}
            color={C.stake}
            label="MIGRATING →"
            dashed
          />
          <Arrow x1={440} y1={48} x2={470} y2={48} color={C.stake} />
          {/* SafeStake → Brain */}
          <Arrow
            x1={557}
            y1={76}
            x2={340}
            y2={120}
            color={C.stake}
            label="calls"
            dashed
          />
          {/* Community → SafeStake */}
          <Arrow
            x1={200}
            y1={420}
            x2={557}
            y2={76}
            color={C.ubuntu}
            label="redirect ↗"
            dashed
          />
          {/* Brain → Community */}
          <Arrow
            x1={160}
            y1={176}
            x2={160}
            y2={420}
            color={C.blue}
            label=""
            dashed
          />

          {/* LEGEND */}
          <rect
            x={460}
            y={140}
            width={210}
            height={120}
            rx={3}
            fill="#090d0c"
            stroke={C.border}
            strokeWidth={1}
          />
          <text x={475} y={158} fill={C.dim} fontSize={8} letterSpacing={2}>
            LEGEND
          </text>
          {[
            [C.sg, "SafeGrid SA"],
            [C.ubuntu, "Ubuntu Pools"],
            [C.stake, "SafeStake"],
            [C.blue, "Brain API / Infra"],
            ["#78909c", "B2B Market"],
          ].map(([c, l], i) => (
            <g key={l}>
              <rect
                x={475}
                y={168 + i * 19}
                width={12}
                height={8}
                rx={1}
                fill={c}
              />
              <text x={492} y={176 + i * 19} fill="#8ab09a" fontSize={9}>
                {l}
              </text>
            </g>
          ))}

          {/* TRANSFER BADGE */}
          <rect
            x={440}
            y={110}
            width={230}
            height={26}
            rx={3}
            fill="#1a0a2a"
            stroke={C.stake}
            strokeWidth={1}
            strokeDasharray="3,3"
          />
          <text
            x={555}
            y={127}
            textAnchor="middle"
            fill={C.stake}
            fontSize={9}
            fontFamily="'Courier New',monospace"
            letterSpacing={1}
          >
            ⇢ GAMBLING ROADMAP TRANSFERS HERE
          </text>
        </svg>
      </div>

      {/* Info panel */}
      {activeEntity ? (
        <div
          style={{
            background: activeEntity.color + "11",
            border: `1px solid ${activeEntity.color}55`,
            borderLeft: `3px solid ${activeEntity.color}`,
            padding: "16px 20px",
            borderRadius: 3,
          }}
        >
          <Label color={activeEntity.color}>
            {activeEntity.label} — {activeEntity.sub}
          </Label>
          <p
            style={{
              margin: "8px 0 0",
              color: C.text,
              fontSize: 13,
              lineHeight: 1.8,
            }}
          >
            {activeEntity.desc}
          </p>
        </div>
      ) : (
        <p
          style={{
            color: C.dim,
            fontSize: 11,
            textAlign: "center",
            letterSpacing: 2,
          }}
        >
          ↑ TAP ANY NODE FOR DETAILS
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  MODEL INSIGHT
// ─────────────────────────────────────────────
function ModelsTab() {
  const [open, setOpen] = useState(null);

  const models = [
    {
      id: "safegrid",
      name: "SAFEGRID SA",
      tagline: "Security Intelligence Platform — Software First",
      color: C.sg,
      overview:
        "SafeGrid SA is the primary business entity — formerly operating under the Pro Installations brand. The pivot is decisive: SafeGrid leads with software intelligence, B2B API monetisation, and autonomous agent architecture. Physical installation work continues informally as a side channel but is no longer the brand identity or the revenue thesis.",
      pillars: [
        {
          t: "Brain API",
          d: "Fastify + PostGIS + Redis. The geospatial intelligence core. All products call this.",
        },
        {
          t: "Agent System",
          d: "Risk Engine → SafeGrid Agent → Red Alert Executor → Kilo OpenClaw. Four-layer autonomous response architecture.",
        },
        {
          t: "B2B Monetisation",
          d: "ZAR-tiered API subscriptions and managed service contracts. Recurring revenue, no consumer acquisition cost.",
        },
        {
          t: "SafeStake Module",
          d: "Harm-reduction intelligence overlay for gambling operators. Lives within SafeGrid SA as a distinct product line.",
        },
      ],
      strengths: [
        "Defensible geospatial moat",
        "Scalable without hardware",
        "B2B recurring revenue model",
        "Agent AI differentiator",
      ],
      gaps: [
        "Still needs CIPC formalisation",
        "Pentest required pre-B2B launch",
        "POPIA data classification incomplete",
      ],
    },
    {
      id: "ubuntu",
      name: "UBUNTU POOLS",
      tagline: "Community Savings Engine — Gamification Layer",
      color: C.ubuntu,
      overview:
        "Ubuntu Pools is the community financial infrastructure product. Built on the stokvel model — Africa's original community savings mechanism — it digitises and gamifies the contribution cycle. Members earn points, unlock tiers, and build collective wealth. The gambling redirect feature was initially roadmapped inside Ubuntu Pools, but this is being formally transferred to SafeStake under SafeGrid SA.",
      pillars: [
        {
          t: "Stokvel Engine",
          d: "Digital savings pools with transparent ledgers. Contribution rotation, payout scheduling, group governance.",
        },
        {
          t: "Gamification Layer",
          d: "Points, streaks, badges, leaderboards. Contribution discipline driven by game mechanics, not guilt.",
        },
        {
          t: "Community Circles",
          d: "Trusted accountability groups. Weekly wellness signals. Ubuntu accountability without surveillance.",
        },
        {
          t: "Micro-Investment Bridge",
          d: "When a pot hits threshold, auto-bridge to regulated investment product (EasyEquities/Satrix).",
        },
      ],
      strengths: [
        "R50bn stokvel market fit",
        "High cultural resonance",
        "No FSP required for pure savings",
        "Community trust flywheel",
      ],
      gaps: [
        "Gambling roadmap leaving — Ubuntu Pools stays pure savings",
        "Needs mobile money rail integration",
        "USSD layer not yet built",
      ],
    },
  ];

  return (
    <div>
      <SectionHeader
        title="Current Model Insight"
        sub="SafeGrid SA and Ubuntu Pools — what each owns, where each is strong, and where the boundaries are drawn"
      />
      {models.map((m) => (
        <div key={m.id} style={{ marginBottom: 24 }}>
          <div
            onClick={() => setOpen(open === m.id ? null : m.id)}
            style={{
              background: open === m.id ? m.color + "18" : C.panel,
              border: `1px solid ${m.color}44`,
              borderLeft: `3px solid ${m.color}`,
              padding: "18px 22px",
              borderRadius: 3,
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  color: m.color,
                  fontSize: 13,
                  fontWeight: "bold",
                  letterSpacing: 2,
                }}
              >
                {m.name}
              </div>
              <div style={{ color: "#6a8a6a", fontSize: 11, marginTop: 3 }}>
                {m.tagline}
              </div>
            </div>
            <span style={{ color: m.color, fontSize: 18 }}>
              {open === m.id ? "−" : "+"}
            </span>
          </div>

          {open === m.id && (
            <div
              style={{
                background: "#080d0a",
                border: `1px solid ${m.color}22`,
                borderTop: "none",
                padding: "20px 22px",
                borderRadius: "0 0 3px 3px",
              }}
            >
              <p
                style={{
                  color: C.text,
                  fontSize: 13,
                  lineHeight: 1.8,
                  margin: "0 0 20px",
                }}
              >
                {m.overview}
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                {m.pillars.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#0a100c",
                      border: `1px solid ${C.border}`,
                      borderLeft: `2px solid ${m.color}`,
                      padding: "12px 14px",
                      borderRadius: 2,
                    }}
                  >
                    <div
                      style={{
                        color: m.color,
                        fontSize: 11,
                        fontWeight: "bold",
                        marginBottom: 6,
                      }}
                    >
                      {p.t}
                    </div>
                    <div
                      style={{
                        color: "#8aaa8a",
                        fontSize: 11,
                        lineHeight: 1.6,
                      }}
                    >
                      {p.d}
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <Label color={C.sg}>STRENGTHS</Label>
                  {m.strengths.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        color: "#8aaa8a",
                        fontSize: 11,
                        lineHeight: 1.9,
                      }}
                    >
                      ✓ {s}
                    </div>
                  ))}
                </div>
                <div>
                  <Label color={C.red}>OPEN GAPS</Label>
                  {m.gaps.map((g, i) => (
                    <div
                      key={i}
                      style={{
                        color: "#aa6a6a",
                        fontSize: 11,
                        lineHeight: 1.9,
                      }}
                    >
                      △ {g}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
//  TRANSFER ROADMAP
// ─────────────────────────────────────────────
function TransferTab() {
  const steps = [
    {
      n: "01",
      status: "NOW",
      title: "Formal Declaration of Intent",
      color: C.ubuntu,
      from: "Ubuntu Pools",
      to: "SafeGrid SafeStake",
      detail:
        "The gambling roadmap — Loss Velocity Engine, Redirect-to-Earn, Probability Transparency, Wagering Overlay — is formally declared as belonging to SafeStake. Ubuntu Pools removes all gambling-adjacent feature branches from its roadmap. Ubuntu Pools' identity crystallises as: pure community savings + gamification only.",
      action:
        "Archive gambling feature branches in Ubuntu Pools repo. Create SafeStake module directory inside Safegrid-Brain-API. Document the transfer decision in Company Manifest v2.",
    },
    {
      n: "02",
      status: "WEEK 1-2",
      title: "Architecture Separation",
      color: C.blue,
      from: "Shared codebase assumptions",
      to: "Clean module boundary",
      detail:
        "SafeStake is implemented as an isolated module within SafeGrid Brain API — its own route namespace (/safestake/v1/), its own PostgreSQL schema, its own Redis key prefix. Ubuntu Pools gets its own isolated microservice or sub-module. No cross-contamination between savings logic and wagering overlay logic.",
      action:
        "mkdir -p src/modules/safestake && mkdir -p src/modules/ubuntu-pools. Define schema files. Add module-level auth middleware.",
    },
    {
      n: "03",
      status: "WEEK 2-4",
      title: "Data Model Migration",
      color: C.stake,
      from: "Ubuntu Pools wallet schema",
      to: "SafeStake financial intelligence schema",
      detail:
        "Ubuntu Pools retains: savings_pools, contributions, members, stokvel_governance. SafeStake takes ownership of: wager_sessions, loss_velocity_log, redirect_transactions, wellness_signals, operator_integrations. These are structurally different data domains and must live separately.",
      action:
        "Write Flyway migration V007__safestake_schema.sql and V008__ubuntu_pools_schema.sql as independent versioned migrations.",
    },
    {
      n: "04",
      status: "WEEK 4-6",
      title: "Ubuntu Pools Gamification Completion",
      color: C.ubuntu,
      from: "Basic savings engine",
      to: "Gamified community savings platform",
      detail:
        "With gambling features formally removed, Ubuntu Pools doubles down on its strength: making saving feel like a game. Points for on-time contributions, streaks for consecutive months, circle leaderboards, achievement badges, milestone unlocks. This is the feature that makes stokvels sticky for a generation that grew up on mobile games.",
      action:
        "Build gamification_engine.js. Define points schema. Build leaderboard endpoint. Connect to notification service for badge alerts.",
    },
    {
      n: "05",
      status: "WEEK 6-10",
      title: "SafeStake Core Build",
      color: C.stake,
      from: "Empty module",
      to: "Loss Velocity Engine + Redirect-to-Earn live",
      detail:
        "The two most critical SafeStake components ship first: the Loss Velocity Engine (real-time spend tracking against self-set thresholds) and the Redirect-to-Earn mechanism (automatic diversion of over-threshold wagers to savings pot). These two alone deliver the harm-reduction mission before anything else is built.",
      action:
        "Build loss_velocity_engine.js. Build redirect_executor.js. Integrate with Ubuntu Pools wallet API for redirect destination. Test with mock operator feed.",
    },
    {
      n: "06",
      status: "WEEK 10-14",
      title: "Operator Integration & Compliance Shell",
      color: C.sg,
      from: "Internal SafeStake",
      to: "Live overlay on licensed gambling operator",
      detail:
        "SafeStake is not a gambling operator — it is a wellness middleware. It connects to a licensed SA operator via OAuth2, reads their bet event stream, applies the Loss Velocity Engine, and returns signals. This structure means SafeStake does not require a gambling licence. FSCA FSP registration covers the financial wellness/savings flow.",
      action:
        "Build operator_integration_adapter.js with OAuth2 flow. Register SafeGrid SA as FSP with FSCA. Draft data processing agreement template for operators.",
    },
    {
      n: "07",
      status: "ONGOING",
      title: "Ubuntu Pools × SafeStake Bridge",
      color: C.ubuntu,
      from: "Two separate modules",
      to: "Unified community financial safety ecosystem",
      detail:
        "The redirect destination for SafeStake's Redirect-to-Earn mechanism IS an Ubuntu Pool. This is the permanent architectural bridge: SafeStake catches the bleeding, Ubuntu Pools holds and grows what's saved. Together they form a closed loop — a person's gambling loss is turned into a community wealth asset. That is the Ubuntu mission expressed in code.",
      action:
        "Build redirect_to_ubuntu_pool() bridge function. Consent-gated pool selection for redirected funds. Publish API spec for the bridge so both modules can evolve independently.",
    },
  ];

  return (
    <div>
      <SectionHeader
        title="Transfer Roadmap"
        sub="Gambling roadmap exits Ubuntu Pools → enters SafeGrid SafeStake — step by step"
      />
      <div
        style={{
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 4,
          padding: "20px 24px",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 40,
            flexWrap: "wrap",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                background: C.ubuntu + "22",
                border: `2px solid ${C.ubuntu}`,
                borderRadius: 4,
                padding: "10px 20px",
                color: C.ubuntu,
                fontSize: 13,
                fontWeight: "bold",
                letterSpacing: 2,
              }}
            >
              UBUNTU POOLS
            </div>
            <div style={{ color: "#6a5a3a", fontSize: 10, marginTop: 6 }}>
              Savings + Gamification ONLY
            </div>
          </div>
          <div
            style={{
              flex: 1,
              textAlign: "center",
              color: C.stake,
              fontSize: 22,
            }}
          >
            ⟶ GAMBLING ROADMAP ⟶
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                background: C.stake + "22",
                border: `2px dashed ${C.stake}`,
                borderRadius: 4,
                padding: "10px 20px",
                color: C.stake,
                fontSize: 13,
                fontWeight: "bold",
                letterSpacing: 2,
              }}
            >
              SAFESTAKE
            </div>
            <div style={{ color: "#5a3a7a", fontSize: 10, marginTop: 6 }}>
              Under SafeGrid SA
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: 28,
            top: 0,
            bottom: 0,
            width: 1,
            background: C.border,
          }}
        />
        {steps.map((s, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 20,
              marginBottom: 20,
              position: "relative",
            }}
          >
            <div
              style={{
                flexShrink: 0,
                width: 56,
                height: 56,
                background: s.color + "22",
                border: `2px solid ${s.color}`,
                borderRadius: "50%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1,
              }}
            >
              <div style={{ color: s.color, fontSize: 11, fontWeight: "bold" }}>
                {s.n}
              </div>
              <div
                style={{
                  color: s.color,
                  fontSize: 8,
                  letterSpacing: 1,
                  opacity: 0.7,
                }}
              >
                {s.status}
              </div>
            </div>
            <div
              style={{
                flex: 1,
                background: C.panel,
                border: `1px solid ${s.color}33`,
                borderLeft: `2px solid ${s.color}`,
                padding: "14px 18px",
                borderRadius: 3,
              }}
            >
              <div
                style={{
                  color: s.color,
                  fontSize: 13,
                  fontWeight: "bold",
                  marginBottom: 8,
                }}
              >
                {s.title}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 10,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    background: "#1a0a0a",
                    color: C.red,
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 2,
                  }}
                >
                  FROM: {s.from}
                </span>
                <span
                  style={{
                    background: "#0a1a0a",
                    color: C.sg,
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 2,
                  }}
                >
                  TO: {s.to}
                </span>
              </div>
              <p
                style={{
                  color: "#8aaa8a",
                  fontSize: 12,
                  lineHeight: 1.7,
                  margin: "0 0 10px",
                }}
              >
                {s.detail}
              </p>
              <div
                style={{
                  background: "#060c08",
                  border: `1px solid ${C.border}`,
                  padding: "8px 12px",
                  borderRadius: 2,
                }}
              >
                <Label color={C.blue}>ACTION</Label>
                <code
                  style={{
                    color: C.blue,
                    fontSize: 11,
                    lineHeight: 1.6,
                    display: "block",
                  }}
                >
                  {s.action}
                </code>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  COMMAND SCRIPTS
// ─────────────────────────────────────────────
function ScriptsTab() {
  const [copied, setCopied] = useState(null);

  const copy = (id, text) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const scripts = [
    {
      id: "ubuntu-scaffold",
      title: "Ubuntu Pools — Module Scaffold",
      color: C.ubuntu,
      tag: "BASH · PROJECT SETUP",
      code: `#!/bin/bash
# ─────────────────────────────────────────────────────────
#  UBUNTU POOLS — GAMIFICATION MODULE SCAFFOLD
#  Run from root of Safegrid-Brain-API repo
# ─────────────────────────────────────────────────────────

echo "🌍 Scaffolding Ubuntu Pools module..."

# Directory structure
mkdir -p src/modules/ubuntu-pools/{routes,services,models,gamification}
mkdir -p src/modules/ubuntu-pools/gamification/{engine,badges,leaderboard}

# Core files
touch src/modules/ubuntu-pools/index.js
touch src/modules/ubuntu-pools/routes/pools.routes.js
touch src/modules/ubuntu-pools/routes/gamification.routes.js
touch src/modules/ubuntu-pools/services/pool.service.js
touch src/modules/ubuntu-pools/services/stokvel.service.js
touch src/modules/ubuntu-pools/services/notification.service.js
touch src/modules/ubuntu-pools/gamification/engine/points.engine.js
touch src/modules/ubuntu-pools/gamification/engine/streak.engine.js
touch src/modules/ubuntu-pools/gamification/badges/badge.definitions.js
touch src/modules/ubuntu-pools/gamification/leaderboard/leaderboard.service.js
touch src/modules/ubuntu-pools/models/pool.schema.js
touch src/modules/ubuntu-pools/models/member.schema.js
touch src/modules/ubuntu-pools/models/contribution.schema.js
touch src/modules/ubuntu-pools/models/gamification.schema.js

echo "✓ Ubuntu Pools directory structure created"`,
    },
    {
      id: "ubuntu-migration",
      title: "Ubuntu Pools — Database Migration",
      color: C.ubuntu,
      tag: "SQL · POSTGRESQL",
      code: `-- ─────────────────────────────────────────────────────────
-- V007__ubuntu_pools_schema.sql
-- Ubuntu Pools: savings pools, stokvel governance, gamification
-- ─────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS ubuntu_pools;

-- Savings Pools
CREATE TABLE ubuntu_pools.savings_pools (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_name       TEXT NOT NULL,
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  pool_type       TEXT CHECK (pool_type IN ('stokvel','family','circle','open')),
  target_amount   NUMERIC(12,2),
  contribution_zar NUMERIC(10,2) NOT NULL,
  cycle           TEXT CHECK (cycle IN ('weekly','monthly','quarterly')),
  payout_rotation JSONB DEFAULT '[]',
  status          TEXT DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Members
CREATE TABLE ubuntu_pools.pool_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id     UUID REFERENCES ubuntu_pools.savings_pools(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL,
  joined_at   TIMESTAMPTZ DEFAULT now(),
  role        TEXT DEFAULT 'member' CHECK (role IN ('admin','member')),
  status      TEXT DEFAULT 'active'
);

-- Contributions
CREATE TABLE ubuntu_pools.contributions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id         UUID REFERENCES ubuntu_pools.savings_pools(id),
  member_id       UUID REFERENCES ubuntu_pools.pool_members(id),
  amount_zar      NUMERIC(10,2) NOT NULL,
  contributed_at  TIMESTAMPTZ DEFAULT now(),
  is_on_time      BOOLEAN DEFAULT true,
  method          TEXT DEFAULT 'manual'
);

-- Gamification
CREATE TABLE ubuntu_pools.gamification_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE NOT NULL,
  total_points    INTEGER DEFAULT 0,
  current_streak  INTEGER DEFAULT 0,
  longest_streak  INTEGER DEFAULT 0,
  level           TEXT DEFAULT 'seed',
  badges          JSONB DEFAULT '[]',
  last_activity   TIMESTAMPTZ DEFAULT now()
);

-- Points Ledger
CREATE TABLE ubuntu_pools.points_ledger (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  event_type  TEXT NOT NULL,
  points      INTEGER NOT NULL,
  reason      TEXT,
  awarded_at  TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_pools_status ON ubuntu_pools.savings_pools(status);
CREATE INDEX idx_contributions_pool ON ubuntu_pools.contributions(pool_id);
CREATE INDEX idx_gamification_user ON ubuntu_pools.gamification_profiles(user_id);
CREATE INDEX idx_points_user ON ubuntu_pools.points_ledger(user_id);

-- Row Level Security
ALTER TABLE ubuntu_pools.savings_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE ubuntu_pools.pool_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ubuntu_pools.contributions ENABLE ROW LEVEL SECURITY;`,
    },
    {
      id: "ubuntu-gamification",
      title: "Ubuntu Pools — Points & Streak Engine",
      color: C.ubuntu,
      tag: "NODE.JS · GAMIFICATION ENGINE",
      code: `// ─────────────────────────────────────────────────────────
//  src/modules/ubuntu-pools/gamification/engine/points.engine.js
//  Ubuntu Pools Gamification — Points, Streaks, Levels
// ─────────────────────────────────────────────────────────

const POINT_EVENTS = {
  ON_TIME_CONTRIBUTION:  50,
  STREAK_7_DAYS:        100,
  STREAK_30_DAYS:       300,
  STREAK_90_DAYS:       750,
  POOL_CREATION:        200,
  MEMBER_REFERRAL:      150,
  MILESTONE_500:        500,
  MILESTONE_1000:      1000,
  FIRST_CONTRIBUTION:   100,
};

const LEVELS = [
  { name: "seed",     min: 0,     color: "#8bc34a" },
  { name: "sprout",   min: 500,   color: "#4caf50" },
  { name: "grove",    min: 1500,  color: "#00897b" },
  { name: "forest",   min: 4000,  color: "#00796b" },
  { name: "ubuntu",   min: 10000, color: "#ffab40" },
];

const BADGES = {
  FIRST_SAVE:    { id: "first_save",   label: "First Step",      icon: "🌱" },
  STREAK_30:     { id: "streak_30",    label: "Iron Saver",      icon: "🔥" },
  STREAK_90:     { id: "streak_90",    label: "Ubuntu Guardian", icon: "🛡️" },
  POOL_STARTER:  { id: "pool_starter", label: "Pool Starter",    icon: "💧" },
  CONNECTOR:     { id: "connector",    label: "Connector",       icon: "🤝" },
  WEALTH_SEED:   { id: "wealth_seed",  label: "Wealth Seed",     icon: "💰" },
};

class PointsEngine {
  constructor(db, redis) {
    this.db = db;
    this.redis = redis;
  }

  async awardPoints(userId, eventType, meta = {}) {
    const points = POINT_EVENTS[eventType];
    if (!points) throw new Error(\`Unknown event: \${eventType}\`);

    // Write to ledger
    await this.db.query(\`
      INSERT INTO ubuntu_pools.points_ledger
        (user_id, event_type, points, reason)
      VALUES ($1, $2, $3, $4)
    \`, [userId, eventType, points, meta.reason || eventType]);

    // Update profile
    const result = await this.db.query(\`
      UPDATE ubuntu_pools.gamification_profiles
      SET total_points = total_points + $2,
          last_activity = now()
      WHERE user_id = $1
      RETURNING total_points
    \`, [userId, points]);

    const total = result.rows[0]?.total_points || 0;
    const newLevel = this.computeLevel(total);

    // Update level
    await this.db.query(\`
      UPDATE ubuntu_pools.gamification_profiles
      SET level = $2 WHERE user_id = $1
    \`, [userId, newLevel]);

    // Bust cache
    await this.redis.del(\`ubuntu:profile:\${userId}\`);

    return { points, total, level: newLevel };
  }

  async recordContribution(userId, poolId, isOnTime) {
    if (isOnTime) {
      const result = await this.awardPoints(userId, "ON_TIME_CONTRIBUTION");

      // Update streak
      const streakResult = await this.db.query(\`
        UPDATE ubuntu_pools.gamification_profiles
        SET current_streak = current_streak + 1,
            longest_streak = GREATEST(longest_streak, current_streak + 1)
        WHERE user_id = $1
        RETURNING current_streak
      \`, [userId]);

      const streak = streakResult.rows[0]?.current_streak;
      if (streak === 7)  await this.awardPoints(userId, "STREAK_7_DAYS");
      if (streak === 30) {
        await this.awardPoints(userId, "STREAK_30_DAYS");
        await this.awardBadge(userId, "STREAK_30");
      }
      if (streak === 90) {
        await this.awardPoints(userId, "STREAK_90_DAYS");
        await this.awardBadge(userId, "STREAK_90");
      }
      return result;
    } else {
      // Break streak
      await this.db.query(\`
        UPDATE ubuntu_pools.gamification_profiles
        SET current_streak = 0 WHERE user_id = $1
      \`, [userId]);
    }
  }

  async awardBadge(userId, badgeId) {
    const badge = BADGES[badgeId];
    if (!badge) return;
    await this.db.query(\`
      UPDATE ubuntu_pools.gamification_profiles
      SET badges = badges || $2::jsonb
      WHERE user_id = $1
        AND NOT (badges @> $2::jsonb)
    \`, [userId, JSON.stringify([badge])]);
  }

  computeLevel(totalPoints) {
    return [...LEVELS].reverse().find(l => totalPoints >= l.min)?.name || "seed";
  }

  async getLeaderboard(poolId, limit = 10) {
    const cacheKey = \`ubuntu:leaderboard:\${poolId}\`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const rows = await this.db.query(\`
      SELECT pm.user_id, gp.total_points, gp.level, gp.current_streak,
             gp.badges, RANK() OVER (ORDER BY gp.total_points DESC) as rank
      FROM ubuntu_pools.pool_members pm
      JOIN ubuntu_pools.gamification_profiles gp ON gp.user_id = pm.user_id
      WHERE pm.pool_id = $1
      ORDER BY gp.total_points DESC LIMIT $2
    \`, [poolId, limit]);

    await this.redis.set(cacheKey, JSON.stringify(rows.rows), "EX", 60);
    return rows.rows;
  }
}

module.exports = { PointsEngine, POINT_EVENTS, BADGES, LEVELS };`,
    },
    {
      id: "safestake-scaffold",
      title: "SafeStake — Module Scaffold",
      color: C.stake,
      tag: "BASH · PROJECT SETUP",
      code: `#!/bin/bash
# ─────────────────────────────────────────────────────────
#  SAFESTAKE — MODULE SCAFFOLD
#  Run from root of Safegrid-Brain-API repo
# ─────────────────────────────────────────────────────────

echo "🎯 Scaffolding SafeStake module..."

mkdir -p src/modules/safestake/{routes,services,engines,adapters,models}

# Core files
touch src/modules/safestake/index.js
touch src/modules/safestake/routes/sessions.routes.js
touch src/modules/safestake/routes/wellness.routes.js
touch src/modules/safestake/routes/operator.routes.js

# Engines
touch src/modules/safestake/engines/loss_velocity.engine.js
touch src/modules/safestake/engines/redirect_executor.engine.js
touch src/modules/safestake/engines/probability_transparency.engine.js
touch src/modules/safestake/engines/wellness_signal.engine.js

# Operator Adapter
touch src/modules/safestake/adapters/operator_integration.adapter.js
touch src/modules/safestake/adapters/ubuntu_pool_bridge.adapter.js

# Services
touch src/modules/safestake/services/threshold.service.js
touch src/modules/safestake/services/notification.service.js
touch src/modules/safestake/services/reporting.service.js

# Models
touch src/modules/safestake/models/wager_session.schema.js
touch src/modules/safestake/models/loss_velocity.schema.js
touch src/modules/safestake/models/redirect_transaction.schema.js
touch src/modules/safestake/models/wellness_signal.schema.js

echo "✓ SafeStake directory structure created"`,
    },
    {
      id: "safestake-migration",
      title: "SafeStake — Database Migration",
      color: C.stake,
      tag: "SQL · POSTGRESQL",
      code: `-- ─────────────────────────────────────────────────────────
-- V008__safestake_schema.sql
-- SafeStake: wagering intelligence, harm-reduction data layer
-- ─────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS safestake;

-- User Profiles & Thresholds
CREATE TABLE safestake.user_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID UNIQUE NOT NULL,
  daily_loss_limit    NUMERIC(10,2) DEFAULT 200.00,
  weekly_loss_limit   NUMERIC(10,2) DEFAULT 800.00,
  cooldown_minutes    INTEGER DEFAULT 60,
  redirect_pool_id    UUID,  -- FK to ubuntu_pools.savings_pools
  consent_version     TEXT DEFAULT '1.0',
  enrolled_at         TIMESTAMPTZ DEFAULT now(),
  status              TEXT DEFAULT 'active'
);

-- Wager Sessions (from operator feed)
CREATE TABLE safestake.wager_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  operator_id     TEXT NOT NULL,
  session_start   TIMESTAMPTZ DEFAULT now(),
  session_end     TIMESTAMPTZ,
  total_wagered   NUMERIC(10,2) DEFAULT 0,
  total_won       NUMERIC(10,2) DEFAULT 0,
  net_loss        NUMERIC(10,2) GENERATED ALWAYS AS (total_wagered - total_won) STORED,
  bet_count       INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'active'
    CHECK (status IN ('active','completed','cooled_down','redirected'))
);

-- Loss Velocity Log
CREATE TABLE safestake.loss_velocity_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  session_id      UUID REFERENCES safestake.wager_sessions(id),
  velocity_zar_hr NUMERIC(10,2),
  threshold_pct   NUMERIC(5,2),
  triggered_at    TIMESTAMPTZ DEFAULT now(),
  action_taken    TEXT CHECK (action_taken IN (
    'warning_sent','cooldown_activated','redirect_triggered','none'
  ))
);

-- Redirect Transactions (money routed to Ubuntu Pool)
CREATE TABLE safestake.redirect_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  session_id      UUID REFERENCES safestake.wager_sessions(id),
  amount_zar      NUMERIC(10,2) NOT NULL,
  destination_pool UUID,
  redirected_at   TIMESTAMPTZ DEFAULT now(),
  status          TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','completed','failed'))
);

-- Wellness Signals (sent to community circles)
CREATE TABLE safestake.wellness_signals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  signal      TEXT CHECK (signal IN ('green','amber','red')),
  week_start  DATE NOT NULL,
  delivered   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Operator Integrations
CREATE TABLE safestake.operator_integrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_name   TEXT NOT NULL,
  operator_code   TEXT UNIQUE NOT NULL,
  oauth2_endpoint TEXT,
  webhook_secret  TEXT,
  active          BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_wager_user ON safestake.wager_sessions(user_id);
CREATE INDEX idx_wager_status ON safestake.wager_sessions(status);
CREATE INDEX idx_velocity_user ON safestake.loss_velocity_log(user_id);
CREATE INDEX idx_velocity_triggered ON safestake.loss_velocity_log(triggered_at);
CREATE INDEX idx_redirect_user ON safestake.redirect_transactions(user_id);
CREATE INDEX idx_wellness_user ON safestake.wellness_signals(user_id, week_start);

-- RLS
ALTER TABLE safestake.user_profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE safestake.wager_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE safestake.loss_velocity_log      ENABLE ROW LEVEL SECURITY;
ALTER TABLE safestake.redirect_transactions  ENABLE ROW LEVEL SECURITY;`,
    },
    {
      id: "safestake-engine",
      title: "SafeStake — Loss Velocity Engine",
      color: C.stake,
      tag: "NODE.JS · CORE INTELLIGENCE",
      code: `// ─────────────────────────────────────────────────────────
//  src/modules/safestake/engines/loss_velocity.engine.js
//  SafeStake — Real-time loss velocity monitoring
//  Fires cooldowns + redirect triggers in real time
// ─────────────────────────────────────────────────────────

const { RedirectExecutor } = require("./redirect_executor.engine");
const { WellnessSignalEngine } = require("./wellness_signal.engine");

class LossVelocityEngine {
  constructor(db, redis, notificationService) {
    this.db = db;
    this.redis = redis;
    this.notify = notificationService;
    this.redirect = new RedirectExecutor(db, redis);
    this.wellness = new WellnessSignalEngine(db, redis);
  }

  // Called on every bet event received from operator webhook
  async processBetEvent(userId, sessionId, betAmount, winAmount) {
    const profile = await this.getUserProfile(userId);
    if (!profile || profile.status !== "active") return;

    // Update session totals
    await this.db.query(\`
      UPDATE safestake.wager_sessions
      SET total_wagered = total_wagered + $1,
          total_won     = total_won + $2,
          bet_count     = bet_count + 1
      WHERE id = $3
    \`, [betAmount, winAmount, sessionId]);

    const session = await this.getSession(sessionId);
    const velocityPct = (session.net_loss / profile.daily_loss_limit) * 100;

    // Log velocity
    await this.db.query(\`
      INSERT INTO safestake.loss_velocity_log
        (user_id, session_id, velocity_zar_hr, threshold_pct, action_taken)
      VALUES ($1, $2, $3, $4, $5)
    \`, [userId, sessionId, session.net_loss, velocityPct, "none"]);

    // Threshold checks
    if (velocityPct >= 75 && velocityPct < 100) {
      await this.issueWarning(userId, sessionId, velocityPct, profile);
    }

    if (velocityPct >= 100) {
      await this.triggerCooldown(userId, sessionId, session, profile);
    }
  }

  async issueWarning(userId, sessionId, pct, profile) {
    const cacheKey = \`ss:warn:\${userId}:\${sessionId}\`;
    const alreadyWarned = await this.redis.get(cacheKey);
    if (alreadyWarned) return;

    await this.notify.send(userId, {
      type:    "SAFESTAKE_WARNING",
      message: \`You've reached \${Math.round(pct)}% of your daily limit. \`
               + \`R\${profile.daily_loss_limit - (pct/100 * profile.daily_loss_limit)} remaining.\`,
      channel: ["in_app","push"],
    });

    await this.redis.set(cacheKey, "1", "EX", 3600);
    await this.logAction(userId, sessionId, "warning_sent");
  }

  async triggerCooldown(userId, sessionId, session, profile) {
    // Lock betting access in Redis
    const cooldownKey = \`ss:cooldown:\${userId}\`;
    await this.redis.set(
      cooldownKey, "1",
      "EX", profile.cooldown_minutes * 60
    );

    // Mark session
    await this.db.query(\`
      UPDATE safestake.wager_sessions
      SET status = 'cooled_down', session_end = now()
      WHERE id = $1
    \`, [sessionId]);

    // Calculate redirect amount (what the next bet WOULD have been)
    const redirectAmount = Math.max(0, session.net_loss - profile.daily_loss_limit);

    if (redirectAmount > 0 && profile.redirect_pool_id) {
      await this.redirect.execute({
        userId,
        sessionId,
        amountZar: redirectAmount,
        destinationPoolId: profile.redirect_pool_id,
      });
    }

    // Update wellness signal
    await this.wellness.updateSignal(userId, "red");

    await this.notify.send(userId, {
      type:    "SAFESTAKE_COOLDOWN",
      message: \`Your SafeStake cooling period has started (\${profile.cooldown_minutes} min). \`
               + \`R\${redirectAmount.toFixed(2)} has been redirected to your Ubuntu Pool.\`,
      channel: ["in_app","push","sms"],
    });

    await this.logAction(userId, sessionId, "cooldown_activated");
  }

  async isInCooldown(userId) {
    return !!(await this.redis.get(\`ss:cooldown:\${userId}\`));
  }

  async getUserProfile(userId) {
    const cached = await this.redis.get(\`ss:profile:\${userId}\`);
    if (cached) return JSON.parse(cached);
    const result = await this.db.query(\`
      SELECT * FROM safestake.user_profiles WHERE user_id = $1
    \`, [userId]);
    if (result.rows[0]) {
      await this.redis.set(
        \`ss:profile:\${userId}\`,
        JSON.stringify(result.rows[0]),
        "EX", 300
      );
    }
    return result.rows[0] || null;
  }

  async getSession(sessionId) {
    const result = await this.db.query(\`
      SELECT * FROM safestake.wager_sessions WHERE id = $1
    \`, [sessionId]);
    return result.rows[0];
  }

  async logAction(userId, sessionId, action) {
    await this.db.query(\`
      UPDATE safestake.loss_velocity_log
      SET action_taken = $3
      WHERE user_id = $1 AND session_id = $2
      ORDER BY triggered_at DESC LIMIT 1
    \`, [userId, sessionId, action]);
  }
}

module.exports = { LossVelocityEngine };`,
    },
    {
      id: "bridge",
      title: "SafeStake → Ubuntu Pools Bridge",
      color: C.sg,
      tag: "NODE.JS · INTEGRATION BRIDGE",
      code: `// ─────────────────────────────────────────────────────────
//  src/modules/safestake/adapters/ubuntu_pool_bridge.adapter.js
//  THE ARCHITECTURAL MISSION:
//  Redirected gambling loss → Community savings wealth
// ─────────────────────────────────────────────────────────

class UbuntuPoolBridgeAdapter {
  constructor(db, redis, notificationService) {
    this.db = db;
    this.redis = redis;
    this.notify = notificationService;
  }

  // Called by RedirectExecutor when cooldown triggers
  async creditRedirectToPool(userId, poolId, amountZar, sessionId) {
    const client = await this.db.pool.connect();

    try {
      await client.query("BEGIN");

      // 1. Verify pool exists and user is a member
      const membership = await client.query(\`
        SELECT pm.id, sp.pool_name
        FROM ubuntu_pools.pool_members pm
        JOIN ubuntu_pools.savings_pools sp ON sp.id = pm.pool_id
        WHERE pm.user_id = $1 AND pm.pool_id = $2 AND pm.status = 'active'
      \`, [userId, poolId]);

      if (!membership.rows[0]) {
        throw new Error("User is not an active member of this Ubuntu Pool");
      }

      // 2. Record contribution in Ubuntu Pools
      const contribution = await client.query(\`
        INSERT INTO ubuntu_pools.contributions
          (pool_id, member_id, amount_zar, is_on_time, method)
        VALUES ($1, $2, $3, true, 'safestake_redirect')
        RETURNING id
      \`, [poolId, membership.rows[0].id, amountZar]);

      // 3. Record redirect transaction in SafeStake
      await client.query(\`
        UPDATE safestake.redirect_transactions
        SET status = 'completed'
        WHERE session_id = $1 AND user_id = $2 AND status = 'pending'
      \`, [sessionId, userId]);

      await client.query("COMMIT");

      // 4. Award gamification points in Ubuntu Pools for redirected contribution
      // (redirect counts as an on-time contribution — reinforces positive behaviour)
      await this.awardRedirectPoints(userId, amountZar);

      // 5. Notify user
      await this.notify.send(userId, {
        type: "UBUNTU_POOL_CREDITED",
        message: \`R\${amountZar.toFixed(2)} from SafeStake has been added to \`
                 + \`your Ubuntu Pool: \${membership.rows[0].pool_name}. \`
                 + \`Your savings are growing.\`,
        channel: ["in_app", "push"],
      });

      return {
        success: true,
        contributionId: contribution.rows[0].id,
        poolName: membership.rows[0].pool_name,
        amountZar,
      };

    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async awardRedirectPoints(userId, amountZar) {
    // Tiered points for redirect amount
    let points = 25; // base
    if (amountZar >= 50)  points = 60;
    if (amountZar >= 100) points = 120;
    if (amountZar >= 200) points = 200;

    await this.db.query(\`
      INSERT INTO ubuntu_pools.points_ledger
        (user_id, event_type, points, reason)
      VALUES ($1, 'SAFESTAKE_REDIRECT', $2, 'Gambling redirect to savings')
    \`, [userId, points]);

    await this.db.query(\`
      UPDATE ubuntu_pools.gamification_profiles
      SET total_points = total_points + $2
      WHERE user_id = $1
    \`, [userId, points]);

    await this.redis.del(\`ubuntu:profile:\${userId}\`);
  }

  // Get redirect stats for a user (used in wellness dashboard)
  async getRedirectSummary(userId) {
    const result = await this.db.query(\`
      SELECT
        COUNT(*) as total_redirects,
        SUM(amount_zar) as total_redirected_zar,
        MIN(redirected_at) as first_redirect,
        MAX(redirected_at) as latest_redirect
      FROM safestake.redirect_transactions
      WHERE user_id = $1 AND status = 'completed'
    \`, [userId]);

    return result.rows[0];
  }
}

module.exports = { UbuntuPoolBridgeAdapter };`,
    },
  ];

  return (
    <div>
      <SectionHeader
        title="Command Scripts"
        sub="Ubuntu Pools Gamification + SafeStake implementation — simultaneous build commands"
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            background: C.ubuntu + "18",
            border: `1px solid ${C.ubuntu}44`,
            padding: "12px 16px",
            borderRadius: 3,
          }}
        >
          <Label color={C.ubuntu}>UBUNTU POOLS SCRIPTS</Label>
          <p
            style={{
              color: "#8a7a5a",
              fontSize: 11,
              margin: "6px 0 0",
              lineHeight: 1.6,
            }}
          >
            Module scaffold · PostgreSQL schema · Points engine · Streak engine
            · Leaderboard
          </p>
        </div>
        <div
          style={{
            background: C.stake + "18",
            border: `1px solid ${C.stake}44`,
            padding: "12px 16px",
            borderRadius: 3,
          }}
        >
          <Label color={C.stake}>SAFESTAKE SCRIPTS</Label>
          <p
            style={{
              color: "#7a6a8a",
              fontSize: 11,
              margin: "6px 0 0",
              lineHeight: 1.6,
            }}
          >
            Module scaffold · PostgreSQL schema · Loss Velocity Engine · Ubuntu
            Pool Bridge
          </p>
        </div>
      </div>

      {scripts.map((s) => (
        <div key={s.id} style={{ marginBottom: 20 }}>
          <div
            style={{
              background: s.color + "14",
              border: `1px solid ${s.color}44`,
              borderLeft: `3px solid ${s.color}`,
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderRadius: "3px 3px 0 0",
            }}
          >
            <div>
              <div
                style={{
                  color: s.color,
                  fontSize: 12,
                  fontWeight: "bold",
                  letterSpacing: 1,
                }}
              >
                {s.title}
              </div>
              <div
                style={{
                  color: "#4a6a4a",
                  fontSize: 10,
                  marginTop: 3,
                  letterSpacing: 2,
                }}
              >
                {s.tag}
              </div>
            </div>
            <button
              onClick={() => copy(s.id, s.code)}
              style={{
                background: copied === s.id ? s.color + "33" : "transparent",
                border: `1px solid ${s.color}66`,
                color: s.color,
                fontSize: 10,
                padding: "5px 12px",
                cursor: "pointer",
                borderRadius: 2,
                letterSpacing: 1,
              }}
            >
              {copied === s.id ? "✓ COPIED" : "COPY"}
            </button>
          </div>
          <pre
            style={{
              background: "#060a08",
              border: `1px solid ${C.border}`,
              borderTop: "none",
              borderRadius: "0 0 3px 3px",
              padding: "16px 18px",
              margin: 0,
              overflowX: "auto",
              fontSize: 10.5,
              lineHeight: 1.7,
              color: "#8acc8a",
              maxHeight: 280,
            }}
          >
            {s.code}
          </pre>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
//  JUSTIFICATION
// ─────────────────────────────────────────────
function JustificationTab() {
  const points = [
    {
      n: "01",
      color: C.sg,
      title: "SafeGrid Is The Right Home For SafeStake",
      body: "SafeStake requires a robust API infrastructure, real-time data processing, financial transaction architecture, and regulatory credibility. All of this already exists in SafeGrid Brain API. Ubuntu Pools is a community savings product — it does not have the engineering infrastructure or the regulatory positioning to safely house a financial harm-reduction overlay for gambling operators. The transfer is not a demotion of Ubuntu Pools — it is each product doing exactly what it was built to do.",
    },
    {
      n: "02",
      color: C.ubuntu,
      title: "Ubuntu Pools Is Stronger Without Gambling Features",
      body: "Mixing gambling redirect logic into a community savings platform creates regulatory ambiguity, user trust confusion, and architectural complexity that Ubuntu Pools does not need. Ubuntu Pools' value proposition — making saving feel like a game, making wealth-building communal — is clean, compelling, and culturally resonant on its own. Gambling features were a distraction from that mission. Removing them sharpens the product.",
    },
    {
      n: "03",
      color: C.stake,
      title: "The Bridge Is The Genius — Not The Separation",
      body: "The architectural decision that makes this powerful is not that SafeStake and Ubuntu Pools are separate. It is that they are connected by a single bridge: redirected gambling funds flow directly into Ubuntu Pools. This means SafeStake catches the money leaving through gambling losses, and Ubuntu Pools holds it and makes it grow. The two products together create a closed loop that neither could create alone. That closed loop is the mission.",
    },
    {
      n: "04",
      color: C.blue,
      title: "The African Gambling Crisis Justifies This Urgency",
      body: "South Africa is consistently ranked among the world's highest gambling-per-capita markets. Across the continent, mobile betting penetration is accelerating among exactly the demographic that can least afford to lose. No existing platform is architected to fight this from the inside — most are architected to extract from it. SafeStake's positioning as a wellness overlay on licensed operators means it works with the regulatory system, not against it, while genuinely reducing harm at scale.",
    },
    {
      n: "05",
      color: C.sg,
      title: "This Strategy Opens Three New Revenue Streams Simultaneously",
      body: "SafeStake as a B2B wellness overlay charges licensed operators a SaaS fee. Ubuntu Pools as a savings platform earns from investment product partnerships when pots cross threshold. The bridge between them creates a data asset — aggregate financial behaviour intelligence — that has value for insurers, NGOs, government financial inclusion programmes, and impact investors. None of these streams require consumer advertising spend. All three grow through trust.",
    },
    {
      n: "06",
      color: C.ubuntu,
      title: "The Phase Sequence Is Correct And Cannot Be Reversed",
      body: "SafeGrid Brain API must be fully operational before SafeStake can call it. Ubuntu Pools must have its gamification layer complete before it can serve as a meaningful redirect destination — a savings pot that is engaging and rewarding is a fundamentally different destination than a blank ledger. SafeStake's FSCA compliance work must be completed before any live operator integration goes live. These are not arbitrary gates — they are structural dependencies. Rushing any one of them breaks the others.",
    },
    {
      n: "07",
      color: C.stake,
      title: "Ubuntu As Architecture, Not Just Brand",
      body: "The deepest justification for this entire structure is that Ubuntu — 'I am because we are' — is not a brand positioning. It is the actual technical design. When one person's gambling loss becomes a community savings contribution, when one neighbourhood's security data makes an adjacent street safer, when one person's wellness signal activates their community circle — the technology is expressing the philosophy. That coherence between value and architecture is what makes this platform fundable, scalable, and genuinely meaningful.",
    },
  ];

  return (
    <div>
      <SectionHeader
        title="Strategy Justification"
        sub="Why this structure, this transfer, and this sequence are the correct choices — not just strategic preferences"
      />
      <div style={{ display: "grid", gap: 16 }}>
        {points.map((p, i) => (
          <div
            key={i}
            style={{
              background: C.panel,
              border: `1px solid ${p.color}33`,
              borderLeft: `3px solid ${p.color}`,
              padding: "20px 24px",
              borderRadius: 3,
            }}
          >
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <span
                style={{
                  color: p.color,
                  fontSize: 22,
                  fontWeight: "bold",
                  opacity: 0.3,
                  flexShrink: 0,
                  lineHeight: 1,
                }}
              >
                {p.n}
              </span>
              <div>
                <div
                  style={{
                    color: p.color,
                    fontSize: 13,
                    fontWeight: "bold",
                    marginBottom: 10,
                    letterSpacing: 1,
                  }}
                >
                  {p.title}
                </div>
                <p
                  style={{
                    color: "#8aaa8a",
                    fontSize: 12.5,
                    lineHeight: 1.85,
                    margin: 0,
                  }}
                >
                  {p.body}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 28,
          background: "#080810",
          border: `1px solid ${C.stake}44`,
          borderLeft: `3px solid ${C.stake}`,
          padding: "20px 24px",
          borderRadius: 3,
        }}
      >
        <Label color={C.stake}>FINAL STRATEGIC STATEMENT</Label>
        <p
          style={{
            color: "#c4b5fd",
            fontSize: 13,
            lineHeight: 1.9,
            margin: "10px 0 0",
          }}
        >
          SafeGrid SA is a security intelligence company. Ubuntu Pools is a
          community wealth engine. SafeStake is a financial harm-reduction
          instrument. They are three distinct products with three distinct
          regulatory profiles, three distinct user relationships — and one
          shared architectural spine. The gambling roadmap belongs in SafeStake
          not because Ubuntu Pools failed, but because precision in product
          identity is what allows each product to become genuinely great. A
          platform that does everything is a platform that owns nothing. These
          three products each own something real, and the bridges between them
          are where the exponential value lives.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  SHARED COMPONENTS
// ─────────────────────────────────────────────
function SectionHeader({ title, sub }) {
  return (
    <div
      style={{
        marginBottom: 28,
        paddingBottom: 18,
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <h2
        style={{
          margin: "0 0 8px",
          color: C.sg,
          fontSize: 17,
          fontWeight: "normal",
          letterSpacing: 2,
        }}
      >
        {title}
      </h2>
      <p style={{ margin: 0, color: C.dim, fontSize: 11, lineHeight: 1.6 }}>
        {sub}
      </p>
    </div>
  );
}

function Label({ children, color = C.dim }) {
  return (
    <p
      style={{
        margin: "0 0 5px",
        color,
        fontSize: 9,
        letterSpacing: 3,
        fontWeight: "bold",
      }}
    >
      {children}
    </p>
  );
}

// ─────────────────────────────────────────────
//  ROOT
// ─────────────────────────────────────────────
export default function aApp() {
  const [tab, setTab] = useState("diagram");

  const TAB_COMPONENTS = {
    diagram: <DiagramTab />,
    models: <ModelsTab />,
    transfer: <TransferTab />,
    scripts: <ScriptsTab />,
    justification: <JustificationTab />,
  };

  return (
    <div
      style={{
        background: C.bg,
        minHeight: "100vh",
        fontFamily: "'Courier New', monospace",
        color: C.text,
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: `1px solid ${C.border}`,
          padding: "22px 28px 16px",
          background: "linear-gradient(135deg, #06080a 0%, #08100c 100%)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 4,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: C.sg,
              boxShadow: `0 0 10px ${C.sg}`,
              animation: "blink 2s infinite",
            }}
          />
          <span style={{ color: C.sg, fontSize: 10, letterSpacing: 4 }}>
            SAFEGRID SA // OPS INTELLIGENCE
          </span>
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: "normal",
            color: "#fff",
            letterSpacing: 1,
          }}
        >
          SafeGrid SA × Ubuntu Pools × SafeStake
        </h1>
        <p
          style={{
            margin: "4px 0 0",
            color: C.dim,
            fontSize: 10,
            letterSpacing: 2,
          }}
        >
          STRUCTURE · TRANSFER · IMPLEMENTATION · JUSTIFICATION
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: `1px solid ${C.border}`,
          overflowX: "auto",
          background: "#070b09",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: tab === t.id ? "#0d1a10" : "transparent",
              border: "none",
              borderBottom:
                tab === t.id ? `2px solid ${C.sg}` : "2px solid transparent",
              color: tab === t.id ? C.sg : C.dim,
              padding: "12px 18px",
              cursor: "pointer",
              fontSize: 10,
              letterSpacing: 2,
              whiteSpace: "nowrap",
              transition: "all 0.2s",
            }}
          >
            {t.icon} {t.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "28px 28px", maxWidth: 1000, margin: "0 auto" }}>
        {TAB_COMPONENTS[tab]}
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        pre::-webkit-scrollbar { height: 4px; }
        pre::-webkit-scrollbar-track { background: #0a0f0c; }
        pre::-webkit-scrollbar-thumb { background: #1a3a1a; border-radius: 2px; }
      `}</style>
    </div>
  );
}
