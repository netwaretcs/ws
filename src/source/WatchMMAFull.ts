import * as cheerio from 'cheerio';
import levenshtein from 'fast-levenshtein';
import { ContentType } from 'stremio-addon-sdk';
import { Context, CountryCode, Meta } from '../types';
import { EventId, Fetcher, getTmdbId, getTmdbNameAndYear, Id, ImdbId } from '../utils';
import { Source, SourceResult } from './Source';

export class WatchMMAFull extends Source {
  public readonly id = 'watchmmafull';

  public readonly label = 'WatchMMAFull';

  public readonly contentTypes: ContentType[] = ['tv', 'movie'];

  public readonly countryCodes: CountryCode[] = [CountryCode.multi, CountryCode.en];

  public readonly baseUrl = 'https://watchmmafull.com';

  private readonly fetcher: Fetcher;

  public constructor(fetcher: Fetcher) {
    super();

    this.fetcher = fetcher;
  }

  public async handleInternal(ctx: Context, _type: string, id: Id): Promise<SourceResult[]> {
    let eventSlug: string;

    if (id instanceof EventId && id.source === this.id) {
      // Direct EventId from this source
      eventSlug = id.slug;
    } else {
      // Search by name from TMDB/IMDB
      let searchName: string;

      try {
        const tmdbId = await getTmdbId(ctx, this.fetcher, id);
        const [name] = await getTmdbNameAndYear(ctx, this.fetcher, tmdbId, 'en');
        searchName = name;
      } catch (error) {
        // TMDB doesn't have this event, try to get title from IMDB directly
        if (id instanceof ImdbId) {
          const imdbTitle = await this.getTitleFromImdb(ctx, id.id);
          if (!imdbTitle) {
            return [];
          }
          searchName = imdbTitle;
        } else {
          return [];
        }
      }

      const foundSlug = await this.searchEvent(ctx, searchName);
      if (!foundSlug) {
        return [];
      }

      eventSlug = foundSlug;
    }

    const eventUrl = new URL(`/${eventSlug}.html`, this.baseUrl);
    const html = await this.fetcher.text(ctx, eventUrl);
    const $ = cheerio.load(html);

    const sourceResults: SourceResult[] = [];

    $('.video-server').each((_i, el) => {
      const dataUrl = $(el).attr('data-url');
      const dataId = $(el).attr('data-id') || 'unknown';

      if (dataUrl) {
        try {
          const url = new URL(dataUrl);
          const meta: Meta = {
            title: `Server ${_i + 1} (${dataId})`,
            sourceLabel: this.label,
            sourceId: this.id,
          };

          sourceResults.push({ url, meta });
        } catch (error) {
          // Skip invalid URLs
        }
      }
    });

    return sourceResults;
  }

  private async getTitleFromImdb(ctx: Context, imdbId: string): Promise<string | undefined> {
    try {
      const imdbUrl = new URL(`/title/${imdbId}/`, 'https://www.imdb.com');

      const html = await this.fetcher.text(ctx, imdbUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      });

      const $ = cheerio.load(html);

      let title: string | undefined;

      // Try JSON-LD metadata first (most reliable)
      $('script[type="application/ld+json"]').each((_i, el) => {
        if (title) return;
        try {
          const jsonText = $(el).html();
          if (jsonText) {
            const data = JSON.parse(jsonText);
            if (data.name) {
              title = data.name.trim();
            }
          }
        } catch (e) {
          // Invalid JSON, continue
        }
      });

      // Fallback to HTML selectors
      if (!title) {
        title = $('h1[data-testid="hero__pageTitle"] span.hero__primary-text').first().text().trim();
      }

      if (!title) {
        title = $('h1').first().text().trim();
      }

      if (!title) {
        // Try title tag as last resort
        const pageTitle = $('title').text();
        const match = pageTitle.match(/^([^(]+)/);
        if (match && match[1]) {
          title = match[1].trim();
        }
      }

      return title || undefined;
    } catch (error) {
      // Failed to scrape IMDB
      return undefined;
    }
  }

  private async searchEvent(ctx: Context, keyword: string): Promise<string | undefined> {
    const searchUrl = new URL('/', this.baseUrl);
    searchUrl.searchParams.set('s', keyword);

    const html = await this.fetcher.text(ctx, searchUrl);
    const $ = cheerio.load(html);

    // Find event links in search results (WordPress-style structure)
    const eventLinks = $('article h2 a[href], .entry-title a[href], .post-title a[href]')
      .map((_i, el) => ({
        href: $(el).attr('href') as string,
        title: $(el).text().trim(),
      }))
      .toArray();

    if (eventLinks.length === 0) {
      return undefined;
    }

    // Find best match using Levenshtein distance
    const matches = eventLinks
      .map(link => ({
        ...link,
        distance: levenshtein.get(link.title.toLowerCase(), keyword.toLowerCase(), { useCollator: true }),
      }))
      .sort((a, b) => a.distance - b.distance);

    const bestMatch = matches[0];
    if (!bestMatch) {
      return undefined;
    }

    // Extract slug from URL (remove base URL, leading slash, and .html extension)
    const url = new URL(bestMatch.href, this.baseUrl);
    return url.pathname.replace(/^\//, '').replace(/\.html$/, '');
  }
}
