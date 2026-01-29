# Combining Results

Combine multiple Results for parallel operations and aggregate validation.

## Overview

When working with multiple independent operations that may fail, you often need to combine their results. ts-error-handling provides several ways to combine Results.

## combine - All or Nothing

Combine multiple Results, failing if any fails:

```typescript
import { combine, Ok, Err } from 'ts-error-handling'

const results = combine([
  validateName(name),    // Result<string, Error>
  validateEmail(email),  // Result<string, Error>
  validateAge(age),      // Result<number, Error>
])

// Result<[string, string, number], Error>
results.map(([name, email, age]) => ({
  name,
  email,
  age,
}))
```

## combineObject - Named Results

Combine Results into an object:

```typescript
import { combineObject } from 'ts-error-handling'

const result = combineObject({
  user: fetchUser(userId),
  orders: fetchOrders(userId),
  preferences: fetchPreferences(userId),
})

// Result<{ user: User; orders: Order[]; preferences: Prefs }, Error>
result.map(({ user, orders, preferences }) => ({
  ...user,
  orderCount: orders.length,
  theme: preferences.theme,
}))
```

## combineAll - Collect All Errors

Collect all errors instead of stopping at first:

```typescript
import { combineAll } from 'ts-error-handling'

const results = combineAll([
  validateField('name', name),
  validateField('email', email),
  validateField('age', age),
])

// Result<[string, string, number], Error[]>
if (results.isErr()) {
  // Get all validation errors
  console.log(results.error) // [Error, Error, ...]
}
```

## partition - Separate Successes and Failures

```typescript
import { partition } from 'ts-error-handling'

const results = users.map((user) => validateUser(user))
const [valid, invalid] = partition(results)

console.log(`${valid.length} valid, ${invalid.length} invalid`)
```

## firstOk - First Successful Result

Get the first successful result:

```typescript
import { firstOk } from 'ts-error-handling'

const result = firstOk([
  fetchFromPrimary(),
  fetchFromSecondary(),
  fetchFromTertiary(),
])

// Returns the first Ok, or Err with all errors if all fail
```

## sequence - Sequential Execution

Execute Results sequentially, accumulating values:

```typescript
import { sequence } from 'ts-error-handling'

const steps = [
  () => validateInput(data),
  (validated) => transformData(validated),
  (transformed) => saveToDatabase(transformed),
  (saved) => sendNotification(saved),
]

const result = sequence(steps)
// Executes each step with the previous result
```

## parallel - Parallel Execution

Execute async Results in parallel:

```typescript
import { parallel } from 'ts-error-handling'

const result = await parallel({
  user: fetchUser(userId),
  posts: fetchPosts(userId),
  comments: fetchComments(userId),
}, { concurrency: 3 })

// All three fetch operations run concurrently
```

## Combining with Different Error Types

Combine Results with different error types:

```typescript
type ValidationError = { type: 'validation'; field: string }
type NetworkError = { type: 'network'; code: number }
type AppError = ValidationError | NetworkError

const combined = combineObject({
  name: validateName(name),     // Result<string, ValidationError>
  data: fetchData(id),          // Result<Data, NetworkError>
}).mapErr((error): AppError => error)
```

## Real-World Example: Form Validation

```typescript
interface FormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

function validateForm(data: FormData): Result<ValidatedForm, ValidationError[]> {
  return combineAll([
    validateName(data.name),
    validateEmail(data.email),
    validatePassword(data.password),
    validatePasswordMatch(data.password, data.confirmPassword),
  ]).map(([name, email, password]) => ({
    name,
    email,
    password,
  }))
}

// Usage
const result = validateForm(formData)

if (result.isErr()) {
  // Show all validation errors to user
  result.error.forEach((error) => {
    showFieldError(error.field, error.message)
  })
} else {
  // Submit valid form
  submitForm(result.value)
}
```
