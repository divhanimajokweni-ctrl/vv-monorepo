import { readFileSync } from 'fs';
import { join } from 'path';

export async function getStaticProps() {
  const dashboardPath = join(process.cwd(), 'public', 'dashboard.html');
  const dashboardHtml = readFileSync(dashboardPath, 'utf8');

  return {
    props: {
      dashboardHtml,
    },
  };
}

export default function Page({ dashboardHtml }: { dashboardHtml: string }) {
  return (
    <div
      dangerouslySetInnerHTML={{ __html: dashboardHtml }}
      style={{ margin: 0, padding: 0 }}
    />
  );
}