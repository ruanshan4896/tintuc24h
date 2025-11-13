const DEFAULT_PATHS = [
  '/',
  '/sitemap.xml',
  '/post-sitemap.xml',
  '/page-sitemap.xml',
  '/category-sitemap.xml',
  '/tag-sitemap.xml',
];

type TriggerOptions = {
  includeDefaults?: boolean;
  logLabel?: string;
};

export async function triggerRevalidate(
  paths: string[] = [],
  options: TriggerOptions = {}
): Promise<void> {
  if (process.env.DISABLE_REVALIDATE === 'true') {
    console.warn('⚠️ Revalidate disabled via DISABLE_REVALIDATE env flag');
    return;
  }

  const { includeDefaults = true, logLabel } = options;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const revalidateSecret = process.env.REVALIDATE_SECRET;

  const set = new Set<string>();
  if (includeDefaults) {
    DEFAULT_PATHS.forEach((path) => set.add(path));
  }
  paths
    .filter((path) => typeof path === 'string' && path.trim().length > 0)
    .forEach((path) => set.add(path.startsWith('/') ? path : `/${path}`));

  const uniquePaths = Array.from(set);
  if (uniquePaths.length === 0) {
    return;
  }

  try {
    const response = await fetch(`${siteUrl}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: revalidateSecret,
        paths: uniquePaths,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ Failed to trigger revalidate', {
        status: response.status,
        statusText: response.statusText,
        body: text,
        paths: uniquePaths,
        logLabel,
      });
    } else {
      console.log('✅ Triggered revalidate', {
        paths: uniquePaths,
        logLabel,
      });
    }
  } catch (error: any) {
    console.error('❌ Error triggering revalidate', {
      message: error?.message,
      stack: error?.stack,
      paths: uniquePaths,
      logLabel,
    });
  }
}

export { DEFAULT_PATHS as DEFAULT_REVALIDATE_PATHS };

