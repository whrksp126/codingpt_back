# 프론트엔드 HTML 프리뷰 기능 구현 프롬프트

다음 프롬프트를 프론트엔드 프로젝트에 전달하세요:

---

## 프롬프트

백엔드 API 서버에 S3에 저장된 HTML 파일을 프리뷰할 수 있는 기능이 구현되어 있습니다. 이 API를 호출하는 컴포넌트를 만들어주세요.

### API 정보

**엔드포인트**: `POST /api/preview`

**요청 형식**:
```json
{
  "s3Path": "class-id-00000006/index.html"
}
```

**주의**: `codingpt/code-execution/` 경로는 백엔드에서 자동으로 붙여집니다. 프론트엔드에서는 그 이후 경로만 전달하면 됩니다.

**응답 형식**:
```json
{
  "success": true,
  "previewUrl": "https://s3.ghmate.com/codingpt/code-execution/class-id-00000006/index.html",
  "s3Path": "codingpt/code-execution/class-id-00000006/index.html",
  "message": "프리뷰 URL이 생성되었습니다."
}
```

### 요구사항

1. **프리뷰 버튼 컴포넌트 생성**
   - S3 경로(`s3Path`)를 props로 받음
   - 클릭 시 프리뷰 API 호출
   - 로딩 상태 표시
   - 에러 처리

2. **프리뷰 열기**
   - API 응답으로 받은 `previewUrl`을 새 창에서 열기
   - `window.open(previewUrl, '_blank')` 사용

3. **에러 처리**
   - API 호출 실패 시 사용자에게 알림
   - 네트워크 오류 처리

## 예시 코드

### React 컴포넌트 예시

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
        window.open(data.previewUrl, '_blank');
      } else {
        setError(data.message || '프리뷰를 열 수 없습니다.');
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
        className="preview-button"
      >
        {loading ? '로딩 중...' : '프리뷰 열기'}
      </button>
      {error && (
        <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default PreviewButton;
```

### 사용 예시

```jsx
// 사용법 (codingpt/code-execution/는 백엔드에서 자동으로 붙여짐)
<PreviewButton s3Path="class-id-00000006/index.html" />
```

## 주요 포인트

1. **S3 경로 형식**: `class-id-00000006/index.html` (프론트엔드에서 전달)
   - 백엔드에서 자동으로 `codingpt/code-execution/`를 앞에 붙임
   - 최종 경로: `codingpt/code-execution/class-id-00000006/index.html`
2. **응답 URL**: 프록시 URL 형식으로 반환됨
3. **새 창 열기**: `window.open()` 사용 (팝업 차단 주의)
4. **에러 처리**: 항상 try-catch로 감싸서 처리

## 테스트용 S3 경로

```
class-id-00000006/index.html
```

이 경로에 샘플 HTML 파일이 업로드되어 있습니다.

## 완료 조건

- [ ] 프리뷰 버튼 컴포넌트 생성
- [ ] API 호출 구현
- [ ] 로딩 상태 표시
- [ ] 에러 처리
- [ ] 새 창에서 프리뷰 열기
- [ ] 테스트 완료

---

## 간단 버전 (한 문장)

백엔드에 `POST /api/preview` API가 있고, S3 경로(`s3Path`)를 보내면 프리뷰 URL(`previewUrl`)을 받을 수 있습니다. 이 URL을 새 창에서 열어주는 버튼 컴포넌트를 만들어주세요. 로딩 상태와 에러 처리도 포함해주세요.

