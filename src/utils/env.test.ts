import * as os from 'node:os';
import { Request } from 'express';
import { envGet, envGetAppId, envGetAppName, envGetRequired, envIsProd, getCacheDir, isElfHostedInstance } from './env';

describe('env', () => {
  test('envGet', () => {
    expect(envGet('NODE_ENV')).toBe('test');
  });

  test('envGetRequired set', () => {
    expect(envGetRequired('NODE_ENV')).toBe('test');
  });

  test('envGetRequired not set', () => {
    expect(() => envGetRequired('NOT_SET')).toThrow('Environment variable "NOT_SET" is not configured.');
  });

  test('envGetAppId', () => {
    expect(envGetAppId()).toBe('fluxstream');

    process.env['MANIFEST_ID'] = 'fluxstream.dev';
    expect(envGetAppId()).toBe('fluxstream.dev');
    delete process.env['MANIFEST_ID'];
  });

  test('envGetAppName', () => {
    expect(envGetAppName()).toBe('FluxStream');

    process.env['MANIFEST_NAME'] = 'FluxStream | dev';
    expect(envGetAppName()).toBe('FluxStream | dev');
    delete process.env['MANIFEST_NAME'];
  });

  test('envIsProd', () => {
    expect(envIsProd()).toBeFalsy();

    const previousNodeEnv = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'production';
    expect(envIsProd()).toBeTruthy();
    process.env['NODE_ENV'] = previousNodeEnv;
  });

  test('isElfHostedInstancce', () => {
    expect(isElfHostedInstance({ host: 'someuser.elfhosted.com' } as Request)).toBeTruthy();
    expect(isElfHostedInstance({ host: 'webstreamr.hayd.uk' } as Request)).toBeFalsy();
  });

  test('getCacheDir', () => {
    const previousCacheDir = process.env['CACHE_DIR'];
    delete process.env['CACHE_DIR'];
    expect(getCacheDir()).toBe(os.tmpdir());
    process.env['CACHE_DIR'] = previousCacheDir;

    expect(getCacheDir()).toBe('/dev/null');
  });
});
