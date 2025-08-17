const { Product, Class, Section, Lesson, Slide, User } = require('../models');

class LessonService {
  // 특정 제품 조회 (리뷰 포함)
  async getSlidesByLesson() {
    const temp = 1; // productId
    const sides = await Slide.findByPk(temp);

    return sides;
  }
}

module.exports = new LessonService(); 