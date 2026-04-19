"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

const LindiweEngine = {
  signals: [] as any[],
  ingest(signal: any) {
    this.signals.push({ ...signal, ts: Date.now() });
    if (this.signals.length > 200) this.signals.shift();
    return this.analyze(signal);
  },
  analyze(signal: any) {
    const impulse = this._calcImpulse(signal);
    const altruism = signal.altruistic
      ? Math.random() * 0.3 + 0.3
      : Math.random() * 0.15;
    const riskProfile = this._riskProfile(signal);
    const coaching = this._coaching(impulse, altruism, riskProfile, signal);
    return {
      impulse,
      altruism,
      riskProfile,
      coaching,
      xp: this._xp(signal, altruism),
    };
  },
  _calcImpulse(s: any) {
    let i = 0.4;
    if (s.decisionMs < 1800) i += 0.3;
    if (s.decisionMs < 800) i += 0.2;
    if (s.risk === "extreme") i += 0.15;
    if (s.risk === "low") i -= 0.1;
    return Math.min(1, Math.max(0, i));
  },
  _riskProfile(s: any) {
    if (s.risk === "extreme" && s.altruistic === false) return "SPECULATOR";
    if (s.altruistic) return "COMMUNITARIAN";
    if (s.risk === "low") return "CONSERVATIVE";
    return "BALANCED";
  },
  _coaching(impulse: number, altruism: number, profile: string, s: any) {
    if (impulse > 0.8)
      return "⚠ High impulse detected. Ubuntu philosophy: pause before you play.";
    if (altruism > 0.5)
      return "✦ Strong altruism signal. Your pool multiplier is active.";
    if (profile === "SPECULATOR")
      return "📊 Speculation pattern. SafeStake redirect available.";
    if (s.score > 5000)
      return "🏆 Strong session. Consider routing surplus to Ubuntu Pools.";
    return "📡 Lindiwe is calibrating your financial profile…";
  },
  _xp(s: any, altruism: number) {
    return Math.floor(s.score / 100 + altruism * 80 + (s.altruistic ? 50 : 0));
  },
};

const SLOT_SYMBOLS = ["🍒", "💎", "7️⃣", "🌟", "💀", "🎯", "💰", "🃏"];
const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

const GAME_CATALOG = [
  {
    id: "slots",
    name: "LOTTERY REELS",
    icon: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18 4V3c0-.55-.45-1-1-1H5c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V6h1v4H9v11c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-9h8V4h-3z" />
        <circle cx="8" cy="8.5" r="1.5" />
        <circle cx="12" cy="8.5" r="1.5" />
        <circle cx="16" cy="8.5" r="1.5" />
      </svg>
    ),
    color: "#f59e0b",
    tagline: "High Velocity · High Stakes",
    timebox: 300,
  },
  {
    id: "dice",
    name: "ROLL-A-DICE",
    icon: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M21 7h-3c-.55 0-1 .45-1 1v9c0 .55.45 1 1 1h3c.55 0 1-.45 1-1V8c0-.55-.45-1-1-1zM4 7h3c.55 0 1 .45 1 1v9c0 .55-.45 1-1 1H4c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1z" />
        <circle cx="12" cy="10" r="1.5" />
        <circle cx="8.5" cy="14" r="1.5" />
        <circle cx="15.5" cy="14" r="1.5" />
        <circle cx="12" cy="17.5" r="1.5" />
      </svg>
    ),
    color: "#8b5cf6",
    tagline: "Strategy Under Pressure",
    timebox: 300,
  },
  {
    id: "stokvel",
    name: "STOKVEL STRATEGY",
    icon: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A2.01 2.01 0 0 0 18.06 7H15V4c0-1.11-.89-2-2-2H9c-1.11 0-2 .89-2 2v5H5.96c-.83 0-1.58.45-1.95 1.19L1.5 16H4v6c0 1.11.89 2 2 2h3c1.11 0 2-.89 2-2v-6h2v6c0 1.11.89 2 2 2h3c1.11 0 2-.89 2-2z" />
        <circle cx="9" cy="10" r="1" />
        <circle cx="15" cy="10" r="1" />
      </svg>
    ),
    color: "#10b981",
    tagline: "Financial Intelligence",
    timebox: 300,
  },
  {
    id: "snakes",
    name: "SNAKES & LADDERS",
    icon: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M21 7h-3c-.55 0-1 .45-1 1v9c0 .55.45 1 1 1h3c.55 0 1-.45 1-1V8c0-.55-.45-1-1-1zM4 7h3c.55 0 1 .45 1 1v9c0 .55-.45 1-1 1H4c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1z" />
        <path d="M6 10h12v2H6v-2zm0 4h12v2H6v-2z" />
        <circle cx="8" cy="12" r="1" />
        <circle cx="16" cy="12" r="1" />
        <circle cx="12" cy="16" r="1" />
      </svg>
    ),
    color: "#ef4444",
    tagline: "Ubuntu Board · Stakes Mode",
    timebox: 300,
  },
  {
    id: "crop",
    name: "CROP FUTURES",
    icon: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
      </svg>
    ),
    color: "#f97316",
    tagline: "Hedge · Hold · Crash",
    timebox: 300,
  },
  {
    id: "tiles2048",
    name: "2048 FUTURES",
    icon: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="3" width="6" height="6" rx="1" />
        <rect x="3" y="11" width="6" height="6" rx="1" />
        <rect x="3" y="19" width="6" height="6" rx="1" />
        <rect x="11" y="3" width="10" height="6" rx="1" />
        <rect x="11" y="11" width="6" height="6" rx="1" />
        <rect x="11" y="19" width="6" height="6" rx="1" />
        <rect x="19" y="11" width="2" height="6" rx="1" />
        <rect x="19" y="19" width="2" height="6" rx="1" />
      </svg>
    ),
    color: "#06b6d4",
    tagline: "Hold & Win · Merge Markets",
    timebox: 300,
  },
  {
    id: "coinflip",
    name: "CSGO COINFLIP",
    icon: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2-4 2v6" />
      </svg>
    ),
    color: "#ec4899",
    tagline: "Probability Transparency Layer",
    timebox: 300,
  },
];

const INIT_LEADERBOARD = [
  {
    name: "Sovereign_Alpha",
    xp: 12400,
    altruism: 0.82,
    profile: "COMMUNITARIAN",
    streak: 7,
  },
  {
    name: "Ubuntu_Queen",
    xp: 9800,
    altruism: 0.91,
    profile: "COMMUNITARIAN",
    streak: 12,
  },
  {
    name: "Lindiwe_Watcher",
    xp: 7500,
    altruism: 0.44,
    profile: "BALANCED",
    streak: 3,
  },
  {
    name: "SafeStake_Pro",
    xp: 6200,
    altruism: 0.21,
    profile: "SPECULATOR",
    streak: 1,
  },
];

function SlotsGame({ onEnd }: { onEnd: (result: { score: number; decisionMs: number; risk: string; altruistic: boolean; game: string }) => void }) {
  const [reels, setReels] = useState(["🎰", "🎰", "🎰"]);
  const [spinning, setSpinning] = useState(false);
  const [bet, setBet] = useState(200);
  const [balance, setBalance] = useState(1000);
  const [result, setResult] = useState<{
    win: boolean;
    payout: number;
    jackpot: boolean;
  } | null>(null);
  const [spins, setSpins] = useState(0);
  const startRef = useRef(0);

  const spin = () => {
    if (balance < bet || spinning) return;
    setSpinning(true);
    setResult(null);
    setBalance((b) => b - bet);

    let ticks = 0;
    const interval = setInterval(() => {
      setReels([
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]!,
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]!,
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]!,
      ]);
      ticks++;
      if (ticks >= 18) {
        clearInterval(interval);
        const final = [
          SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]!,
          SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]!,
          SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]!,
        ];
        setReels(final);
        setSpinning(false);
        setSpins((s) => s + 1);
        const isJackpot = final[0] === final[1] && final[1] === final[2];
        const isPartial = final[0] === final[1] || final[1] === final[2];
        const payout = isJackpot ? bet * 8 : isPartial ? bet * 2 : 0;
        setBalance((b) => b + payout);
        setResult({ win: payout > 0, payout, jackpot: isJackpot });
      }
    }, 80);
  };

  const finish = (altruistic: boolean) => {
    onEnd({
      score: balance,
      decisionMs: Date.now() - startRef.current,
      risk: balance < 500 ? "extreme" : "medium",
      altruistic,
      game: "slots",
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 13,
          color: "#9ca3af",
        }}
      >
        <span>BALANCE</span>
        <span
          style={{
            color:
              balance > 1000
                ? "#10b981"
                : balance < 400
                  ? "#ef4444"
                  : "#f59e0b",
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          R{balance.toLocaleString()}
        </span>
      </div>

      <div
        style={{
          background: "#000",
          border: "2px solid #f59e0b",
          borderRadius: 12,
          padding: "24px 0",
          display: "flex",
          justifyContent: "center",
          gap: 12,
        }}
      >
        {reels.map((sym, i) => (
          <div
            key={i}
            style={{
              width: 80,
              height: 90,
              background: "#111",
              border: "2px solid #333",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 42,
            }}
          >
            {sym}
          </div>
        ))}
      </div>

      {result && (
        <div
          style={{
            textAlign: "center",
            padding: "8px 0",
            color: result.jackpot
              ? "#f59e0b"
              : result.win
                ? "#10b981"
                : "#ef4444",
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: 2,
          }}
        >
          {result.jackpot
            ? `🏆 JACKPOT! +R${result.payout}`
            : result.win
              ? `✦ WIN +R${result.payout}`
              : "✗ NO WIN"}
        </div>
      )}

      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: "#6b7280",
            marginBottom: 6,
          }}
        >
          <span>BET: R{bet}</span>
          <span>MAX WIN: R{bet * 8}</span>
        </div>
        <input
          type="range"
          min={50}
          max={500}
          step={50}
          value={bet}
          onChange={(e) => setBet(+e.target.value)}
          style={{ width: "100%", accentColor: "#f59e0b" }}
        />
      </div>

      <button
        onClick={spin}
        disabled={spinning || balance < bet}
        style={{
          width: "100%",
          padding: "16px 0",
          background: spinning
            ? "#374151"
            : "linear-gradient(135deg, #f59e0b, #d97706)",
          color: "#000",
          fontWeight: 900,
          fontSize: 18,
          border: "none",
          borderRadius: 10,
          cursor: spinning || balance < bet ? "not-allowed" : "pointer",
          letterSpacing: 3,
        }}
      >
        {spinning ? "SPINNING…" : `🎰 SPIN R${bet}`}
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button
          onClick={() => finish(false)}
          style={{
            padding: "10px 0",
            background: "transparent",
            border: "1px solid #374151",
            color: "#9ca3af",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          Collect & Exit
        </button>
        <button
          onClick={() => finish(true)}
          style={{
            padding: "10px 0",
            background: "transparent",
            border: "1px solid #10b981",
            color: "#10b981",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          🤝 Redirect to Pool
        </button>
      </div>
    </div>
  );
}

function DiceGame({ onEnd }: { onEnd: (result: { score: number; decisionMs: number; risk: string; altruistic: boolean; game: string }) => void }) {
  const [dice, setDice] = useState([1, 1]);
  const [rolling, setRolling] = useState(false);
  const [bet, setBet] = useState(300);
  const [guess, setGuess] = useState("high");
  const [balance, setBalance] = useState(1000);
  const [history, setHistory] = useState<
    { d1: number; d2: number; total: number; win: boolean; payout: number }[]
  >([]);
  const startRef = useRef(0);

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    let ticks = 0;
    const interval = setInterval(() => {
      setDice([Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)]);
      ticks++;
      if (ticks >= 12) {
        clearInterval(interval);
        const d1 = Math.ceil(Math.random() * 6),
          d2 = Math.ceil(Math.random() * 6);
        setDice([d1, d2]);
        setRolling(false);
        const total = d1 + d2;
        const isWin =
          (guess === "high" && total >= 8) ||
          (guess === "low" && total <= 6) ||
          (guess === "seven" && total === 7);
        const multi = guess === "seven" ? 5 : 2;
        const payout = isWin ? bet * multi : 0;
        setBalance((b) => b - bet + payout);
        setHistory((h) => [
          { d1, d2, total, win: isWin, payout },
          ...h.slice(0, 4),
        ]);
      }
    }, 80);
  };

  const finish = (altruistic: boolean) =>
    onEnd({
      score: balance,
      decisionMs: Date.now() - startRef.current,
      risk: "medium",
      altruistic,
      game: "dice",
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 13,
          color: "#9ca3af",
        }}
      >
        <span>BALANCE</span>
        <span style={{ color: "#8b5cf6", fontWeight: 700, fontSize: 18 }}>
          R{balance.toLocaleString()}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 24,
          padding: "20px 0",
        }}
      >
        {dice.map((d, i) => (
          <div key={i} style={{ fontSize: 64 }}>
            {DICE_FACES[d - 1]}
          </div>
        ))}
      </div>
      <div
        style={{
          textAlign: "center",
          color: "#6b7280",
          fontSize: 12,
          letterSpacing: 2,
        }}
      >
        TOTAL: {dice[0]! + dice[1]!}
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}
      >
        {[
          ["low", "LOW (≤6)", "2×"],
          ["seven", "LUCKY 7", "5×"],
          ["high", "HIGH (≥8)", "2×"],
        ].map(([v, label, mult]) => (
          <button
            key={v}
            onClick={() => setGuess(v as "low" | "seven" | "high")}
            style={{
              padding: "10px 0",
              border: `2px solid ${guess === v ? "#8b5cf6" : "#374151"}`,
              background: guess === v ? "#8b5cf6" : "transparent",
              color: guess === v ? "#fff" : "#9ca3af",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {label}
            <br />
            <span style={{ fontSize: 14 }}>{mult}</span>
          </button>
        ))}
      </div>

      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: "#6b7280",
            marginBottom: 6,
          }}
        >
          <span>BET: R{bet}</span>
        </div>
        <input
          type="range"
          min={100}
          max={600}
          step={50}
          value={bet}
          onChange={(e) => setBet(+e.target.value)}
          style={{ width: "100%", accentColor: "#8b5cf6" }}
        />
      </div>

      {history.length > 0 && (
        <div style={{ display: "flex", gap: 6 }}>
          {history.map((h, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                padding: "4px 0",
                background: h.win ? "#064e3b" : "#450a0a",
                borderRadius: 6,
                textAlign: "center",
                fontSize: 11,
                color: h.win ? "#6ee7b7" : "#fca5a5",
              }}
            >
              {h.d1}+{h.d2}={h.total}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={roll}
        disabled={rolling || balance < bet}
        style={{
          width: "100%",
          padding: "14px 0",
          background: rolling
            ? "#374151"
            : "linear-gradient(135deg, #8b5cf6, #7c3aed)",
          color: "#fff",
          fontWeight: 900,
          fontSize: 16,
          border: "none",
          borderRadius: 10,
          cursor: "pointer",
          letterSpacing: 2,
        }}
      >
        {rolling ? "ROLLING…" : `🎲 ROLL R${bet}`}
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button
          onClick={() => finish(false)}
          style={{
            padding: "10px 0",
            background: "transparent",
            border: "1px solid #374151",
            color: "#9ca3af",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          Collect
        </button>
        <button
          onClick={() => finish(true)}
          style={{
            padding: "10px 0",
            background: "transparent",
            border: "1px solid #10b981",
            color: "#10b981",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          🤝 To Pool
        </button>
      </div>
    </div>
  );
}

function StokvelGame({ onEnd }: { onEnd: (s: any) => void }) {
  const [phase, setPhase] = useState(0);
  const [poolBalance, setPoolBalance] = useState(5000);
  const [trust, setTrust] = useState(70);
  const [round, setRound] = useState(1);
  const [log, setLog] = useState<string[]>([]);
  const startRef = useRef(0);

  const SCENARIOS = [
    {
      title: "Member default",
      desc: "Thabo missed his R800 contribution. Cover from pool?",
      options: [
        {
          label: "✅ Pool covers (+Trust)",
          effect: { pool: -800, trust: 12 },
          altruistic: true,
        },
        {
          label: "⚖️ Fine R200",
          effect: { pool: 200, trust: -5 },
          altruistic: false,
        },
      ],
    },
    {
      title: "Emergency payout",
      desc: "Nomsa needs R2,000 advance for medical emergency.",
      options: [
        {
          label: "❤️ Approve advance",
          effect: { pool: -2000, trust: 20 },
          altruistic: true,
        },
        {
          label: "❌ Decline",
          effect: { pool: 0, trust: -15 },
          altruistic: false,
        },
      ],
    },
    {
      title: "Invest surplus",
      desc: "Pool has R1,500 surplus. Grow or distribute?",
      options: [
        {
          label: "📈 Invest in SafeGrid",
          effect: { pool: 1500, trust: 8 },
          altruistic: false,
        },
        {
          label: "🎁 Distribute equally",
          effect: { pool: -300, trust: 15 },
          altruistic: true,
        },
      ],
    },
    {
      title: "New member fee",
      desc: "New member wants to join mid-cycle.",
      options: [
        {
          label: "✦ Welcome new member",
          effect: { pool: 500, trust: 5 },
          altruistic: true,
        },
        {
          label: "🔒 Next cycle only",
          effect: { pool: 0, trust: 2 },
          altruistic: false,
        },
      ],
    },
  ];

  const scenario = SCENARIOS[phase % SCENARIOS.length];

  const decide = useCallback((opt: any) => {
    const decisionTime = Date.now();
    const newPool = poolBalance + opt.effect.pool;
    const newTrust = trust + opt.effect.trust;
    setPoolBalance(newPool);
    setTrust(newTrust);
    setLog((l) => [
      `R${round}: ${opt.label} → Pool R${newPool.toLocaleString()}`,
      ...l.slice(0, 3),
    ]);
    setRound((r) => r + 1);
    if (round >= 4) {
      /* eslint-disable-line */ onEnd({
        score: newPool + newTrust * 20,
        decisionMs: decisionTime - startRef.current,
        risk: "medium",
        altruistic: opt.altruistic,
        game: "stokvel",
      });
    } else setPhase((p) => p + 1);
  }, [poolBalance, trust, round, onEnd]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div
          style={{
            background: "#064e3b",
            borderRadius: 10,
            padding: "12px 16px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "#6ee7b7",
              letterSpacing: 2,
              marginBottom: 4,
            }}
          >
            POOL BALANCE
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>
            R{poolBalance.toLocaleString()}
          </div>
        </div>
        <div
          style={{
            background: "#1e1b4b",
            borderRadius: 10,
            padding: "12px 16px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "#a5b4fc",
              letterSpacing: 2,
              marginBottom: 4,
            }}
          >
            TRUST INDEX
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>
            {trust}/100
          </div>
        </div>
      </div>

      <div
        style={{
          height: 4,
          background: "#1f2937",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${trust}%`,
            background:
              trust > 60 ? "#10b981" : trust > 30 ? "#f59e0b" : "#ef4444",
            transition: "width 0.5s",
          }}
        />
      </div>

      <div
        style={{
          background: "#111827",
          border: "1px solid #374151",
          borderRadius: 10,
          padding: 16,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "#10b981",
            letterSpacing: 3,
            marginBottom: 8,
          }}
        >
          ROUND {round}/4 — {scenario?.title.toUpperCase()}
        </div>
        <p
          style={{ color: "#d1d5db", fontSize: 14, margin: 0, lineHeight: 1.6 }}
        >
          {scenario?.desc}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {scenario?.options.map((opt: any, i: number) => (
          <button
            key={i}
            onClick={() => decide(opt)}
            style={{
              padding: "14px 16px",
              background: "transparent",
              border: `1px solid ${opt.altruistic ? "#10b981" : "#6b7280"}`,
              color: opt.altruistic ? "#10b981" : "#9ca3af",
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 13,
              textAlign: "left",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>{opt.label}</span>
            <span
              style={{
                fontSize: 11,
                color:
                  opt.effect.pool > 0
                    ? "#10b981"
                    : opt.effect.pool < 0
                      ? "#ef4444"
                      : "#6b7280",
              }}
            >
              {opt.effect.pool > 0
                ? `+R${opt.effect.pool}`
                : opt.effect.pool < 0
                  ? `-R${Math.abs(opt.effect.pool)}`
                  : "±0"}{" "}
              | Trust {opt.effect.trust > 0 ? "+" : ""}
              {opt.effect.trust}
            </span>
          </button>
        ))}
      </div>

      {log.length > 0 && (
        <div
          style={{
            fontSize: 11,
            color: "#6b7280",
            borderTop: "1px solid #1f2937",
            paddingTop: 12,
          }}
        >
          {log.map((l, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              · {l}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SnakesGame({ onEnd }: { onEnd: (s: any) => void }) {
  const BOARD_SIZE = 100;
  const SNAKES = [
    { start: 16, end: 6, color: "#ef4444" },
    { start: 47, end: 26, color: "#f97316" },
    { start: 49, end: 11, color: "#ec4899" },
    { start: 56, end: 53, color: "#8b5cf6" },
    { start: 62, end: 19, color: "#06b6d4" },
    { start: 64, end: 60, color: "#10b981" },
    { start: 87, end: 24, color: "#f59e0b" },
    { start: 93, end: 73, color: "#84cc16" },
    { start: 95, end: 75, color: "#6366f1" },
    { start: 98, end: 78, color: "#14b8a6" },
  ];

  const LADDERS = [
    { start: 1, end: 38, color: "#10b981" },
    { start: 4, end: 14, color: "#06b6d4" },
    { start: 9, end: 31, color: "#8b5cf6" },
    { start: 21, end: 42, color: "#ec4899" },
    { start: 28, end: 84, color: "#f97316" },
    { start: 36, end: 44, color: "#f59e0b" },
    { start: 51, end: 67, color: "#84cc16" },
    { start: 71, end: 91, color: "#6366f1" },
    { start: 80, end: 100, color: "#14b8a6" },
  ];

  const [pos, setPos] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [diceFace, setDiceFace] = useState(1);
  const [log, setLog] = useState<string[]>([]);
  const [bet, setBet] = useState(500);
  const [wins, setWins] = useState(0);
  const startRef = useRef(0);

  const rollDice = () => {
    if (rolling) return;
    setRolling(true);
    let ticks = 0;
    const iv = setInterval(() => {
      setDiceFace(Math.ceil(Math.random() * 6));
      ticks++;
      if (ticks >= 15) {
        clearInterval(iv);
        const d = Math.ceil(Math.random() * 6);
        setDiceFace(d);
        setRolling(false);
        let newPos = pos + d;
        let msg = `Rolled ${d}`;

        // Check for win
        if (newPos >= BOARD_SIZE) {
          setWins((w) => w + 1);
          newPos = BOARD_SIZE;
          msg = `🏆 WIN! R${bet * 3}`;
          onEnd({
            score: (wins + 1) * bet * 3,
            decisionMs: Date.now() - startRef.current,
            risk: "medium",
            altruistic: false,
            game: "snakes",
          });
          setLog((l) => [msg, ...l.slice(0, 4)]);
          setPos(BOARD_SIZE);
          return;
        }

        // Check for snakes
        const snake = SNAKES.find((s) => s.start === newPos);
        if (snake) {
          newPos = snake.end;
          msg += ` 🐍 → ${newPos}`;
        }

        // Check for ladders
        const ladder = LADDERS.find((l) => l.start === newPos);
        if (ladder) {
          newPos = ladder.end;
          msg += ` 🪜 → ${newPos}`;
        }

        setPos(newPos);
        if (!snake && !ladder) {
          msg += ` → Position ${newPos}`;
        }
        setLog((l) => [msg, ...l.slice(0, 4)]);
      }
    }, 60);
  };

  // Create board path positions (snake-like winding pattern)
  const getBoardPosition = (cellNumber: number) => {
    const row = Math.floor((cellNumber - 1) / 10);
    const col = (cellNumber - 1) % 10;
    const x = row % 2 === 0 ? col : 9 - col;
    return { row, col: x };
  };

  const renderBoard = () => {
    const cells = [];
    for (let i = 1; i <= BOARD_SIZE; i++) {
      const { row, col } = getBoardPosition(i);
      const isPlayer = pos === i;
      const snake = SNAKES.find((s) => s.start === i);
      const ladder = LADDERS.find((l) => l.start === i);

      cells.push(
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${col * 60 + 20}px`,
            top: `${row * 60 + 20}px`,
            width: "40px",
            height: "40px",
            background: isPlayer
              ? "#7c3aed"
              : snake
                ? snake.color
                : ladder
                  ? ladder.color
                  : "#1f2937",
            border: `2px solid ${isPlayer ? "#8b5cf6" : "#374151"}`,
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: isPlayer ? "16px" : "10px",
            color: isPlayer ? "#fff" : snake || ladder ? "#fff" : "#9ca3af",
            fontWeight: isPlayer ? 900 : 600,
            boxShadow: isPlayer ? "0 0 20px rgba(139, 92, 246, 0.5)" : "none",
            zIndex: isPlayer ? 10 : 1,
          }}
        >
          {isPlayer ? "🎯" : snake ? "🐍" : ladder ? "🪜" : i}
        </div>,
      );
    }
    return cells;
  };

  const renderSnakesAndLadders = () => {
    const elements: React.JSX.Element[] = [];

    // Render snakes
    SNAKES.forEach(({ start, end, color }) => {
      const startPos = getBoardPosition(start);
      const endPos = getBoardPosition(end);
      const midX = (startPos.col + endPos.col) * 30 + 40;
      const midY = (startPos.row + endPos.row) * 30 + 40;

      elements.push(
        <path
          key={`snake-${start}`}
          d={`M ${startPos.col * 60 + 40} ${startPos.row * 60 + 40} Q ${midX} ${midY} ${endPos.col * 60 + 40} ${endPos.row * 60 + 40}`}
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeDasharray="8,4"
          opacity="0.7"
        />,
      );
    });

    // Render ladders
    LADDERS.forEach(({ start, end, color }) => {
      const startPos = getBoardPosition(start);
      const endPos = getBoardPosition(end);

      elements.push(
        <line
          key={`ladder-${start}`}
          x1={startPos.col * 60 + 40}
          y1={startPos.row * 60 + 40}
          x2={endPos.col * 60 + 40}
          y2={endPos.row * 60 + 40}
          stroke={color}
          strokeWidth="4"
          opacity="0.8"
        />,
      );
    });

    return elements;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Game Board */}
      <div
        style={{
          position: "relative",
          width: "620px",
          height: "620px",
          margin: "0 auto",
          background: "linear-gradient(135deg, #0f172a, #1e293b)",
          borderRadius: "20px",
          border: "3px solid #374151",
        }}
      >
        <svg
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            zIndex: 2,
          }}
        >
          {renderSnakesAndLadders()}
        </svg>
        {renderBoard()}
      </div>

      {/* Game Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
            DICE
          </div>
          <div style={{ fontSize: 48, lineHeight: 1 }}>
            {DICE_FACES[diceFace - 1]}
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
            POSITION
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#8b5cf6" }}>
            {pos}
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
            WINS
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#10b981" }}>
            {wins}
          </div>
        </div>
      </div>

      {/* Game Log */}
      {log.length > 0 && (
        <div
          style={{
            background: "#111827",
            borderRadius: 10,
            padding: "12px 16px",
            maxHeight: "80px",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "#10b981",
              letterSpacing: 2,
              marginBottom: 6,
            }}
          >
            GAME LOG
          </div>
          {log.slice(0, 3).map((entry, i) => (
            <div
              key={i}
              style={{ fontSize: 12, color: "#d1d5db", marginBottom: 2 }}
            >
              {entry}
            </div>
          ))}
        </div>
      )}

      {/* Betting Controls */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              color: "#6b7280",
              marginBottom: 6,
            }}
          >
            <span>BET AMOUNT</span>
            <span>R{bet}</span>
          </div>
          <input
            type="range"
            min={100}
            max={2000}
            step={100}
            value={bet}
            onChange={(e) => setBet(+e.target.value)}
            style={{ width: "100%", accentColor: "#ef4444" }}
          />
        </div>
      </div>

      {/* Roll Button */}
      <button
        onClick={rollDice}
        disabled={rolling}
        style={{
          width: "100%",
          padding: "16px 0",
          background: rolling
            ? "#374151"
            : "linear-gradient(135deg, #ef4444, #b91c1c)",
          color: "#fff",
          fontWeight: 900,
          fontSize: 18,
          border: "none",
          borderRadius: 12,
          cursor: rolling ? "not-allowed" : "pointer",
          letterSpacing: 3,
          boxShadow: rolling ? "none" : "0 8px 25px rgba(239, 68, 68, 0.3)",
          transition: "all 0.3s ease",
        }}
      >
        {rolling ? "🎲 ROLLING..." : "🎲 ROLL THE DICE"}
      </button>

      {/* Game Rules */}
      <div
        style={{
          background: "#111827",
          borderRadius: 10,
          padding: "12px 16px",
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "#10b981",
            letterSpacing: 2,
            marginBottom: 6,
          }}
        >
          HOW TO PLAY
        </div>
        <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.4 }}>
          Roll the dice to move forward. Land on a ladder (🪜) to climb up,
          avoid snakes (🐍) that pull you back. Reach 100 to win and claim your
          prize!
        </div>
      </div>
    </div>
  );
}

function CropGame({ onEnd }: { onEnd: (s: any) => void }) {
  const [mult, setMult] = useState(1.0);
  const [crashed, setCrashed] = useState(false);
  const [active, setActive] = useState(false);
  const [bet, setBet] = useState(500);
  const [cashedOut, setCashedOut] = useState<number | null>(null);
  const startRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startGame = () => {
    setActive(true);
    setCrashed(false);
    setMult(1.0);
    setCashedOut(null);
    timerRef.current = setInterval(() => {
      setMult((m) => {
        const next = +(m + 0.04).toFixed(2);
        if (Math.random() < next * 0.008) {
          setCrashed(true);
          setActive(false);
          if (timerRef.current) clearInterval(timerRef.current);
          onEnd({
            score: 0,
            decisionMs: Date.now() - startRef.current,
            risk: "extreme",
            altruistic: false,
            game: "crop",
          });
          return m;
        }
        return next;
      });
    }, 120);
  };

  const cashOut = () => {
    if (!active || crashed) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const payout = Math.floor(bet * mult);
    setCashedOut(payout);
    setActive(false);
    onEnd({
      score: payout,
      decisionMs: Date.now() - startRef.current,
      risk: mult > 3 ? "extreme" : "medium",
      altruistic: false,
      game: "crop",
    });
  };

  const multColor = crashed
    ? "#ef4444"
    : mult > 3
      ? "#f59e0b"
      : mult > 1.5
        ? "#10b981"
        : "#06b6d4";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div
        style={{
          background: "#000",
          border: `2px solid ${multColor}`,
          borderRadius: 12,
          padding: "32px 16px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "#6b7280",
            letterSpacing: 3,
            marginBottom: 8,
          }}
        >
          GRAIN MARKET MULTIPLIER
        </div>
        <div style={{ fontSize: 64, fontWeight: 900, color: multColor }}>
          {crashed ? "CRASH!" : `${mult.toFixed(2)}×`}
        </div>
      </div>

      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: "#6b7280",
            marginBottom: 6,
          }}
        >
          <span>STAKE: R{bet}</span>
          <span style={{ color: "#10b981" }}>
            POTENTIAL: R{Math.floor(bet * mult)}
          </span>
        </div>
        <input
          type="range"
          min={100}
          max={2000}
          step={100}
          value={bet}
          onChange={(e) => setBet(+e.target.value)}
          disabled={active}
          style={{ width: "100%", accentColor: "#f97316" }}
        />
      </div>

      {cashedOut && (
        <div
          style={{
            textAlign: "center",
            color: "#10b981",
            fontWeight: 900,
            fontSize: 20,
          }}
        >
          ✦ CASHED R{cashedOut.toLocaleString()}
        </div>
      )}

      {!active && !crashed && !cashedOut && (
        <button
          onClick={startGame}
          style={{
            width: "100%",
            padding: "16px 0",
            background: "linear-gradient(135deg, #f97316, #ea580c)",
            color: "#fff",
            fontWeight: 900,
            fontSize: 16,
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            letterSpacing: 2,
          }}
        >
          🌾 ENTER MARKET
        </button>
      )}

      {active && !crashed && (
        <button
          onClick={cashOut}
          style={{
            width: "100%",
            padding: "16px 0",
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "#fff",
            fontWeight: 900,
            fontSize: 18,
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            letterSpacing: 2,
          }}
        >
          💰 CASH OUT R{Math.floor(bet * mult)}
        </button>
      )}

      {(crashed || cashedOut) && (
        <button
          onClick={() => {
            setMult(1.0);
            setCrashed(false);
            setCashedOut(null);
          }}
          style={{
            padding: "12px 0",
            background: "transparent",
            border: "1px solid #374151",
            color: "#9ca3af",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          New Round
        </button>
      )}
    </div>
  );
}

function Game2048({ onEnd }: { onEnd: (s: any) => void }) {
  const initGrid = () => {
    const g = Array(4)
      .fill(null)
      .map(() => Array(4).fill(0));
    addTile(g);
    addTile(g);
    return g;
  };
  function addTile(g: number[][]) {
    const empties = [];
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++) if (!g[r]![c]) empties.push([r, c]);
    if (empties.length) {
      const randomIndex = Math.floor(Math.random() * empties.length);
      const position = empties[randomIndex];
      if (position) {
        const [r, c] = position as [number, number];
        g[r]![c] = Math.random() < 0.9 ? 2 : 4;
      }
    }
  }

  const [grid, setGrid] = useState(initGrid);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const startRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const mouseStartRef = useRef<{ x: number; y: number } | null>(null);

  const slideLeft = (row: number[]) => {
    const nonZero = row.filter((x) => x > 0);
    const merged = [];
    let pts = 0;
    for (let i = 0; i < nonZero.length; i++) {
      if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
        merged.push(nonZero[i] * 2);
        pts += nonZero[i] * 2;
        i++;
      } else merged.push(nonZero[i]);
    }
    while (merged.length < 4) merged.push(0);
    return { row: merged, pts };
  };

  const move = useCallback(
    (dir: string) => {
      setGrid((prev) => {
        let g = prev.map((r) => [...r]);
        let totalPts = 0;
        if (dir === "left") {
          for (let r = 0; r < 4; r++) {
            const { row, pts } = slideLeft(g[r]);
            g[r] = row;
            totalPts += pts;
          }
        } else if (dir === "right") {
          for (let r = 0; r < 4; r++) {
            const { row, pts } = slideLeft([...g[r]].reverse());
            g[r] = row.reverse();
            totalPts += pts;
          }
        } else if (dir === "up") {
          for (let c = 0; c < 4; c++) {
            const col = g.map((r) => r[c]);
            const { row, pts } = slideLeft(col);
            for (let r = 0; r < 4; r++) g[r][c] = row[r];
            totalPts += pts;
          }
        } else if (dir === "down") {
          for (let c = 0; c < 4; c++) {
            const col = g.map((r) => r[c]).reverse();
            const { row, pts } = slideLeft(col);
            const rev = row.reverse();
            for (let r = 0; r < 4; r++) g[r][c] = rev[r];
            totalPts += pts;
          }
        }
        addTile(g);
        if (totalPts > 0) {
          setScore((s) => {
            const ns = s + totalPts;
            setBest((b) => Math.max(b, ns));
            return ns;
          });
        }
        const maxTile = Math.max(...g.flat());
        if (maxTile >= 2048)
          onEnd({
            score: maxTile * 10,
            decisionMs: Date.now() - startRef.current,
            risk: "low",
            altruistic: false,
            game: "2048",
          });
        return g;
      });
    },
    [onEnd],
  );

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const minSwipeDistance = 50;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > minSwipeDistance) {
        move(deltaX > 0 ? "right" : "left");
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > minSwipeDistance) {
        move(deltaY > 0 ? "down" : "up");
      }
    }
    touchStartRef.current = null;
  };

  // Mouse event handlers for drag gestures
  const handleMouseDown = (e: React.MouseEvent) => {
    mouseStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!mouseStartRef.current) return;
    const deltaX = e.clientX - mouseStartRef.current.x;
    const deltaY = e.clientY - mouseStartRef.current.y;
    const minDragDistance = 30;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal drag
      if (Math.abs(deltaX) > minDragDistance) {
        move(deltaX > 0 ? "right" : "left");
      }
    } else {
      // Vertical drag
      if (Math.abs(deltaY) > minDragDistance) {
        move(deltaY > 0 ? "down" : "up");
      }
    }
    mouseStartRef.current = null;
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") move("left");
      if (e.key === "ArrowRight") move("right");
      if (e.key === "ArrowUp") move("up");
      if (e.key === "ArrowDown") move("down");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [move]);

  const TILE_COLORS: Record<number, string> = {
    0: "#1f2937",
    2: "#164e63",
    4: "#0c4a6e",
    8: "#065f46",
    16: "#14532d",
    32: "#713f12",
    64: "#7c2d12",
    128: "#4c0519",
    256: "#581c87",
    512: "#3b0764",
    1024: "#1e1b4b",
    2048: "#f59e0b",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div
          style={{
            background: "#06b6d4",
            borderRadius: 8,
            padding: "8px 16px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 10, color: "#cffafe", letterSpacing: 2 }}>
            SCORE
          </div>
          <div style={{ fontWeight: 900, color: "#fff" }}>
            {score.toLocaleString()}
          </div>
        </div>
        <div
          style={{
            background: "#1f2937",
            borderRadius: 8,
            padding: "8px 16px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 10, color: "#9ca3af", letterSpacing: 2 }}>
            BEST
          </div>
          <div style={{ fontWeight: 900, color: "#fff" }}>
            {best.toLocaleString()}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 4,
          background: "#111827",
          borderRadius: 10,
          padding: 8,
          touchAction: "none",
          userSelect: "none",
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {grid.flat().map((v, i) => (
          <div
            key={i}
            style={{
              aspectRatio: "1",
              background: TILE_COLORS[Math.min(v, 2048)] || "#1e1b4b",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: v > 999 ? 12 : v > 99 ? 16 : v > 9 ? 20 : 24,
              color: v === 0 ? "transparent" : v >= 128 ? "#fef9c3" : "#fff",
            }}
          >
            {v || ""}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 6,
        }}
      >
        <div />
        <button
          onClick={() => move("up")}
          style={{
            padding: "10px 0",
            background: "#1f2937",
            border: "1px solid #374151",
            color: "#9ca3af",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 18,
          }}
        >
          ↑
        </button>
        <div />
        <button
          onClick={() => move("left")}
          style={{
            padding: "10px 0",
            background: "#1f2937",
            border: "1px solid #374151",
            color: "#9ca3af",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 18,
          }}
        >
          ←
        </button>
        <button
          onClick={() => move("down")}
          style={{
            padding: "10px 0",
            background: "#1f2937",
            border: "1px solid #374151",
            color: "#9ca3af",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 18,
          }}
        >
          ↓
        </button>
        <button
          onClick={() => move("right")}
          style={{
            padding: "10px 0",
            background: "#1f2937",
            border: "1px solid #374151",
            color: "#9ca3af",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 18,
          }}
        >
          →
        </button>
      </div>

      <button
        onClick={() =>
          onEnd({
            score,
            decisionMs: Date.now() - startRef.current,
            risk: "low",
            altruistic: false,
            game: "2048",
          })
        }
        style={{
          padding: "10px 0",
          background: "transparent",
          border: "1px solid #374151",
          color: "#9ca3af",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 12,
        }}
      >
        Exit with R{score.toLocaleString()} XP
      </button>
    </div>
  );
}

function CoinflipGame({ onEnd }: { onEnd: (s: any) => void }) {
  const [side, setSide] = useState("heads");
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<{
    outcome: string;
    win: boolean;
    payout: number;
  } | null>(null);
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(300);
  const [streak, setStreak] = useState(0);
  const [history, setHistory] = useState<{ outcome: string; win: boolean }[]>(
    [],
  );
  const startRef = useRef(0);

  const flip = () => {
    if (flipping || balance < bet) return;
    setFlipping(true);
    setResult(null);
    setTimeout(() => {
      const outcome = Math.random() < 0.5 ? "heads" : "tails";
      const win = outcome === side;
      const streakBonus = win ? streak * 50 : 0;
      const payout = win ? bet * 2 + streakBonus : 0;
      setBalance((b) => b - bet + payout);
      setStreak((s) => (win ? s + 1 : 0));
      setResult({ outcome, win, payout });
      setHistory((h) => [{ outcome, win }, ...h.slice(0, 7)]);
      setFlipping(false);
      if (balance - bet + payout <= 0)
        onEnd({
          score: 0,
          decisionMs: Date.now() - startRef.current,
          risk: "extreme",
          altruistic: false,
          game: "coinflip",
        });
    }, 1200);
  };

  const headsPct = history.length
    ? Math.round(
        (history.filter((h) => h.outcome === "heads").length / history.length) *
          100,
      )
    : 50;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: "#9ca3af", letterSpacing: 2 }}>
            BALANCE
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#ec4899" }}>
            R{balance.toLocaleString()}
          </div>
        </div>
        {streak > 0 && (
          <div
            style={{
              background: "#7c3aed",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 12,
              color: "#ddd6fe",
              fontWeight: 700,
            }}
          >
            🔥 STREAK ×{streak}
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", padding: "24px 0" }}>
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            margin: "0 auto",
            background: flipping
              ? "conic-gradient(#ec4899, #f59e0b, #ec4899)"
              : result?.outcome === "heads"
                ? "#f59e0b"
                : result?.outcome === "tails"
                  ? "#6b7280"
                  : "#374151",
            border: "4px solid #4b5563",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36,
            fontWeight: 900,
            color: "#fff",
            animation: flipping ? "spin 0.3s linear infinite" : "none",
            transition: "background 0.3s",
          }}
        >
          {flipping
            ? "?"
            : result?.outcome === "heads"
              ? "H"
              : result?.outcome === "tails"
                ? "T"
                : "🪙"}
        </div>
      </div>

      {result && (
        <div
          style={{
            textAlign: "center",
            fontWeight: 900,
            fontSize: 16,
            color: result.win ? "#10b981" : "#ef4444",
          }}
        >
          {result.win ? `✦ WIN +R${result.payout}` : "✗ LOSS"}
        </div>
      )}

      {history.length >= 4 && (
        <div style={{ background: "#111827", borderRadius: 8, padding: 10 }}>
          <div
            style={{
              fontSize: 11,
              color: "#6b7280",
              marginBottom: 6,
              letterSpacing: 2,
            }}
          >
            PROBABILITY TRANSPARENCY
          </div>
          <div
            style={{
              height: 8,
              background: "#1f2937",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${headsPct}%`,
                background: "#f59e0b",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10,
              color: "#6b7280",
              marginTop: 4,
            }}
          >
            <span>H: {headsPct}%</span>
            <span>T: {100 - headsPct}%</span>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {["heads", "tails"].map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            style={{
              padding: "12px 0",
              border: `2px solid ${side === s ? "#ec4899" : "#374151"}`,
              background: side === s ? "#ec4899" : "transparent",
              color: side === s ? "#fff" : "#9ca3af",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {s === "heads" ? "H" : "T"} {s.toUpperCase()}
          </button>
        ))}
      </div>

      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: "#6b7280",
            marginBottom: 6,
          }}
        >
          <span>BET: R{bet}</span>
          <span>{streak > 0 ? `Streak bonus: +R${streak * 50}` : ""}</span>
        </div>
        <input
          type="range"
          min={50}
          max={500}
          step={50}
          value={bet}
          onChange={(e) => setBet(+e.target.value)}
          style={{ width: "100%", accentColor: "#ec4899" }}
        />
      </div>

      <button
        onClick={flip}
        disabled={flipping || balance < bet}
        style={{
          width: "100%",
          padding: "14px 0",
          background: flipping
            ? "#374151"
            : "linear-gradient(135deg, #ec4899, #be185d)",
          color: "#fff",
          fontWeight: 900,
          fontSize: 16,
          border: "none",
          borderRadius: 10,
          cursor: "pointer",
          letterSpacing: 2,
        }}
      >
        {flipping ? "FLIPPING…" : `🪙 FLIP R${bet}`}
      </button>

      <button
        onClick={() =>
          onEnd({
            score: balance,
            decisionMs: Date.now() - startRef.current,
            risk: "medium",
            altruistic: true,
            game: "coinflip",
          })
        }
        style={{
          padding: "10px 0",
          background: "transparent",
          border: "1px solid #10b981",
          color: "#10b981",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 12,
        }}
      >
        🤝 Redirect Balance to Pool
      </button>
    </div>
  );
}

function GameModal({
  game,
  onClose,
  onEnd,
  lindiweResult,
}: {
  game: any;
  onClose: () => void;
  onEnd: (r: any, s: any) => void;
  lindiweResult: any;
}) {
  const [timeLeft, setTimeLeft] = useState(game.timebox);
  const [phase, setPhase] = useState("intro");
  const [lindiwe, setLindiwe] = useState<any>(null);

  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(
      () =>
        setTimeLeft((p) => {
          if (p <= 1) {
            clearInterval(t);
            return 0;
          }
          return p - 1;
        }),
      1000,
    );
    return () => clearInterval(t);
  }, [phase]);

  const handleEnd = (signal: any) => {
    const result = LindiweEngine.ingest(signal);
    setLindiwe(result);
    setPhase("result");
    onEnd(result, signal);
  };

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");
  const progress = ((game.timebox - timeLeft) / game.timebox) * 100;

  const GAME_COMPONENTS: Record<string, (props: any) => JSX.Element> = {
    slots: SlotsGame,
    dice: DiceGame,
    stokvel: StokvelGame,
    snakes: SnakesGame,
    crop: CropGame,
    tiles2048: Game2048,
    coinflip: CoinflipGame,
  };
  const GameComponent = GAME_COMPONENTS[game.id];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.96)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#0f172a",
          border: `2px solid ${game.color}`,
          borderRadius: 20,
          width: "100%",
          maxWidth: 460,
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 24,
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "none",
            border: "none",
            color: "#6b7280",
            cursor: "pointer",
            fontSize: 20,
          }}
        >
          ✕
        </button>

        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: game.color,
                letterSpacing: 3,
                fontWeight: 700,
              }}
            >
              {game.name}
            </span>
            <span
              style={{
                fontSize: 16,
                fontWeight: 900,
                color: timeLeft < 30 ? "#ef4444" : "#9ca3af",
                fontFamily: "monospace",
              }}
            >
              {mins}:{secs}
            </span>
          </div>
          <div style={{ height: 2, background: "#1f2937", borderRadius: 1 }}>
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: game.color,
                transition: "width 1s linear",
              }}
            />
          </div>
        </div>

        {phase === "intro" && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>{game.icon}</div>
            <h3
              style={{
                color: "#fff",
                fontSize: 20,
                fontWeight: 900,
                letterSpacing: 2,
                marginBottom: 8,
              }}
            >
              {game.name}
            </h3>
            <p
              style={{
                color: "#6b7280",
                fontSize: 14,
                lineHeight: 1.7,
                marginBottom: 24,
              }}
            >
              {game.tagline}
            </p>
            <button
              onClick={() => setPhase("playing")}
              style={{
                padding: "14px 40px",
                background: game.color,
                color: "#000",
                fontWeight: 900,
                fontSize: 14,
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                letterSpacing: 2,
              }}
            >
              INITIATE SEQUENCE
            </button>
          </div>
        )}

        {phase === "playing" && GameComponent && (
          <GameComponent onEnd={handleEnd} />
        )}

        {phase === "result" && lindiwe && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div
              style={{
                fontSize: 11,
                color: "#10b981",
                letterSpacing: 3,
                marginBottom: 16,
              }}
            >
              LINDIWE ANALYSIS COMPLETE
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  background: "#111827",
                  borderRadius: 10,
                  padding: "12px 16px",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "#9ca3af",
                    letterSpacing: 2,
                    marginBottom: 4,
                  }}
                >
                  XP EARNED
                </div>
                <div
                  style={{ fontSize: 24, fontWeight: 900, color: "#f59e0b" }}
                >
                  +{lindiwe.xp}
                </div>
              </div>
              <div
                style={{
                  background: "#111827",
                  borderRadius: 10,
                  padding: "12px 16px",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "#9ca3af",
                    letterSpacing: 2,
                    marginBottom: 4,
                  }}
                >
                  PROFILE
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color:
                      lindiwe.riskProfile === "COMMUNITARIAN"
                        ? "#10b981"
                        : lindiwe.riskProfile === "SPECULATOR"
                          ? "#ef4444"
                          : "#06b6d4",
                  }}
                >
                  {lindiwe.riskProfile}
                </div>
              </div>
            </div>
            <div
              style={{
                background: "#111827",
                border: "1px dashed #374151",
                borderRadius: 10,
                padding: "12px 16px",
                marginBottom: 20,
                textAlign: "left",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "#10b981",
                  letterSpacing: 2,
                  marginBottom: 6,
                }}
              >
                📡 LINDIWE COACHING
              </div>
              <p
                style={{
                  color: "#d1d5db",
                  fontSize: 13,
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {lindiwe.coaching}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: "100%",
                padding: "14px 0",
                background: `linear-gradient(135deg, ${game.color}, #1f2937)`,
                color: "#fff",
                fontWeight: 900,
                fontSize: 14,
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                letterSpacing: 2,
              }}
            >
              SYNC & CLOSE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState<any>(null);
  const [xp, setXp] = useState(1200);
  const [lindiweState, setLindiweState] = useState({
    impulse: 0.45,
    altruism: 0.3,
    coaching: "📡 Awaiting your first session…",
    riskProfile: "BALANCED",
  });
  const [leaderboard, setLeaderboard] = useState(INIT_LEADERBOARD);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [tab, setTab] = useState("games");
  const [showLindiwe, setShowLindiwe] = useState(false);

  const handleGameEnd = (lindiweResult: any, signal: any) => {
    setXp((x) => x + lindiweResult.xp);
    setLindiweState(lindiweResult);
    setGamesPlayed((g) => g + 1);
    setShowLindiwe(true);
    setTimeout(() => setShowLindiwe(false), 5000);
  };

  const tier =
    xp < 1000
      ? "RECRUIT"
      : xp < 5000
        ? "MEMBER"
        : xp < 12000
          ? "SOVEREIGN"
          : "ORACLE";
  const tierColor = {
    RECRUIT: "#6b7280",
    MEMBER: "#06b6d4",
    SOVEREIGN: "#8b5cf6",
    ORACLE: "#f59e0b",
  }[tier];

  return (
    <div
      style={{
        background: "#030712",
        minHeight: "100vh",
        fontFamily: "'Courier New', Courier, monospace",
        color: "#fff",
      }}
    >
      <style>{`@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } @keyframes glitch { 0%,90%,100% { transform: translate(0); } 92% { transform: translate(-2px, 0); } 96% { transform: translate(2px, 0); } }`}</style>

      <div
        style={{
          borderBottom: "1px solid #1f2937",
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: "#6b7280", letterSpacing: 4 }}>
            UBUNTU POOLS
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 900,
              letterSpacing: 6,
              animation: "glitch 4s infinite",
            }}
          >
            ARCADE v2.0
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: 10,
              color: "#6b7280",
              letterSpacing: 2,
              marginBottom: 2,
            }}
          >
            SOVEREIGN STATUS
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: tierColor }}>
            {xp.toLocaleString()} XP
          </div>
          <div style={{ fontSize: 10, color: tierColor, letterSpacing: 3 }}>
            {tier}
          </div>
        </div>
      </div>

      <div style={{ height: 3, background: "#111827" }}>
        <div
          style={{
            height: "100%",
            width: `${Math.min(100, (xp / 15000) * 100)}%`,
            background: `linear-gradient(90deg, #8b5cf6, ${tierColor})`,
            transition: "width 0.5s",
          }}
        />
      </div>

      <div
        style={{
          background: "#0a0a0a",
          borderBottom: "1px solid #1f2937",
          padding: "8px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#10b981",
            display: "inline-block",
            animation: "pulse 1.5s infinite",
          }}
        />
        <span style={{ fontSize: 11, color: "#6b7280", letterSpacing: 1 }}>
          LINDIWE: {lindiweState.coaching}
        </span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#374151" }}>
          {gamesPlayed} sessions · {lindiweState.riskProfile}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #1f2937",
          padding: "0 20px",
        }}
      >
        {[
          ["games", "🎮 GAMES"],
          ["leaderboard", "🏆 RANKS"],
          ["tournament", "⚡ TOURNAMENT"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              padding: "12px 16px",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${tab === id ? "#8b5cf6" : "transparent"}`,
              color: tab === id ? "#8b5cf6" : "#6b7280",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 2,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: 20 }}>
        {tab === "games" && (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: 12,
                marginBottom: 24,
              }}
            >
              {GAME_CATALOG.map((g) => (
                <div
                  key={g.id}
                  onClick={() => setActiveGame(g)}
                  style={{
                    background: "#0f172a",
                    border: "1px solid #1f2937",
                    borderRadius: 14,
                    padding: "20px 16px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <div
                    style={{
                      marginBottom: 12,
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    {g.icon}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 900,
                      color: "#fff",
                      letterSpacing: 1,
                      marginBottom: 4,
                    }}
                  >
                    {g.name}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#6b7280",
                      lineHeight: 1.5,
                      marginBottom: 14,
                    }}
                  >
                    {g.tagline}
                  </div>
                  <div
                    style={{
                      height: 2,
                      background: g.color,
                      borderRadius: 1,
                      width: "40%",
                      opacity: 0.6,
                    }}
                  />
                </div>
              ))}
            </div>

            <div
              style={{
                background: "#0a0a0a",
                border: "1px dashed #1f2937",
                borderRadius: 14,
                padding: 20,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#10b981",
                  letterSpacing: 3,
                  marginBottom: 16,
                }}
              >
                📡 LINDIWE SIGNAL DASHBOARD
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                {[
                  [
                    "IMPULSE",
                    `${(lindiweState.impulse * 100).toFixed(0)}%`,
                    lindiweState.impulse > 0.7 ? "#ef4444" : "#10b981",
                  ],
                  [
                    "ALTRUISM",
                    `${(lindiweState.altruism * 100).toFixed(0)}%`,
                    "#8b5cf6",
                  ],
                  ["SESSIONS", gamesPlayed, "#06b6d4"],
                ].map(([label, val, color]) => (
                  <div
                    key={label}
                    style={{
                      background: "#111827",
                      borderRadius: 8,
                      padding: "10px 12px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: "#6b7280",
                        letterSpacing: 2,
                        marginBottom: 4,
                      }}
                    >
                      {label}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 900, color }}>
                      {val}
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                {[
                  [
                    "IMPULSE",
                    lindiweState.impulse,
                    lindiweState.impulse > 0.7 ? "#ef4444" : "#10b981",
                  ],
                  ["ALTRUISM", lindiweState.altruism, "#8b5cf6"],
                ].map(([label, val, color]) => (
                  <div key={label}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 10,
                        color: "#6b7280",
                        marginBottom: 4,
                      }}
                    >
                      <span>{label}</span>
                      <span>{(val * 100).toFixed(0)}%</span>
                    </div>
                    <div
                      style={{
                        height: 4,
                        background: "#1f2937",
                        borderRadius: 2,
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${val * 100}%`,
                          background: color,
                          transition: "width 0.5s",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "leaderboard" && (
          <div>
            <div
              style={{
                fontSize: 11,
                color: "#6b7280",
                letterSpacing: 3,
                marginBottom: 12,
              }}
            >
              &gt; TOP SOVEREIGNS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...leaderboard]
                .sort((a, b) => b.xp - a.xp)
                .map((entry, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      background: "#111827",
                      borderRadius: 10,
                      padding: "10px 14px",
                      border:
                        i === 0
                          ? "1px solid #f59e0b44"
                          : "1px solid transparent",
                    }}
                  >
                    <span
                      style={{ fontSize: 18, width: 24, textAlign: "center" }}
                    >
                      {i < 3 ? ["🥇", "🥈", "🥉"][i] : `${i + 1}.`}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}
                      >
                        {entry.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color:
                            entry.profile === "COMMUNITARIAN"
                              ? "#10b981"
                              : entry.profile === "SPECULATOR"
                                ? "#ef4444"
                                : "#6b7280",
                        }}
                      >
                        {entry.profile}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 900,
                          color:
                            i < 3
                              ? ["#f59e0b", "#9ca3af", "#cd7c3d"][i]
                              : "#9ca3af",
                        }}
                      >
                        {entry.xp.toLocaleString()} XP
                      </div>
                      <div style={{ fontSize: 10, color: "#6b7280" }}>
                        A:{(entry.altruism * 100).toFixed(0)}%
                        {entry.streak > 1 ? ` 🔥${entry.streak}` : ""}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {tab === "tournament" && (
          <div>
            <div
              style={{
                fontSize: 11,
                color: "#6b7280",
                letterSpacing: 3,
                marginBottom: 12,
              }}
            >
              &gt; TOURNAMENT BRACKET
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                {
                  p1: "Sovereign_Alpha",
                  p2: "Ubuntu_Queen",
                  game: "SLOTS",
                  status: "LIVE",
                },
                {
                  p1: "Lindiwe_Watcher",
                  p2: "SafeStake_Pro",
                  game: "DICE",
                  status: "QUEUED",
                },
                { p1: "???", p2: "???", game: "FINAL", status: "UPCOMING" },
              ].map((m, i) => (
                <div
                  key={i}
                  style={{
                    background: "#111827",
                    borderRadius: 10,
                    padding: "12px 14px",
                    border: `1px solid ${m.status === "LIVE" ? "#10b981" : "#1f2937"}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        color:
                          m.status === "LIVE"
                            ? "#10b981"
                            : m.status === "UPCOMING"
                              ? "#f59e0b"
                              : "#6b7280",
                        letterSpacing: 2,
                      }}
                    >
                      {m.status === "LIVE"
                        ? "● LIVE"
                        : m.status === "UPCOMING"
                          ? "★ FINAL"
                          : "◌ QUEUED"}{" "}
                      · {m.game}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{
                        flex: 1,
                        fontSize: 13,
                        color: "#d1d5db",
                        fontWeight: 600,
                      }}
                    >
                      {m.p1}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: "#4b5563",
                        fontWeight: 700,
                      }}
                    >
                      VS
                    </span>
                    <span
                      style={{
                        flex: 1,
                        fontSize: 13,
                        color: "#d1d5db",
                        fontWeight: 600,
                        textAlign: "right",
                      }}
                    >
                      {m.p2}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {activeGame && (
        <GameModal
          game={activeGame}
          onClose={() => setActiveGame(null)}
          onEnd={handleGameEnd}
          lindiweResult={lindiweState}
        />
      )}

      {showLindiwe && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            background: "#0f172a",
            border: "1px solid #10b981",
            borderRadius: 12,
            padding: "12px 16px",
            maxWidth: 280,
            zIndex: 200,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "#10b981",
              letterSpacing: 2,
              marginBottom: 6,
            }}
          >
            📡 LINDIWE UPDATE
          </div>
          <p style={{ fontSize: 12, color: "#d1d5db", margin: 0 }}>
            {lindiweState.coaching}
          </p>
        </div>
      )}
    </div>
  );
}
