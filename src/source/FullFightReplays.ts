import * as cheerio from 'cheerio';
import { ContentType } from 'stremio-addon-sdk';
import { Context, CountryCode, Meta } from '../types';
import { EventId, Fetcher, Id } from '../utils';
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
    if (!(id instanceof EventId)) {
      return [];
    }

    if (id.source !== this.id) {
      return [];
    }

    const eventUrl = new URL(`/${id.slug}`, this.baseUrl);
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
}
