import {
  DEFAULT_MULTI_PROVIDERS,
  DEFAULT_PROVIDERS,
  isClassProvider,
  isFactoryProvider,
  isTokenProvider,
  Provider,
  ProviderDef,
} from './provider';
import { InjectionToken, MultiToken } from './token';
import { InjectionOpts } from './injection-opts';
import { dep, Deps, isDepWithOpts } from './deps';
import { ResolvePath } from './resolve-path';
import {
  CyclicDepsError,
  InjectorDestroyedError,
  MissingProviderError,
} from './errors';
import { MultiMap } from './multi-map';
import { OnDestroy, onDestroy } from './destroy';

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

function checkDestroy(destroyed: boolean): void {
  if (destroyed) {
    throw new InjectorDestroyedError();
  }
}

function isDestroyableProvider(provider: Provider<unknown>): boolean {
  return isClassProvider(provider);
}

function isDestroyableInstance(instance: any): instance is OnDestroy {
  return (
    instance !== null &&
    typeof instance === 'object' &&
    typeof instance[onDestroy] === 'function' // eslint-disable-line @typescript-eslint/no-unsafe-member-access
  );
}

function destroyBindings(bindings: {
  forEach(callback: (binding: Binding) => void): void;
}): void {
  bindings.forEach(({ provider, instance }) => {
    if (isDestroyableProvider(provider) && isDestroyableInstance(instance)) {
      instance[onDestroy]();
    }
  });
}

interface Binding {
  provider: Provider<unknown>;
  instance: unknown;
}

interface MultiBinding {
  bindings: Binding[];
  instances: unknown[];
}

export class Injector {
  readonly depth: number =
    this.parent !== undefined ? this.parent.depth + 1 : 0;

  private readonly providers = new Map<
    InjectionToken<unknown>,
    Provider<unknown>
  >(this.depth === 0 ? DEFAULT_PROVIDERS : []);
  private readonly bindings = new Map<InjectionToken<unknown>, Binding>();

  private readonly multiProviders = new MultiMap<
    MultiToken<unknown>,
    Provider<unknown>
  >(this.depth === 0 ? DEFAULT_MULTI_PROVIDERS : undefined);
  private readonly multiBindings = new Map<MultiToken<unknown>, MultiBinding>();
  private destroyed = false;

  constructor(
    providers: ProviderDef<unknown>[] = [],
    private readonly parent?: Injector
  ) {
    this.bindings.set(Injector, {
      provider: { token: Injector },
      instance: this,
    });
    for (const { token, provider } of providers) {
      if (token instanceof MultiToken) {
        this.multiProviders.add(token, provider);
      } else {
        this.providers.set(token, provider);
      }
    }
  }

  get<T>(
    token: InjectionToken<T>,
    opts?: InjectionOpts & { optional?: false }
  ): T;
  get<T>(
    token: InjectionToken<T>,
    opts: InjectionOpts & { optional: true }
  ): T | undefined;
  get<T>(token: InjectionToken<T>, opts: InjectionOpts = {}): T | undefined {
    return this.resolve(token, opts, []);
  }

  destroy(): void {
    destroyBindings(this.bindings);
    this.multiBindings.forEach((multiBinding) => {
      destroyBindings(multiBinding.bindings);
    });
    this.destroyed = true;
  }

  private resolve<T>(
    token: InjectionToken<T>,
    opts: InjectionOpts,
    path: ResolvePath
  ): T | undefined {
    checkDestroy(this.destroyed);
    checkCycle(path, token, this);
    if (token instanceof MultiToken) {
      return (this.resolveMany(token, opts, path) as unknown) as T;
    } else {
      return this.resolveOne(token, opts, path);
    }
  }

  private resolveOne<T>(
    token: InjectionToken<T>,
    { optional = false, from = 'self-and-ancestors' }: InjectionOpts,
    path: ResolvePath
  ): T | undefined {
    if (from === 'ancestors') {
      if (this.parent !== undefined) {
        return this.parent.resolve(token, { optional }, path);
      } else {
        return missingProvider(path, token, optional);
      }
    } else {
      const instance = this.bindings.get(token)?.instance as T | undefined;
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
    this.bindings.set(token, { instance, provider });
    return instance;
  }

  private resolveMany<T>(
    token: MultiToken<T>,
    { optional = false, from = 'self-and-ancestors' }: InjectionOpts,
    path: ResolvePath
  ): T[] | undefined {
    const instances: T[] = [];
    switch (from) {
      case 'self':
        instances.push(...this.getAllFromSelf(token, path));
        break;
      case 'ancestors':
        instances.push(...this.getAllFromAncestors(token, path));
        break;
      case 'self-and-ancestors':
        instances.push(...this.getAllFromAncestors(token, path));
        instances.push(...this.getAllFromSelf(token, path));
        break;
    }

    if (instances.length !== 0) {
      return instances;
    } else {
      return missingProvider([], token, optional);
    }
  }

  private getAllFromAncestors<T>(token: MultiToken<T>, path: ResolvePath): T[] {
    return this.parent?.resolve(token, { optional: true }, path) ?? [];
  }

  private getAllFromSelf<T>(token: MultiToken<T>, path: ResolvePath): T[] {
    const instances = this.multiBindings.get(token)?.instances as
      | T[]
      | undefined;
    if (instances !== undefined) {
      return instances;
    } else {
      const providers = this.getMultiProviders(token);
      if (providers !== undefined) {
        return this.bindMultiInstances(token, providers, path);
      } else {
        return [];
      }
    }
  }

  private getMultiProviders<T>(
    token: MultiToken<T>
  ): Provider<T>[] | undefined {
    return this.multiProviders.get(token) as Provider<T>[] | undefined;
  }

  private bindMultiInstances<T>(
    token: MultiToken<T>,
    providers: Provider<T>[],
    path: ResolvePath
  ): T[] {
    const bindings = providers.map((provider) => ({
      provider,
      instance: this.createInstance(provider, [
        ...path,
        { token, injector: this },
      ]),
    }));
    const instances = bindings.map((binding) => binding.instance);
    this.multiBindings.set(token, { bindings, instances });
    return instances;
  }

  private createInstance<T>(provider: Provider<T>, path: ResolvePath): T {
    if (isClassProvider(provider)) {
      const deps = this.resolveDeps(provider.deps, path);
      return new provider.class(...deps);
    } else if (isFactoryProvider(provider)) {
      const deps = this.resolveDeps(provider.deps, path);
      return provider.factory(...deps);
    } else if (isTokenProvider(provider)) {
      return this.resolve(provider.token, {}, path) as T;
    } else {
      return provider.value;
    }
  }

  private resolveDeps(deps: Deps<unknown[]>, path: ResolvePath): unknown[] {
    return deps.map((x) => {
      const { token, opts } = isDepWithOpts(x) ? x : dep(x);
      return this.resolve(token, opts, path);
    });
  }
}
