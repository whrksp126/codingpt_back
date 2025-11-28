const { Review, ProductReviewMap, sequelize } = require('../models');

class ReviewService {
  // 리뷰 등록
  async createReview(userId, product_id, score, review_text) {
    // 필수 필드 검증
    if (!userId || !product_id || !score || !review_text) {
      throw new Error('필수 필드가 누락되었습니다.');
    }
    // 점수 검증 (1점에서 5점 사이)
    if (score < 1 || score > 5) {
      throw new Error('점수는 1점에서 5점 사이여야 합니다.');
    }

    // 트랜잭션으로 리뷰와 매핑 동시 생성
    const transaction = await sequelize.transaction();

    try {
      // Review 생성
      const review = await Review.create({
        user_id: userId,
        score,
        review_text,
        created_at: new Date()
      }, { transaction });

      // ProductReviewMap 생성
      await ProductReviewMap.create({
        product_id,
        review_id: review.id
      }, { transaction });

      await transaction.commit();
      return review;
    } catch (error) {
      await transaction.rollback();
      console.error('트랜잭션 롤백 완료:', error);
      throw error;
    }
  }
}

module.exports = new ReviewService();
