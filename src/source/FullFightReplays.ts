import * as cheerio from 'cheerio';
import levenshtein from 'fast-levenshtein';
import { ContentType } from 'stremio-addon-sdk';
import { Context, CountryCode, Meta } from '../types';
import { EventId, Fetcher, getTmdbId, getTmdbNameAndYear, Id } from '../utils';
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
      const tmdbId = await getTmdbId(ctx, this.fetcher, id);
      const [name] = await getTmdbNameAndYear(ctx, this.fetcher, tmdbId, 'en');

      const foundSlug = await this.searchEvent(ctx, name);
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
