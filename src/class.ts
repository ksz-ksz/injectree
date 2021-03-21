export interface Class<T> extends Function {
  prototype: T;
}

export interface ClassConstructor<T, ARGS extends unknown[] = unknown[]>
  extends Class<T> {
  new (...args: ARGS): T;
}
