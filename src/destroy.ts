export const onDestroy = Symbol('onDestroy');
export interface OnDestroy {
  [onDestroy](): void;
}
