export function trimBreakLine(str: string): string {
  return str.replace(/\n$/, '').replace(/^\n/, '')
}

export type MaybePromise<T> = T | Promise<T>
