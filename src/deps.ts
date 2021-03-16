import { Token } from './token';
import { InjectionOpts } from './injection-opts';

export interface DepWithOpts<T> {
  token: Token<T>;
  opts: InjectionOpts;
}

export type Dep<T> = Token<T> | DepWithOpts<T>;

export type Deps<D extends unknown[]> = {
  [index in keyof D]: Dep<D[index]>;
};

export function dep<T>(
  token: Token<T>,
  opts: InjectionOpts = {}
): DepWithOpts<T> {
  return { token, opts };
}
