import { Class } from './class';

declare const TOKEN: unique symbol;

export class Token<T> {
  constructor(readonly name: string) {}
}

export interface Token<T> {
  [TOKEN]: T;
}

export type InjectionToken<T> = Token<T> | Class<T>;
