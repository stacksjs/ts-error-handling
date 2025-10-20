export interface ErrorHandlingConfig {
  verbose: boolean
}

// Core Result types inspired by Rust and neverthrow
export type Result<T, E> = Ok<T, E> | Err<T, E>

export interface Ok<T, E> {
  readonly isOk: true
  readonly isErr: false
  readonly value: T
  readonly _tag: 'Ok'

  map<U>(fn: (value: T) => U): Result<U, E>
  mapErr<F>(_fn: (error: E) => F): Result<T, F>
  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E>
  orElse<F>(_fn: (error: E) => Result<T, F>): Result<T, F>
  match<U>(patterns: { ok: (value: T) => U, err: (error: E) => U }): U
  unwrap(): T
  unwrapOr(_defaultValue: T): T
  unwrapOrElse(_fn: (error: E) => T): T
  expect(_msg: string): T
}

export interface Err<T, E> {
  readonly isOk: false
  readonly isErr: true
  readonly error: E
  readonly _tag: 'Err'

  map<U>(_fn: (value: T) => U): Result<U, E>
  mapErr<F>(fn: (error: E) => F): Result<T, F>
  andThen<U>(_fn: (value: T) => Result<U, E>): Result<U, E>
  orElse<F>(fn: (error: E) => Result<T, F>): Result<T, F>
  match<U>(patterns: { ok: (value: T) => U, err: (error: E) => U }): U
  unwrap(): never
  unwrapOr(defaultValue: T): T
  unwrapOrElse(fn: (error: E) => T): T
  expect(msg: string): never
}

// Async Result type
export type ResultAsync<T, E> = Promise<Result<T, E>>

// Utility types
export type InferOkType<T> = T extends Result<infer U, unknown> ? U : never
export type InferErrType<T> = T extends Result<unknown, infer E> ? E : never

// Combine utility types
export type ExtractOkTypes<T extends readonly Result<unknown, unknown>[]> = {
  [K in keyof T]: T[K] extends Result<infer U, unknown> ? U : never
}

export type ExtractErrTypes<T extends readonly Result<unknown, unknown>[]> = {
  [K in keyof T]: T[K] extends Result<unknown, infer E> ? E : never
}[number]
