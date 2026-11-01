const CACHE_PREFIX = 'serviceup.settings';

function cacheKey() {
  try {
    const configured = import.meta.env.VITE_SERVICEUP_TENANT;
    const tenant = JSON.parse(localStorage.getItem('serviceup.tenant') || 'null');
    return `${CACHE_PREFIX}.${configured || tenant?.slug || tenant?.id || 'default'}`;
  } catch {
    return `${CACHE_PREFIX}.default`;
  }
}

export function readCachedSettings() {
  try {
    return JSON.parse(localStorage.getItem(cacheKey()) || 'null');
  } catch {
    return null;
  }
}

export function cacheSettings(settings) {
  if (!settings || typeof settings !== 'object') return;
  try {
    localStorage.setItem(cacheKey(), JSON.stringify(settings));
  } catch {
    // The live settings still work when storage is unavailable.
  }
}

export async function preloadBrandImages(settings) {
  if (!settings || typeof Image === 'undefined') return;
  const urls = [settings.logoUrl, settings.faviconUrl, settings.appIconUrl].filter(Boolean);
  await Promise.all(urls.map((url) => new Promise((resolve) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = resolve;
    image.src = url;
  })));
}

export function applyBranding(settings) {
  if (!settings || typeof document === 'undefined') return;
  const theme = settings.theme || {};
  const root = document.documentElement;
  root.setAttribute('data-theme', theme.mode || 'light');

  const tokens = {
    '--su-primary': theme.primary,
    '--su-accent': theme.primary,
    '--su-secondary': theme.secondary,
    '--su-link': theme.accent,
    '--su-bg': theme.bg,
    '--su-surface': theme.surface,
    '--su-text': theme.text,
    '--su-border': theme.border,
    '--su-heading-font': theme.headingFont,
    '--su-body-font': theme.bodyFont,
  };
  Object.entries(tokens).forEach(([name, value]) => {
    if (value) root.style.setProperty(name, value);
  });
  if (theme.radius != null) root.style.setProperty('--su-radius', `${theme.radius}px`);

  document.title = settings.appName || settings.app_name || settings.name || 'ServiceUp';

  const ensureLink = (rel, href) => {
    if (!href) return;
    let link = document.querySelector(`link[rel="${rel}"]`);
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      document.head.appendChild(link);
    }
    link.href = href;
  };
  ensureLink('icon', settings.faviconUrl || '/assets/logo.svg');
  ensureLink('apple-touch-icon', settings.appIconUrl || '/assets/logo.svg');

  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = theme.primary || '#000000';
}
