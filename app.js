const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = 3000;

// CORS 설정
const allowedOrigins = [
  'http://localhost:5173', // React 개발 서버
  'http://localhost:3000', // API 테스트
  'http://example.com', // 허용할 추가 도메인
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      // 요청 Origin이 허용된 Origin 리스트에 있으면 승인
      callback(null, true);
    } else {
      // 요청 Origin이 허용되지 않으면 에러 반환
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // 허용할 HTTP 메서드
  allowedHeaders: ['Content-Type', 'Authorization'], // 허용할 헤더
  credentials: true, // 쿠키 허용
}));

// JSON 요청 처리
app.use(express.json());

// 라우트 설정
app.use('/users', userRoutes);

// 데이터베이스 동기화 및 서버 시작
sequelize.sync({ force: false }).then(() => {
  console.log('데이터베이스 동기화 완료');
  app.listen(PORT, () => console.log(`http://localhost:${PORT} 서버 실행 중`));
});
