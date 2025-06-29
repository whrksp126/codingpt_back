const express = require('express');
const axios = require('axios');
const router = express.Router();

// HTML 컨텐츠를 그대로 반환하는 프록시
router.get('/*', async (req, res) => {
  try {
    const targetUrl = req.params[0];
    console.log('Proxying request to:', targetUrl);

    const response = await axios({
      method: 'GET',
      url: targetUrl,
      responseType: 'arraybuffer',  // 바이너리 응답을 처리하기 위해
      headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // 원본 응답의 Content-Type을 유지
    const contentType = response.headers['content-type'];
    res.setHeader('Content-Type', contentType);

    // 다른 중요한 헤더들도 전달
    if (response.headers['content-encoding']) {
      res.setHeader('Content-Encoding', response.headers['content-encoding']);
    }

    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 응답 본문을 그대로 전달
    res.send(response.data);

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).send('Proxy request failed: ' + error.message);
  }
});

// 프록시 요청 처리
router.post('/fetch', async (req, res) => {
    try {
        const { url, method = 'GET', headers = {}, data = null } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // 기본 헤더 설정
        const defaultHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        };

        // axios 요청 설정
        const config = {
            method: method,
            url: url,
            headers: { ...defaultHeaders, ...headers },
            data: data,
            validateStatus: false // 모든 상태 코드를 허용
        };

        // 요청 보내기
        const response = await axios(config);

        // 응답 반환
        res.status(response.status).json({
            status: response.status,
            headers: response.headers,
            data: response.data
        });

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({
            error: 'Proxy request failed',
            message: error.message
        });
    }
});

// URL 인코딩된 GET 요청을 위한 편의 라우트
router.get('/get/*', async (req, res) => {
    try {
        const encodedUrl = req.params[0];
        const targetUrl = decodeURIComponent(encodedUrl);

        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            validateStatus: false
        });

        res.status(response.status).json({
            status: response.status,
            headers: response.headers,
            data: response.data
        });

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({
            error: 'Proxy request failed',
            message: error.message
        });
    }
});

module.exports = router;

 