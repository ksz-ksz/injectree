export class MultiMap<K, V> {
  private readonly map: Map<K, V[]>;
  constructor(map?: MultiMap<K, V>) {
    this.map = map !== undefined ? new Map<K, V[]>(map.map) : new Map<K, V[]>();
  }

  get(key: K): V[] | undefined {
    return this.map.get(key);
  }

  set(key: K, vals: V[]): void {
    this.map.set(key, vals);
  }

  add(key: K, val: V): void {
    const vals = this.map.get(key);
    if (vals !== undefined) {
      this.map.set(key, [...vals, val]);
    } else {
      this.map.set(key, [val]);
    }
  }
}
