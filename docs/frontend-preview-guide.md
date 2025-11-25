# 프론트엔드 HTML 프리뷰 사용 가이드

## 개요

S3에 저장된 HTML/CSS/JS 파일을 프리뷰할 수 있는 기능입니다. 백엔드에서 S3 Presigned URL을 생성하여 반환합니다.

## API 엔드포인트

### POST `/api/preview` (백엔드를 통해 호출)
또는 직접 코드 실행 서버 호출: `POST http://localhost:5200/preview`

## 요청 형식

```javascript
const response = await fetch('http://localhost:5103/api/preview', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    s3Path: 'codingpt/code-execution/user-123/lesson-456/index.html'
  })
});
```

### 요청 파라미터

- `s3Path` (string, required): S3에 저장된 HTML 파일 경로
  - 예: `"codingpt/code-execution/user-123/lesson-456/index.html"`
  - 예: `"codingpt/code-execution/user-123/lesson-456/"` (디렉토리 경로)

## 응답 형식

### 성공 응답 (200)

```json
{
  "success": true,
  "previewUrl": "https://your-bucket.s3.ap-northeast-2.amazonaws.com/path/to/file.html?X-Amz-Algorithm=...",
  "s3Path": "codingpt/code-execution/user-123/lesson-456/index.html",
  "expiresIn": 3600,
  "message": "프리뷰 URL이 생성되었습니다. (1시간 유효)"
}
```

### 에러 응답

#### 파일 없음 (404)
```json
{
  "success": false,
  "message": "S3 경로에 파일이 없습니다: codingpt/code-execution/user-123/lesson-456/index.html"
}
```

#### 서버 오류 (500)
```json
{
  "success": false,
  "message": "프리뷰 URL 생성 실패: ..."
}
```

## 사용 예시

### 1. 기본 사용법

```javascript
async function openPreview(s3Path) {
  try {
    const response = await fetch('http://localhost:5103/api/preview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ s3Path })
    });

    const data = await response.json();

    if (data.success) {
      // 새 창에서 프리뷰 열기
      window.open(data.previewUrl, '_blank');
    } else {
      console.error('프리뷰 생성 실패:', data.message);
      alert(`프리뷰를 열 수 없습니다: ${data.message}`);
    }
  } catch (error) {
    console.error('프리뷰 요청 오류:', error);
    alert('프리뷰 요청 중 오류가 발생했습니다.');
  }
}

// 사용 예시
openPreview('codingpt/code-execution/user-123/lesson-456/index.html');
```

### 2. React 컴포넌트 예시

```jsx
import React, { useState } from 'react';

function PreviewButton({ s3Path }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePreview = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5103/api/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ s3Path })
      });

      const data = await response.json();

      if (data.success) {
        // 새 창에서 프리뷰 열기
        const previewWindow = window.open(data.previewUrl, '_blank');
        
        if (!previewWindow) {
          setError('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
        }
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('프리뷰 요청 중 오류가 발생했습니다.');
      console.error('프리뷰 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={handlePreview} 
        disabled={loading}
      >
        {loading ? '로딩 중...' : '프리뷰 열기'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default PreviewButton;
```

### 3. iframe으로 프리뷰 표시

```jsx
import React, { useState, useEffect } from 'react';

function PreviewFrame({ s3Path }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPreviewUrl = async () => {
      try {
        const response = await fetch('http://localhost:5103/api/preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ s3Path })
        });

        const data = await response.json();

        if (data.success) {
          setPreviewUrl(data.previewUrl);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError('프리뷰 URL을 가져올 수 없습니다.');
        console.error('프리뷰 오류:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPreviewUrl();
  }, [s3Path]);

  if (loading) {
    return <div>프리뷰를 불러오는 중...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>오류: {error}</div>;
  }

  return (
    <iframe
      src={previewUrl}
      style={{
        width: '100%',
        height: '600px',
        border: '1px solid #ccc',
        borderRadius: '4px'
      }}
      title="HTML 프리뷰"
    />
  );
}

export default PreviewFrame;
```

### 4. 백엔드 API를 통한 호출 (권장)

백엔드에 프리뷰 엔드포인트를 추가하여 프론트엔드가 백엔드를 통해 호출하는 방식:

```javascript
// 백엔드: routes/previewRoutes.js (예시)
const express = require('express');
const router = express.Router();
const http = require('http');
const { URL } = require('url');

router.post('/', async (req, res) => {
  const { s3Path } = req.body;
  
  const executorUrl = process.env.CODE_EXECUTOR_URL || 'http://code-executor:5200';
  const url = new URL(`${executorUrl}/preview`);
  
  const postData = JSON.stringify({ s3Path });
  
  const options = {
    hostname: url.hostname,
    port: url.port || 5200,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const executorReq = http.request(options, (executorRes) => {
    let data = '';
    executorRes.on('data', (chunk) => {
      data += chunk;
    });
    executorRes.on('end', () => {
      res.json(JSON.parse(data));
    });
  });

  executorReq.on('error', (err) => {
    res.status(500).json({
      success: false,
      message: `코드 실행 서버 오류: ${err.message}`
    });
  });

  executorReq.write(postData);
  executorReq.end();
});

module.exports = router;
```

프론트엔드에서:
```javascript
// 백엔드를 통해 호출
const response = await fetch('http://localhost:5103/api/preview', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    s3Path: 'codingpt/code-execution/user-123/lesson-456/index.html'
  })
});
```

## 주의사항

1. **Presigned URL 유효기간**: 생성된 URL은 1시간 동안만 유효합니다.
2. **CORS 설정**: S3 버킷에 CORS 설정이 필요할 수 있습니다.
3. **팝업 차단**: `window.open()` 사용 시 브라우저 팝업 차단 설정을 확인하세요.
4. **에러 처리**: 항상 에러 처리를 구현하세요.

## S3 CORS 설정 예시

S3 버킷의 CORS 설정:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:5173",
      "https://your-domain.com"
    ],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3000
  }
]
```

## 완전한 예시 코드

```javascript
class PreviewService {
  constructor(baseUrl = 'http://localhost:5103/api') {
    this.baseUrl = baseUrl;
  }

  async getPreviewUrl(s3Path) {
    try {
      const response = await fetch(`${this.baseUrl}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ s3Path })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }

      return data.previewUrl;
    } catch (error) {
      console.error('프리뷰 URL 생성 실패:', error);
      throw error;
    }
  }

  async openPreview(s3Path, target = '_blank') {
    try {
      const previewUrl = await this.getPreviewUrl(s3Path);
      window.open(previewUrl, target);
    } catch (error) {
      alert(`프리뷰를 열 수 없습니다: ${error.message}`);
    }
  }
}

// 사용
const previewService = new PreviewService();
previewService.openPreview('codingpt/code-execution/user-123/lesson-456/index.html');
```

