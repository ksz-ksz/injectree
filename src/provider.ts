import { Class } from './class';
import { ClassToken, NamedToken, Token } from './token';
import { Deps } from './deps';

export interface ValueProvider<T> extends Provider<T> {
  value: T;
}

export interface FactoryProvider<T, D extends unknown[]> extends Provider<T> {
  deps: Deps<D>;
  factory: (...args: D) => T;
}

export interface ClassProvider<T, D extends unknown[]> extends Provider<T> {
  deps: Deps<D>;
  class: Class<T, D>;
}

// @ts-ignore
export interface ImplicitClassProvider<T, D extends unknown[]> {
  deps: Deps<D>;
}

// @ts-ignore
export interface Provider<T> {}

export interface ValueProviderBinding<T> extends ProviderBinding<T> {
  token: Token<T>;
  provider: ValueProvider<T>;
}

export interface ClassProviderBinding<T, D extends unknown[]>
  extends ProviderBinding<T> {
  token: Class<T, D>;
  provider: ClassProvider<T, D>;
}

export interface FactoryProviderBinding<T, D extends unknown[]>
  extends ProviderBinding<T> {
  token: Token<T>;
  provider: FactoryProvider<T, D>;
}

export interface ProviderBinding<T> {
  token: Token<T>;
  provider: Provider<T>;
}

export function isValueProvider<T>(
  provider: Provider<T>
): provider is ValueProvider<T> {
  return 'value' in provider;
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

const DEFAULT_PROVIDERS = new Map<Token<unknown>, Provider<unknown>>();

function getProvider<T>(
  token: NamedToken<T> | ClassToken<T>,
  provider: Provider<T> | ImplicitClassProvider<T, unknown[]>
): Provider<T> {
  if ('value' in provider || 'factory' in provider || 'class' in provider) {
    return provider;
  } else {
    return {
      ...provider,
      class: token as Class<T>,
    };
  }
}

export function provider<T>(
  token: Token<T>,
  provider: ValueProvider<T>
): ValueProviderBinding<T>;
export function provider<T, D extends unknown[]>(
  token: Token<T>,
  provider: FactoryProvider<T, D>
): FactoryProviderBinding<T, D>;
export function provider<T, U extends T, D extends unknown[]>(
  token: Token<T>,
  provider: ClassProvider<U, D>
): ClassProviderBinding<T, D>;
export function provider<T, D extends unknown[]>(
  token: Class<T, D>,
  provider: ImplicitClassProvider<T, D>
): ClassProviderBinding<T, D>;
export function provider<T>(
  token: Token<T>,
  provider: Provider<T> | ImplicitClassProvider<T, unknown[]>
): ProviderBinding<T> {
  return {
    token,
    provider: getProvider(token, provider),
  };
}

export function defaultProvider<T>(
  token: Token<T>,
  provider: ValueProvider<T>
): Token<T>;
export function defaultProvider<T, D extends unknown[]>(
  token: Token<T>,
  provider: FactoryProvider<T, D>
): Token<T>;
export function defaultProvider<T, U extends T, D extends unknown[]>(
  token: Token<T>,
  provider: ClassProvider<U, D>
): Token<T>;
export function defaultProvider<T, D extends unknown[]>(
  token: Class<T, D>,
  provider: ImplicitClassProvider<T, D>
): Class<T, D>;
export function defaultProvider<T>(
  token: Token<T>,
  provider: Provider<T> | ImplicitClassProvider<T, unknown[]>
): Token<T> {
  DEFAULT_PROVIDERS.set(token, getProvider(token, provider));
  return token;
}

export function getDefaultProvider<T>(token: Token<T>): Provider<T> {
  return DEFAULT_PROVIDERS.get(token) as Provider<T>;
}
