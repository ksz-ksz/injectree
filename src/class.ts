export interface AbstractClass<T> extends Function {
  prototype: T;
}

export interface Class<T, ARGS extends unknown[] = unknown[]>
  extends AbstractClass<T> {
  new (...args: ARGS): T;
}
