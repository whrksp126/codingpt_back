const { MyClass } = require('../models');

class MyClassService {
  // 모든 내강의 조회
  async getAllMyclass() {
    return await MyClass.findAll({
      attributes: ['id', 'user_id', 'product_id']
    });
  }
  
  // 특정 상품 수강 여부 조회
  async getMyClasstById(userId, productId) {
        const record = await MyClass.findOne({
            where: {
              user_id: userId,
              product_id: productId,
            },
        });
        return !!record; // true 또는 false 반환
    }

    // 내강의 등록
    async createMyclass(userId, productId) {
      const exists = await MyClass.findOne({
        where: { user_id: userId, product_id: productId }
      });
      if (exists) {
        throw new Error('이미 등록된 강의입니다.');
      }
      // create
      const newEntry = await MyClass.create({ user_id: userId, product_id: productId });
      return newEntry;
    }
}

module.exports = new MyClassService(); 