const express = require('express');
const router = express.Router();
const userRoutes = require('./userRoutes');
const productRoutes = require('./productRoutes');
const classRoutes = require('./classRoutes');
const storeRoutes = require('./storeRoutes');
const myclassRoutes = require('./myclassRoutes');
const lessonRoutes = require('./lessonRoutes');
const heartRoutes = require('./heartRoutes');

// API 라우트 설정
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/classes', classRoutes);
router.use('/store', storeRoutes);
router.use('/myclass', myclassRoutes);
router.use('/lesson', lessonRoutes);
router.use('/hearts', heartRoutes);

// API 루트 엔드포인트
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CodingPT API 서버',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      products: '/api/products',
      classes: '/api/classes',
      store: '/api/store',
      myclass: '/api/myclass',
      lesson: '/api/lesson',
      hearts: '/api/hearts'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;