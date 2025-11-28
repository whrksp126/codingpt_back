const reviewService = require('../services/reviewService');
const { successResponse, errorResponse } = require('../utils/response');

// 리뷰 등록
const createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, score, review_text } = req.body;
    if (!userId || !product_id || !score || !review_text) {
      throw new Error('필수 파라미터가 누락되었습니다.');
    }
    const review = await reviewService.createReview(userId, product_id, score, review_text);
    if (review) {
      successResponse(res, review, '리뷰가 성공적으로 등록되었습니다.', 201);
    } else {
      errorResponse(res, '리뷰 등록 실패', 400);
    }
  } catch (error) {
    console.error('리뷰 등록 오류:', error);
    errorResponse(res, { message: error.message }, 400);
  }
};

module.exports = {
  createReview
};

