import { formatResolvePath, ResolvePath } from './resolve-path';
import { Token } from './token';

export class MissingProviderError extends Error {
  constructor(readonly path: ResolvePath, readonly token: Token<unknown>) {
    super(
      `missing provider:${
        path.length ? ` [${formatResolvePath(path)}] ` : ' '
      }${token.name}`
    );
  }
}

export class CyclicDepsError extends Error {
  constructor(readonly path: ResolvePath, readonly cycle: ResolvePath) {
    super(
      `cyclic deps:${
        path.length ? ` [${formatResolvePath(path)}] ` : ' '
      }${formatResolvePath(cycle)}`
    );
  }
}
