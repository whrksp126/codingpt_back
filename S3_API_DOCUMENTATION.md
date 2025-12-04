# S3 관련 API 문서

## 개요

S3 경로 기반 파일 관리, 코드 실행, 프리뷰 기능을 제공하는 API입니다.

### 주요 기능
1. **S3 파일 관리**: 파일 목록 조회, 내용 조회, 저장/업데이트
2. **CloudFront 캐시 관리**: 캐시 무효화
3. **코드 실행**: S3에 저장된 프로그래밍 언어 파일 실행 (SSE 스트림)
4. **웹 프리뷰**: S3에 저장된 HTML 파일을 웹서버처럼 실행

---

## 전체 API 목록

| 번호 | API | 엔드포인트 | 설명 |
|------|-----|-----------|------|
| 1 | 파일 목록 조회 | `POST/GET /api/s3/files` | S3 경로의 파일 및 디렉토리 목록 조회 (기본: 재귀적) |
| 2 | 파일 내용 조회 | `POST/GET /api/s3/file` | S3 파일의 내용 조회 |
| 3 | 파일 저장/업데이트 | `PUT /api/s3/file` | S3에 파일 저장 또는 업데이트 |
| 4 | 파일 삭제 | `DELETE /api/s3/file` | S3 파일 삭제 |
| 5 | 캐시 무효화 | `POST/PUT /api/s3/invalidate` | CloudFront 캐시 무효화 |
| 6 | S3 파일 기반 코드 실행 | `POST /api/executor/execute-s3` | S3 파일을 실행하고 결과를 SSE로 전달 |
| 7 | 웹 프리뷰 | `POST /api/executor/preview` | S3 HTML 파일을 웹서버처럼 실행 |

---

## 1. S3 파일 목록 조회

특정 S3 경로의 파일 및 디렉토리 목록을 조회합니다.

### 엔드포인트
- `POST /api/s3/files`
- `GET /api/s3/files?path={s3Path}&recursive={true|false}`

### 요청

**POST 방식:**
```json
{
  "s3Path": "class-id-00000001/default/lesson-id-00000001/code-execution-00000001",
  "recursive": true
}
```

**GET 방식:**
```
GET /api/s3/files?path=class-id-00000001/default/lesson-id-00000001/code-execution-00000001&recursive=true
```

### 파라미터
- `s3Path` (선택): S3 경로 (디렉토리)
  - 제공하지 않거나 빈 문자열이면 최상단 경로(`codingpt/execute/`)에서 조회
  - 예: `class-id-00000001/default/lesson-id-00000001/code-execution-00000001`
  - `codingpt/execute/` prefix는 자동으로 추가됩니다
- `recursive` (선택): 재귀적 조회 여부 (기본값: `true`)
  - `true`: 하위 디렉토리까지 모두 조회 (기본값)
  - `false`: 현재 디렉토리만 조회

### 응답

**성공 (200):**
```json
{
  "success": true,
  "files": [
    {
      "name": "index.html",
      "path": "codingpt/execute/class-id-00000001/.../index.html",
      "type": "file",
      "size": 1740,
      "lastModified": "2025-12-04T05:28:07.000Z"
    },
    {
      "name": "script.js",
      "path": "codingpt/execute/class-id-00000001/.../script.js",
      "type": "file",
      "size": 4608,
      "lastModified": "2025-12-04T05:28:07.000Z"
    },
    {
      "name": "subdirectory",
      "path": "codingpt/execute/class-id-00000001/.../subdirectory/",
      "type": "directory",
      "size": 0,
      "lastModified": null
    }
  ]
}
```

**실패 (400/403/500):**
```json
{
  "success": false,
  "message": "에러 메시지",
  "error": "ErrorCode"
}
```

---

## 2. S3 파일 내용 조회

특정 S3 파일의 내용을 조회합니다.

### 엔드포인트
- `POST /api/s3/file`
- `GET /api/s3/file?path={filePath}`

### 요청

**POST 방식:**
```json
{
  "filePath": "class-id-00000001/default/lesson-id-00000001/code-execution-00000001/index.html"
}
```

**GET 방식:**
```
GET /api/s3/file?path=class-id-00000001/default/lesson-id-00000001/code-execution-00000001/index.html
```

### 파라미터
- `filePath` (필수): S3 파일 경로
  - 예: `class-id-00000001/default/lesson-id-00000001/code-execution-00000001/index.html`
  - `codingpt/execute/` prefix는 자동으로 추가됩니다

### 응답

**성공 (200):**
```json
{
  "success": true,
  "content": "<html>...</html>",
  "filePath": "codingpt/execute/class-id-00000001/.../index.html",
  "contentType": "text/html",
  "encoding": "utf-8",
  "size": 1740
}
```

**바이너리 파일의 경우:**
```json
{
  "success": true,
  "content": "base64인코딩된내용",
  "filePath": "codingpt/execute/.../image.png",
  "contentType": "image/png",
  "encoding": "base64",
  "size": 10240
}
```

**실패 (400/403/404/500):**
```json
{
  "success": false,
  "message": "에러 메시지",
  "error": "ErrorCode"
}
```

### 제한사항
- 최대 파일 크기: 10MB
- 10MB 초과 시 `FileTooLarge` 에러 반환

---

## 3. S3 파일 저장/업데이트

S3에 파일을 저장하거나 업데이트합니다.

### 엔드포인트
- `PUT /api/s3/file`

### 요청

```json
{
  "filePath": "class-id-00000001/default/lesson-id-00000001/code-execution-00000001/index.html",
  "content": "<html><body>Hello World</body></html>"
}
```

### 파라미터
- `filePath` (필수): 저장할 S3 파일 경로
  - 예: `class-id-00000001/default/lesson-id-00000001/code-execution-00000001/index.html`
  - `codingpt/execute/` prefix는 자동으로 추가됩니다
- `content` (필수): 파일 내용
  - 텍스트 파일: 문자열로 전달
  - 바이너리 파일: base64 인코딩된 문자열로 전달

### 응답

**성공 (200):**
```json
{
  "success": true,
  "message": "파일이 성공적으로 저장되었습니다.",
  "filePath": "codingpt/execute/class-id-00000001/.../index.html",
  "size": 1740
}
```

**실패 (400/403/500):**
```json
{
  "success": false,
  "message": "에러 메시지",
  "error": "ErrorCode"
}
```

### 제한사항
- 최대 파일 크기: 10MB
- 10MB 초과 시 `FileTooLarge` 에러 반환

---

## 4. CloudFront 캐시 무효화

S3 파일 업데이트 후 CloudFront 캐시를 무효화합니다.

### 엔드포인트
- `POST /api/s3/invalidate`
- `PUT /api/s3/invalidate`

### 요청

**단일 파일 무효화:**
```json
{
  "filePath": "class-id-00000001/default/lesson-id-00000001/code-execution-00000001/index.html"
}
```

**여러 파일 배치 무효화:**
```json
{
  "filePaths": [
    "class-id-00000001/default/lesson-id-00000001/code-execution-00000001/index.html",
    "class-id-00000001/default/lesson-id-00000001/code-execution-00000001/script.js",
    "class-id-00000001/default/lesson-id-00000001/code-execution-00000001/style.css"
  ]
}
```

### 파라미터
- `filePath` (선택): 단일 파일 경로
- `filePaths` (선택): 여러 파일 경로 배열
- 둘 중 하나는 반드시 제공해야 합니다
- `codingpt/execute/` prefix는 자동으로 추가됩니다

### 응답

**성공 (200):**
```json
{
  "success": true,
  "message": "캐시 무효화가 성공적으로 요청되었습니다.",
  "invalidationId": "I2J3M4N5O6P7Q",
  "status": "InProgress",
  "pathCount": 3,
  "paths": [
    "/codingpt/execute/class-id-00000001/.../index.html",
    "/codingpt/execute/class-id-00000001/.../script.js",
    "/codingpt/execute/class-id-00000001/.../style.css"
  ]
}
```

**스킵됨 (200):**
```json
{
  "success": false,
  "message": "CloudFront Distribution ID가 설정되지 않았습니다.",
  "skipped": true
}
```

**실패 (403/500):**
```json
{
  "success": false,
  "message": "에러 메시지",
  "error": "ErrorCode"
}
```

### 주의사항
- CloudFront Distribution ID가 설정되어 있어야 동작합니다
- 무효화는 비동기로 처리되며, 완료까지 몇 분 걸릴 수 있습니다
- 비용: 월 1,000개 경로까지 무료, 이후 경로당 $0.005

---

## 5. S3 파일 삭제

S3에 저장된 파일을 삭제합니다.

### 엔드포인트
- `DELETE /api/s3/file`

### 요청

```json
{
  "filePath": "class-id-00000001/default/lesson-id-00000001/code-execution-00000001/index.html"
}
```

### 파라미터
- `filePath` (필수): 삭제할 S3 파일 경로
  - 예: `class-id-00000001/default/lesson-id-00000001/code-execution-00000001/index.html`
  - `codingpt/execute/` prefix는 자동으로 추가됩니다

### 응답

**성공 (200):**
```json
{
  "success": true,
  "message": "파일이 성공적으로 삭제되었습니다.",
  "filePath": "codingpt/execute/class-id-00000001/.../index.html"
}
```

**실패 (400/403/404/500):**
```json
{
  "success": false,
  "message": "에러 메시지",
  "error": "ErrorCode"
}
```

### 에러 코드
- `NoSuchKey` (404): 파일을 찾을 수 없음
- `AccessDenied` (403): 삭제 권한 없음
- `InvalidPath` (400): 잘못된 경로
- `EmptyPath` (400): 경로가 제공되지 않음

---

## 6. S3 파일 기반 코드 실행

S3에 저장된 프로그래밍 언어 파일을 실행하고 결과를 SSE(Server-Sent Events)로 실시간 전달합니다.

### 엔드포인트
- `POST /api/executor/execute-s3`

### 요청

```json
{
  "s3Path": "class-id-00000001/default/lesson-id-00000001/code-execution-00000001",
  "fileName": "main.py",
  "language": "python"
}
```

### 파라미터
- `s3Path` (필수): S3 디렉토리 경로
  - 예: `class-id-00000001/default/lesson-id-00000001/code-execution-00000001`
  - `codingpt/execute/` prefix는 자동으로 추가됩니다
- `fileName` (필수): 실행할 파일명
  - 예: `main.py`, `app.js`, `main.c`, `Main.java`
- `language` (선택): 프로그래밍 언어
  - 제공하지 않으면 파일 확장자로 자동 판단
  - 지원 언어: `javascript`, `python`, `c`, `cpp`, `java`

### 지원 언어 및 파일 확장자

| 언어 | 확장자 | 자동 판단 |
|------|--------|----------|
| JavaScript | `.js` | ✅ |
| Python | `.py` | ✅ |
| C | `.c` | ✅ |
| C++ | `.cpp`, `.cc`, `.cxx` | ✅ |
| Java | `.java` | ✅ |

### 응답

**SSE 스트림 (text/event-stream):**

실행 결과가 실시간으로 SSE 이벤트로 전달됩니다.

```javascript
// 이벤트 타입:
// - log: 로그 메시지 (시작/종료 등)
// - output: 표준 출력 (stdout)
// - error: 표준 에러 출력 (stderr)
// - close: 실행 종료

// 예시 이벤트:
data: {"type":"log","message":"Python 코드 실행을 시작합니다...\n"}

data: {"type":"output","data":"Hello, World!\n"}

data: {"type":"error","data":"Traceback (most recent call last):\n"}

data: {"type":"close","exitCode":0,"hasError":false}
```

**에러 응답 (400/403/404/500):**

```json
{
  "success": false,
  "message": "에러 메시지",
  "error": "ErrorCode"
}
```

### 사용 예시

```javascript
// fetch API를 사용한 SSE 연결
async function executeS3File(s3Path, fileName) {
  const response = await fetch('/api/executor/execute-s3', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      s3Path: s3Path,
      fileName: fileName
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('실행 실패:', error);
    return;
  }

  // SSE 스트림 읽기
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.substring(6));
          
          switch (data.type) {
            case 'log':
              console.log('로그:', data.message);
              break;
            case 'output':
              console.log('출력:', data.data);
              break;
            case 'error':
              console.error('에러:', data.data);
              break;
            case 'close':
              console.log('실행 완료:', data.exitCode);
              return;
          }
        } catch (err) {
          console.error('파싱 오류:', err);
        }
      }
    }
  }
}

// 사용
executeS3File(
  'class-id-00000001/default/lesson-id-00000001/code-execution-00000001',
  'main.py'
);
```

### 주의사항
- 실행 시간 제한: 30초 (초과 시 자동 종료)
- 파일 크기 제한: 10MB
- 컴파일 언어(C, C++, Java)는 현재 인터프리터 모드로만 실행됩니다 (컴파일 기능은 추후 추가 예정)

---

## 7. S3 경로 기반 웹서버 실행 (프리뷰)

S3에 저장된 HTML 파일을 웹서버처럼 실행하여 프리뷰할 수 있는 URL을 생성합니다.

### 엔드포인트
- `POST /api/executor/preview`

### 요청

```json
{
  "s3Path": "class-id-00000001/default/lesson-id-00000001/code-execution-00000001",
  "fileName": "index.html"
}
```

### 파라미터
- `s3Path` (필수): S3 디렉토리 경로
  - 예: `class-id-00000001/default/lesson-id-00000001/code-execution-00000001`
  - `codingpt/execute/` prefix는 자동으로 추가됩니다
- `fileName` (선택): 시작 파일명
  - 제공하지 않으면 자동으로 `index.html`을 찾습니다
  - `index.html`이 없으면 첫 번째 HTML 파일을 사용합니다

### 응답

**성공 (200):**
```json
{
  "success": true,
  "previewUrl": "http://localhost:5103/api/executor/preview-1764859407906-4c2xtq/index.html",
  "s3Path": "codingpt/execute/class-id-00000001/.../index.html",
  "sessionId": "preview-1764859407906-4c2xtq",
  "expiresIn": 300,
  "message": "프리뷰 URL이 생성되었습니다. (5분 유효)"
}
```

**실패 (400/404/500):**
```json
{
  "success": false,
  "message": "에러 메시지",
  "error": "ErrorCode"
}
```

### 프리뷰 URL 사용 방법

1. **프리뷰 URL 접속**
   - 응답의 `previewUrl`을 브라우저에서 열면 HTML 파일이 실행됩니다
   - 예: `http://localhost:5103/api/executor/preview-xxx/index.html`

2. **관련 파일 자동 로드**
   - HTML 파일 내의 상대 경로(`./style.css`, `script.js`)는 자동으로 같은 S3 디렉토리에서 로드됩니다
   - 절대 경로(`/style.css`)도 자동으로 세션 경로로 변환됩니다

3. **세션 만료**
   - 프리뷰 세션은 5분 후 자동 만료됩니다
   - 페이지를 닫거나 이탈하면 자동으로 세션 만료 요청이 전송됩니다

### 프리뷰 파일 접근

프리뷰 세션이 생성되면 다음 경로로 파일에 접근할 수 있습니다:
- `GET /api/executor/:sessionId/index.html` - HTML 파일
- `GET /api/executor/:sessionId/style.css` - CSS 파일
- `GET /api/executor/:sessionId/script.js` - JavaScript 파일
- 기타 모든 정적 파일

---

## 전체 사용 흐름 예시

### 1. 파일 목록 조회 (재귀적 - 기본값)
```javascript
// 특정 경로 조회
const response = await fetch('/api/s3/files', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    s3Path: 'class-id-00000001/default/lesson-id-00000001/code-execution-00000001'
    // recursive는 기본값 true (모든 하위 디렉토리 포함)
  })
});
const { files } = await response.json();

// 최상단 경로 조회 (s3Path 없음 또는 빈 문자열)
const response2 = await fetch('/api/s3/files', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    // s3Path를 제공하지 않으면 최상단 경로(codingpt/execute/)에서 조회
  })
});
const { files: allFiles } = await response2.json();
```

### 2. 파일 내용 조회
```javascript
const response = await fetch('/api/s3/file', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    filePath: 'class-id-00000001/default/lesson-id-00000001/code-execution-00000001/index.html'
  })
});
const { content } = await response.json();
```

### 3. 파일 업데이트
```javascript
const response = await fetch('/api/s3/file', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    filePath: 'class-id-00000001/default/lesson-id-00000001/code-execution-00000001/index.html',
    content: '<html><body>Updated Content</body></html>'
  })
});
```

### 4. 캐시 무효화
```javascript
const response = await fetch('/api/s3/invalidate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    filePath: 'class-id-00000001/default/lesson-id-00000001/code-execution-00000001/index.html'
  })
});
```

### 5. 파일 삭제
```javascript
const response = await fetch('/api/s3/file', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    filePath: 'class-id-00000001/default/lesson-id-00000001/code-execution-00000001/old-file.html'
  })
});
const result = await response.json();
```

### 6. S3 파일 기반 코드 실행
```javascript
async function executeS3File(s3Path, fileName) {
  const response = await fetch('/api/executor/execute-s3', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ s3Path, fileName })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.substring(6));
        // 출력 처리
      }
    }
  }
}
```

### 7. 프리뷰 실행
```javascript
const response = await fetch('/api/executor/preview', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    s3Path: 'class-id-00000001/default/lesson-id-00000001/code-execution-00000001'
  })
});
const { previewUrl } = await response.json();
// previewUrl을 새 창에서 열기
window.open(previewUrl, '_blank');
```

---

## 에러 코드

| 에러 코드 | HTTP 상태 | 설명 |
|----------|----------|------|
| `MissingPath` | 400 | 경로가 제공되지 않음 |
| `InvalidPath` | 400 | 잘못된 경로 (경로 탐색 공격 방지) |
| `EmptyPath` | 400 | 빈 경로 |
| `EmptyContent` | 400 | 파일 내용이 없음 |
| `FileTooLarge` | 400 | 파일 크기가 10MB 초과 |
| `NoSuchKey` | 404 | 파일을 찾을 수 없음 |
| `NoSuchBucket` | 403 | S3 버킷을 찾을 수 없음 |
| `AccessDenied` | 403 | 접근 권한 없음 |
| `InternalServerError` | 500 | 서버 내부 오류 |

---

## 경로 자동 처리

모든 API에서 S3 경로는 자동으로 처리됩니다:

- `class-id-00000001/...` → `codingpt/execute/class-id-00000001/...` (자동 추가)
- 이미 `codingpt/execute/`로 시작하는 경로는 그대로 사용
- 앞뒤 슬래시(`/`)는 자동으로 정규화

---

## 주의사항

1. **파일 크기 제한**: 모든 파일은 최대 10MB까지 지원
2. **경로 보안**: 경로 탐색 공격 방지를 위해 `..`, `//` 등의 특수 문자는 차단됩니다
3. **프리뷰 세션**: 프리뷰 세션은 5분 후 자동 만료되며, 페이지 이탈 시 즉시 만료됩니다
4. **캐시 무효화**: CloudFront Distribution ID가 설정되어 있어야 동작합니다

