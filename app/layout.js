import './globals.css';

import SiteChrome from '../components/SiteChrome';
import BacksoundPlayer from '../components/BacksoundPlayer';
import FeedbackButton from '../components/FeedbackButton';

import { getSession } from '../lib/auth';
import { getSettings } from '../lib/settings';
import { recordLoginDay } from '../lib/streak';

export const metadata = {
  title: 'DramaVers',
  description: 'Kumpulan klip Asia, Western, JKT48, KPOP, Anime',
};

export default async function RootLayout({ children }) {
  const session = getSession();

  if (session) {
    await recordLoginDay(session.id);
  }

  const settings = await getSettings([
    'backsound_enabled',
    'backsound_url',
  ]);

  return (
    <html lang="id">
      <body>
        <SiteChrome session={session}>
          {children}
        </SiteChrome>

        <BacksoundPlayer
          enabled={settings.backsound_enabled === 'true'}
          url={settings.backsound_url}
        />

        <FeedbackButton />
      </body>
    </html>
  );
}