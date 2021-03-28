import { Class, ClassConstructor } from './class';
import { Token, InjectionToken, MultiToken } from './token';
import { Deps } from './deps';
import { MultiMap } from './multi-map';

export interface ValueProvider<T> {
  value: T;
}

export interface FactoryProvider<T, D extends unknown[]> {
  deps: Deps<D>;
  factory: (...args: D) => T;
}

export interface ClassProvider<T, D extends unknown[]> {
  deps: Deps<D>;
  class: ClassConstructor<T, D>;
}

export interface TokenProvider<T> {
  token: InjectionToken<T>;
}

export type Provider<T> =
  | ValueProvider<T>
  | FactoryProvider<T, unknown[]>
  | ClassProvider<T, unknown[]>
  | TokenProvider<T>;

export interface ImplicitClassProvider<T, D extends unknown[]> {
  deps: Deps<D>;
}

export interface ProviderDef<T> {
  token: InjectionToken<T>;
  provider: Provider<T>;
}

export interface MultiProviderDef<T> {
  token: MultiToken<T>;
  provider: Provider<T>;
}

export function isValueProvider<T>(
  provider: Provider<T>
): provider is ValueProvider<T> {
  return 'value' in provider;
}

export function isTokenProvider<T>(
  provider: Provider<T>
): provider is TokenProvider<T> {
  return 'token' in provider;
}

export function isFactoryProvider<T>(
  provider: Provider<T>
): provider is FactoryProvider<T, unknown[]> {
  return 'factory' in provider;
}

export function isClassProvider<T>(
  provider: Provider<T>
): provider is ClassProvider<T, unknown[]> {
  return 'class' in provider;
}

export const DEFAULT_PROVIDERS = new Map<
  InjectionToken<unknown>,
  Provider<unknown>
>();

export const DEFAULT_MULTI_PROVIDERS = new MultiMap<
  MultiToken<unknown>,
  Provider<unknown>
>();

function getProvider<T>(
  token: Token<T> | Class<T>,
  provider: Provider<T> | ImplicitClassProvider<T, unknown[]>
): Provider<T> {
  if (
    'value' in provider ||
    'token' in provider ||
    'factory' in provider ||
    'class' in provider
  ) {
    return provider;
  } else {
    return {
      ...provider,
      class: token as ClassConstructor<T>,
    };
  }
}

export function provider<T>(
  token: InjectionToken<T>,
  provider: ValueProvider<T>
): ProviderDef<T>;
export function provider<T>(
  token: InjectionToken<T>,
  provider: TokenProvider<T>
): ProviderDef<T>;
export function provider<T, D extends unknown[]>(
  token: InjectionToken<T>,
  provider: FactoryProvider<T, D>
): ProviderDef<T>;
export function provider<T, U extends T, D extends unknown[]>(
  token: InjectionToken<T>,
  provider: ClassProvider<U, D>
): ProviderDef<T>;
export function provider<T, D extends unknown[]>(
  token: ClassConstructor<T, D>,
  provider: ImplicitClassProvider<T, D>
): ProviderDef<T>;
export function provider<T>(
  token: MultiToken<T>,
  provider: ValueProvider<T>
): MultiProviderDef<T>;
export function provider<T>(
  token: MultiToken<T>,
  provider: TokenProvider<T>
): MultiProviderDef<T>;
export function provider<T, D extends unknown[]>(
  token: MultiToken<T>,
  provider: FactoryProvider<T, D>
): MultiProviderDef<T>;
export function provider<T, U extends T, D extends unknown[]>(
  token: MultiToken<T>,
  provider: ClassProvider<U, D>
): MultiProviderDef<T>;
export function provider<T>(
  token: InjectionToken<T>,
  provider: Provider<T> | ImplicitClassProvider<T, unknown[]>
): ProviderDef<T> | MultiProviderDef<T> {
  if (token instanceof MultiToken) {
    return { token, provider: provider as Provider<T> };
  } else {
    return {
      token,
      provider: getProvider(token, provider),
    };
  }
}

export function defaultProvider<T>(
  token: InjectionToken<T>,
  provider: ValueProvider<T>
): InjectionToken<T>;
export function defaultProvider<T, D extends unknown[]>(
  token: InjectionToken<T>,
  provider: FactoryProvider<T, D>
): InjectionToken<T>;
export function defaultProvider<T, U extends T, D extends unknown[]>(
  token: InjectionToken<T>,
  provider: ClassProvider<U, D>
): InjectionToken<T>;
export function defaultProvider<T, D extends unknown[]>(
  token: ClassConstructor<T, D>,
  provider: ImplicitClassProvider<T, D>
): ClassConstructor<T, D>;
export function defaultProvider<T>(
  token: MultiToken<T>,
  provider: ValueProvider<T>
): InjectionToken<T>;
export function defaultProvider<T, D extends unknown[]>(
  token: MultiToken<T>,
  provider: FactoryProvider<T, D>
): InjectionToken<T>;
export function defaultProvider<T, U extends T, D extends unknown[]>(
  token: MultiToken<T>,
  provider: ClassProvider<U, D>
): InjectionToken<T>;
export function defaultProvider<T>(
  token: InjectionToken<T>,
  provider: Provider<T> | ImplicitClassProvider<T, unknown[]>
): InjectionToken<T> {
  if (token instanceof MultiToken) {
    DEFAULT_MULTI_PROVIDERS.add(token, provider as Provider<T>);
  } else {
    DEFAULT_PROVIDERS.set(token, getProvider(token, provider));
  }
  return token;
}
