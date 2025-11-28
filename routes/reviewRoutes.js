const express = require('express');
const router = express.Router();
const { createReview, getReviewsByProductId } = require('../controllers/reviewController');
const authMiddleware = require('../middlewares/authMiddleware');

// 리뷰 관련 라우트
router.post('/', authMiddleware, createReview);           // 리뷰 등록
router.get('/product/:productId', getReviewsByProductId); // 특정 상품의 리뷰 조회

module.exports = router;