# API 변경 사항 문서

## 변경 요약

S3 관련 기능과 Executor 서버를 백엔드에 통합하여 모든 API를 `/api` 경로로 통일했습니다.

---

## 변경된 API 엔드포인트

### 1. 코드 실행 API

**이전:**
- `POST http://code-executor:5200/execute` (별도 서버)
- 또는 `POST /api/execute` (프록시)

**현재:**
- `POST /api/executor/execute`

**요청:**
```json
{
  "code": "console.log('Hello World');",
  "language": "javascript"
}
```

**응답:** SSE (Server-Sent Events) 스트림
```
data: {"type":"log","message":"JavaScript 코드 실행을 시작합니다...\n"}
data: {"type":"output","data":"Hello World\n"}
data: {"type":"close","exitCode":0,"hasError":false}
```

---

### 2. 프리뷰 세션 생성 API

**이전:**
- `POST /api/preview` → `POST http://code-executor:5200/preview` (프록시)

**현재:**
- `POST /api/executor/preview`

**요청:**
```json
{
  "s3Path": "class-id-00000001/default/lesson-id-00000001/code-execution-00000001",
  "fileName": "index.html"  // 선택적, 없으면 자동으로 index.html 찾기
}
```

**응답:**
```json
{
  "success": true,
  "previewUrl": "http://localhost:5103/api/executor/preview-1234567890-abc/index.html",
  "s3Path": "codingpt/execute/class-id-00000001/.../index.html",
  "sessionId": "preview-1234567890-abc",
  "expiresIn": 300,
  "message": "프리뷰 URL이 생성되었습니다. (5분 유효)"
}
```

---

### 3. 프리뷰 파일 제공 API

**이전:**
- `GET /executor/:sessionId/*` (프록시)

**현재:**
- `GET /api/executor/:sessionId/*`

**예시:**
- `GET /api/executor/preview-1234567890-abc/index.html`
- `GET /api/executor/preview-1234567890-abc/style.css`
- `GET /api/executor/preview-1234567890-abc/script.js`

---

### 4. 프리뷰 세션 만료 API

**이전:**
- `POST /executor/:sessionId/expire` (프록시)

**현재:**
- `POST /api/executor/:sessionId/expire`

**요청:**
```
POST /api/executor/preview-1234567890-abc/expire
```

**응답:**
```json
{
  "success": true,
  "message": "프리뷰 세션이 만료되었습니다."
}
```

---

### 5. 헬스 체크 API

**이전:**
- `GET http://code-executor:5200/health` (별도 서버)

**현재:**
- `GET /api/executor/health`

**응답:**
```json
{
  "status": "ok",
  "service": "executor"
}
```

---

## S3 관련 API (변경 없음)

### 1. 파일 목록 조회
- `POST /api/s3/files` 또는 `GET /api/s3/files?path={s3Path}`
- `recursive` 파라미터 지원

### 2. 파일 내용 조회
- `POST /api/s3/file` 또는 `GET /api/s3/file?path={filePath}`

### 3. 파일 저장/업데이트
- `PUT /api/s3/file`

### 4. CloudFront 캐시 무효화 (신규)
- `POST /api/s3/invalidate` 또는 `PUT /api/s3/invalidate`

**요청:**
```json
{
  "filePath": "codingpt/execute/.../index.html"
}
```

또는 여러 파일:
```json
{
  "filePaths": [
    "codingpt/execute/.../index.html",
    "codingpt/execute/.../script.js",
    "codingpt/execute/.../style.css"
  ]
}
```

**응답:**
```json
{
  "success": true,
  "message": "캐시 무효화가 성공적으로 요청되었습니다.",
  "invalidationId": "I2J3M4N5O6P7Q",
  "status": "InProgress",
  "pathCount": 3,
  "paths": ["/codingpt/execute/.../index.html", ...]
}
```

---

## 제거된 API

### 1. 프리뷰 API (통합됨)
- ~~`POST /api/preview`~~ → `POST /api/executor/preview`로 통합

### 2. Executor 프록시
- ~~`/executor/*`~~ → `/api/executor/*`로 변경

---

## 환경 변수 변경

### 제거된 환경 변수
- ~~`CODE_EXECUTOR_URL`~~ - 더 이상 필요 없음 (통합됨)

### 유지된 환경 변수
- `S3_PUBLIC_BASE_URL` - S3 공개 URL
- `BACKEND_URL` - 백엔드 URL (프리뷰 URL 생성 시 사용)
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME` - S3 설정
- `CLOUDFRONT_DISTRIBUTION_ID` - CloudFront 캐시 무효화용

---

## 마이그레이션 가이드

### 프론트엔드 코드 변경 예시

**이전:**
```javascript
// 코드 실행
await fetch('/api/execute', {
  method: 'POST',
  body: JSON.stringify({ code, language })
});

// 프리뷰 생성
await fetch('/api/preview', {
  method: 'POST',
  body: JSON.stringify({ s3Path })
});

// 프리뷰 URL
const previewUrl = `http://localhost:5103/executor/${sessionId}/index.html`;
```

**현재:**
```javascript
// 코드 실행
await fetch('/api/executor/execute', {
  method: 'POST',
  body: JSON.stringify({ code, language })
});

// 프리뷰 생성
await fetch('/api/executor/preview', {
  method: 'POST',
  body: JSON.stringify({ s3Path })
});

// 프리뷰 URL
const previewUrl = `http://localhost:5103/api/executor/${sessionId}/index.html`;
```

---

## 주요 변경 사항

1. **모든 API가 `/api` 경로로 통일**
2. **Executor 서버 통합** - 별도 서버 없이 백엔드에 통합
3. **프리뷰 API 통합** - `/api/preview` → `/api/executor/preview`
4. **CloudFront 캐시 무효화 API 추가** - `/api/s3/invalidate`

---

## Docker 설정 변경

### docker-compose.local.yml
- `code-executor` 서비스 제거 (더 이상 필요 없음)
- `app` 서비스만 사용

### 환경 변수
- `CODE_EXECUTOR_URL` 제거

