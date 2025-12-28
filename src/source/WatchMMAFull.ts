import * as cheerio from 'cheerio';
import { ContentType } from 'stremio-addon-sdk';
import { Context, CountryCode, Meta } from '../types';
import { EventId, Fetcher, Id } from '../utils';
import { Source, SourceResult } from './Source';

export class WatchMMAFull extends Source {
  public readonly id = 'watchmmafull';

  public readonly label = 'WatchMMAFull';

  public readonly contentTypes: ContentType[] = ['tv'];

  public readonly countryCodes: CountryCode[] = [CountryCode.multi, CountryCode.en];

  public readonly baseUrl = 'https://watchmmafull.com';

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

    const eventUrl = new URL(`/${id.slug}.html`, this.baseUrl);
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
}
