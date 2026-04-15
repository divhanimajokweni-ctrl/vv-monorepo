'use client';

import { useState, useEffect } from 'react';

const WA_NUMBER = '27623506594';
const WA_GROUP_LINK = 'https://chat.whatsapp.com/HcncFfDYrWb3G2ZiBx8BYL';
const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://workspace-fawn-alpha.vercel.app';

function genCode(name: string) {
  const clean = (name || 'UBUNTU').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'UBNT';
  return clean + Math.floor(1000 + Math.random() * 9000);
}

export default function LandingPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [refCode, setRefCode] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('ref') || '';
    }
    return '';
  });
  const [consent, setConsent] = useState(false);
  const [counter, setCounter] = useState(47);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [formHidden, setFormHidden] = useState(false);
  const [successHidden, setSuccessHidden] = useState(true);
  const [myRefLink, setMyRefLink] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [initialToastShown, setInitialToastShown] = useState(false);

  function showToastFunc(msg: string) {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  }

  useEffect(() => {
    if (refCode && !initialToastShown) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToastMsg("Referral code applied: " + refCode);
      setShowToast(true);
      setInitialToastShown(true);
      setTimeout(() => setShowToast(false), 2500);
    }
  }, [refCode, initialToastShown]);

  function handleJoin() {
    if (!name.trim()) {
      showToastFunc("Please enter your name");
      return;
    }
    if (!phone.trim()) {
      showToastFunc("Please enter your WhatsApp number");
      return;
    }
    if (!consent) {
      showToastFunc("Please accept the POPIA consent to continue");
      return;
    }

    const code = genCode(name);
    const refLink = BASE_URL + '?ref=' + code;

    setMyRefLink(refLink);
    setSuccessMsg(`Hi ${name.split(' ')[0]}! Share your referral link to move up — every friend who joins bumps you 5 spots closer to launch.`);

    setCounter(prev => prev + 1);

    setFormHidden(true);
    setSuccessHidden(false);

    const waMsg = `Hi Ubuntu Pools! I just joined the waitlist.\nName: ${name}\nNumber: ${phone}${refCode ? '\nReferred by: ' + refCode : ''}\n\nI consent to POPIA processing.`;
    setTimeout(() => {
      window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waMsg)}`, '_blank');
    }, 600);
  }

  function copyRefLink() {
    navigator.clipboard.writeText(myRefLink).then(() => showToastFunc('Link copied!')).catch(() => {
      const input = document.getElementById('my-ref-link') as HTMLInputElement;
      input.select();
      showToastFunc('Copy the link above');
    });
  }

  function shareWhatsApp() {
    const msg = `I just joined Ubuntu Pools — community savings built on Ubuntu philosophy.\nStake from R500, earn together, governed by us.\n\nJoin the waitlist: ${myRefLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  }

  function openWhatsApp() {
    window.open(WA_GROUP_LINK, '_blank');
  }

  return (
    <div className="max-w-[640px] mx-auto px-6 py-10 pb-16">
      <p className="text-xs font-medium uppercase tracking-[0.1em] text-[var(--text-tertiary)] mb-6">Vaguely Vanity LLC</p>
      <span className="inline-block text-xs font-medium uppercase tracking-[0.08em] bg-[var(--ubuntu-light)] text-[var(--ubuntu-dark)] px-3 py-1 rounded-[20px] mb-6">Gqeberha · Eastern Cape</span>
      <h1 className="font-['Playfair_Display'] text-[2.4rem] leading-[1.2] font-semibold text-[var(--text-primary)] mb-3">&ldquo;<span className="text-[var(--ubuntu-green)]">Umuntu ngumuntu</span> ngabantu&rdquo;</h1>
      <p className="text-sm text-[var(--text-secondary)] leading-[1.7] mb-8 border-l-4 border-[var(--ubuntu-green)] pl-4 italic">Community savings built on Ubuntu philosophy. Stake from R500. Earn together. Governed by the group, not a bank.</p>

      <div className="grid grid-cols-3 gap-2.5 mb-8">
        <div className="bg-[var(--bg-primary)] rounded-[var(--radius-md)] p-4 text-center border border-[var(--border-tertiary)]">
          <div className="text-xl font-medium text-[var(--ubuntu-green)]" id="counter">{counter}</div>
          <div className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-[0.05em] mt-1">Waiting</div>
        </div>
        <div className="bg-[var(--bg-primary)] rounded-[var(--radius-md)] p-4 text-center border border-[var(--border-tertiary)]">
          <div className="text-xl font-medium text-[var(--ubuntu-green)]">R500</div>
          <div className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-[0.05em] mt-1">Min. stake</div>
        </div>
        <div className="bg-[var(--bg-primary)] rounded-[var(--radius-md)] p-4 text-center border border-[var(--border-tertiary)]">
          <div className="text-xl font-medium text-[var(--ubuntu-green)]">100%</div>
          <div className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-[0.05em] mt-1">Community</div>
        </div>
      </div>

      <div id="form-section" className={formHidden ? 'hidden' : ''}>
        <div className="bg-[var(--bg-primary)] border border-[var(--border-tertiary)] rounded-[var(--radius-lg)] p-6 mb-6">
          <p className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-3">Confirm your spot</p>
          <div className="flex flex-col gap-2.5 mb-3">
            <input type="text" id="name-input" placeholder="Your name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 rounded-[var(--radius-md)] border border-[var(--border-secondary)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] font-['DM_Sans'] outline-none focus:border-[var(--ubuntu-green)]" />
            <input type="tel" id="phone-input" placeholder="WhatsApp number (e.g. 083 000 0000)" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 rounded-[var(--radius-md)] border border-[var(--border-secondary)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] font-['DM_Sans'] outline-none focus:border-[var(--ubuntu-green)]" />
          </div>

          <div className="bg-[var(--ubuntu-gold-light)] border border-[#FAC775] rounded-[var(--radius-md)] p-4 flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 bg-[#EF9F27] rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="text-[13px] text-[#633806] leading-[1.5]">
              <strong className="text-[#412402] block mb-1">Refer a friend, move up the list</strong>
              Every person who joins with your link bumps you 5 spots closer to launch access.
            </div>
          </div>

          <p className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-1">Were you referred by someone?</p>
          <input type="text" id="ref-code-input" placeholder="Referral code (optional)" value={refCode} onChange={e => setRefCode(e.target.value)} className="w-full p-3 rounded-[var(--radius-md)] border border-[var(--border-secondary)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] font-['DM_Sans'] outline-none mb-3 focus:border-[var(--ubuntu-green)]" />

          <div className="flex items-start gap-2.5 mb-6">
            <input type="checkbox" id="popia-check" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5 accent-[var(--ubuntu-green)] flex-shrink-0" />
            <label htmlFor="popia-check" className="text-xs text-[var(--text-secondary)] leading-[1.6]">I consent to Ubuntu Pools (Vaguely Vanity LLC) processing my information under POPIA to manage my waitlist registration and send me updates.</label>
          </div>

          <button onClick={handleJoin} className="w-full p-3.5 rounded-[var(--radius-md)] bg-[var(--ubuntu-green)] border-none text-white text-sm font-medium font-['DM_Sans'] cursor-pointer transition-all hover:bg-[var(--ubuntu-dark)] active:scale-95 tracking-[0.02em]">Confirm my spot</button>
        </div>

        <div onClick={openWhatsApp} className="bg-[var(--bg-primary)] border border-[var(--border-tertiary)] rounded-[var(--radius-lg)] p-5 mb-6 flex items-center gap-4 cursor-pointer transition-all hover:border-[#25D366] no-underline">
          <div className="w-11 h-11 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 fill-white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-[var(--text-primary)] mb-0.5">Join our WhatsApp community</div>
            <div className="text-xs text-[var(--text-secondary)]">Get updates, ask questions, meet your pool members</div>
          </div>
          <div className="text-[var(--text-tertiary)] text-xl">›</div>
        </div>

        <div className="bg-[var(--bg-primary)] border border-[var(--border-tertiary)] rounded-[var(--radius-lg)] p-5 mb-6">
          <p className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-3">How it works</p>
          <div className="flex items-start gap-4 py-2.5 border-b border-[var(--border-tertiary)] first:pt-0 last:border-b-0 last:pb-0">
            <div className="w-7 h-7 rounded-full bg-[var(--ubuntu-light)] text-[var(--ubuntu-dark)] text-xs font-medium flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
            <div>
              <div className="text-sm font-medium text-[var(--text-primary)]">Join the waitlist</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1 leading-[1.5]">Confirm your spot and share your referral link to climb the queue</div>
            </div>
          </div>
          <div className="flex items-start gap-4 py-2.5 border-b border-[var(--border-tertiary)] first:pt-0 last:border-b-0 last:pb-0">
            <div className="w-7 h-7 rounded-full bg-[var(--ubuntu-light)] text-[var(--ubuntu-dark)] text-xs font-medium flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
            <div>
              <div className="text-sm font-medium text-[var(--text-primary)]">Get matched to a pool</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1 leading-[1.5]">We group members by contribution level and savings goal</div>
            </div>
          </div>
          <div className="flex items-start gap-4 py-2.5 border-b border-[var(--border-tertiary)] first:pt-0 last:border-b-0 last:pb-0">
            <div className="w-7 h-7 rounded-full bg-[var(--ubuntu-light)] text-[var(--ubuntu-dark)] text-xs font-medium flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
            <div>
              <div className="text-sm font-medium text-[var(--text-primary)]">Stake from R500</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1 leading-[1.5]">Contribute monthly. Your pool earns and rotates payouts</div>
            </div>
          </div>
          <div className="flex items-start gap-4 py-2.5 border-b border-[var(--border-tertiary)] first:pt-0 last:border-b-0 last:pb-0">
            <div className="w-7 h-7 rounded-full bg-[var(--ubuntu-light)] text-[var(--ubuntu-dark)] text-xs font-medium flex items-center justify-center flex-shrink-0 mt-0.5">4</div>
            <div>
              <div className="text-sm font-medium text-[var(--text-primary)]">Governed by the group</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1 leading-[1.5]">Voting, disputes, and rules — decided by members, not a bank</div>
            </div>
          </div>
        </div>
      </div>

      <div id="success-section" className={successHidden ? 'hidden' : ''}>
        <div className="bg-[var(--bg-primary)] border border-[var(--border-tertiary)] rounded-[var(--radius-lg)] p-6 mb-6">
          <div className="text-center py-2 pb-2.5">
            <div className="w-14 h-14 rounded-full bg-[var(--ubuntu-light)] mx-auto mb-4 flex items-center justify-center text-2xl text-[var(--ubuntu-dark)]">✓</div>
            <div className="font-['Playfair_Display'] text-[1.4rem] text-[var(--text-primary)] mb-2.5">You&apos;re on the list!</div>
            <p className="text-sm text-[var(--text-secondary)] leading-[1.6] mb-6" id="success-msg">{successMsg}</p>
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-1">Your referral link</p>
          <div className="flex gap-2 mb-3">
            <input type="text" id="my-ref-link" value={myRefLink} readOnly className="flex-1 p-3 rounded-[var(--radius-md)] border border-[var(--border-secondary)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] font-['DM_Sans'] cursor-default outline-none" />
            <button onClick={copyRefLink} className="px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] text-sm font-medium cursor-pointer transition-all hover:bg-[var(--bg-tertiary)] active:scale-95 text-[var(--text-primary)] font-['DM_Sans'] whitespace-nowrap">Copy</button>
          </div>
          <button onClick={shareWhatsApp} className="w-full p-3.5 rounded-[var(--radius-md)] bg-[var(--ubuntu-green)] border-none text-white text-sm font-medium font-['DM_Sans'] cursor-pointer transition-all hover:bg-[var(--ubuntu-dark)] active:scale-95 tracking-[0.02em] mt-2">Share on WhatsApp</button>
        </div>

        <div onClick={openWhatsApp} className="bg-[var(--bg-primary)] border border-[var(--border-tertiary)] rounded-[var(--radius-lg)] p-5 mb-6 flex items-center gap-4 cursor-pointer transition-all hover:border-[#25D366] no-underline">
          <div className="w-11 h-11 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 fill-white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-[var(--text-primary)] mb-0.5">Join our WhatsApp community</div>
            <div className="text-xs text-[var(--text-secondary)]">Get updates, ask questions, meet your pool members</div>
          </div>
          <div className="text-[var(--text-tertiary)] text-xl">›</div>
        </div>
      </div>

      <div className="text-xs text-[var(--text-tertiary)] text-center pt-4 leading-[1.8]">
        Gqeberha, Eastern Cape, South Africa<br />
        Pro Installations Pty Ltd — Vaguely Vanity LLC<br />
        Protected under POPIA
      </div>

      <div className={`toast ${showToast ? 'show' : ''}`} id="toast">{toastMsg}</div>
    </div>
  );
}
