const { Review, ProductReviewMap, User, sequelize } = require('../models');

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

  // 특정 상품의 리뷰 조회
  async getReviewsByProductId(productId) {
    if (!productId) {
      throw new Error('상품 ID가 필요합니다.');
    }

    const reviews = await Review.findAll({
      attributes: ['id', 'score', 'review_text', 'created_at', 'updated_at'],
      include: [
        {
          model: ProductReviewMap,
          where: { product_id: productId },
          attributes: []
        },
        {
          model: User,
          attributes: ['id', 'nickname', 'profile_img']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return reviews;
  }

  // 리뷰 수정
  async updateReview(reviewId, userId, updateData) {
    if (!reviewId) {
      throw new Error('리뷰 ID가 필요합니다.');
    }

    const review = await Review.findByPk(reviewId);

    if (!review) {
      throw new Error('해당 리뷰를 찾을 수 없습니다.');
    }

    // 본인 리뷰인지 확인
    if (review.user_id !== userId) {
      throw new Error('본인이 작성한 리뷰만 수정할 수 있습니다.');
    }

    const { score, review_text } = updateData;

    // 점수 검증 (1점에서 5점 사이)
    if (score !== undefined && (score < 1 || score > 5)) {
      throw new Error('점수는 1점에서 5점 사이여야 합니다.');
    }

    // 업데이트할 필드만 수정
    if (score !== undefined) review.score = score;
    if (review_text !== undefined) review.review_text = review_text;
    review.updated_at = new Date();

    await review.save();

    return review;
  }
}

module.exports = new ReviewService();
