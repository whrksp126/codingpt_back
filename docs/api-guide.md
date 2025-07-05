# 📡 API 사용 가이드

## 🚀 기본 정보

- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`
- **인증**: JWT 토큰 (Authorization 헤더)

## 📋 응답 형식

### 성공 응답
```json
{
  "success": true,
  "message": "성공 메시지",
  "data": { /* 응답 데이터 */ },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 에러 응답
```json
{
  "success": false,
  "message": "에러 메시지",
  "error": "상세 에러 정보 (개발 환경에서만)",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 👥 Users API

### 1. 사용자 생성
```http
POST /api/users
Content-Type: application/json

{
  "email": "user@example.com",
  "google_id": "google123",
  "refresh_token": "refresh_token_here",
  "nickname": "사용자닉네임",
  "profile_img": "https://example.com/image.jpg"
}
```

**응답:**
```json
{
  "success": true,
  "message": "사용자가 성공적으로 생성되었습니다.",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "사용자닉네임",
    "profile_img": "https://example.com/image.jpg",
    "xp": 0,
    "heart": 5,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. 모든 사용자 조회
```http
GET /api/users
```

### 3. 특정 사용자 조회
```http
GET /api/users/1
```

### 4. 사용자 정보 수정
```http
PUT /api/users/1
Content-Type: application/json

{
  "nickname": "새로운닉네임",
  "profile_img": "https://example.com/new-image.jpg"
}
```

### 5. 사용자 삭제
```http
DELETE /api/users/1
```

### 6. XP 업데이트
```http
PATCH /api/users/1/xp
Content-Type: application/json

{
  "xp": 100
}
```

### 7. 하트 업데이트
```http
PATCH /api/users/1/heart
Content-Type: application/json

{
  "heart": 3
}
```

## 🛍️ Products API

### 1. 제품 생성
```http
POST /api/products
Content-Type: application/json

{
  "name": "JavaScript 기초 강의",
  "description": "JavaScript의 기초를 배우는 강의입니다.",
  "type": "programming",
  "price": 50000,
  "lecture_intro": "이 강의에서는 JavaScript의 기본 문법을 배웁니다."
}
```

### 2. 모든 제품 조회
```http
GET /api/products
```

### 3. 특정 제품 조회 (리뷰 포함)
```http
GET /api/products/1
```

**응답:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "JavaScript 기초 강의",
    "description": "JavaScript의 기초를 배우는 강의입니다.",
    "type": "programming",
    "price": 50000,
    "lecture_intro": "이 강의에서는 JavaScript의 기본 문법을 배웁니다.",
    "Reviews": [
      {
        "id": 1,
        "score": 5,
        "review_text": "정말 좋은 강의입니다!",
        "created_at": "2024-01-01T00:00:00.000Z",
        "User": {
          "id": 1,
          "nickname": "사용자1",
          "profile_img": "https://example.com/image.jpg"
        }
      }
    ]
  }
}
```

### 4. 제품 수정
```http
PUT /api/products/1
Content-Type: application/json

{
  "name": "JavaScript 기초 강의 (업데이트)",
  "price": 60000
}
```

### 5. 제품 삭제
```http
DELETE /api/products/1
```

### 6. 타입별 제품 조회
```http
GET /api/products/type/programming
```

### 7. 제품별 클래스 조회
```http
GET /api/products/1/classes
```

## 🎓 Classes API

### 1. 클래스 생성
```http
POST /api/classes
Content-Type: application/json

{
  "name": "JavaScript 기초 클래스",
  "description": "JavaScript 기초를 배우는 클래스입니다."
}
```

### 2. 모든 클래스 조회
```http
GET /api/classes
```

### 3. 특정 클래스 조회 (섹션 포함)
```http
GET /api/classes/1
```

### 4. 클래스 수정
```http
PUT /api/classes/1
Content-Type: application/json

{
  "name": "JavaScript 기초 클래스 (업데이트)",
  "description": "업데이트된 설명입니다."
}
```

### 5. 클래스 삭제
```http
DELETE /api/classes/1
```

### 6. 클래스별 제품 조회
```http
GET /api/classes/1/products
```

### 7. 클래스별 커리큘럼 조회
```http
GET /api/classes/1/curriculums
```

### 8. 클래스에 섹션 추가
```http
POST /api/classes/1/sections/2
```

### 9. 클래스에서 섹션 제거
```http
DELETE /api/classes/1/sections/2
```

## 🔧 쿼리 파라미터

### 페이지네이션
```http
GET /api/users?page=1&limit=10
```

### 필터링
```http
GET /api/products?type=programming&min_price=10000
```

### 정렬
```http
GET /api/products?sort=price&order=desc
```

## ⚠️ 에러 코드

| 상태 코드 | 의미 | 설명 |
|-----------|------|------|
| 200 | OK | 요청 성공 |
| 201 | Created | 리소스 생성 성공 |
| 400 | Bad Request | 잘못된 요청 |
| 401 | Unauthorized | 인증 필요 |
| 403 | Forbidden | 권한 없음 |
| 404 | Not Found | 리소스를 찾을 수 없음 |
| 409 | Conflict | 중복된 데이터 |
| 500 | Internal Server Error | 서버 내부 오류 |

## 📝 사용 예시

### JavaScript (fetch)
```javascript
// 사용자 생성
const createUser = async (userData) => {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData)
  });
  
  const result = await response.json();
  return result;
};

// 사용자 조회
const getUser = async (id) => {
  const response = await fetch(`/api/users/${id}`);
  const result = await response.json();
  return result;
};
```

### cURL
```bash
# 사용자 생성
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "google_id": "google123",
    "refresh_token": "token",
    "nickname": "사용자"
  }'

# 사용자 조회
curl http://localhost:3000/api/users/1
```

## 🔐 인증 (향후 구현 예정)

```http
GET /api/users/me
Authorization: Bearer <jwt_token>
```

## 📊 응답 예시

### 페이지네이션 응답
```json
{
  "success": true,
  "message": "Success",
  "data": [ /* 데이터 배열 */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

이 가이드는 API를 사용하는 방법과 각 엔드포인트의 기능을 설명합니다. 실제 사용 시에는 서버가 실행 중인지 확인하고, 올바른 URL과 포트를 사용하세요. 