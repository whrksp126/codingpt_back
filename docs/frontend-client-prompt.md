# 프론트엔드 코드 실행 클라이언트 구현 요청 프롬프트

다음 프롬프트를 프론트엔드 프로젝트(agent)에 전달하세요:

---

## 프롬프트

백엔드 API 서버에 코드 실행 기능이 구현되어 있습니다. 이 API를 호출하는 클라이언트 코드를 만들어주세요.

### API 정보

**엔드포인트**: `POST /api/execute`

**요청 형식**:
```json
{
  "code": "console.log('Hello, World!');",
  "language": "javascript"  // 또는 "python"
}
```

**응답 형식**: Server-Sent Events (SSE) 스트리밍

**SSE 이벤트 타입**:
- `start`: 실행 시작
  ```json
  { "type": "start", "message": "JavaScript 코드 실행을 시작합니다...\n" }
  ```
- `output`: 일반 출력 (stdout)
  ```json
  { "type": "output", "data": "Hello, World!\n" }
  ```
- `error`: 에러 출력 (stderr)
  ```json
  { "type": "error", "data": "Error: ...\n" }
  ```
- `close`: 실행 종료
  ```json
  { "type": "close", "exitCode": 0, "hasError": false, "message": "\n프로세스가 종료되었습니다. (종료 코드: 0)\n" }
  ```

### 요구사항

1. **함수/클래스 생성**: `executeCode(code, language, callbacks)` 형태로 구현
   - `code`: 실행할 코드 (string)
   - `language`: "javascript" 또는 "python" (string)
   - `callbacks`: 콜백 함수 객체
     - `onStart(message)`: 실행 시작 시 호출
     - `onOutput(data)`: 출력 데이터 수신 시 호출
     - `onError(data)`: 에러 데이터 수신 시 호출
     - `onClose(result)`: 실행 종료 시 호출 (result: { exitCode, hasError, message })

2. **SSE 연결 처리**: EventSource 또는 fetch API를 사용하여 SSE 스트림 처리

3. **에러 처리**: 네트워크 오류, 타임아웃 등 처리

4. **사용 예시**:
```javascript
executeCode(
  "console.log('Hello!');\nconsole.log('World!');",
  "javascript",
  {
    onStart: (message) => console.log('시작:', message),
    onOutput: (data) => console.log('출력:', data),
    onError: (data) => console.error('에러:', data),
    onClose: (result) => console.log('종료:', result)
  }
);
```

5. **추가 기능 (선택사항)**:
   - 실행 중단 기능 (abort)
   - 재연결 로직
   - 타임아웃 처리

### 참고사항

- 백엔드 서버 URL은 환경 변수나 설정 파일에서 관리
- SSE는 `text/event-stream` Content-Type으로 응답
- 각 이벤트는 `data: {JSON}\n\n` 형식으로 전송됨

---

## 간단 버전 (한 문장)

백엔드에 `POST /api/execute` API가 있고, 코드와 언어(javascript/python)를 보내면 SSE로 실시간 실행 결과를 받을 수 있습니다. 이걸 호출하는 클라이언트 함수를 만들어주세요. EventSource나 fetch로 SSE 스트림을 받아서 onStart, onOutput, onError, onClose 콜백으로 처리하면 됩니다.

