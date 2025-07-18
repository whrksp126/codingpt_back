const { StoreCategory } = require('../models');

class StoreService {
    // 상점 카테고리 및 상품 조회(ALL)
    async getAllCategoriesWithProducts() {
        const categories = await StoreCategory.findAll({
            attributes: ['id', 'name', 'description'],
            include: [
            {
                association: 'Products',
                attributes: ['id', 'name', 'description', 'type', 'price', 'lecture_intro'],
                through: { attributes: [] }, // 매핑 테이블 정보 생략
            },
            ],
        });
        return categories;
    }
  }
  
  module.exports = new StoreService(); 