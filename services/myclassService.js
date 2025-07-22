const { MyClass, Product } = require('../models');

class MyClassService {
  // 모든 내강의 조회
  async getAllMyclass(userId) {
    const myclassList = await MyClass.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'description', 'type', 'price', 'lecture_intro']
        }
      ]
    });
    // Product만 추출
    //console.log(JSON.stringify(myclassList, null, 2));
    return myclassList.map(entry => entry.Product);
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