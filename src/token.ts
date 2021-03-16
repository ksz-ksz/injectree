import { AbstractClass } from './class';

export class NamedToken<T> {
  constructor(readonly name: string) {}
}
export interface NamedToken<T> {
  __TYPE__: T;
}

export type ClassToken<T> = AbstractClass<T>;
export type Token<T> = NamedToken<T> | ClassToken<T>;
