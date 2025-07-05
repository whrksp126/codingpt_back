// 환경 변수 로딩 (가장 먼저)
require('dotenv').config({ path: '.env.local' });

const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./middlewares/logger');

// 환경 변수 디버깅 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 환경 변수 확인:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_NAME:', process.env.DB_NAME);
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_PORT:', process.env.DB_PORT);
  console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***설정됨***' : '***설정되지 않음***');
}

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 설정 (실무 환경)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173', // React 개발 서버
  'http://localhost:3001', // 다른 프론트엔드 포트
  'https://yourdomain.com' // 프로덕션 도메인
];

app.use(cors({
  origin: (origin, callback) => {
    // 개발 환경에서는 모든 origin 허용
    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      // 프로덕션에서는 허용된 origin만
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS 정책에 의해 차단되었습니다.'));
      }
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// 미들웨어 설정
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 로깅 미들웨어
app.use(logger);

// API 라우트
app.use('/api', routes);

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '요청한 리소스를 찾을 수 없습니다.',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// 에러 핸들링 미들웨어 (반드시 마지막에 위치)
app.use(errorHandler);

// 데이터베이스 연결 및 서버 시작
const startServer = async () => {
  try {
    console.log('🔍 데이터베이스 연결 시도 중...');
    console.log('📍 연결 대상:', process.env.DB_HOST);
    
    // 데이터베이스 연결 테스트
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // // 데이터베이스 동기화 (개발 환경에서만)
    // if (process.env.NODE_ENV === 'development') {
    //   console.log('🔄 데이터베이스 동기화 시작...');
    //   await sequelize.sync({ alter: true });
    //   console.log('✅ 데이터베이스 동기화 완료');
    // }

    // 서버 시작
    app.listen(PORT, () => {
      console.log(`🚀 서버가 http://localhost:${PORT}에서 실행 중입니다!`);
      console.log(`👥 사용자 API: http://localhost:${PORT}/api/users`);
      console.log(`🌍 환경: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    console.error('🔍 에러 상세 정보:', {
      name: error.name,
      message: error.message,
      code: error.parent?.code,
      detail: error.parent?.detail
    });
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM 신호 수신, 서버 종료 중...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT 신호 수신, 서버 종료 중...');
  await sequelize.close();
  process.exit(0);
});

startServer();