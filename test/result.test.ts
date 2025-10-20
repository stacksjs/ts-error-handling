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
import type { Result } from '../src/types'

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
      const result = ok<number, string>(42).orElse(e => ok(0))

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
      const result = tryCatch(() => 42)

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
      const result = await tryCatchAsync(async () => 42)

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
      const results = [ok(1), ok(2), ok(3)] as const
      const combined = combine(results)

      expect(combined.isOk).toBe(true)
      if (combined.isOk) {
        expect(combined.value).toEqual([1, 2, 3])
      }
    })

    it('short-circuits on first error', () => {
      const results = [ok(1), err('error'), ok(3)] as const
      const combined = combine(results)

      expect(combined.isErr).toBe(true)
      if (combined.isErr) {
        expect(combined.error).toBe('error')
      }
    })
  })

  describe('combineWithAllErrors', () => {
    it('combines successful Results', () => {
      const results = [ok(1), ok(2), ok(3)] as const
      const combined = combineWithAllErrors(results)

      expect(combined.isOk).toBe(true)
      if (combined.isOk) {
        expect(combined.value).toEqual([1, 2, 3])
      }
    })

    it('collects all errors', () => {
      const results = [ok(1), err('error1'), err('error2')] as const
      const combined = combineWithAllErrors(results)

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
      const operations = [
        async () => ok(1),
        async () => ok(2),
        async () => ok(3),
      ]

      const result = await sequence(operations)

      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toEqual([1, 2, 3])
      }
    })

    it('stops at first error', async () => {
      let executed = 0
      const operations = [
        async () => {
          executed++
          return ok(1)
        },
        async () => {
          executed++
          return err<number, string>('error')
        },
        async () => {
          executed++
          return ok(3)
        },
      ]

      const result = await sequence(operations)

      expect(result.isErr).toBe(true)
      expect(executed).toBe(2)
    })
  })

  describe('parallel', () => {
    it('executes operations in parallel when all succeed', async () => {
      const operations = [
        async () => ok(1),
        async () => ok(2),
        async () => ok(3),
      ]

      const result = await parallel(operations)

      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toEqual([1, 2, 3])
      }
    })

    it('returns first error encountered', async () => {
      const operations = [
        async () => ok(1),
        async () => err<number, string>('error'),
        async () => ok(3),
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
      const result = traverse(items, x => (x === 2 ? err('error') : ok(x * 2)))

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
      const result = await traverseAsync(items, async x =>
        x === 2 ? err('error') : ok(x * 2),
      )

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
})
