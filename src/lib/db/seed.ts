import { v4 as uuidv4 } from 'uuid';

export interface SeedMember {
  id: string;
  name: string;
  email: string;
  reputationScore: number;
  creditBalance: number;
  contributionTotal: number;
}

export interface SeedVillage {
  id: string;
  name: string;
  members: SeedMember[];
  poolBalance: number;
  transactionCount: number;
  governanceProposals: SeedProposal[];
}

export interface SeedProposal {
  id: string;
  title: string;
  description: string;
  votesFor: number;
  votesAgainst: number;
  status: 'active' | 'passed' | 'rejected';
}

const generateMembers = (count: number, villageId: string): SeedMember[] => {
  const firstNames = [
    'Amara', 'Themba', 'Zuri', 'Kwame', 'Nia', 'Jelani', 'Ayana', 'Kofi',
    'Fatima', 'Omar', 'Grace', 'David', 'Miriam', 'Joseph', 'Sarah', 'Michael',
    'Rebecca', 'Daniel', 'Hannah', 'Samuel', 'Abigail', 'John', 'Elizabeth', 'James', 'Mary'
  ];
  const lastNames = [
    'Mbeki', 'Zuma', 'Nkosi', 'Mensah', 'Okonkwo', 'Toure', 'Mwangi', 'Diallo',
    'Hassan', 'Musa', 'Patel', 'Singh', 'Kim', 'Chen', 'Smith', 'Johnson'
  ];

  return Array.from({ length: count }, (_, i) => {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
    const reputationScore = 40 + Math.floor(Math.random() * 55);
    const contributionTotal = 500 + Math.floor(Math.random() * 9500);

    return {
      id: uuidv4(),
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
      reputationScore,
      creditBalance: contributionTotal * (0.3 + Math.random() * 0.5),
      contributionTotal,
    };
  });
};

const generateProposals = (): SeedProposal[] => [
  {
    id: uuidv4(),
    title: 'Community Garden Project',
    description: 'Allocate funds to establish a community vegetable garden to improve food security.',
    votesFor: 18,
    votesAgainst: 4,
    status: 'passed',
  },
  {
    id: uuidv4(),
    title: 'Youth Skills Training Program',
    description: 'Fund digital literacy and trades training for young members.',
    votesFor: 22,
    votesAgainst: 2,
    status: 'passed',
  },
  {
    id: uuidv4(),
    title: 'Solar Panel Installation',
    description: 'Install solar panels on community center to reduce electricity costs.',
    votesFor: 12,
    votesAgainst: 8,
    status: 'active',
  },
  {
    id: uuidv4(),
    title: 'Emergency Relief Fund',
    description: 'Create emergency fund for member hardship assistance.',
    votesFor: 25,
    votesAgainst: 0,
    status: 'passed',
  },
  {
    id: uuidv4(),
    title: 'Village Market Day',
    description: 'Organize monthly market day for members to sell produce.',
    votesFor: 15,
    votesAgainst: 6,
    status: 'active',
  },
];

export const generateSeedData = (): SeedVillage => {
  const villageId = uuidv4();
  const members = generateMembers(25, villageId);
  const poolBalance = members.reduce((sum, m) => sum + m.contributionTotal, 0);
  const transactionCount = Math.floor(poolBalance * 0.3 * (0.8 + Math.random() * 0.4));

  return {
    id: villageId,
    name: 'Soweto Collective',
    members,
    poolBalance,
    transactionCount,
    governanceProposals: generateProposals(),
  };
};

export const seedData = generateSeedData();

if (require.main === module) {
  console.log('\n=== Ubuntu Pools Seed Data ===\n');
  console.log(`Village: ${seedData.name}`);
  console.log(`Members: ${seedData.members.length}`);
  console.log(`Pool Balance: R${seedData.poolBalance.toLocaleString()}`);
  console.log(`Transactions: ${seedData.transactionCount}`);
  console.log(`Governance Proposals: ${seedData.governanceProposals.length}`);
  console.log('\n--- Sample Members ---\n');
  
  seedData.members.slice(0, 5).forEach((member, i) => {
    console.log(`${i + 1}. ${member.name}`);
    console.log(`   Email: ${member.email}`);
    console.log(`   Reputation Score: ${member.reputationScore}`);
    console.log(`   Credit Balance: R${member.creditBalance.toFixed(2)}`);
    console.log(`   Contribution Total: R${member.contributionTotal.toLocaleString()}`);
    console.log('');
  });

  console.log('--- Sample Proposals ---\n');
  seedData.governanceProposals.forEach((proposal) => {
    console.log(`[${proposal.status.toUpperCase()}] ${proposal.title}`);
    console.log(`   Votes For: ${proposal.votesFor} | Against: ${proposal.votesAgainst}`);
    console.log('');
  });

  console.log('Seed data generated successfully!\n');
}
