import type { Err, ExtractErrTypes, ExtractOkTypes, Ok, Result } from './types'

// Ok implementation
class OkImpl<T, E> implements Ok<T, E> {
  readonly isOk = true as const
  readonly isErr = false as const
  readonly _tag = 'Ok' as const

  constructor(readonly value: T) {}

  map<U>(fn: (value: T) => U): Result<U, E> {
    return ok(fn(this.value))
  }

  mapErr<F>(_fn: (error: E) => F): Result<T, F> {
    return ok(this.value)
  }

  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value)
  }

  orElse<F>(_fn: (error: E) => Result<T, F>): Result<T, F> {
    return ok(this.value)
  }

  match<U>(patterns: { ok: (value: T) => U, err: (error: E) => U }): U {
    return patterns.ok(this.value)
  }

  unwrap(): T {
    return this.value
  }

  unwrapOr(_defaultValue: T): T {
    return this.value
  }

  unwrapOrElse(_fn: (error: E) => T): T {
    return this.value
  }

  expect(_msg: string): T {
    return this.value
  }
}

// Err implementation
class ErrImpl<T, E> implements Err<T, E> {
  readonly isOk = false as const
  readonly isErr = true as const
  readonly _tag = 'Err' as const
  readonly error: E

  constructor(error: E) {
    this.error = error
  }

  map<U>(_fn: (value: T) => U): Result<U, E> {
    return err(this.error)
  }

  mapErr<F>(fn: (error: E) => F): Result<T, F> {
    return err(fn(this.error))
  }

  andThen<U>(_fn: (value: T) => Result<U, E>): Result<U, E> {
    return err(this.error)
  }

  orElse<F>(fn: (error: E) => Result<T, F>): Result<T, F> {
    try {
      return fn(this.error)
    }
    catch (error) {
      throw new Error(`orElse handler threw: ${String(error)}`)
    }
  }

  match<U>(patterns: { ok: (value: T) => U, err: (error: E) => U }): U {
    return patterns.err(this.error)
  }

  unwrap(): never {
    throw new Error(`Called unwrap on an Err value: ${String(this.error)}`)
  }

  unwrapOr(defaultValue: T): T {
    return defaultValue
  }

  unwrapOrElse(fn: (error: E) => T): T {
    return fn(this.error)
  }

  expect(msg: string): never {
    throw new Error(`${msg}: ${String(this.error)}`)
  }
}

/**
 * Creates a successful Result
 */
export function ok<T, E = never>(value: T): Result<T, E> {
  return new OkImpl<T, E>(value)
}

/**
 * Creates a failed Result
 */
export function err<T = never, E = unknown>(error: E): Result<T, E> {
  return new ErrImpl<T, E>(error)
}

/**
 * Wraps a function that might throw into a Result
 */
export function tryCatch<T, E = unknown>(
  fn: () => T,
  errorHandler?: (error: unknown) => E,
): Result<T, E> {
  try {
    return ok(fn())
  }
  catch (error) {
    return err(errorHandler ? errorHandler(error) : error as E)
  }
}

/**
 * Wraps an async function that might throw into a ResultAsync
 */
export async function tryCatchAsync<T, E = unknown>(
  fn: () => Promise<T>,
  errorHandler?: (error: unknown) => E,
): Promise<Result<Awaited<T>, E>> {
  try {
    const value = await fn()
    return ok(value) as Result<Awaited<T>, E>
  }
  catch (error) {
    return err(errorHandler ? errorHandler(error) : error as E)
  }
}

/**
 * Combines multiple Results into a single Result containing an array of values
 * Short-circuits on the first error
 */
export function combine<T extends readonly Result<unknown, unknown>[]>(
  results: T,
): Result<ExtractOkTypes<T>, ExtractErrTypes<T>> {
  const values: unknown[] = []

  for (const result of results) {
    if (result.isErr) {
      return err(result.error) as Result<ExtractOkTypes<T>, ExtractErrTypes<T>>
    }
    values.push(result.value)
  }

  return ok(values) as unknown as Result<ExtractOkTypes<T>, ExtractErrTypes<T>>
}

/**
 * Combines multiple Results, collecting all errors if any fail
 */
export function combineWithAllErrors<T extends readonly Result<unknown, unknown>[]>(
  results: T,
): Result<ExtractOkTypes<T>, ExtractErrTypes<T>[]> {
  const values: unknown[] = []
  const errors: unknown[] = []

  for (const result of results) {
    if (result.isErr) {
      errors.push(result.error)
    }
    else {
      values.push(result.value)
    }
  }

  if (errors.length > 0) {
    return err(errors as ExtractErrTypes<T>[]) as unknown as Result<ExtractOkTypes<T>, ExtractErrTypes<T>[]>
  }

  return ok(values as ExtractOkTypes<T>) as unknown as Result<ExtractOkTypes<T>, ExtractErrTypes<T>[]>
}

/**
 * Helper to convert a nullable value into a Result
 */
export function fromNullable<T, E>(
  value: T | null | undefined,
  error: E,
): Result<NonNullable<T>, E> {
  return value != null ? ok(value as NonNullable<T>) : err(error)
}

/**
 * Helper to convert a Promise into a ResultAsync
 */
export async function fromPromise<T, E = unknown>(
  promise: Promise<T>,
  errorHandler?: (error: unknown) => E,
): Promise<Result<Awaited<T>, E>> {
  return tryCatchAsync(() => promise, errorHandler)
}

/**
 * Type guard to check if a value is a Result
 */
export function isResult<T, E>(value: unknown): value is Result<T, E> {
  return (
    typeof value === 'object'
    && value !== null
    && '_tag' in value
    && (value._tag === 'Ok' || value._tag === 'Err')
  )
}

/**
 * Sequences an array of async Result operations, stopping at the first error
 */
export async function sequence<T, E>(
  operations: (() => Promise<Result<T, E>>)[],
): Promise<Result<T[], E>> {
  const results: T[] = []

  for (const op of operations) {
    const result = await op()
    if (result.isErr) {
      return err(result.error)
    }
    results.push(result.value)
  }

  return ok(results)
}

/**
 * Executes async Result operations in parallel
 */
export async function parallel<T, E>(
  operations: (() => Promise<Result<T, E>>)[],
): Promise<Result<T[], E>> {
  const results = await Promise.all(operations.map(op => op()))
  // @ts-expect-error - Complex type inference with combine
  return combine(results)
}

/**
 * Maps over an array with a Result-returning function
 */
export function traverse<T, U, E>(
  items: T[],
  fn: (item: T) => Result<U, E>,
): Result<U[], E> {
  const results: U[] = []

  for (const item of items) {
    const result = fn(item)
    if (result.isErr) {
      return err(result.error)
    }
    results.push(result.value)
  }

  return ok(results)
}

/**
 * Async version of traverse
 */
export async function traverseAsync<T, U, E>(
  items: T[],
  fn: (item: T) => Promise<Result<U, E>>,
): Promise<Result<U[], E>> {
  const results: U[] = []

  for (const item of items) {
    const result = await fn(item)
    if (result.isErr) {
      return err(result.error)
    }
    results.push(result.value)
  }

  return ok(results)
}

/**
 * Flattens a nested Result<Result<T, E>, E> into Result<T, E>
 */
export function flatten<T, E>(result: Result<Result<T, E>, E>): Result<T, E> {
  if (result.isErr) {
    return err(result.error)
  }
  return result.value
}

/**
 * Taps into a Result without modifying it - useful for logging/debugging
 */
export function tap<T, E>(
  result: Result<T, E>,
  onOk?: (value: T) => void,
  onErr?: (error: E) => void,
): Result<T, E> {
  if (result.isOk && onOk) {
    onOk(result.value)
  }
  else if (result.isErr && onErr) {
    onErr(result.error)
  }
  return result
}

/**
 * Swaps Ok and Err - useful for inverting logic
 */
export function swap<T, E>(result: Result<T, E>): Result<E, T> {
  if (result.isOk) {
    return err(result.value)
  }
  return ok(result.error)
}

/**
 * Filters a Result based on a predicate
 */
export function filter<T, E>(
  result: Result<T, E>,
  predicate: (value: T) => boolean,
  error: E,
): Result<T, E> {
  if (result.isErr) {
    return result
  }
  return predicate(result.value) ? result : err(error)
}

/**
 * Returns Ok value or throws error - useful at boundaries
 */
export function unwrapOrThrow<T, E>(
  result: Result<T, E>,
  mapError?: (error: E) => Error,
): T {
  if (result.isOk) {
    return result.value
  }
  throw mapError ? mapError(result.error) : new Error(String(result.error))
}

/**
 * Converts Result to Promise - Ok becomes resolved, Err becomes rejected
 */
export function toPromise<T, E>(
  result: Result<T, E>,
  mapError?: (error: E) => Error,
): Promise<T> {
  if (result.isOk) {
    return Promise.resolve(result.value)
  }
  return Promise.reject(mapError ? mapError(result.error) : new Error(String(result.error)))
}

/**
 * Gets the Ok value or a default computed lazily
 */
export function getOrElse<T, E>(
  result: Result<T, E>,
  fn: (error: E) => T,
): T {
  return result.isOk ? result.value : fn(result.error)
}

/**
 * Collects multiple Results, returning Ok with all values or Err with first error
 */
export function all<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = []
  for (const result of results) {
    if (result.isErr) {
      return err(result.error)
    }
    values.push(result.value)
  }
  return ok(values)
}

/**
 * Returns the first Ok result, or the last Err if all fail
 */
export function any<T, E>(results: Result<T, E>[]): Result<T, E> {
  let lastError: E | undefined

  for (const result of results) {
    if (result.isOk) {
      return result
    }
    lastError = result.error
  }

  return err(lastError as E)
}

/**
 * Partitions an array of Results into [successes, failures]
 */
export function partition<T, E>(
  results: Result<T, E>[],
): [T[], E[]] {
  const oks: T[] = []
  const errs: E[] = []

  for (const result of results) {
    if (result.isOk) {
      oks.push(result.value)
    }
    else {
      errs.push(result.error)
    }
  }

  return [oks, errs]
}
