import { readFileSync } from 'fs';
import { join } from 'path';

export default function Page() {
  // Read the dashboard HTML file
  const dashboardPath = join(process.cwd(), 'public', 'dashboard.html');
  const dashboardHtml = readFileSync(dashboardPath, 'utf8');

  return (
    <div
      dangerouslySetInnerHTML={{ __html: dashboardHtml }}
      style={{ margin: 0, padding: 0 }}
    />
  );
}