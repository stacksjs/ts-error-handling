# Framework Integration

Integrate ts-error-handling with popular frameworks and libraries.

## Express.js Integration

Use Results in Express middleware:

```typescript
import express from 'express'
import { Result, Ok, Err } from 'ts-error-handling'

const app = express()

// Middleware that returns Result
async function authenticate(token: string): Promise<Result<User, AuthError>> {
  try {
    const user = await verifyToken(token)
    return user ? Ok(user) : Err({ code: 'INVALID_TOKEN' })
  } catch {
    return Err({ code: 'TOKEN_EXPIRED' })
  }
}

// Use in routes
app.get('/profile', async (req, res) => {
  const authResult = await authenticate(req.headers.authorization)

  authResult.match({
    Ok: (user) => res.json(user),
    Err: (error) => res.status(401).json({ error: error.code }),
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof ResultError) {
    return res.status(err.statusCode).json({ error: err.message })
  }
  next(err)
})
```

## Hono Integration

```typescript
import { Hono } from 'hono'
import { Result, Ok, Err } from 'ts-error-handling'

const app = new Hono()

// Result-based service
async function createUser(data: CreateUserInput): Promise<Result<User, ApiError>> {
  const validation = validateUser(data)
  if (validation.isErr()) {
    return Err({ status: 400, message: validation.error })
  }

  try {
    const user = await db.users.create(validation.value)
    return Ok(user)
  } catch (e) {
    return Err({ status: 500, message: 'Database error' })
  }
}

app.post('/users', async (c) => {
  const body = await c.req.json()
  const result = await createUser(body)

  return result.match({
    Ok: (user) => c.json(user, 201),
    Err: (error) => c.json({ error: error.message }, error.status),
  })
})
```

## React Integration

```typescript
import { useState, useEffect } from 'react'
import { Result, Ok, Err } from 'ts-error-handling'

// Custom hook for Result-based async operations
function useResult<T, E>(
  asyncFn: () => Promise<Result<T, E>>,
  deps: any[] = []
) {
  const [state, setState] = useState<{
    loading: boolean
    result: Result<T, E> | null
  }>({ loading: true, result: null })

  useEffect(() => {
    setState({ loading: true, result: null })
    asyncFn().then((result) => {
      setState({ loading: false, result })
    })
  }, deps)

  return state
}

// Usage in component
function UserProfile({ userId }: { userId: string }) {
  const { loading, result } = useResult(
    () => fetchUser(userId),
    [userId]
  )

  if (loading) return <Loading />

  return result?.match({
    Ok: (user) => <UserCard user={user} />,
    Err: (error) => <ErrorMessage error={error} />,
  }) ?? null
}
```

## Vue.js Integration

```typescript
<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { Result } from 'ts-error-handling'

const userId = ref('123')
const userResult = ref<Result<User, Error> | null>(null)
const loading = ref(true)

watchEffect(async () => {
  loading.value = true
  userResult.value = await fetchUser(userId.value)
  loading.value = false
})
</script>

<template>
  <div v-if="loading">Loading...</div>
  <template v-else-if="userResult">
    <UserCard v-if="userResult.isOk()" :user="userResult.value" />
    <ErrorMessage v-else :error="userResult.error" />
  </template>
</template>
```

## Database Integration

Use Results with database operations:

```typescript
import { Result, Ok, Err, ResultAsync } from 'ts-error-handling'

class UserRepository {
  async findById(id: string): Promise<Result<User | null, DbError>> {
    return ResultAsync.tryCatch(
      () => db.users.findUnique({ where: { id } }),
      (e) => new DbError('Failed to find user', e)
    )
  }

  async create(data: CreateUserData): Promise<Result<User, DbError>> {
    return ResultAsync.tryCatch(
      () => db.users.create({ data }),
      (e) => new DbError('Failed to create user', e)
    )
  }

  async update(id: string, data: UpdateUserData): Promise<Result<User, DbError>> {
    return this.findById(id)
      .flatMap((user) =>
        user
          ? Ok(user)
          : Err(new DbError('User not found'))
      )
      .flatMap((user) =>
        ResultAsync.tryCatch(
          () => db.users.update({ where: { id }, data }),
          (e) => new DbError('Failed to update user', e)
        )
      )
  }
}
```
