import type { Result } from '../src/types'
import { describe, expect, it } from 'bun:test'
import {
  combine,
  combineWithAllErrors,
  err,
  fromNullable,
  fromPromise,
  isResult,
  ok,
  parallel,
  sequence,
  traverse,
  traverseAsync,
  tryCatch,
  tryCatchAsync,
} from '../src/result'

describe('result', () => {
  describe('ok', () => {
    it('creates a successful Result', () => {
      const result: Result<number, string> = ok(42)

      expect(result.isOk).toBe(true)
      expect(result.isErr).toBe(false)
      if (result.isOk) {
        expect(result.value).toBe(42)
      }
    })

    it('has correct type narrowing', () => {
      const result: Result<number, string> = ok(42)

      if (result.isOk) {
        // Type is narrowed to Ok<number, string>
        const value: number = result.value
        expect(value).toBe(42)
      }
    })
  })

  describe('err', () => {
    it('creates a failed Result', () => {
      const result: Result<number, string> = err('error message')

      expect(result.isOk).toBe(false)
      expect(result.isErr).toBe(true)
      if (result.isErr) {
        expect(result.error).toBe('error message')
      }
    })

    it('has correct type narrowing', () => {
      const result: Result<number, string> = err('failed')

      if (result.isErr) {
        // Type is narrowed to Err<number, string>
        const error: string = result.error
        expect(error).toBe('failed')
      }
    })
  })

  describe('map', () => {
    it('transforms Ok value', () => {
      const result = ok(21).map(x => x * 2)

      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toBe(42)
      }
    })

    it('does not transform Err value', () => {
      const result = err<number, string>('error').map(x => x * 2)

      expect(result.isErr).toBe(true)
      if (result.isErr) {
        expect(result.error).toBe('error')
      }
    })
  })

  describe('mapErr', () => {
    it('does not transform Ok error', () => {
      const result = ok<number, string>(42).mapErr(e => e.toUpperCase())

      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toBe(42)
      }
    })

    it('transforms Err error', () => {
      const result = err<number, string>('error').mapErr(e => e.toUpperCase())

      expect(result.isErr).toBe(true)
      if (result.isErr) {
        expect(result.error).toBe('ERROR')
      }
    })
  })

  describe('andThen', () => {
    it('chains Ok results', () => {
      const result = ok(21).andThen(x => ok(x * 2))

      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toBe(42)
      }
    })

    it('short-circuits on Err', () => {
      const result = err<number, string>('error').andThen(x => ok(x * 2))

      expect(result.isErr).toBe(true)
      if (result.isErr) {
        expect(result.error).toBe('error')
      }
    })

    it('can change to Err in chain', () => {
      const result: Result<number, string> = ok<number, string>(21).andThen(x =>
        x > 20 ? err<number, string>('too large') : ok<number, string>(x * 2),
      )

      expect(result.isErr).toBe(true)
      if (result.isErr) {
        expect(result.error).toBe('too large')
      }
    })
  })

  describe('orElse', () => {
    it('does not transform Ok', () => {
      const result = ok<number, string>(42).orElse(_e => ok(0))

      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toBe(42)
      }
    })

    it('recovers from Err', () => {
      const result = err<number, string>('error').orElse(_e => ok(42))

      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toBe(42)
      }
    })

    it('can change error type', () => {
      const result = err<number, string>('error').orElse(e =>
        err<number, number>(e.length),
      )

      expect(result.isErr).toBe(true)
      if (result.isErr) {
        expect(result.error).toBe(5)
      }
    })
  })

  describe('match', () => {
    it('matches Ok branch', () => {
      const result = ok<number, string>(42)
      const output = result.match({
        ok: val => `Success: ${val}`,
        err: error => `Error: ${error}`,
      })

      expect(output).toBe('Success: 42')
    })

    it('matches Err branch', () => {
      const result = err<number, string>('failed')
      const output = result.match({
        ok: val => `Success: ${val}`,
        err: error => `Error: ${error}`,
      })

      expect(output).toBe('Error: failed')
    })
  })

  describe('unwrap', () => {
    it('returns value for Ok', () => {
      const result = ok(42)
      expect(result.unwrap()).toBe(42)
    })

    it('throws for Err', () => {
      const result = err('error')
      expect(() => result.unwrap()).toThrow()
    })
  })

  describe('unwrapOr', () => {
    it('returns value for Ok', () => {
      const result = ok(42)
      expect(result.unwrapOr(0)).toBe(42)
    })

    it('returns default for Err', () => {
      const result = err<number, string>('error')
      expect(result.unwrapOr(0)).toBe(0)
    })
  })

  describe('unwrapOrElse', () => {
    it('returns value for Ok', () => {
      const result = ok(42)
      expect(result.unwrapOrElse(() => 0)).toBe(42)
    })

    it('computes default for Err', () => {
      const result = err<number, string>('error')
      expect(result.unwrapOrElse(e => e.length)).toBe(5)
    })
  })

  describe('expect', () => {
    it('returns value for Ok', () => {
      const result = ok(42)
      expect(result.expect('should not fail')).toBe(42)
    })

    it('throws with custom message for Err', () => {
      const result = err('error')
      expect(() => result.expect('Operation failed')).toThrow('Operation failed')
    })
  })

  describe('tryCatch', () => {
    it('returns Ok for successful function', () => {
      const result: Result<number, string> = tryCatch(() => 42)

      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toBe(42)
      }
    })

    it('returns Err for throwing function', () => {
      const result = tryCatch<number, string>(
        () => {
          throw new Error('failed')
        },
        e => (e as Error).message,
      )

      expect(result.isErr).toBe(true)
      if (result.isErr) {
        expect(result.error).toBe('failed')
      }
    })
  })

  describe('tryCatchAsync', () => {
    it('returns Ok for successful async function', async () => {
      const result: Result<number, string> = await tryCatchAsync(async () => 42)

      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toBe(42)
      }
    })

    it('returns Err for rejecting async function', async () => {
      const result = await tryCatchAsync<number, string>(
        async () => {
          throw new Error('failed')
        },
        e => (e as Error).message,
      )

      expect(result.isErr).toBe(true)
      if (result.isErr) {
        expect(result.error).toBe('failed')
      }
    })
  })

  describe('combine', () => {
    it('combines successful Results', () => {
      const combined = combine(
        // @ts-expect-error - Complex type inference
        [ok<number, string>(1), ok<number, string>(2), ok<number, string>(3)],
      )

      expect(combined.isOk).toBe(true)
      if (combined.isOk) {
        expect(combined.value).toEqual([1, 2, 3])
      }
    })

    it('short-circuits on first error', () => {
      const combined = combine(
        // @ts-expect-error - Complex type inference
        [ok<number, string>(1), err<number, string>('error'), ok<number, string>(3)],
      )

      expect(combined.isErr).toBe(true)
      if (combined.isErr) {
        expect(combined.error).toBe('error')
      }
    })
  })

  describe('combineWithAllErrors', () => {
    it('combines successful Results', () => {
      const combined = combineWithAllErrors(
        // @ts-expect-error - Complex type inference
        [ok<number, string>(1), ok<number, string>(2), ok<number, string>(3)],
      )

      expect(combined.isOk).toBe(true)
      if (combined.isOk) {
        expect(combined.value).toEqual([1, 2, 3])
      }
    })

    it('collects all errors', () => {
      const combined = combineWithAllErrors(
        // @ts-expect-error - Complex type inference
        [ok<number, string>(1), err<number, string>('error1'), err<number, string>('error2')],
      )

      expect(combined.isErr).toBe(true)
      if (combined.isErr) {
        expect(combined.error).toEqual(['error1', 'error2'])
      }
    })
  })

  describe('fromNullable', () => {
    it('returns Ok for non-null value', () => {
      const result = fromNullable(42, 'was null')

      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toBe(42)
      }
    })

    it('returns Err for null', () => {
      const result = fromNullable(null, 'was null')

      expect(result.isErr).toBe(true)
      if (result.isErr) {
        expect(result.error).toBe('was null')
      }
    })

    it('returns Err for undefined', () => {
      const result = fromNullable(undefined, 'was undefined')

      expect(result.isErr).toBe(true)
      if (result.isErr) {
        expect(result.error).toBe('was undefined')
      }
    })
  })

  describe('fromPromise', () => {
    it('returns Ok for resolved promise', async () => {
      const result = await fromPromise(Promise.resolve(42))

      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toBe(42)
      }
    })

    it('returns Err for rejected promise', async () => {
      const result = await fromPromise<number, string>(
        Promise.reject(new Error('failed')),
        e => (e as Error).message,
      )

      expect(result.isErr).toBe(true)
      if (result.isErr) {
        expect(result.error).toBe('failed')
      }
    })
  })

  describe('isResult', () => {
    it('returns true for Ok', () => {
      expect(isResult(ok(42))).toBe(true)
    })

    it('returns true for Err', () => {
      expect(isResult(err('error'))).toBe(true)
    })

    it('returns false for non-Result values', () => {
      expect(isResult(42)).toBe(false)
      expect(isResult('string')).toBe(false)
      expect(isResult(null)).toBe(false)
      expect(isResult(undefined)).toBe(false)
      expect(isResult({})).toBe(false)
    })
  })

  describe('sequence', () => {
    it('executes operations in sequence when all succeed', async () => {
      const operations: (() => Promise<Result<number, string>>)[] = [
        async () => ok<number, string>(1),
        async () => ok<number, string>(2),
        async () => ok<number, string>(3),
      ]

      const result = await sequence(operations)

      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toEqual([1, 2, 3])
      }
    })

    it('stops at first error', async () => {
      let executed = 0
      const operations: (() => Promise<Result<number, string>>)[] = [
        async () => {
          executed++
          return ok<number, string>(1)
        },
        async () => {
          executed++
          return err<number, string>('error')
        },
        async () => {
          executed++
          return ok<number, string>(3)
        },
      ]

      const result = await sequence(operations)

      expect(result.isErr).toBe(true)
      expect(executed).toBe(2)
    })
  })

  describe('parallel', () => {
    it('executes operations in parallel when all succeed', async () => {
      const operations: (() => Promise<Result<number, string>>)[] = [
        async () => ok<number, string>(1),
        async () => ok<number, string>(2),
        async () => ok<number, string>(3),
      ]

      const result = await parallel(operations)

      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toEqual([1, 2, 3])
      }
    })

    it('returns first error encountered', async () => {
      const operations: (() => Promise<Result<number, string>>)[] = [
        async () => ok<number, string>(1),
        async () => err<number, string>('error'),
        async () => ok<number, string>(3),
      ]

      const result = await parallel(operations)

      expect(result.isErr).toBe(true)
    })
  })

  describe('traverse', () => {
    it('maps array with Result-returning function', () => {
      const items = [1, 2, 3]
      const result = traverse(items, x => ok(x * 2))

      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toEqual([2, 4, 6])
      }
    })

    it('short-circuits on first error', () => {
      const items = [1, 2, 3]
      const result: Result<number[], string> = traverse(items, x => (x === 2 ? err<number, string>('error') : ok<number, string>(x * 2)))

      expect(result.isErr).toBe(true)
    })
  })

  describe('traverseAsync', () => {
    it('maps array with async Result-returning function', async () => {
      const items = [1, 2, 3]
      const result = await traverseAsync(items, async x => ok(x * 2))

      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toEqual([2, 4, 6])
      }
    })

    it('short-circuits on first error', async () => {
      const items = [1, 2, 3]
      const result: Result<number[], string> = await traverseAsync(items, async x =>
        x === 2 ? err<number, string>('error') : ok<number, string>(x * 2))

      expect(result.isErr).toBe(true)
    })
  })

  describe('chaining example', () => {
    it('demonstrates complex chaining with full type safety', () => {
      interface User {
        name: string
        age: number
      }

      function parseAge(input: string): Result<number, string> {
        const age = Number.parseInt(input)
        if (Number.isNaN(age))
          return err('Invalid age')
        if (age < 0 || age > 120)
          return err('Age out of range')
        return ok(age)
      }

      function createUser(name: string, ageStr: string): Result<User, string> {
        return parseAge(ageStr)
          .map(age => ({ name, age }))
      }

      const result = createUser('Alice', '30')
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.name).toBe('Alice')
        expect(result.value.age).toBe(30)
      }

      const invalidResult = createUser('Bob', 'invalid')
      expect(invalidResult.isErr).toBe(true)
      if (invalidResult.isErr) {
        expect(invalidResult.error).toBe('Invalid age')
      }
    })
  })

  describe('edge cases', () => {
    it('handles nested Results correctly', () => {
      const nested = ok(ok(42))
      expect(nested.isOk).toBe(true)
      if (nested.isOk) {
        expect(nested.value.isOk).toBe(true)
      }
    })

    it('handles empty arrays with traverse', () => {
      const result = traverse([], x => ok(x))
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toEqual([])
      }
    })

    it('handles empty arrays with traverseAsync', async () => {
      const result = await traverseAsync([], async x => ok(x))
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toEqual([])
      }
    })

    it('handles null values with fromNullable', () => {
      const result = fromNullable(null, 'null value')
      expect(result.isErr).toBe(true)
      if (result.isErr) {
        expect(result.error).toBe('null value')
      }
    })

    it('handles undefined values with fromNullable', () => {
      const result = fromNullable(undefined, 'undefined value')
      expect(result.isErr).toBe(true)
      if (result.isErr) {
        expect(result.error).toBe('undefined value')
      }
    })

    it('handles 0 as valid value with fromNullable', () => {
      const result = fromNullable(0, 'was null')
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toBe(0)
      }
    })

    it('handles empty string as valid value with fromNullable', () => {
      const result = fromNullable('', 'was null')
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toBe('')
      }
    })

    it('handles false as valid value with fromNullable', () => {
      const result = fromNullable(false, 'was null')
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toBe(false)
      }
    })
  })

  describe('chaining complex operations', () => {
    it('chains multiple andThen operations', () => {
      const result: Result<number, string> = ok<number, string>(10)
        .andThen(x => ok<number, string>(x * 2))
        .andThen(x => ok<number, string>(x + 5))
        .andThen(x => ok<number, string>(x - 3))

      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toBe(22)
      }
    })

    it('stops chaining at first error in andThen', () => {
      let callCount = 0
      const result: Result<number, string> = ok<number, string>(10)
        .andThen((x) => {
          callCount++
          return ok<number, string>(x * 2)
        })
        .andThen((_x) => {
          callCount++
          return err<number, string>('error')
        })
        .andThen((x) => {
          callCount++
          return ok<number, string>(x + 5)
        })

      expect(result.isErr).toBe(true)
      expect(callCount).toBe(2)
    })

    it('chains multiple map operations', () => {
      const result = ok(5)
        .map(x => x * 2)
        .map(x => x + 3)
        .map(x => x.toString())

      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toBe('13')
      }
    })

    it('chains orElse for error recovery', () => {
      const result: Result<number, string> = err<number, string>('error1')
        .orElse(_e => err<number, string>('error2'))
        .orElse(_e => err<number, string>('error3'))
        .orElse(_e => ok<number, string>(42))

      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toBe(42)
      }
    })
  })

  describe('error handling with tryCatch', () => {
    it('catches TypeError', () => {
      const result: Result<string, string> = tryCatch(
        () => {
          const obj: unknown = null
          // @ts-expect-error - Intentionally causing error
          return obj.toString()
        },
        e => (e as Error).name,
      )

      expect(result.isErr).toBe(true)
      if (result.isErr) {
        expect(result.error).toBe('TypeError')
      }
    })

    it('catches ReferenceError', () => {
      const result: Result<unknown, string> = tryCatch(
        () => {
          // @ts-expect-error - Intentionally using undefined variable
          return undefinedVariable
        },
        e => (e as Error).name,
      )

      expect(result.isErr).toBe(true)
      if (result.isErr) {
        expect(result.error).toBe('ReferenceError')
      }
    })

    it('preserves stack trace in error handler', () => {
      const result = tryCatch<number, Error>(
        () => {
          throw new Error('test error')
        },
        e => e as Error,
      )

      expect(result.isErr).toBe(true)
      if (result.isErr) {
        expect(result.error.stack).toBeDefined()
      }
    })
  })

  describe('async error handling', () => {
    it('handles rejected promises with fromPromise', async () => {
      const result: Result<number, string> = await fromPromise<number, string>(
        Promise.reject(new Error('async error')),
        e => (e as Error).message,
      )

      expect(result.isErr).toBe(true)
      if (result.isErr) {
        expect(result.error).toBe('async error')
      }
    })

    it('handles timeout errors', async () => {
      const timeout = (ms: number) =>
        new Promise<never>((_resolve, reject) =>
          setTimeout(() => reject(new Error('Timeout')), ms),
        )

      const result: Result<never, string> = await fromPromise(
        timeout(10),
        e => (e as Error).message,
      )

      expect(result.isErr).toBe(true)
      if (result.isErr) {
        expect(result.error).toBe('Timeout')
      }
    })
  })

  describe('type inference', () => {
    it('infers correct types for ok', () => {
      const result = ok(42)
      // Type should be Result<number, never>
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        const value: number = result.value
        expect(value).toBe(42)
      }
    })

    it('infers correct types for err', () => {
      const result = err('error')
      // Type should be Result<never, string>
      expect(result.isErr).toBe(true)
      if (result.isErr) {
        const error: string = result.error
        expect(error).toBe('error')
      }
    })
  })

  describe('real-world scenarios', () => {
    it('validates and parses form input', () => {
      interface FormInput {
        email: string
        age: string
      }

      function validateFormInput(input: FormInput): Result<{ email: string, age: number }, string[]> {
        const errors: string[] = []

        if (!input.email.includes('@')) {
          errors.push('Invalid email')
        }

        const age = Number.parseInt(input.age)
        if (Number.isNaN(age) || age < 0) {
          errors.push('Invalid age')
        }

        if (errors.length > 0) {
          return err(errors)
        }

        return ok({ email: input.email, age })
      }

      const valid = validateFormInput({ email: 'test@example.com', age: '25' })
      expect(valid.isOk).toBe(true)

      const invalid = validateFormInput({ email: 'invalid', age: 'abc' })
      expect(invalid.isErr).toBe(true)
      if (invalid.isErr) {
        expect(invalid.error).toContain('Invalid email')
        expect(invalid.error).toContain('Invalid age')
      }
    })

    it('handles database-style operations', async () => {
      interface User {
        id: number
        name: string
      }

      async function findUserById(id: number): Promise<Result<User, string>> {
        if (id <= 0) {
          return err('Invalid ID')
        }

        await new Promise(resolve => setTimeout(resolve, 1))

        if (id === 999) {
          return err('User not found')
        }

        return ok({ id, name: `User${id}` })
      }

      const user = await findUserById(1)
      expect(user.isOk).toBe(true)

      const notFound = await findUserById(999)
      expect(notFound.isErr).toBe(true)

      const invalid = await findUserById(-1)
      expect(invalid.isErr).toBe(true)
    })

    it('handles parsing with multiple validation steps', () => {
      function parseAndValidateNumber(input: string): Result<number, string> {
        const parsed: Result<number, string> = tryCatch(
          () => Number.parseFloat(input),
          () => 'Parse error',
        )

        return parsed
          .andThen((num): Result<number, string> => {
            if (Number.isNaN(num))
              return err('Not a number')
            return ok(num)
          })
          .andThen((num): Result<number, string> => {
            if (!Number.isFinite(num))
              return err('Must be finite')
            return ok(num)
          })
          .andThen((num): Result<number, string> => {
            if (num < 0)
              return err('Must be positive')
            return ok(num)
          })
      }

      expect(parseAndValidateNumber('42').isOk).toBe(true)
      expect(parseAndValidateNumber('abc').isErr).toBe(true)
      expect(parseAndValidateNumber('Infinity').isErr).toBe(true)
      expect(parseAndValidateNumber('-5').isErr).toBe(true)
    })
  })

  describe('new utility functions', () => {
    describe('flatten', () => {
      it('flattens nested Ok Result', async () => {
        const { flatten } = await import('../src/result')
        const nested = ok(ok(42))
        const flattened = flatten(nested)

        expect(flattened.isOk).toBe(true)
        if (flattened.isOk) {
          expect(flattened.value).toBe(42)
        }
      })

      it('flattens outer Err', async () => {
        const { flatten } = await import('../src/result')
        const nested: Result<Result<number, string>, string> = err('outer error')
        const flattened = flatten(nested)

        expect(flattened.isErr).toBe(true)
        if (flattened.isErr) {
          expect(flattened.error).toBe('outer error')
        }
      })

      it('flattens inner Err', async () => {
        const { flatten } = await import('../src/result')
        const nested: Result<Result<number, string>, string> = ok(err<number, string>('inner error'))
        const flattened = flatten(nested)

        expect(flattened.isErr).toBe(true)
        if (flattened.isErr) {
          expect(flattened.error).toBe('inner error')
        }
      })
    })

    describe('tap', () => {
      it('calls onOk for Ok result', async () => {
        const { tap } = await import('../src/result')
        let called = false
        let value: number | undefined

        const result = tap(
          ok(42),
          (v) => {
            called = true
            value = v
          },
        )

        expect(called).toBe(true)
        expect(value).toBe(42)
        expect(result.isOk).toBe(true)
      })

      it('calls onErr for Err result', async () => {
        const { tap } = await import('../src/result')
        let called = false
        let error: string | undefined

        const result = tap(
          err<number, string>('error'),
          undefined,
          (e) => {
            called = true
            error = e
          },
        )

        expect(called).toBe(true)
        expect(error).toBe('error')
        expect(result.isErr).toBe(true)
      })

      it('does not modify the result', async () => {
        const { tap } = await import('../src/result')
        const original = ok(42)
        const tapped = tap(original, () => {})

        expect(tapped).toBe(original)
      })
    })

    describe('swap', () => {
      it('swaps Ok to Err', async () => {
        const { swap } = await import('../src/result')
        const result = swap(ok(42))

        expect(result.isErr).toBe(true)
        if (result.isErr) {
          expect(result.error).toBe(42)
        }
      })

      it('swaps Err to Ok', async () => {
        const { swap } = await import('../src/result')
        const result = swap(err('error'))

        expect(result.isOk).toBe(true)
        if (result.isOk) {
          expect(result.value).toBe('error')
        }
      })
    })

    describe('filter', () => {
      it('keeps Ok when predicate is true', async () => {
        const { filter } = await import('../src/result')
        const result = filter(ok<number, string>(42), x => x > 0, 'must be positive')

        expect(result.isOk).toBe(true)
        if (result.isOk) {
          expect(result.value).toBe(42)
        }
      })

      it('converts to Err when predicate is false', async () => {
        const { filter } = await import('../src/result')
        const result = filter(ok<number, string>(-5), x => x > 0, 'must be positive')

        expect(result.isErr).toBe(true)
        if (result.isErr) {
          expect(result.error).toBe('must be positive')
        }
      })

      it('keeps Err unchanged', async () => {
        const { filter } = await import('../src/result')
        const result = filter(err<number, string>('error'), x => x > 0, 'must be positive')

        expect(result.isErr).toBe(true)
        if (result.isErr) {
          expect(result.error).toBe('error')
        }
      })
    })

    describe('unwrapOrThrow', () => {
      it('returns Ok value', async () => {
        const { unwrapOrThrow } = await import('../src/result')
        const value = unwrapOrThrow(ok(42))

        expect(value).toBe(42)
      })

      it('throws for Err', async () => {
        const { unwrapOrThrow } = await import('../src/result')
        expect(() => unwrapOrThrow(err('error'))).toThrow()
      })

      it('uses custom error mapper', async () => {
        const { unwrapOrThrow } = await import('../src/result')
        try {
          unwrapOrThrow(err('custom'), e => new Error(`Custom: ${e}`))
          throw new Error('Should have thrown')
        }
        catch (error) {
          expect((error as Error).message).toBe('Custom: custom')
        }
      })
    })

    describe('toPromise', () => {
      it('resolves for Ok', async () => {
        const { toPromise } = await import('../src/result')
        const promise = toPromise(ok(42))

        await expect(promise).resolves.toBe(42)
      })

      it('rejects for Err', async () => {
        const { toPromise } = await import('../src/result')
        const promise = toPromise(err('error'))

        await expect(promise).rejects.toThrow('error')
      })

      it('uses custom error mapper', async () => {
        const { toPromise } = await import('../src/result')
        const promise = toPromise(err('custom'), e => new Error(`Custom: ${e}`))

        await expect(promise).rejects.toThrow('Custom: custom')
      })
    })

    describe('getOrElse', () => {
      it('returns Ok value', async () => {
        const { getOrElse } = await import('../src/result')
        const value = getOrElse(ok(42), () => 0)

        expect(value).toBe(42)
      })

      it('computes default for Err', async () => {
        const { getOrElse } = await import('../src/result')
        const value = getOrElse(err<number, string>('error'), e => e.length)

        expect(value).toBe(5)
      })
    })

    describe('all', () => {
      it('returns Ok with all values when all succeed', async () => {
        const { all } = await import('../src/result')
        const result = all([ok<number, string>(1), ok<number, string>(2), ok<number, string>(3)])

        expect(result.isOk).toBe(true)
        if (result.isOk) {
          expect(result.value).toEqual([1, 2, 3])
        }
      })

      it('returns first Err when any fails', async () => {
        const { all } = await import('../src/result')
        const result = all([ok<number, string>(1), err<number, string>('error'), ok<number, string>(3)])

        expect(result.isErr).toBe(true)
        if (result.isErr) {
          expect(result.error).toBe('error')
        }
      })

      it('handles empty array', async () => {
        const { all } = await import('../src/result')
        const result = all<number, string>([])

        expect(result.isOk).toBe(true)
        if (result.isOk) {
          expect(result.value).toEqual([])
        }
      })
    })

    describe('any', () => {
      it('returns first Ok when any succeeds', async () => {
        const { any } = await import('../src/result')
        const result = any([err<number, string>('error1'), ok<number, string>(42), ok<number, string>(43)])

        expect(result.isOk).toBe(true)
        if (result.isOk) {
          expect(result.value).toBe(42)
        }
      })

      it('returns last Err when all fail', async () => {
        const { any } = await import('../src/result')
        const result = any([err<number, string>('error1'), err<number, string>('error2'), err<number, string>('error3')])

        expect(result.isErr).toBe(true)
        if (result.isErr) {
          expect(result.error).toBe('error3')
        }
      })
    })

    describe('partition', () => {
      it('separates Oks and Errs', async () => {
        const { partition } = await import('../src/result')
        const [oks, errs] = partition([
          ok<number, string>(1),
          err<number, string>('error1'),
          ok<number, string>(2),
          err<number, string>('error2'),
          ok<number, string>(3),
        ])

        expect(oks).toEqual([1, 2, 3])
        expect(errs).toEqual(['error1', 'error2'])
      })

      it('handles all Oks', async () => {
        const { partition } = await import('../src/result')
        const [oks, errs] = partition([ok<number, string>(1), ok<number, string>(2), ok<number, string>(3)])

        expect(oks).toEqual([1, 2, 3])
        expect(errs).toEqual([])
      })

      it('handles all Errs', async () => {
        const { partition } = await import('../src/result')
        const [oks, errs] = partition([err<number, string>('e1'), err<number, string>('e2')])

        expect(oks).toEqual([])
        expect(errs).toEqual(['e1', 'e2'])
      })

      it('handles empty array', async () => {
        const { partition } = await import('../src/result')
        const [oks, errs] = partition<number, string>([])

        expect(oks).toEqual([])
        expect(errs).toEqual([])
      })
    })
  })
})
