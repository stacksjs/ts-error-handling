# Result Type

The `Result<T, E>` type represents either a successful value of type `T` (Ok) or an error of type `E` (Err). This is the core type in ts-error-handling.

## Type Definition

```typescript
type Result<T, E> = Ok<T, E> | Err<T, E>
```

## Creating Results

### ok()

Creates a successful Result containing a value:

```typescript
import { ok } from 'ts-error-handling'

const result = ok(42)
// Result<number, never>

const user = ok({ id: 1, name: 'John' })
// Result<{ id: number; name: string }, never>
```

### err()

Creates a failed Result containing an error:

```typescript
import { err } from 'ts-error-handling'

const result = err('Something went wrong')
// Result<never, string>

const error = err({ code: 404, message: 'Not found' })
// Result<never, { code: number; message: string }>
```

### With Explicit Types

```typescript
import { ok, err } from 'ts-error-handling'
import type { Result } from 'ts-error-handling'

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return err('Division by zero')
  }
  return ok(a / b)
}
```

## Properties

### isOk

Returns `true` if the Result is Ok:

```typescript
const success = ok(42)
success.isOk // true

const failure = err('error')
failure.isOk // false
```

### isErr

Returns `true` if the Result is Err:

```typescript
const success = ok(42)
success.isErr // false

const failure = err('error')
failure.isErr // true
```

### value

The success value (only accessible on Ok):

```typescript
const result = ok(42)

if (result.isOk) {
  console.log(result.value) // 42 - TypeScript knows this is number
}
```

### error

The error value (only accessible on Err):

```typescript
const result = err('something failed')

if (result.isErr) {
  console.log(result.error) // 'something failed'
}
```

### _tag

A discriminant property for pattern matching:

```typescript
const result = ok(42)
result._tag // 'Ok'

const error = err('failed')
error._tag // 'Err'
```

## Transformation Methods

### map()

Transforms the Ok value, leaving Err unchanged:

```typescript
// Transform success value
ok(21).map(x => x _ 2) // Ok(42)

// Err passes through unchanged
err('failed').map(x => x _ 2) // Err('failed')

// Chaining
ok(5)
  .map(x => x + 1)  // Ok(6)
  .map(x => x * 2)  // Ok(12)
  .map(x => `Result: ${x}`) // Ok('Result: 12')
```

**Type Signature:**
```typescript
map<U>(fn: (value: T) => U): Result<U, E>
```

### mapErr()

Transforms the Err value, leaving Ok unchanged:

```typescript
// Ok passes through unchanged
ok(42).mapErr(e => e.toUpperCase()) // Ok(42)

// Transform error value
err('failed').mapErr(e => e.toUpperCase()) // Err('FAILED')

// Convert error type
err('not found')
  .mapErr(msg => ({ code: 404, message: msg }))
// Err({ code: 404, message: 'not found' })
```

**Type Signature:**
```typescript
mapErr<F>(fn: (error: E) => F): Result<T, F>
```

### andThen() / flatMap()

Chains Result-returning operations:

```typescript
function parseNumber(s: string): Result<number, string> {
  const n = parseInt(s)
  return isNaN(n) ? err('Not a number') : ok(n)
}

function validatePositive(n: number): Result<number, string> {
  return n > 0 ? ok(n) : err('Must be positive')
}

function validateEven(n: number): Result<number, string> {
  return n % 2 === 0 ? ok(n) : err('Must be even')
}

// Chain validations
const result = parseNumber('42')
  .andThen(validatePositive)
  .andThen(validateEven)
// Ok(42)

const failedResult = parseNumber('-5')
  .andThen(validatePositive)
  .andThen(validateEven)
// Err('Must be positive') - stops at first error
```

**Type Signature:**
```typescript
andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E>
```

### orElse()

Recovers from errors by providing an alternative:

```typescript
// Try cache, fall back to database
function getFromCache(key: string): Result<Data, string> {
  return err('Cache miss')
}

function getFromDatabase(key: string): Result<Data, string> {
  return ok({ id: 1, value: 'from database' })
}

const result = getFromCache('user:1')
  .orElse(() => getFromDatabase('user:1'))
// Ok({ id: 1, value: 'from database' })

// Ok stays Ok
ok(42).orElse(() => ok(0)) // Ok(42)
```

**Type Signature:**
```typescript
orElse<F>(fn: (error: E) => Result<T, F>): Result<T, F>
```

## Unwrapping Methods

### unwrap()

Returns the Ok value or throws an error:

```typescript
ok(42).unwrap() // 42
err('failed').unwrap() // throws Error('failed')
```

Use with caution - prefer pattern matching or other safe methods.

### unwrapOr()

Returns the Ok value or a default:

```typescript
ok(42).unwrapOr(0) // 42
err('failed').unwrapOr(0) // 0
```

### unwrapOrElse()

Returns the Ok value or computes a default from the error:

```typescript
ok(42).unwrapOrElse(e => 0) // 42
err('message').unwrapOrElse(e => e.length) // 7

// Useful for logging
result.unwrapOrElse(error => {
  console.error('Failed:', error)
  return defaultValue
})
```

### expect()

Returns the Ok value or throws with a custom message:

```typescript
ok(42).expect('Value should exist') // 42
err('failed').expect('Value should exist')
// throws Error('Value should exist')
```

## Pattern Matching

### match()

Exhaustively handles both Ok and Err cases:

```typescript
const result = divide(10, 0)

const message = result.match({
  ok: value => `Success: ${value}`,
  err: error => `Error: ${error}`
})
// 'Error: Division by zero'

// With complex logic
const response = result.match({
  ok: value => ({
    status: 200,
    body: { data: value }
  }),
  err: error => ({
    status: 400,
    body: { error }
  })
})
```

**Type Signature:**
```typescript
match<U>(patterns: {
  ok: (value: T) => U
  err: (error: E) => U
}): U
```

## Type Guards

### isResult()

Checks if a value is a Result:

```typescript
import { isResult } from 'ts-error-handling'

isResult(ok(42)) // true
isResult(err('error')) // true
isResult(42) // false
isResult(null) // false
```

## Combining Results

### combine()

Combines an array of Results, failing fast on the first error:

```typescript
import { combine } from 'ts-error-handling'

// All Ok - returns array of values
combine([ok(1), ok(2), ok(3)])
// Ok([1, 2, 3])

// Contains Err - returns first error
combine([ok(1), err('error 1'), ok(3), err('error 2')])
// Err('error 1')

// Preserve types with tuples
const result = combine([
  ok('hello') as Result<string, string>,
  ok(42) as Result<number, string>,
  ok(true) as Result<boolean, string>
])
// Result<[string, number, boolean], string>
```

### combineWithAllErrors()

Collects all errors instead of failing fast:

```typescript
import { combineWithAllErrors } from 'ts-error-handling'

// Contains errors - returns all errors
combineWithAllErrors([
  ok(1),
  err('error 1'),
  ok(3),
  err('error 2')
])
// Err(['error 1', 'error 2'])

// All Ok - returns values
combineWithAllErrors([ok(1), ok(2), ok(3)])
// Ok([1, 2, 3])
```

### all()

Similar to combine, collects all Ok values or returns first Err:

```typescript
import { all } from 'ts-error-handling'

all([ok(1), ok(2), ok(3)])
// Ok([1, 2, 3])

all([ok(1), err('failed'), ok(3)])
// Err('failed')
```

### any()

Returns the first Ok or the last Err:

```typescript
import { any } from 'ts-error-handling'

any([err('error 1'), ok(42), err('error 2')])
// Ok(42)

any([err('error 1'), err('error 2'), err('error 3')])
// Err('error 3')
```

## Array Operations

### traverse()

Maps over an array with a Result-returning function:

```typescript
import { traverse } from 'ts-error-handling'

function parseNumber(s: string): Result<number, string> {
  const n = parseInt(s)
  return isNaN(n) ? err(`'${s}' is not a number`) : ok(n)
}

traverse(['1', '2', '3'], parseNumber)
// Ok([1, 2, 3])

traverse(['1', 'abc', '3'], parseNumber)
// Err("'abc' is not a number")
```

### partition()

Splits Results into successes and failures:

```typescript
import { partition } from 'ts-error-handling'

const results = [ok(1), err('error 1'), ok(2), err('error 2')]
const [successes, failures] = partition(results)
// successes: [1, 2]
// failures: ['error 1', 'error 2']
```

## Transformation Utilities

### flatten()

Flattens nested Results:

```typescript
import { flatten } from 'ts-error-handling'

const nested: Result<Result<number, string>, string> = ok(ok(42))
flatten(nested) // Ok(42)

const nestedErr: Result<Result<number, string>, string> = ok(err('inner'))
flatten(nestedErr) // Err('inner')
```

### swap()

Swaps Ok and Err values:

```typescript
import { swap } from 'ts-error-handling'

swap(ok(42)) // Err(42)
swap(err('error')) // Ok('error')
```

### filter()

Filters based on a predicate:

```typescript
import { filter } from 'ts-error-handling'

filter(ok(42), n => n > 0, 'Must be positive')
// Ok(42)

filter(ok(-5), n => n > 0, 'Must be positive')
// Err('Must be positive')

filter(err('already error'), n => n > 0, 'Must be positive')
// Err('already error')
```

### tap()

Performs side effects without modifying the Result:

```typescript
import { tap } from 'ts-error-handling'

tap(
  ok(42),
  value => console.log('Success:', value),
  error => console.log('Error:', error)
)
// Logs: 'Success: 42'
// Returns: Ok(42)
```

## Conversion Utilities

### toPromise()

Converts Result to Promise:

```typescript
import { toPromise } from 'ts-error-handling'

await toPromise(ok(42)) // 42
await toPromise(err('failed')) // throws Error('failed')

// With custom error mapping
await toPromise(err('failed'), e => new CustomError(e))
```

### unwrapOrThrow()

Unwraps or throws a mapped error:

```typescript
import { unwrapOrThrow } from 'ts-error-handling'

unwrapOrThrow(ok(42)) // 42
unwrapOrThrow(err('failed'), e => new Error(`Failed: ${e}`))
// throws Error('Failed: failed')
```

### getOrElse()

Gets value or computes default from error:

```typescript
import { getOrElse } from 'ts-error-handling'

getOrElse(ok(42), e => 0) // 42
getOrElse(err('failed'), e => e.length) // 6
```

## Type Utilities

### InferOkType

Extracts the Ok type from a Result:

```typescript
import type { InferOkType } from 'ts-error-handling'

type R = Result<string, number>
type OkType = InferOkType<R> // string
```

### InferErrType

Extracts the Err type from a Result:

```typescript
import type { InferErrType } from 'ts-error-handling'

type R = Result<string, number>
type ErrType = InferErrType<R> // number
```

## Complete Example

```typescript
import { ok, err, combine, tryCatch } from 'ts-error-handling'
import type { Result } from 'ts-error-handling'

// Define error types
type ValidationError = {
  field: string
  message: string
}

// Validation functions
function validateEmail(email: string): Result<string, ValidationError> {
  if (!email.includes('@')) {
    return err({ field: 'email', message: 'Invalid email format' })
  }
  return ok(email)
}

function validateAge(age: number): Result<number, ValidationError> {
  if (age < 0 || age > 150) {
    return err({ field: 'age', message: 'Age must be between 0 and 150' })
  }
  return ok(age)
}

// Parse JSON safely
function parseUserInput(json: string): Result<{ email: string; age: number }, ValidationError> {
  return tryCatch(
    () => JSON.parse(json),
    () => ({ field: 'input', message: 'Invalid JSON' })
  )
}

// Full validation pipeline
function validateUser(input: string): Result<{ email: string; age: number }, ValidationError[]> {
  return parseUserInput(input)
    .mapErr(e => [e]) // Wrap single error in array
    .andThen(data => {
      const emailResult = validateEmail(data.email)
      const ageResult = validateAge(data.age)

      return combineWithAllErrors([emailResult, ageResult])
        .map(([email, age]) => ({ email, age }))
    })
}

// Usage
const result = validateUser('{"email": "test", "age": -5}')

result.match({
  ok: user => console.log('Valid user:', user),
  err: errors => errors.forEach(e =>
    console.error(`${e.field}: ${e.message}`)
  )
})
// Output:
// email: Invalid email format
// age: Age must be between 0 and 150
```
