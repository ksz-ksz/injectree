import { InjectionToken } from './token';
import { InjectionOpts } from './injection-opts';

export interface DepWithOpts<T> {
  token: InjectionToken<T>;
  opts: InjectionOpts;
}

export type Dep<T> = InjectionToken<T> | DepWithOpts<T>;

export type Deps<D extends unknown[]> = {
  [index in keyof D]: Dep<D[index]>;
};

export function dep<T>(
  token: InjectionToken<T>,
  opts: InjectionOpts = {}
): DepWithOpts<T> {
  return { token, opts };
}

export function isDepWithOpts<T>(x: Dep<T>): x is DepWithOpts<T> {
  return 'opts' in x;
}
