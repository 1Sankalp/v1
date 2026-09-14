export type LinkPreview = {
  url: string;
  image: string | null;
  title: string | null;
  source: 'og' | 'github' | 'youtube' | 'screenshot' | 'none';
};

const FETCH_TIMEOUT_MS = 4500;
const USER_AGENT =
  'Mozilla/5.0 (compatible; SuperfolioPreview/1.0; +https://www.superfolio.me)';

export function normalizePreviewUrl(raw: string): URL | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const url = new URL(withProtocol);
    if (url.protocol === 'http:') url.protocol = 'https:';
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url;
  } catch {
    return null;
  }
}

export function githubOpenGraphImage(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, '');
  if (host !== 'github.com') return null;
  const [owner, repo] = url.pathname.split('/').filter(Boolean);
  if (!owner || !repo) return null;
  if (['settings', 'login', 'orgs', 'marketplace', 'topics'].includes(owner)) {
    return null;
  }
  return `https://opengraph.githubassets.com/1/${owner}/${repo}`;
}

export function youtubeThumbnail(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, '');
  let videoId: string | undefined;

  if (host === 'youtu.be') {
    videoId = url.pathname.split('/').filter(Boolean)[0];
  } else if (host === 'youtube.com' || host === 'm.youtube.com') {
    videoId = url.searchParams.get('v') || undefined;
    if (!videoId) {
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0] === 'embed' || parts[0] === 'shorts') videoId = parts[1];
    }
  }

  if (!videoId || videoId.length < 8) return null;
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function screenshotFallback(url: URL): string {
  return `https://image.thum.io/get/width/800/crop/500/noanimate/${url.href}`;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function metaContent(html: string, keys: string[]): string | null {
  for (const key of keys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      new RegExp(
        `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`,
        'i'
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`,
        'i'
      ),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return decodeHtml(match[1]);
    }
  }
  return null;
}

function resolveUrl(base: URL, maybeRelative: string): string | null {
  try {
    return new URL(maybeRelative, base).href;
  } catch {
    return null;
  }
}

function unwrapNextImage(resolved: string, base: URL): string {
  try {
    const parsed = new URL(resolved);
    const inner = parsed.searchParams.get('url');
    if (parsed.pathname.includes('/_next/image') && inner) {
      return resolveUrl(base, inner) || resolved;
    }
  } catch {
    // keep original
  }
  return resolved;
}

function rankPreviewImage(imageUrl: string): number {
  const value = imageUrl.toLowerCase();
  if (/hero|cover|og[-_]?image|screenshot|poster|preview|banner|opengraph/.test(value)) return 0;
  if (/\.(jpe?g|png|webp)(\?|$)/.test(value) && !/logo|icon|favicon|avatar|apple-touch/.test(value)) {
    return 1;
  }
  if (/logo|icon|favicon|avatar|apple-touch/.test(value)) return 6;
  return 4;
}

function forEachMatch(html: string, pattern: RegExp, onMatch: (match: RegExpExecArray) => void) {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  const regex = new RegExp(pattern.source, flags);
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    onMatch(match);
  }
}

function extractCandidateImages(html: string, base: URL): string[] {
  const found = new Set<string>();
  const add = (raw?: string | null) => {
    if (!raw) return;
    const token = decodeHtml(raw.trim().split(/[\s,]/)[0] || '');
    if (!token || token.startsWith('data:')) return;
    const resolved = resolveUrl(base, token);
    if (!resolved) return;
    const unwrapped = unwrapNextImage(resolved, base);
    const lower = unwrapped.toLowerCase();
    if (lower.endsWith('.svg') || lower.includes('1x1') || lower.includes('pixel.gif')) return;
    found.add(unwrapped);
  };

  forEachMatch(
    html,
    /<meta[^>]+(?:property|name)=["'](?:og:image(?:url)?|twitter:image(?::src)?)["'][^>]+content=["']([^"']+)["']/gi,
    (match) => add(match[1])
  );
  forEachMatch(
    html,
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image(?:url)?|twitter:image(?::src)?)["']/gi,
    (match) => add(match[1])
  );
  forEachMatch(html, /<img[^>]+src=["']([^"']+)["']/gi, (match) => add(match[1]));
  forEachMatch(html, /srcSet=["']([^"']+)["']/gi, (match) => add(match[1].split(',')[0]));

  return Array.from(found).sort((a, b) => rankPreviewImage(a) - rankPreviewImage(b));
}

async function fetchHtml(url: URL): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url.href, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': USER_AGENT,
      },
    });
    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return null;
    }
    const html = await response.text();
    return html.slice(0, 250_000);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function getLinkPreview(raw: string): Promise<LinkPreview> {
  const url = normalizePreviewUrl(raw);
  if (!url) {
    return { url: raw, image: null, title: null, source: 'none' };
  }

  const githubImage = githubOpenGraphImage(url);
  if (githubImage) {
    return { url: url.href, image: githubImage, title: null, source: 'github' };
  }

  const youtubeImage = youtubeThumbnail(url);
  if (youtubeImage) {
    return { url: url.href, image: youtubeImage, title: null, source: 'youtube' };
  }

  const html = await fetchHtml(url);
  if (html) {
    const title =
      metaContent(html, ['og:title', 'twitter:title']) ||
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
      null;
    const decodedTitle = title ? decodeHtml(title) : null;
    const candidates = extractCandidateImages(html, url);
    const photo = candidates.find((image) => rankPreviewImage(image) <= 1) || null;
    if (photo) {
      return {
        url: url.href,
        image: photo,
        title: decodedTitle,
        source: 'og',
      };
    }
    if (decodedTitle) {
      return {
        url: url.href,
        image: screenshotFallback(url),
        title: decodedTitle,
        source: 'screenshot',
      };
    }
  }

  return {
    url: url.href,
    image: screenshotFallback(url),
    title: null,
    source: 'screenshot',
  };
}
