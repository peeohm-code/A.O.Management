import { useRef } from "react";

type noop = (...args: any[]) => any;

/**
 * usePersistFn 可以替代 useCallback 以降低心智负担
 */
export function usePersistFn<T extends noop>(fn: T) {
  const fnRef = useRef<T>(fn);
  fnRef.current = fn;

  const persistFnRef = useRef<T | undefined>(undefined);
  if (!persistFnRef.current) {
    persistFnRef.current = function (this: unknown, ...args) {
      return fnRef.current.apply(this, args);
    } as T;
  }

  return persistFnRef.current;
}
