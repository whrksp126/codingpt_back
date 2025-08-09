const { sequelize, MyClass, MyClassStatus, Product, ProductClassMap, Class, ClassSectionMap, Section, SectionLessonMap, Lesson } = require('../models');

class MyClassService {
  /**
   * 모든 내강의 조회
   */
  async getAllMyclass(userId) {
    const myclassList = await MyClass.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'description', 'type', 'price', 'lecture_intro'],
          include: [
            {
              model: Class,
              as: 'Classes',
              through: { model: ProductClassMap, attributes: [] },
              include: [
                {
                  model: Section,
                  as: 'Sections',
                  through: { model: ClassSectionMap, attributes: [] },
                  include: [
                    {
                      model: Lesson,
                      as: 'Lessons',
                      through: { model: SectionLessonMap, attributes: [] }
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          model: MyClassStatus,
          required: false
        }
      ]
    });
    
    // 데이터 구조화
    return myclassList.map(myclass => ({
      ...myclass.Product.dataValues,
      myclass_id: myclass.id,
      status: myclass.MyClassStatuses || []
    }));
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

  /**
   * 수강 등록 함수
   * 내강의(myclass) 등록 + 학습상태(myclass_status) 초기화
   */
  async createMyclass(userId, productId) {
    const exists = await MyClass.findOne({
      where: { user_id: userId, product_id: productId }
    });
    if (exists) {
      throw new Error('이미 등록된 강의입니다.');
    }
    const t = await sequelize.transaction(); // 트랜잭션 시작
    try {
      // 1. myclass 생성
      const myclass = await MyClass.create({
        user_id: userId,
        product_id: productId
      }, { transaction: t });

      // 2. 연결된 lesson 전체 조회
      const product = await Product.findByPk(productId, {
        include: [{
          model: Class,
          through: { model: ProductClassMap },
          include: [{
            model: Section,
            through: { model: ClassSectionMap },
            include: [{
              model: Lesson,
              through: { model: SectionLessonMap }
            }]
          }]
        }],
        transaction: t
      });

      const lessonIds = [];

      for (const cls of product.Classes) {
        for (const section of cls.Sections) {
          for (const lesson of section.Lessons) {
            lessonIds.push(lesson.id);
          }
        }
      }

      // 3. myclass_status에 lesson별 학습상태 추가
      const statusData = lessonIds.map(lessonId => ({
        myclass_id: myclass.id,
        lesson_id: lessonId,
        status: 1
      }));

      await MyClassStatus.bulkCreate(statusData, { transaction: t });

      await t.commit(); // 성공 시 커밋
      return myclass;
    } catch (error) {
      await t.rollback(); // 실패 시 롤백
      throw error;
    }
  }
}

module.exports = new MyClassService(); 