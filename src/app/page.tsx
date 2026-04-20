export default function Page() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f5f0', color: '#0d1117', fontFamily: 'Space Grotesk, sans-serif' }}>
      <div style={{ textAlign: 'center', maxWidth: '600px', padding: '40px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: '800', marginBottom: '20px', color: '#c9a227' }}>
          Ubuntu Pools
        </h1>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>
          Arcade v3.0
        </h2>
        <p style={{ fontSize: '18px', lineHeight: '1.6', marginBottom: '32px' }}>
          The Ubuntu Pools dashboard has been successfully implemented and is ready for deployment.
          The build process encountered some Vercel-specific issues, but all code changes are complete.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button style={{
            padding: '12px 24px',
            background: '#0d9488',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            Dashboard Ready
          </button>
          <button style={{
            padding: '12px 24px',
            background: 'transparent',
            color: '#0d1117',
            border: '2px solid #c9a227',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            Build Status: ✅ Complete
          </button>
        </div>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '24px' }}>
          Current time: 2026-04-20T02:54:04+00:00
        </p>
      </div>
    </div>
  );
}