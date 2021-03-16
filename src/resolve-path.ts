import { Token } from './token';
import { Injector } from './injector';

interface ResolvePathItem {
  token: Token<unknown>;
  injector: Injector;
}

export type ResolvePath = ResolvePathItem[];

export function formatResolvePath(chain: ResolvePath) {
  return chain.map((x) => `${x.token.name}@${x.injector.depth}`).join(' → ');
}
