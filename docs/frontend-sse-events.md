# 프론트엔드 SSE 이벤트 처리 가이드 (xterm.js 사용)

## 이벤트 타입

백엔드에서 전송하는 SSE 이벤트는 다음과 같은 타입으로 구분됩니다:

### 1. `log` 타입 - 로그 메시지 (터미널 출력 아님)
시작/종료 메시지 등 시스템 로그입니다. xterm.js 터미널에는 표시하지 않고 별도 로그 영역에 표시합니다.

```json
{
  "type": "log",
  "message": "JavaScript 코드 실행을 시작합니다...\n"
}
```

### 2. `output` 타입 - 터미널 출력 (실제 콘솔 출력)
코드 실행 결과로 출력되는 실제 콘솔 출력입니다. xterm.js 터미널에 표시합니다.

```json
{
  "type": "output",
  "data": "Hello, World!\n"
}
```

### 3. `error` 타입 - 에러 출력 (터미널 출력)
코드 실행 중 발생한 에러 메시지입니다. xterm.js 터미널에 빨간색으로 표시합니다.

```json
{
  "type": "error",
  "data": "Error: something went wrong\n"
}
```

### 4. `close` 타입 - 종료 이벤트
코드 실행이 완료되었음을 알리는 메타데이터입니다.

```json
{
  "type": "close",
  "exitCode": 0,
  "hasError": false
}
```

## xterm.js를 사용한 프론트엔드 처리 예시

### 설치
```bash
npm install xterm xterm-addon-fit
```

### 코드 예시

```javascript
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

// xterm.js 터미널 초기화
const terminal = new Terminal({
  theme: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    cursor: '#aeafad',
    selection: '#3a3d41',
    black: '#000000',
    red: '#cd3131',
    green: '#0dbc79',
    yellow: '#e5e510',
    blue: '#2472c8',
    magenta: '#bc3fbc',
    cyan: '#11a8cd',
    white: '#e5e5e5',
    brightBlack: '#666666',
    brightRed: '#f14c4c',
    brightGreen: '#23d18b',
    brightYellow: '#f5f543',
    brightBlue: '#3b8eea',
    brightMagenta: '#bc3fbc',
    brightCyan: '#29b8db',
    brightWhite: '#e5e5e5'
  },
  fontSize: 14,
  fontFamily: 'Consolas, "Courier New", monospace',
  cursorBlink: true,
  cursorStyle: 'block'
});

const fitAddon = new FitAddon();
terminal.loadAddon(fitAddon);

// 터미널을 DOM에 연결
terminal.open(document.getElementById('terminal-container'));
fitAddon.fit();

// 코드 실행 함수
async function executeCode(code, language) {
  // 터미널 초기화 (선택사항)
  terminal.clear();
  
  const response = await fetch('http://localhost:5103/api/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, language }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const event = JSON.parse(line.substring(6));
          
          switch (event.type) {
            case 'log':
              // 로그 메시지는 터미널에 표시하지 않음
              // 별도 로그 영역에 표시하거나 콘솔에만 출력
              console.log('[LOG]', event.message);
              // 필요시 별도 로그 영역에 표시
              // displayLog(event.message);
              break;
              
            case 'output':
              // 터미널에 일반 출력 표시
              terminal.write(event.data);
              break;
              
            case 'error':
              // 터미널에 에러 출력 표시 (빨간색)
              // ANSI 이스케이프 코드로 빨간색 설정
              terminal.write('\x1b[31m'); // 빨간색 시작
              terminal.write(event.data);
              terminal.write('\x1b[0m'); // 색상 리셋
              break;
              
            case 'close':
              // 실행 완료 처리
              console.log('[CLOSE]', `Exit code: ${event.exitCode}, Has error: ${event.hasError}`);
              
              // 종료 메시지 표시 (선택사항)
              if (event.hasError) {
                terminal.write('\x1b[31m'); // 빨간색
                terminal.write(`\n프로세스가 종료되었습니다. (종료 코드: ${event.exitCode})\n`);
                terminal.write('\x1b[0m'); // 색상 리셋
              } else {
                terminal.write(`\n프로세스가 종료되었습니다. (종료 코드: ${event.exitCode})\n`);
              }
              
              // 실행 완료 콜백
              onExecutionComplete({
                exitCode: event.exitCode,
                hasError: event.hasError
              });
              break;
          }
        } catch (err) {
          console.error('SSE 파싱 오류:', err, line);
        }
      }
    }
  }
}

// 실행 완료 콜백
function onExecutionComplete(result) {
  console.log('코드 실행 완료:', result);
  // 필요시 추가 처리
}
```

### 주요 포인트

1. **`log` 타입**: xterm.js 터미널에 표시하지 않음 (별도 로그 영역 사용)
2. **`output` 타입**: `terminal.write(event.data)`로 터미널에 출력
3. **`error` 타입**: ANSI 이스케이프 코드로 빨간색 설정 후 출력
   - `\x1b[31m`: 빨간색 시작
   - `\x1b[0m`: 색상 리셋
4. **`close` 타입**: 실행 완료 처리 및 종료 메시지 표시

### ANSI 색상 코드 참고

- `\x1b[30m`: 검은색
- `\x1b[31m`: 빨간색 (에러용)
- `\x1b[32m`: 초록색
- `\x1b[33m`: 노란색
- `\x1b[34m`: 파란색
- `\x1b[35m`: 마젠타
- `\x1b[36m`: 시안
- `\x1b[37m`: 흰색
- `\x1b[0m`: 색상 리셋

## 요약

- **`log` 타입**: xterm.js 터미널에 표시하지 않음 (별도 로그 영역 사용)
- **`output` 타입**: `terminal.write(event.data)`로 터미널에 출력
- **`error` 타입**: ANSI 이스케이프 코드로 빨간색 설정 후 `terminal.write()`로 출력
- **`close` 타입**: 실행 완료 처리 및 종료 메시지 표시

xterm.js 터미널에는 `output`과 `error`만 표시하고, `log`는 별도 로그 영역에 표시하거나 무시하면 됩니다.

## 백엔드에서 전달하는 형식

백엔드는 이미 올바른 형식으로 전달하고 있습니다:
- `log`: `{ "type": "log", "message": "..." }`
- `output`: `{ "type": "output", "data": "..." }`
- `error`: `{ "type": "error", "data": "..." }`
- `close`: `{ "type": "close", "exitCode": 0, "hasError": false }`

프론트엔드에서 위 예시 코드대로 처리하면 됩니다.

