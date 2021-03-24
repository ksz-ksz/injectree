import { Class } from './class';

declare const TOKEN: unique symbol;
declare const MULTI_TOKEN: unique symbol;

export class Token<T> {
  constructor(readonly name: string) {}
}

export interface Token<T> {
  [TOKEN]: T;
}

export class MultiToken<T> extends Token<T[]> {}

export interface MultiToken<T> {
  [MULTI_TOKEN]: T;
}

export type InjectionToken<T> = Token<T> | Class<T>;
