import {
  getDefaultProvider,
  isClassProvider,
  isFactoryProvider,
  isValueProvider,
  Provider,
  ProviderBinding,
} from './provider';
import { InjectionToken } from './token';
import { InjectionOpts } from './injection-opts';
import { dep, Deps, isDepWithOpts } from './deps';
import { ResolvePath } from './resolve-path';
import { CyclicDepsError, MissingProviderError } from './errors';

function missingProvider(
  path: ResolvePath,
  token: InjectionToken<unknown>,
  optional: boolean
): undefined {
  if (optional) {
    return undefined;
  } else {
    throw new MissingProviderError(path, token);
  }
}

function checkCycle<T>(
  path: ResolvePath,
  token: InjectionToken<T>,
  injector: Injector
): void {
  const index = path.findIndex(
    (x) => x.token === token && x.injector === injector
  );
  if (index !== -1) {
    throw new CyclicDepsError(path.slice(0, index), [
      ...path.slice(index),
      { token, injector: injector },
    ]);
  }
}

export class Injector {
  readonly depth: number;
  private readonly providers = new Map<
    InjectionToken<unknown>,
    Provider<unknown>
  >();
  private readonly bindings = new Map<InjectionToken<unknown>, unknown>();

  constructor(
    providers: ProviderBinding<unknown>[] = [],
    private readonly parent?: Injector
  ) {
    this.depth = this.parent !== undefined ? this.parent.depth + 1 : 0;
    this.bindings.set(Injector, this);
    for (const provider of providers) {
      this.providers.set(provider.token, provider.provider);
    }
  }

  get<T>(token: InjectionToken<T>): T;
  get<T>(
    token: InjectionToken<T>,
    opts: InjectionOpts & { optional?: false }
  ): T;
  get<T>(
    token: InjectionToken<T>,
    opts: InjectionOpts & { optional: true }
  ): T | undefined;
  get<T>(token: InjectionToken<T>, opts: InjectionOpts = {}): T | undefined {
    return this.resolve(token, opts, []);
  }

  private resolve<T>(
    token: InjectionToken<T>,
    { optional = false, from = 'self-and-ancestors' }: InjectionOpts,
    path: ResolvePath
  ): T | undefined {
    checkCycle(path, token, this);
    if (from === 'ancestors') {
      if (this.parent !== undefined) {
        return this.parent.resolve(token, { optional }, path);
      } else {
        return missingProvider(path, token, optional);
      }
    } else {
      const instance = this.bindings.get(token) as T | undefined;
      if (instance !== undefined) {
        return instance;
      } else {
        const provider = this.getProvider(token);
        if (provider !== undefined) {
          return this.bindInstance(token, provider, path);
        } else if (from !== 'self') {
          if (this.parent !== undefined) {
            return this.parent.resolve(token, { optional }, path);
          } else {
            const defaultProvider = getDefaultProvider(token);
            if (defaultProvider !== undefined) {
              return this.bindInstance(token, defaultProvider, path);
            } else {
              return missingProvider(path, token, optional);
            }
          }
        } else if (/* from === 'self' && */ this.depth === 0) {
          const defaultProvider = getDefaultProvider(token);
          if (defaultProvider !== undefined) {
            return this.bindInstance(token, defaultProvider, path);
          } else {
            return missingProvider(path, token, optional);
          }
        } else {
          return missingProvider(path, token, optional);
        }
      }
    }
  }

  private getProvider<T>(token: InjectionToken<T>): Provider<T> | undefined {
    return this.providers.get(token) as Provider<T> | undefined;
  }

  private bindInstance<T>(
    token: InjectionToken<T>,
    provider: Provider<T>,
    path: ResolvePath
  ): T {
    const instance = this.createInstance(provider, [
      ...path,
      { token, injector: this },
    ]);
    this.bindings.set(token, instance);
    return instance;
  }

  private createInstance<T>(provider: Provider<T>, path: ResolvePath): T {
    if (isValueProvider(provider)) {
      return provider.value;
    } else if (isFactoryProvider(provider)) {
      const deps = this.resolveDeps(provider.deps, path);
      return provider.factory(...deps);
    } else if (isClassProvider(provider)) {
      const deps = this.resolveDeps(provider.deps, path);
      return new provider.class(...deps);
    } else {
      throw new Error();
    }
  }

  private resolveDeps(deps: Deps<unknown[]>, chain: ResolvePath): unknown[] {
    return deps.map((x) => {
      const { token, opts } = isDepWithOpts(x) ? x : dep(x);
      return this.resolve(token, opts, chain);
    });
  }
}
