import { InjectionToken } from './token';
import { Injector } from './injector';

interface ResolvePathItem {
  token: InjectionToken<unknown>;
  injector: Injector;
}

export type ResolvePath = ResolvePathItem[];

export function formatResolvePath(chain: ResolvePath): string {
  return chain.map((x) => `${x.token.name}@${x.injector.depth}`).join(' → ');
}
