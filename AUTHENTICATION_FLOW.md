# NestJS Authentication Flow - Complete Guide

## 📚 Table of Contents
1. [JWT (JSON Web Tokens)](#jwt-json-web-tokens)
2. [JWT Strategy](#jwt-strategy)
3. [Custom Decorators](#custom-decorators)
4. [Complete Authentication Flow](#complete-authentication-flow)
5. [Key Components](#key-components)
6. [Security Best Practices](#security-best-practices)

---

## 🔐 JWT (JSON Web Tokens)

### What is JWT?
JWT is a secure way to transmit information between parties as a JSON object. Think of it as a **digital passport** that proves who you are without needing to show your password every time.

### JWT Structure
A JWT consists of three parts separated by dots (`.`):

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImhhbnNhIiwiaWF0IjoxNjc1MzAyNjk5fQ.SiC0Rvfwv2W4sz32hOjp-iKNcdDeDFWzvZgB-NbpE0U
     [HEADER]                            [PAYLOAD]                      [SIGNATURE]
```

**1. Header** (Algorithm & Token Type)
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**2. Payload** (User Data)
```json
{
  "username": "hansa.arora",
  "iat": 1775302699,
  "exp": 1775306299
}
```

**3. Signature** (Verification)
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

### How JWT Works in Our App

**Login Flow:**
```
User Login (POST /auth/signin)
    ↓
Verify credentials
    ↓
Generate JWT with username
    ↓
Return JWT to client
    ↓
Client stores JWT (localStorage/cookie)
```

**Authenticated Request Flow:**
```
Client sends request with JWT in header
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    ↓
Server validates JWT
    ↓
Extracts user info from JWT
    ↓
Fetches complete user from database
    ↓
Attaches user to request
    ↓
Executes controller method
```

---

## 🛡️ JWT Strategy

### What is Passport Strategy?
Passport is an authentication middleware. A **strategy** is a specific method of authentication (JWT, OAuth, Local, etc.).

### Our JWT Strategy Implementation

**File:** `src/auth/jwt.strategy.ts`

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userRepository: UsersRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'topSecret51',
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const { username } = payload;
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) {
      throw new Error('User not found');
    }
    return user;  // ✅ Automatically attached to request.user
  }
}
```

### Configuration Breakdown

**1. `jwtFromRequest`**
```typescript
ExtractJwt.fromAuthHeaderAsBearerToken()
```
- Tells Passport: "Look for JWT in the Authorization header"
- Expects format: `Authorization: Bearer <token>`

**2. `secretOrKey`**
```typescript
secretOrKey: 'topSecret51'
```
- Secret key used to verify JWT signature
- Must match the secret used when creating the token
- **Production:** Store in environment variables, not hardcoded!

**3. `validate()` method**
- Automatically called after JWT is verified
- Receives the **decoded payload** from JWT
- Fetches complete user from database
- Returns user object → Passport attaches it to `request.user`

### Why Fetch User from Database?
**JWT only contains minimal data** (username, iat, exp). We need:
- User ID for database relations
- User roles/permissions
- Updated user information
- Verify user still exists and is active

---

## 🎨 Custom Decorators

### What is a Decorator?
A **decorator** is a special function that adds metadata or modifies behavior of classes, methods, or parameters.

Think of it as a **sticker** you put on things to give them special powers.

### Types of Decorators in NestJS

**1. Class Decorators**
```typescript
@Controller('tasks')  // Marks class as a controller
@Injectable()         // Makes class injectable
```

**2. Method Decorators**
```typescript
@Get()               // HTTP GET endpoint
@Post()              // HTTP POST endpoint
@UseGuards()         // Applies guards
```

**3. Parameter Decorators**
```typescript
@Body()              // Extract request body
@Param()             // Extract URL parameters
@Query()             // Extract query parameters
@GetUser()           // Our custom decorator!
```

### Our Custom `@GetUser()` Decorator

**File:** `src/auth/get-user.decorator.ts`

```typescript
export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

### How It Works

**1. `createParamDecorator()`**
- NestJS function to create custom parameter decorators
- Allows extracting custom data from requests

**2. `ExecutionContext`**
- Provides access to the current request/response cycle
- Works with HTTP, WebSockets, GraphQL, etc.

**3. `ctx.switchToHttp()`**
- Switches context to HTTP mode
- Gives access to request/response objects

**4. `getRequest()`**
- Returns the Express request object
- Contains headers, body, params, query, **user**, etc.

**5. `request.user`**
- This was set by JWT Strategy's `validate()` method
- Contains the complete User object from database

### Usage Example

**Without Custom Decorator:**
```typescript
async createTask(
  @Body() createTaskDto: CreateTaskDto,
  @Req() request: Request,
) {
  const user = request.user;  // Manual extraction
  return this.tasksService.createTask(createTaskDto, user);
}
```

**With Custom Decorator:**
```typescript
async createTask(
  @Body() createTaskDto: CreateTaskDto,
  @GetUser() user: User,  // ✨ Clean and simple!
) {
  return this.tasksService.createTask(createTaskDto, user);
}
```

---

## 🔄 Complete Authentication Flow

### Step-by-Step Breakdown

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENT: POST /tasks                                             │
│  Header: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...   │
│  Body: { "title": "Task 1", "description": "..." }               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Request Hits Controller                                │
│  @UseGuards(AuthGuard()) blocks unauthenticated requests        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: AuthGuard Activates                                    │
│  - Extracts JWT from "Authorization: Bearer <token>"            │
│  - Calls JwtStrategy                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: JwtStrategy.validate() Runs                            │
│  1. Verifies JWT signature with secret key                      │
│  2. Decodes JWT payload → { username: "hansa.arora", ... }      │
│  3. Queries database: findOne({ where: { username } })          │
│  4. Returns User object (id, username, password, ...)           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: Passport Middleware                                    │
│  - Takes returned User object                                   │
│  - Attaches it to request: request.user = { id: 1, username...} │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: @GetUser() Decorator Executes                          │
│  - Calls: ctx.switchToHttp().getRequest()                       │
│  - Returns: request.user                                         │
│  - Controller receives: user parameter with full User object    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 6: Controller Method                                      │
│  async createTask(                                               │
│    @Body() createTaskDto,                                        │
│    @GetUser() user: User  ← Complete user object here          │
│  )                                                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 7: Service Layer                                          │
│  createTask(createTaskDto, user) {                              │
│    // user.id is used to set task.userId                        │
│    return taskRepository.createTask(createTaskDto, user);       │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 8: Repository Saves Task                                  │
│  {                                                               │
│    id: "uuid-123",                                               │
│    title: "Task 1",                                              │
│    description: "...",                                           │
│    userId: user.id  ← User ID automatically saved               │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Key Components

### 1. **AuthGuard**
```typescript
@UseGuards(AuthGuard())
```
- **Purpose:** Protects routes from unauthorized access
- **Action:** Triggers JWT validation before executing controller
- **Behavior:** Returns 401 Unauthorized if JWT is invalid/missing

### 2. **JWT Strategy**
```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) { ... }
```
- **Purpose:** Validates JWT and fetches user
- **Input:** JWT payload (decoded token)
- **Output:** User object (attached to request)
- **Registration:** Added to `AuthModule.providers`

### 3. **@GetUser() Decorator**
```typescript
export const GetUser = createParamDecorator(...)
```
- **Purpose:** Extract user from request in a clean way
- **Advantage:** Reusable across all controllers
- **Type Safety:** Returns typed User object

### 4. **ExecutionContext**
```typescript
ctx: ExecutionContext
```
- **Purpose:** Abstraction over different request types
- **Methods:**
  - `switchToHttp()` - HTTP requests
  - `switchToWs()` - WebSocket
  - `switchToRpc()` - Microservices

### 5. **Passport**
- **Library:** Node.js authentication middleware
- **Role:** Handles authentication strategies
- **Integration:** Works seamlessly with NestJS guards

---

## 🔒 Security Best Practices

### 1. **Secret Key Management**
❌ **Bad:**
```typescript
secretOrKey: 'topSecret51'  // Hardcoded
```

✅ **Good:**
```typescript
secretOrKey: process.env.JWT_SECRET  // From .env file
```

### 2. **Token Expiration**
```typescript
// Set appropriate expiration
expiresIn: '1h'  // Token expires in 1 hour
```

### 3. **HTTPS Only**
- Always use HTTPS in production
- Prevents token interception

### 4. **Token Storage**
**Client-side options:**
- ✅ HttpOnly cookies (best for web)
- ⚠️ localStorage (XSS vulnerable)
- ⚠️ sessionStorage (XSS vulnerable)

### 5. **Refresh Tokens**
```typescript
// Long-lived refresh token for getting new access tokens
refreshToken: '30d'
accessToken: '15m'
```

### 6. **Token Revocation**
- Maintain a blacklist of revoked tokens
- Check on each request

### 7. **Rate Limiting**
```typescript
// Prevent brute force attacks
@UseGuards(ThrottlerGuard)
```

---

## 🎯 Key Takeaways

### When JWT is Created
1. User logs in with username/password
2. Credentials are verified
3. JWT is generated with user data
4. JWT is sent to client
5. Client stores JWT for future requests

### When JWT is Validated
1. Client sends request with JWT in Authorization header
2. `@UseGuards(AuthGuard())` intercepts request
3. AuthGuard extracts JWT from header
4. JwtStrategy verifies signature and decodes payload
5. `validate()` method fetches user from database
6. User object is attached to `request.user`
7. `@GetUser()` decorator extracts `request.user`
8. Controller receives complete User object

### Why This Design?
- **Stateless:** Server doesn't store session data
- **Scalable:** Works across multiple servers
- **Fast:** No session lookup on every request
- **Secure:** Cryptographically signed tokens
- **Clean Code:** Decorators make code readable

### Common Mistakes
❌ Storing sensitive data in JWT payload (it's base64, not encrypted!)  
❌ Not setting token expiration  
❌ Hardcoding secrets in code  
❌ Not validating JWT signature  
❌ Trusting client-side token validation only  

---

## 📝 Quick Reference

### Request Flow
```
Client → AuthGuard → JwtStrategy → Passport → @GetUser() → Controller
```

### Data Flow
```
JWT Token → Decoded Payload → Database User → request.user → Controller Parameter
```

### File Structure
```
src/auth/
  ├── jwt.strategy.ts          // Validates JWT, fetches user
  ├── get-user.decorator.ts    // Extracts user from request
  ├── jwt-payload.interface.ts // JWT payload type
  └── user.entity.ts           // User database model
```

---

**Created:** April 6, 2026  
**Last Updated:** April 6, 2026  
**Author:** Learning Documentation for NestJS Task Management
