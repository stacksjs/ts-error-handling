/**
 * Comprehensive examples demonstrating the fully typed error handling system
 * Similar to neverthrow and Rust's Result type
 */

import type { Result } from './src/types'
import {
  combine,
  combineWithAllErrors,
  err,
  fromNullable,
  ok,
  traverse,
  tryCatch,
  tryCatchAsync,
} from './src/result'

// ============================================================================
// Example 1: Basic usage with type inference
// ============================================================================

function divideBasic(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return err('Division by zero')
  }
  return ok(a / b)
}

// Type is inferred as Result<number, string>
const result1 = divideBasic(10, 2)

// Type narrowing works perfectly
if (result1.isOk) {
  console.log(result1.value) // Type: number
}
else {
  console.log(result1.error) // Type: string
}

// ============================================================================
// Example 2: Chaining operations with map and andThen
// ============================================================================

function parseNumber(input: string): Result<number, string> {
  const num = Number.parseFloat(input)
  return Number.isNaN(num) ? err('Invalid number') : ok(num)
}

function validatePositive(num: number): Result<number, string> {
  return num > 0 ? ok(num) : err('Number must be positive')
}

function sqrt(num: number): Result<number, string> {
  return num >= 0 ? ok(Math.sqrt(num)) : err('Cannot take square root of negative number')
}

// Chain operations with full type safety
const result2 = parseNumber('16')
  .andThen(validatePositive)
  .andThen(sqrt)
  .map(n => n * 2)

// ============================================================================
// Example 3: Pattern matching
// ============================================================================

interface User {
  id: number
  name: string
  email: string
}

function findUser(id: number): Result<User, string> {
  // Simulated database lookup
  if (id === 1) {
    return ok({ id: 1, name: 'Alice', email: 'alice@example.com' })
  }
  return err(`User ${id} not found`)
}

const message = findUser(1).match({
  ok: user => `Found user: ${user.name}`,
  err: error => `Error: ${error}`,
})

// ============================================================================
// Example 4: Handling nullable values
// ============================================================================

interface Config {
  apiKey?: string
  timeout?: number
}

function getApiKey(config: Config): Result<string, string> {
  return fromNullable(config.apiKey, 'API key is required')
}

const config: Config = { timeout: 5000 }
const apiKeyResult = getApiKey(config) // Result<string, string>

// ============================================================================
// Example 5: Converting exceptions to Results
// ============================================================================

function parseJSON<T>(json: string): Result<T, string> {
  return tryCatch(
    () => JSON.parse(json) as T,
    (error) => {
      if (error instanceof Error) {
        return error.message
      }
      return 'Unknown error'
    },
  )
}

const jsonResult = parseJSON<{ name: string }>('{"name": "Alice"}')

// ============================================================================
// Example 6: Async operations
// ============================================================================

async function fetchUser(id: number): Promise<Result<User, string>> {
  return tryCatchAsync(
    async () => {
      const response = await fetch(`https://api.example.com/users/${id}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      return response.json() as Promise<User>
    },
    error => error instanceof Error ? error.message : 'Unknown error',
  )
}

// ============================================================================
// Example 7: Combining multiple Results
// ============================================================================

interface UserProfile {
  user: User
  age: number
  country: string
}

function getUser(): Result<User, string> {
  return ok({ id: 1, name: 'Alice', email: 'alice@example.com' })
}

function getAge(): Result<number, string> {
  return ok(30)
}

function getCountry(): Result<string, string> {
  return ok('USA')
}

// Combine all results - stops at first error
const profileResult = combine([getUser(), getAge(), getCountry()])

if (profileResult.isOk) {
  const values = profileResult.value
  const profile: UserProfile = {
    user: values[0] as User,
    age: values[1] as number,
    country: values[2] as string
  }
  console.log(profile)
}

// ============================================================================
// Example 8: Form validation with combineWithAllErrors
// ============================================================================

interface FormData {
  email: string
  password: string
  age: string
}

function validateEmail(email: string): Result<string, string> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) ? ok(email) : err('Invalid email format')
}

function validatePassword(password: string): Result<string, string> {
  return password.length >= 8 ? ok(password) : err('Password must be at least 8 characters')
}

function validateAge(age: string): Result<number, string> {
  const num = Number.parseInt(age)
  if (Number.isNaN(num))
    return err('Age must be a number')
  if (num < 18)
    return err('Must be 18 or older')
  return ok(num)
}

function validateForm(data: FormData): Result<readonly [string, string, number], string[]> {
  const results = [
    validateEmail(data.email),
    validatePassword(data.password),
    validateAge(data.age),
  ] as const

  // Collect all errors instead of stopping at first one
  return combineWithAllErrors(results)
}

const formData: FormData = {
  email: 'invalid-email',
  password: 'short',
  age: '15',
}

const validationResult = validateForm(formData)

if (validationResult.isErr) {
  console.log('Validation errors:', validationResult.error)
  // Type: string[]
}

// ============================================================================
// Example 9: Railway-oriented programming
// ============================================================================

interface OrderData {
  productId: string
  quantity: number
  userId: string
}

interface Product {
  id: string
  name: string
  price: number
  stock: number
}

interface Order {
  id: string
  product: Product
  quantity: number
  total: number
}

function validateQuantity(quantity: number): Result<number, string> {
  return quantity > 0 ? ok(quantity) : err('Quantity must be positive')
}

function findProduct(productId: string): Result<Product, string> {
  // Simulated product lookup
  return ok({
    id: productId,
    name: 'Widget',
    price: 9.99,
    stock: 100,
  })
}

function checkStock(product: Product, quantity: number): Result<Product, string> {
  return product.stock >= quantity
    ? ok(product)
    : err(`Insufficient stock. Available: ${product.stock}`)
}

function calculateTotal(product: Product, quantity: number): number {
  return product.price * quantity
}

function createOrder(orderData: OrderData): Result<Order, string> {
  return validateQuantity(orderData.quantity)
    .andThen(quantity =>
      findProduct(orderData.productId)
        .andThen(product => checkStock(product, quantity))
        .map(product => ({
          id: crypto.randomUUID(),
          product,
          quantity,
          total: calculateTotal(product, quantity),
        })),
    )
}

// ============================================================================
// Example 10: Working with arrays using traverse
// ============================================================================

function processNumbers(inputs: string[]): Result<number[], string> {
  return traverse(inputs, (input) => {
    const num = Number.parseFloat(input)
    return Number.isNaN(num) ? err(`Invalid number: ${input}`) : ok(num)
  })
}

const numbersResult = processNumbers(['1', '2', '3'])
// Result<number[], string> = Ok([1, 2, 3])

const invalidResult = processNumbers(['1', 'invalid', '3'])
// Result<number[], string> = Err("Invalid number: invalid")

// ============================================================================
// Example 11: Error recovery with orElse
// ============================================================================

function fetchFromPrimaryCache(key: string): Result<string, string> {
  return err('Cache miss')
}

function fetchFromSecondaryCache(key: string): Result<string, string> {
  return err('Cache miss')
}

function fetchFromDatabase(key: string): Result<string, string> {
  return ok('data from database')
}

function getData(key: string): Result<string, string> {
  return fetchFromPrimaryCache(key)
    .orElse(() => fetchFromSecondaryCache(key))
    .orElse(() => fetchFromDatabase(key))
}

// ============================================================================
// Example 12: Type-safe error transformation with mapErr
// ============================================================================

enum ErrorCode {
  NotFound = 'NOT_FOUND',
  Unauthorized = 'UNAUTHORIZED',
  ValidationError = 'VALIDATION_ERROR',
}

interface ApiError {
  code: ErrorCode
  message: string
  timestamp: Date
}

function validateInput(input: string): Result<string, string> {
  return input.length > 0 ? ok(input) : err('Input cannot be empty')
}

function processWithApiError(input: string): Result<string, ApiError> {
  return validateInput(input).mapErr(errorMessage => ({
    code: ErrorCode.ValidationError,
    message: errorMessage,
    timestamp: new Date(),
  }))
}

// ============================================================================
// Example 13: Practical API client example
// ============================================================================

interface ApiResponse<T> {
  data: T
  status: number
}

class HttpError {
  constructor(
    public status: number,
    public message: string,
  ) {}
}

async function makeRequest<T>(url: string): Promise<Result<T, HttpError>> {
  return tryCatchAsync(
    async () => {
      const response = await fetch(url)
      if (!response.ok) {
        throw new HttpError(response.status, response.statusText)
      }
      return response.json() as Promise<T>
    },
    (error) => {
      if (error instanceof HttpError) {
        return error
      }
      return new HttpError(500, 'Internal error')
    },
  )
}

// Usage with full type safety
async function getUserProfile(userId: string): Promise<
  { success: true, user: User } | { success: false, error: string }
> {
  const result = await makeRequest<User>(`/api/users/${userId}`)

  if (result.isOk) {
    return { success: true as const, user: result.value }
  }
  else {
    return {
      success: false as const,
      error: `Failed to fetch user: ${result.error.message} (${result.error.status})`,
    }
  }
}

// ============================================================================
// Export examples for documentation
// ============================================================================

export {
  createOrder,
  divideBasic,
  fetchUser,
  getData,
  getUserProfile,
  parseJSON,
  parseNumber,
  processNumbers,
  processWithApiError,
  sqrt,
  validateForm,
  validatePositive,
}
