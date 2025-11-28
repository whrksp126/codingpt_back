const express = require('express');
const router = express.Router();
const { createReview } = require('../controllers/reviewController');
const authMiddleware = require('../middlewares/authMiddleware');

// 리뷰 관련 라우트
router.post('/', authMiddleware, createReview);  // 리뷰 등록

module.exports = router;