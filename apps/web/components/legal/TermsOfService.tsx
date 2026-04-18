'use client';

interface TermsOfServiceProps {
  entityName?: string;
}

export function TermsOfService({ entityName = 'Ubuntu Pools' }: TermsOfServiceProps) {
  return (
    <div className="up-card p-6 space-y-6">
      <h2 className="text-xl font-black tracking-tight">Terms of Service</h2>
      
      <div className="space-y-4 text-sm text-[color:var(--muted)]">
        <section>
          <h3 className="font-medium text-[color:var(--text)] mb-2">1. Acceptance of Terms</h3>
          <p>By accessing and using {entityName}, you agree to be bound by these Terms of Service.</p>
        </section>

        <section>
          <h3 className="font-medium text-[color:var(--text)] mb-2">2. Use License</h3>
          <p>Permission is granted to temporarily use {entityName} for personal, non-commercial use only.</p>
        </section>

        <section>
          <h3 className="font-medium text-[color:var(--text)] mb-2">3. Intellectual Property</h3>
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-amber-400 font-medium">
              ⚠️ PROPRIETARY INTELLECTUAL PROPERTY
            </p>
            <p className="mt-2">
              The <strong>Ubuntu Score™</strong> methodology, the <strong>Ubuntu Accord</strong> framework, 
              and all associated algorithms, scoring models, and governance mechanisms are the sole 
              intellectual property of {entityName}. 
            </p>
            <p className="mt-2">
              No part of this software may be reproduced, distributed, or transmitted in any form 
              or by any means without prior written permission.
            </p>
          </div>
        </section>

        <section>
          <h3 className="font-medium text-[color:var(--text)] mb-2">4. User Data & Privacy</h3>
          <p>
            Your data is governed by our Privacy Policy. The &quot;Sovereignty Toggle&quot; gives you granular 
            control over what social data is used for financial recommendations.
          </p>
        </section>

        <section>
          <h3 className="font-medium text-[color:var(--text)] mb-2">5. Limitation of Liability</h3>
          <p>
            {entityName} is provided &quot;as is&quot; without warranty of any kind. Financial decisions 
            should be made with due diligence.
          </p>
        </section>

        <section>
          <h3 className="font-medium text-[color:var(--text)] mb-2">6. Contact</h3>
          <p>For IP licensing inquiries, contact: legal@{entityName.toLowerCase().replace(/ /g, '')}.com</p>
        </section>
      </div>

      <div className="pt-4 border-t border-[color:var(--border)] text-xs text-[color:var(--muted)]">
        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
  );
}

export function PrivacyPolicy({ entityName = 'Ubuntu Pools' }: TermsOfServiceProps) {
  return (
    <div className="up-card p-6 space-y-6">
      <h2 className="text-xl font-black tracking-tight">Privacy Policy</h2>
      
      <div className="space-y-4 text-sm text-[color:var(--muted)]">
        <section>
          <h3 className="font-medium text-[color:var(--text)] mb-2">Data Collection</h3>
          <p>We collect minimal data necessary for platform functionality: authentication, contributions, and reputation.</p>
        </section>

        <section>
          <h3 className="font-medium text-[color:var(--text)] mb-2">Sovereignty Toggle</h3>
          <p>You control which social data feeds are accessible through the dashboard settings.</p>
        </section>

        <section>
          <h3 className="font-medium text-[color:var(--text)] mb-2">Right to be Forgotten</h3>
          <p>Request deletion of your social cache while maintaining financial records for compliance.</p>
        </section>

        <section>
          <h3 className="font-medium text-[color:var(--text)] mb-2">Contact</h3>
          <p>privacy@{entityName.toLowerCase().replace(/ /g, '')}.com</p>
        </section>
      </div>

      <div className="pt-4 border-t border-[color:var(--border)] text-xs text-[color:var(--muted)]">
        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
  );
}
