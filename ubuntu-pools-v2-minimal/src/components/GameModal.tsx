import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Zap, X } from 'lucide-react';
import { Game } from './types';

const SOUNDS = {
  spin: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  win: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  loss: 'https://assets.mixkit.co/active_storage/sfx/251/251-preview.mp3',
  bailout: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  tick: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
};

const playSound = (soundUrl: string, loop = false) => {
  const audio = new Audio(soundUrl);
  audio.volume = 0.4;
  audio.loop = loop;
  audio.play().catch(() => {}); // Ignore autoplay blocks
  return audio;
};

export default function GameModal({ game, onClose, onEnd }: { game: Game; onClose: () => void; onEnd: (score: number, meta: any) => void }) {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'result'>('intro');
  const [score, setScore] = useState(0);
  const [meta, setMeta] = useState<any>({});
  const [timeLeft, setTimeLeft] = useState(game.timebox);
  const [isSpinning, setIsSpinning] = useState(false);
  const [multiplier, setMultiplier] = useState(1.0);
  const [isCrashed, setIsCrashed] = useState(false);
  const [reels, setReels] = useState(['🎰', '🎰', '🎰']);
  const [bet, setBet] = useState(500);
  const [startTime] = useState<number>(() => Date.now());
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (gameState === 'playing') {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState]);

  // Crash Game Logic
  useEffect(() => {
    if (game.id === 'crop' && gameState === 'playing' && !isCrashed) {
      const interval = setInterval(() => {
        setMultiplier(prev => {
          const next = prev + 0.05;
          // Random crash chance increases as multiplier goes up
          if (Math.random() < (next * 0.01)) {
            setIsCrashed(true);
            playSound(SOUNDS.loss);
            clearInterval(interval);
            return prev;
          }
          return next;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [game.id, gameState, isCrashed]);

  const handleDecision = (finalScore: number, finalMeta: any) => {
    const decisionTime = Date.now() - startTime;
    if (finalScore > bet * 2) playSound(SOUNDS.win);
    else if (finalScore === 0) playSound(SOUNDS.loss);
    onEnd(finalScore, { ...finalMeta, decisionTime });
  };

  const spinLottery = () => {
    setIsSpinning(true);
    const audio = playSound(SOUNDS.spin, true);
    setActiveAudio(audio);

    const symbols = ['🎰', '💰', '💎', '❤️', '💀', '🌟'];

    setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
      setActiveAudio(null);

      const result = [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
      ];
      setReels(result);
      setIsSpinning(false);

      const isWin = result[0] === result[1] && result[1] === result[2];
      const winScore = isWin ? bet * 10 : bet;

      if (isWin) playSound(SOUNDS.win);
      else playSound(SOUNDS.loss);

      setScore(winScore);
      setMeta({ isAltruistic: false, risk: 'extreme' });
      setGameState('result');
    }, 2000);
  };

  const renderGameContent = () => {
    switch (game.id) {
      case 'lottery':
        return (
          <div className="space-y-8">
            <div className="casino-border bg-black/60 p-6 rounded-xl flex justify-center gap-4 reel-container overflow-hidden h-48 items-center">
              {reels.map((symbol, i) => (
                <motion.div
                  key={i}
                  className={`text-6xl bg-gray-800 w-24 h-32 flex items-center justify-center rounded-lg border-2 border-casino-gold ${isSpinning ? 'animate-spin-reel' : ''}`}
                  animate={isSpinning ? { y: [0, -100] } : { y: 0 }}
                  transition={isSpinning ? { repeat: Infinity, duration: 0.1, ease: "linear" } : {}}
                >
                  {symbol}
                </motion.div>
              ))}
            </div>

            <div className="text-center space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs uppercase tracking-widest text-cyber-cyan">
                  <span>Bet Amount</span>
                  <span>R{bet}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="100"
                  value={bet}
                  onChange={(e) => setBet(Number(e.target.value))}
                  disabled={isSpinning}
                  className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-casino-gold"
                />
                <p className="text-[0.6rem] text-gray-500">POTENTIAL JACKPOT: R{bet * 10}</p>
              </div>

              <button
                disabled={isSpinning}
                onClick={spinLottery}
                className={`w-full py-6 bg-gradient-to-b from-casino-gold to-yellow-700 text-black font-black text-2xl rounded-xl shadow-[0_5px_0_#b8860b] active:translate-y-1 active:shadow-none transition-all uppercase tracking-tighter ${isSpinning ? 'opacity-50' : ''}`}
              >
                {isSpinning ? 'SPINNING...' : `🎰 SPIN FOR R${bet}`}
              </button>
              <button
                onClick={() => {
                  playSound(SOUNDS.bailout);
                  handleDecision(1100, { isAltruistic: true, risk: 'low' });
                  setScore(1100);
                  setGameState('result');
                }}
                className="text-cyber-cyan underline text-sm hover:text-cyber-pink transition-colors"
              >
                Skip and build community pool (+Altruism)
              </button>
            </div>
          </div>
        );
      case 'crop':
        return (
          <div className="space-y-8">
            <div className="relative h-64 bg-black/80 border-2 border-cyber-cyan rounded-xl overflow-hidden flex flex-col items-center justify-center">
              <motion.div
                className={`text-7xl font-black ${isCrashed ? 'text-casino-red' : 'text-cyber-cyan'} transition-colors`}
                animate={!isCrashed ? {
                  scale: [1, 1.1, 1],
                  textShadow: [
                    "0 0 10px rgba(0,255,204,0.5)",
                    "0 0 20px rgba(0,255,204,0.8)",
                    "0 0 10px rgba(0,255,204,0.5)"
                  ]
                } : { scale: 1 }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                {multiplier.toFixed(2)}x
              </motion.div>
              {isCrashed && <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-casino-red font-bold text-2xl animate-bounce mt-4 uppercase"
              >
                CRASHED!
              </motion.div>}

              <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-800">
                <motion.div
                  className="h-full bg-cyber-cyan"
                  animate={{ width: isCrashed ? '100%' : `${(multiplier / 5) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs uppercase tracking-widest text-cyber-cyan">
                  <span>Initial Investment</span>
                  <span>R{bet}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  value={bet}
                  onChange={(e) => setBet(Number(e.target.value))}
                  disabled={gameState === 'playing'}
                  className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyber-cyan"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  disabled={isCrashed}
                  onClick={() => {
                    const finalScore = Math.floor(bet * multiplier);
                    playSound(SOUNDS.win);
                    setScore(finalScore);
                    setMeta({ risk: multiplier > 2 ? 'extreme' : 'medium', isAltruistic: false });
                    setGameState('result');
                  }}
                  className={`w-full py-6 font-black text-2xl rounded-xl transition-all uppercase tracking-widest ${isCrashed ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-cyber-cyan text-black hover:bg-cyber-pink active:scale-95'}`}
                >
                  {isCrashed ? 'TOO LATE' : `CASH OUT R${Math.floor(bet * multiplier)}`}
                </button>
                {isCrashed && (
                  <button
                    onClick={() => {
                      setScore(0);
                      setMeta({ risk: 'extreme', isAltruistic: false });
                      setGameState('result');
                    }}
                    className="w-full py-4 border-2 border-casino-red text-casino-red font-bold rounded-xl hover:bg-casino-red hover:text-white transition-all"
                  >
                    Accept Loss
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      case 'fi':
        return (
          <div className="space-y-8">
            <div className="flex justify-center">
              <motion.div
                className="w-48 h-48 rounded-full border-8 border-casino-gold flex items-center justify-center relative bg-black/40"
                animate={isSpinning ? { rotate: 360 * 5 } : { rotate: 0 }}
                transition={isSpinning ? { duration: 2, ease: "circOut" } : {}}
              >
                <div className="absolute top-0 w-2 h-8 bg-casino-gold -translate-y-4" />
                <div className="text-5xl">{isSpinning ? '?' : '🤝'}</div>
              </motion.div>
            </div>

            <p className="text-lg text-center text-gray-300">A member needs help. Will the collective trust hold?</p>

            <div className="grid grid-cols-1 gap-3">
              <button
                disabled={isSpinning}
                onClick={() => {
                  setIsSpinning(true);
                  playSound(SOUNDS.spin);
                  setTimeout(() => {
                    setIsSpinning(false);
                    playSound(SOUNDS.bailout);
                    setScore(1500);
                    setMeta({ isAltruistic: true, risk: 'medium' });
                    setGameState('result');
                  }, 2000);
                }}
                className="w-full p-5 bg-cyber-pink text-black font-black uppercase tracking-widest rounded-xl hover:opacity-90 active:scale-95 transition-all"
              >
                {isSpinning ? 'SPINNING TRUST...' : '🤝 VOTE TO COVER (R1000)'}
              </button>
              <button
                disabled={isSpinning}
                onClick={() => {
                  playSound(SOUNDS.loss);
                  setScore(800);
                  setMeta({ isAltruistic: false, risk: 'low' });
                  setGameState('result');
                }}
                className="w-full p-4 border-2 border-gray-600 text-gray-400 font-bold uppercase tracking-widest rounded-xl hover:border-cyber-cyan hover:text-cyber-cyan transition-all"
              >
                Fine Member
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-cyber-dark border-4 border-cyber-cyan rounded-3xl p-8 w-full max-w-xl relative"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-cyber-cyan hover:text-cyber-pink transition-colors"
        >
          <X className="w-8 h-8" />
        </button>

        <div className="text-center mb-8">
          <div className="text-cyber-pink text-2xl font-bold mb-2">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
          <h2 className="text-3xl font-bold uppercase tracking-widest">{game.name}</h2>
        </div>

        {gameState === 'intro' ? (
          <div className="text-center space-y-6">
            <p className="text-gray-400 leading-relaxed">{game.description}</p>
            <button
              onClick={() => setGameState('playing')}
              className="px-12 py-4 bg-cyber-cyan text-black font-bold rounded-full hover:bg-cyber-pink transition-colors uppercase tracking-widest"
            >
              Start Mission
            </button>
          </div>
        ) : gameState === 'playing' ? (
          renderGameContent()
        ) : (
          <div className={`text-center space-y-6 p-8 rounded-2xl transition-all ${score > 1000 ? 'win-flash' : ''}`}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              {score > 1000 ? (
                <Trophy className="w-20 h-20 text-casino-gold mx-auto drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]" />
              ) : (
                <Zap className="w-20 h-20 text-gray-500 mx-auto" />
              )}
            </motion.div>

            <h3 className={`text-5xl font-black uppercase tracking-tighter ${score > 1000 ? 'text-casino-gold' : 'text-gray-400'}`}>
              {score > 1000 ? 'BIG WIN!' : 'MISSION END'}
            </h3>

            <div className="bg-black/80 border-2 border-cyber-cyan p-8 rounded-2xl space-y-2 relative overflow-hidden">
              {score > 1000 && (
                <motion.div
                  className="absolute inset-0 bg-casino-gold/10"
                  animate={{ opacity: [0.1, 0.3, 0.1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
              )}
              <p className="text-cyber-cyan uppercase text-xs tracking-[4px]">Payout Received</p>
              <p className="text-6xl font-black text-white">R{score.toLocaleString()}</p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => onEnd(score, meta)}
                className="w-full py-5 bg-gradient-to-r from-cyber-cyan to-cyber-pink text-black font-black text-xl rounded-xl hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest"
              >
                Collect & Sync
              </button>
              <p className="text-[0.6rem] text-gray-500 uppercase tracking-widest">
                Lindiwe is analyzing your {meta.risk} risk behavior...
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}