# Option Type

While ts-error-handling focuses on the Result type, the library provides utilities for working with optional values in a Result-oriented way. This guide covers patterns for handling nullable values.

## Working with Nullable Values

### fromNullable()

Converts nullable values to Result:

```typescript
import { fromNullable } from 'ts-error-handling'
import type { Result } from 'ts-error-handling'

// Basic usage
fromNullable('hello', 'Value is null')
// Ok('hello')

fromNullable(null, 'Value is null')
// Err('Value is null')

fromNullable(undefined, 'Value is undefined')
// Err('Value is undefined')
```

### Practical Examples

```typescript
interface User {
  id: number
  name: string
  email?: string
  profile?: {
    bio?: string
    avatar?: string
  }
}

function getEmail(user: User): Result<string, string> {
  return fromNullable(user.email, 'User has no email')
}

function getBio(user: User): Result<string, string> {
  return fromNullable(user.profile, 'User has no profile')
    .andThen(profile => fromNullable(profile.bio, 'User has no bio'))
}

// Usage
const user: User = { id: 1, name: 'John' }
getEmail(user) // Err('User has no email')

const userWithEmail: User = { id: 2, name: 'Jane', email: 'jane@example.com' }
getEmail(userWithEmail) // Ok('jane@example.com')
```

## Option Pattern with Result

You can create an Option-like pattern using Result with a unit type for errors:

```typescript
import { ok, err } from 'ts-error-handling'
import type { Result } from 'ts-error-handling'

// Define a None type
type None = { readonly _tag: 'None' }
const None: None = { _tag: 'None' }

// Option is Result with None as error type
type Option<T> = Result<T, None>

// Helper functions
function some<T>(value: T): Option<T> {
  return ok(value)
}

function none<T>(): Option<T> {
  return err(None)
}

function isSome<T>(option: Option<T>): option is Ok<T, None> {
  return option.isOk
}

function isNone<T>(option: Option<T>): option is Err<T, None> {
  return option.isErr
}

// Usage
const maybeNumber: Option<number> = some(42)
const noNumber: Option<number> = none()

maybeNumber.map(n => n * 2) // Some(84)
noNumber.map(n => n * 2) // None

maybeNumber.unwrapOr(0) // 42
noNumber.unwrapOr(0) // 0
```

## Safe Property Access

Create utilities for safe property access:

```typescript
import { fromNullable } from 'ts-error-handling'
import type { Result } from 'ts-error-handling'

// Safe property getter
function prop<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K
): Result<NonNullable<T[K]>, string> {
  if (obj == null) {
    return err(`Cannot read property '${String(key)}' of ${obj}`)
  }
  return fromNullable(obj[key] as NonNullable<T[K]>, `Property '${String(key)}' is null`)
}

// Usage
interface Config {
  database?: {
    host?: string
    port?: number
  }
}

const config: Config = { database: { host: 'localhost' } }

prop(config, 'database')
  .andThen(db => prop(db, 'host'))
// Ok('localhost')

prop(config, 'database')
  .andThen(db => prop(db, 'port'))
// Err("Property 'port' is null")
```

## Array Operations with Optional Values

### Find with Result

```typescript
import { ok, err } from 'ts-error-handling'
import type { Result } from 'ts-error-handling'

function find<T>(
  array: T[],
  predicate: (item: T) => boolean
): Result<T, string> {
  const found = array.find(predicate)
  return fromNullable(found, 'Item not found')
}

// Usage
const users = [
  { id: 1, name: 'John' },
  { id: 2, name: 'Jane' }
]

find(users, u => u.id === 1)
// Ok({ id: 1, name: 'John' })

find(users, u => u.id === 999)
// Err('Item not found')
```

### First and Last

```typescript
function first<T>(array: T[]): Result<T, string> {
  return fromNullable(array[0], 'Array is empty')
}

function last<T>(array: T[]): Result<T, string> {
  return fromNullable(array[array.length - 1], 'Array is empty')
}

// Usage
first([1, 2, 3]) // Ok(1)
first([]) // Err('Array is empty')

last([1, 2, 3]) // Ok(3)
last([]) // Err('Array is empty')
```

## Map/Dictionary Lookups

```typescript
import { ok, err, fromNullable } from 'ts-error-handling'
import type { Result } from 'ts-error-handling'

function lookup<K, V>(
  map: Map<K, V>,
  key: K
): Result<V, string> {
  const value = map.get(key)
  return fromNullable(value, `Key '${key}' not found`)
}

function recordLookup<V>(
  record: Record<string, V>,
  key: string
): Result<V, string> {
  return fromNullable(record[key], `Key '${key}' not found`)
}

// Usage
const userMap = new Map([
  [1, { name: 'John' }],
  [2, { name: 'Jane' }]
])

lookup(userMap, 1) // Ok({ name: 'John' })
lookup(userMap, 999) // Err("Key '999' not found")

const config = { host: 'localhost', port: '3000' }
recordLookup(config, 'host') // Ok('localhost')
recordLookup(config, 'missing') // Err("Key 'missing' not found")
```

## Environment Variables

```typescript
import { fromNullable } from 'ts-error-handling'
import type { Result } from 'ts-error-handling'

function getEnv(name: string): Result<string, string> {
  return fromNullable(
    process.env[name],
    `Environment variable '${name}' is not set`
  )
}

function getEnvNumber(name: string): Result<number, string> {
  return getEnv(name)
    .andThen(value => {
      const num = parseInt(value)
      return isNaN(num)
        ? err(`Environment variable '${name}' is not a number`)
        : ok(num)
    })
}

// Usage
interface DatabaseConfig {
  host: string
  port: number
  name: string
}

function getDatabaseConfig(): Result<DatabaseConfig, string[]> {
  return combineWithAllErrors([
    getEnv('DB_HOST'),
    getEnvNumber('DB_PORT'),
    getEnv('DB_NAME')
  ]).map(([host, port, name]) => ({ host, port, name }))
}

const config = getDatabaseConfig()
config.match({
  ok: cfg => console.log('Database config:', cfg),
  err: errors => console.error('Missing config:', errors)
})
```

## Chaining Optional Lookups

```typescript
interface Company {
  name: string
  address?: {
    street?: string
    city?: string
    country?: {
      name?: string
      code?: string
    }
  }
}

function getCountryCode(company: Company): Result<string, string> {
  return fromNullable(company.address, 'Company has no address')
    .andThen(address =>
      fromNullable(address.country, 'Address has no country')
    )
    .andThen(country =>
      fromNullable(country.code, 'Country has no code')
    )
}

// Usage
const company: Company = {
  name: 'ACME',
  address: {
    street: '123 Main St',
    city: 'New York',
    country: {
      name: 'United States',
      code: 'US'
    }
  }
}

getCountryCode(company) // Ok('US')

const companyNoCode: Company = {
  name: 'ACME',
  address: {
    country: { name: 'United States' }
  }
}

getCountryCode(companyNoCode) // Err('Country has no code')
```

## Default Values Pattern

```typescript
import { ok, fromNullable } from 'ts-error-handling'
import type { Result } from 'ts-error-handling'

// Get with default
function getWithDefault<T>(
  value: T | null | undefined,
  defaultValue: T
): T {
  return fromNullable(value, '').unwrapOr(defaultValue)
}

// Get or compute default
function getOrCompute<T>(
  value: T | null | undefined,
  compute: () => T
): T {
  return fromNullable(value, '')
    .unwrapOrElse(compute)
}

// Usage
const config = {
  timeout: undefined as number | undefined,
  retries: 3
}

const timeout = getWithDefault(config.timeout, 5000) // 5000
const retries = getWithDefault(config.retries, 1) // 3

const expensiveDefault = getOrCompute(
  config.timeout,
  () => {
    console.log('Computing default...')
    return 10000
  }
)
// Logs: 'Computing default...'
// Returns: 10000
```

## Filtering Optionals

```typescript
import { ok, err, fromNullable } from 'ts-error-handling'
import type { Result } from 'ts-error-handling'

// Filter out null/undefined from arrays
function filterNullable<T>(
  array: (T | null | undefined)[]
): T[] {
  return array.filter((item): item is T => item != null)
}

// Get first non-null value
function coalesce<T>(...values: (T | null | undefined)[]): Result<T, string> {
  for (const value of values) {
    if (value != null) {
      return ok(value)
    }
  }
  return err('All values are null')
}

// Usage
filterNullable([1, null, 2, undefined, 3])
// [1, 2, 3]

coalesce(null, undefined, 'hello', 'world')
// Ok('hello')

coalesce(null, undefined)
// Err('All values are null')
```

## Type Guard Utilities

```typescript
import { ok, err } from 'ts-error-handling'
import type { Result } from 'ts-error-handling'

// Result from type guard
function fromGuard<T, U extends T>(
  value: T,
  guard: (value: T) => value is U,
  errorMessage: string
): Result<U, string> {
  return guard(value) ? ok(value) : err(errorMessage)
}

// Usage
interface Cat { meow(): void }
interface Dog { bark(): void }
type Animal = Cat | Dog

function isCat(animal: Animal): animal is Cat {
  return 'meow' in animal
}

const animal: Animal = { meow: () => {} }
const result = fromGuard(animal, isCat, 'Not a cat')
// Ok({ meow: [Function] })
```

## Pattern Summary

| Pattern | Description |
|---------|-------------|
| `fromNullable(value, error)` | Convert nullable to Result |
| `.andThen(fn)` | Chain optional lookups |
| `.unwrapOr(default)` | Get value or default |
| `.unwrapOrElse(fn)` | Get value or compute default |
| `combineWithAllErrors([...])` | Collect all missing values |
| `filter(...)` | Filter with fallback |

## Best Practices

1. **Use `fromNullable` at boundaries** - Convert nullable values to Result at the edges of your code

2. **Chain with `andThen`** - Use andThen for nested optional access

3. **Provide meaningful errors** - Don't just say "null", explain what's missing

4. **Consider defaults** - Use `unwrapOr` when a default makes sense

5. **Collect errors for validation** - Use `combineWithAllErrors` for form validation
