const http = require('http');
const { URL } = require('url');

/**
 * S3 HTML 프리뷰 URL 생성
 */
const createPreview = async (req, res) => {
  const { s3Path } = req.body;

  if (!s3Path || typeof s3Path !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'S3 경로가 필요합니다. (예: codingpt/code-execution/user-id/lesson-id/index.html)'
    });
  }

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
      data += chunk.toString();
    });

    executorRes.on('end', () => {
      try {
        const result = JSON.parse(data);
        res.status(executorRes.statusCode).json(result);
      } catch (err) {
        console.error('[PreviewController] 응답 파싱 오류:', err);
        res.status(500).json({
          success: false,
          message: '프리뷰 서버 응답을 파싱할 수 없습니다.'
        });
      }
    });
  });

  executorReq.on('error', (err) => {
    console.error('[PreviewController] 코드 실행 서버 연결 오류:', err);
    res.status(500).json({
      success: false,
      message: `코드 실행 서버 연결 실패: ${err.message}. 서버가 실행 중인지 확인하세요.`
    });
  });

  executorReq.write(postData);
  executorReq.end();
};

module.exports = {
  createPreview
};

