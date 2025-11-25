const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 5200;

const S3_PUBLIC_BASE_URL = process.env.S3_PUBLIC_BASE_URL || 'https://s3.ghmate.com';

// 프리뷰 세션 관리
// 세션 ID -> 세션 정보
const previewSessions = new Map();
// S3 경로 -> 세션 ID (같은 경로의 기존 세션 찾기용)
const s3PathToSessionId = new Map();

// 세션 정리 (1분마다 만료된 세션 삭제)
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, sessionData] of previewSessions.entries()) {
    if (now > sessionData.expiresAt) {
      previewSessions.delete(sessionId);
      // S3 경로 매핑도 삭제
      if (s3PathToSessionId.get(sessionData.s3Path) === sessionId) {
        s3PathToSessionId.delete(sessionData.s3Path);
      }
    }
  }
}, 60000); // 1분마다 체크

// 환경 변수 확인 (서버 시작 시)
console.log('🔧 [ExecutorServer] 환경 변수 확인:');
console.log('  - PORT:', PORT);
console.log('  - S3_PUBLIC_BASE_URL:', S3_PUBLIC_BASE_URL);
console.log('  - AWS_REGION:', process.env.AWS_REGION || '(설정되지 않음)');
console.log('  - AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '***설정됨***' : '(설정되지 않음)');
console.log('  - AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '***설정됨***' : '(설정되지 않음)');
console.log('  - S3_BUCKET_NAME:', process.env.S3_BUCKET_NAME || '(설정되지 않음)');

// 미들웨어
app.use(express.json({ limit: '10mb' }));

// 임시 파일 디렉토리
const tempDir = path.join(os.tmpdir(), 'code-execute');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// 언어 설정
const languageConfigs = {
  javascript: {
    extension: '.js',
    command: 'node',
    name: 'JavaScript'
  },
  python: {
    extension: '.py',
    command: 'python3',
    fallbackCommand: 'python',
    name: 'Python'
  }
};

/**
 * 코드 실행 API
 * POST /execute
 */
app.post('/execute', async (req, res) => {
  const { code, language = 'javascript' } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({
      success: false,
      message: '코드가 필요합니다.'
    });
  }

  const lang = language.toLowerCase();
  const langConfig = languageConfigs[lang];

  if (!langConfig) {
    return res.status(400).json({
      success: false,
      message: `지원하지 않는 언어입니다: ${language}`
    });
  }

  // SSE 헤더 설정
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // 시작 메시지 (로그로 전송)
  res.write(`data: ${JSON.stringify({ type: 'log', message: `${langConfig.name} 코드 실행을 시작합니다...\n` })}\n\n`);

  // 임시 파일 생성
  const tempFile = path.join(
    tempDir,
    `code-${Date.now()}-${Math.random().toString(36).substring(7)}${langConfig.extension}`
  );

  try {
    // 코드를 임시 파일에 작성
    fs.writeFileSync(tempFile, code, 'utf8');

    // 실행 명령어
    let command = langConfig.command;
    let args = [tempFile];
    
    // 프로세스 실행
    const process = spawn(command, args, {
      cwd: '/tmp',
      env: {},
      shell: false
    });
    
    process.on('error', (err) => {
      console.error(`[ExecutorServer] spawn 오류:`, err);
    });

    let outputBuffer = '';
    let errorBuffer = '';
    let hasError = false;
    let isFinished = false;
    
    // stdout이 없는 경우 처리
    if (!process.stdout) {
      console.error(`[ExecutorServer] stdout이 null입니다!`);
      res.write(`data: ${JSON.stringify({ type: 'error', data: '프로세스 stdout을 열 수 없습니다.\n' })}\n\n`);
      res.write(`data: ${JSON.stringify({ 
        type: 'close', 
        exitCode: -1,
        hasError: true,
        message: '프로세스 실행 실패'
      })}\n\n`);
      res.end();
      return;
    }

    // 타임아웃 설정 (30초)
    const timeout = setTimeout(() => {
      if (!isFinished) {
        isFinished = true;
        process.kill('SIGTERM');
        res.write(`data: ${JSON.stringify({ type: 'error', data: '\n⏱️ 실행 시간이 30초를 초과하여 종료되었습니다.\n' })}\n\n`);
        res.write(`data: ${JSON.stringify({ 
          type: 'close', 
          exitCode: -1,
          hasError: true,
          message: '실행 시간 초과'
        })}\n\n`);
        res.end();
        
        // 정리
        try {
          if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
          }
        } catch (err) {
          console.error('임시 파일 삭제 실패:', err);
        }
      }
    }, 30000);

    // stdout 처리
    process.stdout.on('data', (data) => {
      const output = data.toString();
      outputBuffer += output;
      
      const lines = output.split('\n');
      lines.forEach((line, index) => {
        if (line || index < lines.length - 1) {
          try {
            const outputData = { type: 'output', data: line + (index < lines.length - 1 ? '\n' : '') };
            // 연결이 끊어져도 전송 시도 (백엔드가 받을 수 있으면 받음)
            try {
              res.write(`data: ${JSON.stringify(outputData)}\n\n`);
            } catch (writeErr) {
              clientDisconnected = true;
            }
          } catch (err) {
            clientDisconnected = true;
          }
        }
      });
    });
    
    process.stdout.on('error', (err) => {
      console.error(`[ExecutorServer] stdout 스트림 오류:`, err);
    });

    // stderr 처리
    process.stderr.on('data', (data) => {
      const error = data.toString();
      errorBuffer += error;
      hasError = true;
      
      const lines = error.split('\n');
      lines.forEach((line, index) => {
        if (line || index < lines.length - 1) {
          try {
            res.write(`data: ${JSON.stringify({ type: 'error', data: line + (index < lines.length - 1 ? '\n' : '') })}\n\n`);
          } catch (err) {
            // 클라이언트 연결 종료
          }
        }
      });
    });

    // 프로세스 종료 처리
    process.on('close', (code, signal) => {
      if (isFinished) {
        return;
      }
      isFinished = true;
      clearTimeout(timeout);

      // 임시 파일 삭제
      try {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      } catch (err) {
        console.error('[ExecutorServer] 임시 파일 삭제 실패:', err);
      }

      // 종료 메시지
      try {
        // 1. 종료 로그 메시지
        const logData = {
          type: 'log',
          message: `프로세스가 종료되었습니다. (종료 코드: ${code})\n`
        };
        try {
          res.write(`data: ${JSON.stringify(logData)}\n\n`);
        } catch (logErr) {
          // 무시
        }
        
        // 2. close 이벤트 (메타데이터만)
        const closeData = {
          type: 'close',
          exitCode: code,
          hasError: hasError || code !== 0
        };
        // 연결이 끊어져도 전송 시도 (백엔드가 받을 수 있으면 받음)
        try {
          res.write(`data: ${JSON.stringify(closeData)}\n\n`);
          res.end();
        } catch (writeErr) {
          try {
            res.end();
          } catch (e) {}
        }
      } catch (err) {
        try {
          res.end();
        } catch (e) {}
      }
    });

    // 프로세스 에러 처리
    process.on('error', (err) => {
      if (isFinished) return;
      isFinished = true;
      clearTimeout(timeout);

      // Python fallback 시도
      if (lang === 'python' && langConfig.fallbackCommand && err.code === 'ENOENT') {
        const fallbackProcess = spawn(langConfig.fallbackCommand, args, {
          cwd: '/tmp',
          env: {},
          shell: false
        });

        let fallbackOutputBuffer = '';
        let fallbackErrorBuffer = '';
        let fallbackHasError = false;
        let fallbackFinished = false;

        const fallbackTimeout = setTimeout(() => {
          if (!fallbackFinished) {
            fallbackFinished = true;
            fallbackProcess.kill('SIGTERM');
            res.write(`data: ${JSON.stringify({ type: 'error', data: '\n⏱️ 실행 시간이 30초를 초과하여 종료되었습니다.\n' })}\n\n`);
            res.write(`data: ${JSON.stringify({ 
              type: 'close', 
              exitCode: -1,
              hasError: true,
              message: '실행 시간 초과'
            })}\n\n`);
            res.end();
          }
        }, 30000);

        fallbackProcess.stdout.on('data', (data) => {
          const output = data.toString();
          fallbackOutputBuffer += output;
          const lines = output.split('\n');
          lines.forEach((line, index) => {
            if (line || index < lines.length - 1) {
              try {
                res.write(`data: ${JSON.stringify({ type: 'output', data: line + (index < lines.length - 1 ? '\n' : '') })}\n\n`);
              } catch (err) {}
            }
          });
        });

        fallbackProcess.stderr.on('data', (data) => {
          const error = data.toString();
          fallbackErrorBuffer += error;
          fallbackHasError = true;
          const lines = error.split('\n');
          lines.forEach((line, index) => {
            if (line || index < lines.length - 1) {
              try {
                res.write(`data: ${JSON.stringify({ type: 'error', data: line + (index < lines.length - 1 ? '\n' : '') })}\n\n`);
              } catch (err) {}
            }
          });
        });

        fallbackProcess.on('close', (fallbackCode) => {
          if (fallbackFinished) return;
          fallbackFinished = true;
          clearTimeout(fallbackTimeout);

          try {
            if (fs.existsSync(tempFile)) {
              fs.unlinkSync(tempFile);
            }
          } catch (err) {
            console.error('임시 파일 삭제 실패:', err);
          }

          try {
            res.write(`data: ${JSON.stringify({ 
              type: 'close', 
              exitCode: fallbackCode,
              hasError: fallbackHasError || fallbackCode !== 0,
              message: `\n프로세스가 종료되었습니다. (종료 코드: ${fallbackCode})\n`
            })}\n\n`);
            res.end();
          } catch (err) {}
        });

        return;
      }

      // 일반 에러 처리
      try {
        res.write(`data: ${JSON.stringify({ type: 'error', data: `프로세스 실행 오류: ${err.message}\n` })}\n\n`);
        res.write(`data: ${JSON.stringify({ 
          type: 'close', 
          exitCode: -1,
          hasError: true,
          message: '실행 실패'
        })}\n\n`);
        res.end();
      } catch (writeErr) {}

      // 정리
      try {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      } catch (deleteErr) {
        console.error('임시 파일 삭제 실패:', deleteErr);
      }
    });

    // 클라이언트 연결 종료 감지
    // 주의: 백엔드가 연결을 끊어도 코드 실행은 계속하고, 결과는 전송 시도
    let clientDisconnected = false;
    req.on('close', () => {
      // 백엔드가 연결을 끊어도 코드 실행은 계속
      // 응답 전송은 시도하되 실패해도 무시
    });
    
    // 응답 스트림 오류 처리 (클라이언트가 연결을 끊었을 때)
    res.on('close', () => {
      clientDisconnected = true;
    });
    
    res.on('error', (err) => {
      clientDisconnected = true;
    });

  } catch (err) {
    // 파일 생성 오류
    try {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    } catch (deleteErr) {
      console.error('임시 파일 삭제 실패:', deleteErr);
    }

    res.write(`data: ${JSON.stringify({ type: 'error', data: `파일 생성 오류: ${err.message}\n` })}\n\n`);
    res.write(`data: ${JSON.stringify({ 
      type: 'close', 
      exitCode: -1,
      hasError: true,
      message: '실행 실패'
    })}\n\n`);
    res.end();
  }
});

/**
 * HTML 프리뷰 API
 * POST /preview
 * S3 경로를 직접 참조하여 presigned URL 또는 공개 URL 생성
 */
app.post('/preview', async (req, res) => {
  const { s3Path } = req.body; // 예: "codingpt/code-execution/user-id/lesson-id/index.html"

  if (!s3Path || typeof s3Path !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'S3 경로가 필요합니다. (예: class-id-00000006/index.html)'
    });
  }

  if (!S3_PUBLIC_BASE_URL) {
    return res.status(500).json({
      success: false,
      message: 'S3 공개 URL이 설정되지 않았습니다.'
    });
  }

  try {
    // S3 경로 정규화 (앞뒤 슬래시 제거)
    let normalizedPath = s3Path.replace(/^\/+|\/+$/g, '');
    
    // codingpt/code-execution/ 경로를 앞에 붙이기
    if (!normalizedPath.startsWith('codingpt/code-execution/')) {
      normalizedPath = `codingpt/code-execution/${normalizedPath}`;
    }
    
    // 짧은 경로 추출 (기존 세션 찾기용 및 URL 생성용)
    const shortPath = normalizedPath.replace(/^codingpt\/code-execution\//, '');
    
    // 기존 세션이 있는지 확인 (같은 S3 경로)
    const existingSessionId = s3PathToSessionId.get(normalizedPath);
    if (existingSessionId && previewSessions.has(existingSessionId)) {
      // 기존 세션 만료 처리
      console.log(`[ExecutorServer] 기존 프리뷰 세션 만료: ${existingSessionId}`);
      previewSessions.delete(existingSessionId);
      s3PathToSessionId.delete(normalizedPath);
    }
    
    // 새로운 고유한 세션 ID 생성
    const sessionId = `preview-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5분 후 만료
    
    // 파일명과 디렉토리 경로 분리
    const fileName = path.basename(normalizedPath); // index.html
    const baseDir = path.dirname(normalizedPath); // codingpt/code-execution/class-id-00000006
    
    // 세션 정보 저장 (실제 S3 경로는 세션에만 저장)
    previewSessions.set(sessionId, {
      s3Path: normalizedPath, // 전체 S3 경로 (S3에서 파일 가져올 때 사용)
      baseDir: baseDir, // 디렉토리 경로 (CSS/JS 파일 가져올 때 사용)
      fileName: fileName, // 파일명
      createdAt: Date.now(),
      expiresAt: expiresAt,
      isActive: false // 접속 전에는 false
    });
    
    // S3 경로 -> 세션 ID 매핑 저장 (기존 세션 찾기용)
    s3PathToSessionId.set(normalizedPath, sessionId);
    
    // 프리뷰 URL 생성 (S3 경로 숨김: 세션 ID + 파일명만, /preview/ 제거)
    const previewUrl = `http://localhost:5200/${sessionId}/${fileName}`;

    res.json({
      success: true,
      previewUrl: previewUrl,
      s3Path: normalizedPath,
      sessionId: sessionId,
      expiresIn: 300, // 5분 (초 단위)
      message: '프리뷰 URL이 생성되었습니다. (5분 유효)'
    });

  } catch (err) {
    console.error('[ExecutorServer] 프리뷰 URL 생성 오류:', err);
    
    // 파일이 없는 경우
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
      return res.status(404).json({
        success: false,
        message: `S3 경로에 파일이 없습니다: ${s3Path}`
      });
    }

    res.status(500).json({
      success: false,
      message: `프리뷰 URL 생성 실패: ${err.message}`
    });
  }
});

/**
 * 프리뷰 페이지 서빙 (세션 기반 접근 제어)
 * GET /:sessionId/* (preview-로 시작하는 세션 ID만 처리)
 * S3 경로를 URL에서 완전히 숨김
 */

/**
 * 프리뷰 세션 만료 API
 * POST /:sessionId/expire (preview-로 시작하는 세션 ID만 처리)
 */
app.post('/:sessionId/expire', (req, res) => {
  const { sessionId } = req.params;
  
  // preview-로 시작하는 세션 ID만 처리
  if (!sessionId.startsWith('preview-')) {
    return res.status(404).json({ success: false, message: 'Not Found' });
  }
  
  if (previewSessions.has(sessionId)) {
    const sessionData = previewSessions.get(sessionId);
    previewSessions.delete(sessionId);
    
    // S3 경로 매핑도 삭제
    if (s3PathToSessionId.get(sessionData.s3Path) === sessionId) {
      s3PathToSessionId.delete(sessionData.s3Path);
    }
    
    res.json({ success: true, message: '프리뷰 세션이 만료되었습니다.' });
  } else {
    res.json({ success: false, message: '세션을 찾을 수 없습니다.' });
  }
});

// 헬스 체크 (프리뷰 라우트보다 먼저 정의하여 충돌 방지)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'code-executor' });
});

// 프리뷰 라우트를 다른 라우트들보다 나중에 정의
// GET /:sessionId/* (preview-로 시작하는 세션 ID만 처리)
app.get('/:sessionId/*', async (req, res) => {
  const { sessionId } = req.params;
  const requestedFile = req.params[0]; // 요청된 파일명 (예: index.html, style.css)

  // preview-로 시작하는 세션 ID만 처리 (다른 라우트와 충돌 방지)
  if (!sessionId.startsWith('preview-')) {
    return res.status(404).send('Not Found');
  }

  const session = previewSessions.get(sessionId);
  
  if (!session) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>프리뷰 만료</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          h1 { color: #e74c3c; }
        </style>
      </head>
      <body>
        <h1>프리뷰가 만료되었습니다</h1>
        <p>이 프리뷰는 만료되었거나 존재하지 않습니다.</p>
      </body>
      </html>
    `);
  }

  // 만료 확인
  if (Date.now() > session.expiresAt) {
    previewSessions.delete(sessionId);
    if (s3PathToSessionId.get(session.s3Path) === sessionId) {
      s3PathToSessionId.delete(session.s3Path);
    }
    return res.status(410).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>프리뷰 만료</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          h1 { color: #e74c3c; }
        </style>
      </head>
      <body>
        <h1>프리뷰가 만료되었습니다</h1>
        <p>이 프리뷰는 5분이 지나 만료되었습니다.</p>
      </body>
      </html>
    `);
  }

  // S3에서 파일 가져오기
  try {
    // 요청된 파일명을 세션의 baseDir과 결합하여 전체 S3 경로 생성
    const fullS3Path = `${session.baseDir}/${requestedFile}`;
    const s3Url = `${S3_PUBLIC_BASE_URL}/${fullS3Path}`;
    
    // HTTPS 또는 HTTP에 따라 적절한 모듈 사용
    const urlObj = new URL(s3Url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    // HTTP/HTTPS로 S3 파일 가져오기
    let htmlContent = await new Promise((resolve, reject) => {
      client.get(s3Url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`S3 파일을 가져올 수 없습니다: ${response.statusCode}`));
          return;
        }

        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => {
          resolve(data);
        });
      }).on('error', (err) => {
        reject(err);
      });
    });

    // 파일 확장자에 따라 Content-Type 설정
    const ext = path.extname(requestedFile).toLowerCase();
    let contentType = 'text/html; charset=utf-8';
    
    if (ext === '.css') {
      contentType = 'text/css; charset=utf-8';
    } else if (ext === '.js') {
      contentType = 'application/javascript; charset=utf-8';
    } else if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.gif') {
      contentType = `image/${ext.substring(1)}`;
    } else if (ext === '.svg') {
      contentType = 'image/svg+xml';
    }

    // HTML 파일인 경우에만 세션 활성화 및 스크립트 삽입
    if (ext === '.html' || ext === '') {
      // 세션 활성화
      session.isActive = true;
      session.accessedAt = Date.now();

      // 상대 경로를 프록시 경로로 변환 (S3 경로 숨김)
      // 예: style.css -> /{sessionId}/style.css
      const baseUrl = `/${sessionId}/`;
      
      // HTML 내부의 상대 경로를 프록시 경로로 변환
      htmlContent = htmlContent.replace(
        /(href|src)=(["'])(?!https?:\/\/)([^"']+)(["'])/g,
        (match, attr, quote1, url, quote2) => {
          // 이미 절대 경로로 시작하는 경우는 제외
          if (url.startsWith('/')) {
            return match;
          }
          // 상대 경로를 프록시 경로로 변환
          const newUrl = baseUrl + url;
          return `${attr}=${quote1}${newUrl}${quote2}`;
        }
      );

      // 페이지 이탈 감지 스크립트 삽입
      const expireScript = `
        <script>
          (function() {
            let sessionId = '${sessionId}';
            let hasExpired = false;

            // 페이지 이탈 감지
            function expireSession() {
              if (hasExpired) return;
              hasExpired = true;
              
              // 서버에 만료 요청
              fetch('/' + sessionId + '/expire', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              }).catch(() => {});
            }

            // beforeunload: 페이지 닫기, 새로고침, 뒤로가기
            window.addEventListener('beforeunload', expireSession);
            
            // visibilitychange: 탭 전환
            document.addEventListener('visibilitychange', function() {
              if (document.hidden) {
                expireSession();
              }
            });

            // pagehide: 페이지 숨김 (모바일에서 뒤로가기)
            window.addEventListener('pagehide', expireSession);

            // unload: 페이지 언로드
            window.addEventListener('unload', expireSession);
          })();
        </script>
      `;

      // </body> 태그 앞에 스크립트 삽입
      if (htmlContent.includes('</body>')) {
        htmlContent = htmlContent.replace('</body>', expireScript + '</body>');
      } else {
        htmlContent += expireScript;
      }
    }

    res.setHeader('Content-Type', contentType);
    res.send(htmlContent);

  } catch (err) {
    console.error('[ExecutorServer] S3 파일 가져오기 오류:', err);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>오류</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          h1 { color: #e74c3c; }
        </style>
      </head>
      <body>
        <h1>프리뷰를 불러올 수 없습니다</h1>
        <p>${err.message}</p>
      </body>
      </html>
    `);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 코드 실행 서버가 포트 ${PORT}에서 실행 중입니다!`);
});

