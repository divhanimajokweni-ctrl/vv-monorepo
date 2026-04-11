'use client';

import { useState, useEffect } from 'react';

interface Member {
  id: string;
  name: string;
  phone: string;
  stake: number;
  payment_status: string;
  joined: string;
  paid_out: boolean;
  referral_code: string;
}

interface Payout {
  id: string;
  member_name: string;
  amount: number;
  expected_date?: string;
  status: string;
}

interface FrictionLog {
  date: string;
  member_name: string;
  stage: string;
  priority: string;
  desc: string;
  potential_fix?: string;
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [frictionLogs, setFrictionLogs] = useState<FrictionLog[]>([]);
  const [showFrictionModal, setShowFrictionModal] = useState(false);
  const [frictionMember, setFrictionMember] = useState('');
  const [frictionDesc, setFrictionDesc] = useState('');
  const [frictionStage, setFrictionStage] = useState('Signup');
  const [frictionPriority, setFrictionPriority] = useState('High');
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  const loadData = () => {
    setMembers(JSON.parse(localStorage.getItem('ubuntu_members') || '[]'));
    setPayouts(JSON.parse(localStorage.getItem('ubuntu_payouts') || '[]'));
    setFrictionLogs(JSON.parse(localStorage.getItem('ubuntu_friction') || '[]'));
  };

  useEffect(() => {
    const pwd = prompt("Admin access required. Enter password:");
    if (pwd === "ubuntu2025") {
      setAuthenticated(true); // eslint-disable-line react-hooks/set-state-in-effect
      loadData();
    } else if (pwd !== null) {
      alert("Wrong password");
      window.location.href = '/';
    }
  }, []);

  const persistData = () => {
    localStorage.setItem('ubuntu_members', JSON.stringify(members));
    localStorage.setItem('ubuntu_payouts', JSON.stringify(payouts));
    localStorage.setItem('ubuntu_friction', JSON.stringify(frictionLogs));
  };

  const showToastFunc = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const markPayout = (id: string) => {
    const member = members.find(m => m.id === id);
    if (member && !member.paid_out) {
      const existingPayout = payouts.find(p => p.id === id);
      if (existingPayout) {
        existingPayout.status = 'pending';
      } else {
        setPayouts(prev => [...prev, { id, member_name: member.name, amount: member.stake, status: 'pending' }]);
      }
      persistData();
      showToastFunc('Payout scheduled');
    }
  };

  const completePayout = (payoutId: string) => {
    setPayouts(prev => prev.map(p => p.id === payoutId ? { ...p, status: 'completed' } : p));
    setMembers(prev => prev.map(m => m.id === payoutId ? { ...m, paid_out: true } : m));
    persistData();
    showToastFunc('Payout completed');
  };

  const saveFriction = () => {
    if (!frictionDesc.trim()) {
      showToastFunc('Describe friction');
      return;
    }
    const newLog: FrictionLog = {
      date: new Date().toLocaleString(),
      member_name: frictionMember,
      stage: frictionStage,
      priority: frictionPriority,
      desc: frictionDesc,
      potential_fix: ''
    };
    setFrictionLogs(prev => [newLog, ...prev]);
    persistData();
    setShowFrictionModal(false);
    setFrictionMember('');
    setFrictionDesc('');
    showToastFunc('Friction logged → product roadmap');
  };

  if (!authenticated) return null;

  const totalStake = members.reduce((s, m) => s + (m.stake || 0), 0);
  const paidMembers = members.filter(m => m.payment_status === 'paid').length;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🛠️ Ubuntu Pools Admin</h1>
        <button onClick={() => window.location.href = '/'} className="px-4 py-2 bg-gray-200 rounded">Logout</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">{members.length}</div>
          <div className="text-sm text-gray-600">Total Members</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">{paidMembers}</div>
          <div className="text-sm text-gray-600">Paid</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">R{totalStake.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Pool Volume</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">{payouts.filter(p => p.status === 'pending').length}</div>
          <div className="text-sm text-gray-600">Pending Payouts</div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg border mb-6">
        <h2 className="text-xl font-semibold mb-4">📋 Pilot Members</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-2 border-b">Name</th>
              <th className="text-left p-2 border-b">WhatsApp</th>
              <th className="text-left p-2 border-b">Stake</th>
              <th className="text-left p-2 border-b">Status</th>
              <th className="text-left p-2 border-b">Action</th>
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id}>
                <td className="p-2 border-b">{m.name}</td>
                <td className="p-2 border-b">{m.phone}</td>
                <td className="p-2 border-b">R{m.stake}</td>
                <td className="p-2 border-b text-green-600 font-medium">{m.payment_status}</td>
                <td className="p-2 border-b">
                  <button onClick={() => markPayout(m.id)} className="text-xs px-3 py-1 bg-blue-500 text-white rounded">Schedule payout</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-white p-6 rounded-lg border mb-6">
        <h2 className="text-xl font-semibold mb-4">💰 Payout Queue</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-2 border-b">Member</th>
              <th className="text-left p-2 border-b">Amount</th>
              <th className="text-left p-2 border-b">Status</th>
              <th className="text-left p-2 border-b">Mark complete</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map(p => (
              <tr key={p.id}>
                <td className="p-2 border-b">{p.member_name}</td>
                <td className="p-2 border-b">R{p.amount}</td>
                <td className="p-2 border-b">{p.status}</td>
                <td className="p-2 border-b">
                  {p.status === 'pending' && (
                    <button onClick={() => completePayout(p.id)} className="text-xs px-3 py-1 bg-green-500 text-white rounded">✓ Paid out</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">📝 Friction Log (Product Roadmap)</h2>
        {frictionLogs.map((f, i) => (
          <div key={i} className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded">
            <strong>{f.date} | {f.stage} | {f.priority}</strong><br />
            {f.desc}<br />
            <em>Fix idea: {f.potential_fix || 'Not yet'}</em>
          </div>
        ))}
        <button onClick={() => setShowFrictionModal(true)} className="px-4 py-2 bg-green-600 text-white rounded">+ Log friction point</button>
      </div>

      {showFrictionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Log friction</h3>
            <input type="text" placeholder="Member name" value={frictionMember} onChange={e => setFrictionMember(e.target.value)} className="w-full p-3 border rounded mb-3" />
            <textarea rows={3} placeholder="Exact words / hesitation" value={frictionDesc} onChange={e => setFrictionDesc(e.target.value)} className="w-full p-3 border rounded mb-3"></textarea>
            <select value={frictionStage} onChange={e => setFrictionStage(e.target.value)} className="w-full p-3 border rounded mb-3">
              <option>Signup</option>
              <option>Payment</option>
              <option>WhatsApp</option>
              <option>Payout</option>
            </select>
            <select value={frictionPriority} onChange={e => setFrictionPriority(e.target.value)} className="w-full p-3 border rounded mb-4">
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
            <div className="flex gap-2">
              <button onClick={saveFriction} className="px-4 py-2 bg-green-600 text-white rounded">Save</button>
              <button onClick={() => setShowFrictionModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className={`fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full text-sm transition-transform ${showToast ? 'translate-y-0' : 'translate-y-20'}`}>
        {toastMsg}
      </div>
    </div>
  );
}