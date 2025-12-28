import { envGet, Fetcher } from '../utils';
import { Eurostreaming } from './Eurostreaming';
import { FullFightReplays } from './FullFightReplays';
import { MostraGuarda } from './MostraGuarda';
import { Source } from './Source';
import { VixSrc } from './VixSrc';
import { WatchMMAFull } from './WatchMMAFull';

export * from './Source';

export const createSources = (fetcher: Fetcher): Source[] => {
  const disabledSources = envGet('DISABLED_SOURCES')?.split(',') ?? [];

  return [
    // Multi-language
    new VixSrc(fetcher),
    // Sports / Events (EN)
    new FullFightReplays(fetcher),
    new WatchMMAFull(fetcher),
    // Italian
    new Eurostreaming(fetcher),
    new MostraGuarda(fetcher),
  ].filter(source => !disabledSources.includes(source.id));
};
