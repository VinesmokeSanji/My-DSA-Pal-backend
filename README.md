# Backend for My DSA Pal

A backend service that integrates with LeetCode to provide AI-powered code reviews and insights.

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## API Endpoints

### User Management

#### 1. Register User

```bash
curl -X POST http://localhost:3000/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

Response:

```json
{
  "username": "testuser",
  "email": "test@example.com",
  "_id": "..."
}
```

#### 2. Login

```bash
curl -X POST http://localhost:3000/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

Response:

```json
{
  "token": "jwt_token_here",
  "username": "testuser"
}
```

#### 3. Get User Profile

```bash
curl -X GET http://localhost:3000/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:

```json
{
  "username": "testuser",
  "email": "test@example.com",
  "leetcode": {
    "username": "leetcode_username",
    "totalSolved": 100,
    "lastSync": "2025-09-04T10:00:00Z"
  }
}
```

### LeetCode Integration

#### 1. Set LeetCode Session

```bash
curl -X POST http://localhost:3000/leetcode/set-session \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionToken": "your_leetcode_session_token"
  }'
```

Response:

```json
{
  "success": true,
  "message": "LeetCode session token set successfully"
}
```

#### 2. Fetch Recent Submissions

```bash
curl -X POST http://localhost:3000/leetcode/fetch-submissions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 10
  }'
```

Response:

```json
{
  "success": true,
  "submissions": [
    {
      "id": "submission_id",
      "problem": "Two Sum",
      "submitted": "2025-09-04 10:00:00",
      "status": "Accepted",
      "runtime": "56 ms",
      "memory": "42.1 MB",
      "language": "python3",
      "code": "def solution()..."
    }
  ]
}
```

#### 3. Get LeetCode Profile

```bash
curl -X GET http://localhost:3000/leetcode/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:

```json
{
  "success": true,
  "profile": {
    "username": "leetcode_username",
    "ranking": 50000,
    "totalSolved": 100,
    "submitStats": {
      "acSubmissionNum": [
        {
          "difficulty": "All",
          "count": 100
        }
      ]
    }
  }
}
```

#### 4. Get Specific Submission

```bash
curl -X GET http://localhost:3000/leetcode/submission/12345 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:

```json
{
  "success": true,
  "submission": {
    "id": "12345",
    "problem": "Two Sum",
    "submitted": "2025-09-04 10:00:00",
    "status": "Accepted",
    "runtime": "56 ms",
    "memory": "42.1 MB",
    "language": "python3",
    "code": "def solution()..."
  }
}
```

### Review Management

#### 1. Generate Review

```bash
curl -X POST http://localhost:3000/review/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "submissions": [{
      "submissionId": "12345",
      "problemName": "Two Sum",
      "problemDifficulty": "Easy",
      "submissionCode": "def solution()...",
      "language": "python3"
    }],
    "aiReview": {
      "insights": "Good use of hash map...",
      "suggestions": "Consider edge cases...",
      "improvements": "Time complexity can be improved...",
      "timeComplexityAnalysis": "O(n)",
      "spaceComplexityAnalysis": "O(n)"
    }
  }'
```

Response:

```json
{
  "_id": "review_id",
  "username": "testuser",
  "leetcodeSubmissions": [...],
  "aiReview": {...},
  "generatedAt": "2025-09-04T10:00:00Z"
}
```

#### 2. Get Review History

```bash
curl -X GET http://localhost:3000/review/history/testuser \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:

```json
[
  {
    "_id": "review_id",
    "username": "testuser",
    "leetcodeSubmissions": [...],
    "aiReview": {...},
    "generatedAt": "2025-09-04T10:00:00Z"
  }
]
```

#### 3. Get Specific Review

```bash
curl -X GET http://localhost:3000/review/review_id \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:

```json
{
  "_id": "review_id",
  "username": "testuser",
  "leetcodeSubmissions": [...],
  "aiReview": {...},
  "generatedAt": "2025-09-04T10:00:00Z"
}
```

### Session Management

#### 1. Store Current Session

```bash
curl -X POST http://localhost:3000/session \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "problemId": "two-sum",
    "code": "def solution()...",
    "language": "python3"
  }'
```

Response:

```json
{
  "username": "testuser",
  "sessionData": {
    "problemId": "two-sum",
    "code": "def solution()...",
    "language": "python3",
    "timestamp": "2025-09-04T10:00:00Z"
  }
}
```

#### 2. Get Current Session

```bash
curl -X GET http://localhost:3000/session \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:

```json
{
  "username": "testuser",
  "activeSession": true
}
```

## Error Responses

All endpoints return appropriate HTTP status codes:

- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

Example error response:

```json
{
  "error": "Error message here",
  "details": "Detailed error information"
}
```

## Notes

1. All timestamps are in ISO 8601 format
2. All protected routes require valid JWT token
3. LeetCode operations require valid LeetCode session token to be set first
4. Review history is tied to the authenticated user
5. Session data is temporary and may be cleared periodically
