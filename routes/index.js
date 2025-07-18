const express = require('express');
const router = express.Router();
const userRoutes = require('./userRoutes');
const productRoutes = require('./productRoutes');
const classRoutes = require('./classRoutes');
const storeRoutes = require('./storeRoutes');

// API 라우트 설정
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/classes', classRoutes);
router.use('/store', storeRoutes);

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
      classes: '/api/store'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 