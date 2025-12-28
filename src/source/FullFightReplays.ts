import * as cheerio from 'cheerio';
import levenshtein from 'fast-levenshtein';
import { ContentType } from 'stremio-addon-sdk';
import { Context, CountryCode, Meta } from '../types';
import { EventId, Fetcher, getTmdbId, getTmdbNameAndYear, Id, ImdbId } from '../utils';
import { Source, SourceResult } from './Source';

export class FullFightReplays extends Source {
  public readonly id = 'fullfightreplays';

  public readonly label = 'FullFightReplays';

  public readonly contentTypes: ContentType[] = ['tv'];

  public readonly countryCodes: CountryCode[] = [CountryCode.multi, CountryCode.en];

  public readonly baseUrl = 'https://fullfightreplays.com';

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

    const eventUrl = new URL(`/${eventSlug}`, this.baseUrl);
    const html = await this.fetcher.text(ctx, eventUrl);
    const $ = cheerio.load(html);

    const sourceResults: SourceResult[] = [];

    // Try to find iframe embeds (some pages might have direct embeds)
    $('iframe').each((_i, el) => {
      const src = $(el).attr('src');
      if (src) {
        try {
          const url = new URL(src, this.baseUrl);
          const meta: Meta = {
            title: `Embed ${_i + 1}`,
            sourceLabel: this.label,
            sourceId: this.id,
          };

          sourceResults.push({ url, meta });
        } catch (error) {
          // Skip invalid URLs
        }
      }
    });

    // Try to find video tags
    $('video source').each((_i, el) => {
      const src = $(el).attr('src');
      if (src) {
        try {
          const url = new URL(src, this.baseUrl);
          const meta: Meta = {
            title: `Video ${_i + 1}`,
            sourceLabel: this.label,
            sourceId: this.id,
          };

          sourceResults.push({ url, meta });
        } catch (error) {
          // Skip invalid URLs
        }
      }
    });

    // Note: This site uses heavy JavaScript to load video players dynamically.
    // A more advanced implementation would require a headless browser (Puppeteer/Playwright)
    // to execute JavaScript and extract the dynamically loaded video URLs.

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

      // Try multiple selectors for the title
      let title = $('h1[data-testid="hero__pageTitle"] span').first().text().trim();

      if (!title) {
        title = $('h1').first().text().trim();
      }

      if (!title) {
        // Try JSON-LD metadata
        const jsonLd = $('script[type="application/ld+json"]').first().html();
        if (jsonLd) {
          const data = JSON.parse(jsonLd);
          title = data.name || '';
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

    // Find event links in search results
    const eventLinks = $('.short_cont h3 a[href], .inf_raited_title a[href]')
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

    // Extract slug from URL (remove base URL and leading slash)
    const url = new URL(bestMatch.href, this.baseUrl);
    return url.pathname.replace(/^\//, '');
  }
}
