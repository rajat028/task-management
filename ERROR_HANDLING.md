# Production-Ready Error Handling Guide

## Overview

This document outlines the production-ready error handling implementation for the NestJS Task Management application.

## Architecture Components

### 1. Custom Exception Classes

Location: `src/common/exceptions/custom.exception.ts`

Custom exceptions provide semantic error information:

- **DuplicateUserException**: Thrown when attempting to create a user with an existing username
- **InvalidCredentialsException**: Thrown for invalid auth credentials
- **TaskNotFoundException**: Thrown when a task is not found
- **DatabaseException**: Thrown for database operation failures
- **ValidationException**: Thrown for input validation failures
- **UnexpectedException**: Thrown for unexpected runtime errors

### 2. Global Exception Filters

Location: `src/common/filters/`

#### HttpExceptionFilter

- Catches all `HttpException` instances
- Formats responses with consistent structure (statusCode, timestamp, path, method, message)
- Logs errors appropriately based on severity
- Provides detailed error messages for debugging

#### AllExceptionsFilter

- Catches any unhandled exceptions
- Logs complete stack traces
- Returns sanitized error response (no internal details leaked)
- Prevents application crashes

### 3. Database Error Utility

Location: `src/common/utils/database-error.util.ts`

Handles database-specific errors:

- **Unique Constraint Violations (23505)**: Duplicate entries
- **Foreign Key Violations (23503)**: Referenced record doesn't exist
- **Not Null Violations (23502)**: Required field missing
- **Connection Errors**: Database connection failures

## Implementation Details

### Error Handling in Repositories

```typescript
async createUser(authCredentialsDto: AuthCredentialsDto): Promise<User> {
  try {
    const savedUser = await this.save(user);
    this.logger.debug(`User created successfully: ${username}`);
    return savedUser;
  } catch (error) {
    if (DatabaseErrorUtil.isUniqueConstraintError(error)) {
      throw new DuplicateUserException(username);
    }
    DatabaseErrorUtil.handleError(error, 'UsersRepository.createUser');
  }
}
```

### Error Handling in Services

Services log operations and re-throw exceptions from repositories:

```typescript
async createTask(createTaskDto: CreateTaskDto): Promise<Task> {
  try {
    const task = await this.taskRepository.createTask(createTaskDto);
    this.logger.log(`Task created: ${task.id}`);
    return task;
  } catch (error) {
    this.logger.error('Failed to create task', error.stack);
    throw error;
  }
}
```

### Validation Pipeline

NestJS ValidationPipe validates all incoming requests:

- Input validation happens before business logic
- Returns `ValidationException` with field-level errors
- Configured with `whitelist` and `forbidNonWhitelisted`

### Logging Interceptor

Logs all HTTP requests and responses:

- Records method, URL, status code, duration
- Logs errors with appropriate severity levels
- Provides request context for debugging

## Error Response Format

### Success Response

```json
{
  "data": {...},
  "statusCode": 200
}
```

### Error Response

```json
{
  "statusCode": 400,
  "timestamp": "2024-04-01T10:30:00.000Z",
  "path": "/auth/signup",
  "method": "POST",
  "message": "User with username \"john\" already exists",
  "errors": {
    "username": ["must be unique"],
    "password": ["must match pattern"]
  }
}
```

## HTTP Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized
- **404**: Not Found
- **409**: Conflict (duplicate entry)
- **500**: Internal Server Error
- **503**: Service Unavailable

## Best Practices

### 1. Always Log Context

```typescript
this.logger.error(
  'Operation failed',
  error instanceof Error ? error.stack : String(error),
);
```

### 2. Don't Expose Internal Details

- Error messages visible to clients should be generic
- Full error details logged server-side only
- Stack traces never sent in responses

### 3. Handle Specific Database Errors

```typescript
if (DatabaseErrorUtil.isUniqueConstraintError(error)) {
  throw new DuplicateUserException(username);
}
```

### 4. Validate Before Operations

- Use class-validator decorators in DTOs
- Validate early in the request pipeline
- Provide specific error messages

### 5. Use Appropriate Exception Classes

- Choose specific exceptions (not generic Error)
- Inherit from NestJS HttpException classes
- Provide meaningful error messages

## Testing Error Scenarios

### Duplicate User

```bash
POST /auth/signup
{
  "username": "john",
  "password": "Password123"
}

# Second request with same username returns:
{
  "statusCode": 409,
  "message": "User with username \"john\" already exists",
  "timestamp": "2024-04-01T10:30:00.000Z",
  "path": "/auth/signup",
  "method": "POST"
}
```

### Validation Error

```bash
POST /auth/signup
{
  "username": "jo",
  "password": "weak"
}

# Returns:
{
  "statusCode": 400,
  "message": "Input validation failed",
  "errors": {
    "username": ["must be longer than or equal to 4 characters"],
    "password": ["Password must be at least 8 characters..."]
  },
  "timestamp": "2024-04-01T10:30:00.000Z",
  "path": "/auth/signup",
  "method": "POST"
}
```

### Not Found Error

```bash
GET /tasks/invalid-id

# Returns:
{
  "statusCode": 404,
  "message": "Task with ID \"invalid-id\" not found",
  "timestamp": "2024-04-01T10:30:00.000Z",
  "path": "/tasks/invalid-id",
  "method": "GET"
}
```

## Configuration

### Environment Variables

```env
NODE_ENV=production
LOG_LEVEL=warn
PORT=3000
```

### Logging Levels

- **debug**: Development details
- **log**: General information
- **warn**: Warning conditions
- **error**: Error conditions

## Future Enhancements

1. **Distributed Tracing**: Add correlation IDs to requests
2. **Error Metrics**: Integration with monitoring tools (Prometheus, DataDog)
3. **Rate Limiting**: Implement rate limiting for API endpoints
4. **Request ID**: Track requests across microservices
5. **Structured Logging**: JSON format for log aggregation
6. **Error Analytics**: Track error patterns and frequencies

## Migration Guide

If migrating from old error handling:

1. Replace generic `Error` with custom exceptions
2. Add try-catch blocks with specific error handling
3. Implement logger in each service/repository
4. Update DTOs with proper validators
5. Test error scenarios thoroughly
6. Update integration tests with new responses
