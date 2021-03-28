# Injectree &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/ksz-ksz/injectree/blob/master/LICENSE) [![npm version](https://img.shields.io/npm/v/injectree.svg?style=flat)](https://www.npmjs.com/package/injectree) [![Build Status](https://www.travis-ci.com/ksz-ksz/injectree.svg?branch=master)](https://www.travis-ci.com/ksz-ksz/injectree) [![codecov](https://codecov.io/gh/ksz-ksz/injectree/branch/master/graph/badge.svg?token=157GENE1YI)](https://codecov.io/gh/ksz-ksz/injectree)
----
A simple and intuitive dependency injection library supporting containers chaining.

## Example

```ts
import { Injector, Token, provider } from 'injectree';

class Greeter {
  constructor(private readonly name: string) {}
  greet() {
    return `Hello ${this.name}!`;
  }
}
const NAME = new Token<string>();
const injector = new Injector([
    provider(NAME, {value: 'World'}),
    provider(Greeter, {deps: [NAME]}),
]);

const greeter = injector.get(Greeter);
greeter.greet(); // returns 'Hello World!'
```

## Provider types

### Value provider

Provides a value directly.

Example:
```ts
const TOKEN = new Token<string>('TOKEN');
const injector = new Injector([
  provider(TOKEN, {value: 'Hello!'}),
]);
```

### Factory provider

Provides a value returned form the factory function. Can specify dependencies that are provided to the factory function as parameters.

Example:
```ts
const TOKEN = new Token<string>('TOKEN');
const NAME = new Token<string>('NAME');
const injector = new Injector([
  provider(TOKEN, {factory: (name: string) => `Hello ${name}!`, deps: [NAME]}),
  provider(NAME, {value: 'World'}),
]);

```

### Class provider

Provides an instance of the class. Can specify dependencies that are provided to the constructor as parameters.

Example:
```ts
class Greeter {
  constructor(private name: string) {}
  greet() {
    return `Hello ${this.name}!`;
  }
}
const NAME = new Token<string>('NAME');
const injector = new Injector([
  provider(Greeter, {class: Greeter, deps: [NAME]}),
  provider(NAME, {value: 'World'}),
]);
// or
const injector = new Injector([
  provider(Greeter, {deps: [NAME]}), // class derived from the provider token
  provider(NAME, {value: 'World'}),
]);
```

### Token provider

Provides a value/instance provided under another token.

Example:
```ts
const TOKEN = new Token<string>('TOKEN');
const OTHER_TOKEN = new Token<string>('OTHER_TOKEN');
const injector = new Injector([
  provider(OTHER_TOKEN, {value: 'Hello!'}),
  provider(TOKEN, {token: OTHER_TOKEN}),
]);
```

## Default providers

The `defaultProvider` function allows for specifying providers for tokens that are not explicitly defined on any injector.
Note that the default provider needs to be defined before the injector is created.

Example:
```ts
class Service {
  getValue() {
    return 42;
  }
}
defaultProvider(Service, {deps: []});

// later

const injector = new Injector();
const service = injector.get(Service);
service.getValue(); // return 42
```

## Multi tokens

A multi token can hold bindings to multiple values and/or instances.
Multiple providers can be specified for a single multi token.

Example:
```ts
const MULTI_TOKEN = new MultiToken<string>('MULTI_TOKEN');
defaultProvider(MULTI_TOKEN, {value: 'default'});
const injector = new Injector([
  provider(MULTI_TOKEN, {value: 'first'}),
  provider(MULTI_TOKEN, {value: 'second'}),
]);

injector.get(MULTI_TOKEN); // returns ['default', 'first', 'second']
```

## Injectors chaining

An injector can specify its parent injector when it's created.
If a provider is not found in the injector and the parent injector is specified, the search will be continued in the parent injector.
In case of multi token, values and/or instances will be returned also from the parent injector.

## Injection options

Injection options can be used to control the resolution process.
They can be specified on the `Injector.get()` method or on the `dep` function when declaring dependencies on factory and class providers.

### `optional`

If set to `true`, the injector will return `undefined` if no provider was defined for the token instead of throwing an error.

Example:

```ts
const TOKEN = new Token<string>('TOKEN');
const injector = new Injector();
const value: string | undefined = injector.get(TOKEN, {optional: true});
```

```ts
const TOKEN = new Token<string>('TOKEN');
class Service {
  constructor(readonly value: string | undefined) {}
}
const injector = new Injector([
  provider(Service, {deps: [dep(TOKEN, {optional: true})]}),
]);
```

### `from`

Specifies where to search for the provider.
* `self-and-ancestors` *(default)* - search in the current injector or any of it's ancestors,
* `self` - search only in the current injector,
* `ancestors` - search only in ancestor injectors.

## Instances lifecycle

An instance is created right after it's resolved using the `Injector.get()` method (either directly or as a transitive dependency).
Every successive resolution for the same token will result with the same instance being returned.
An instance remains active until the injector that created it is destroyed.
In case of instances created using the class provider, the `[onDestroy]` hook is available to give an instance a chance to clean up after itself.

Example:
```ts
import {Injector, provider, onDestroy} from 'injectree';

class Service {
  private unsubscribe: () => void;
  constructor() {
    this.unsubscribe = subscribeToSomeDataSource();
  }
  
  [onDestroy]() {
    this.unsubscribe();
    this.unsubscribe = undefined;
  }
}
const injector = new Injector([
    provider(Service, {deps: []}),
])
injector.get(Service); // Service created

// later
injector.destroy(); // Service[onDestroy] called
```
