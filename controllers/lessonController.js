const lessonService = require('../services/lessonService');
const { successResponse, errorResponse } = require('../utils/response');

// 레슨별 슬라이드 데이터 조회
const getSlidesByLesson = async (req, res) => {
  try {
    const data = await lessonService.getSlidesByLesson();
    successResponse(res, data, '레슨별 슬라이드 데이터를 성공적으로 조회했습니다.');
  } catch (error) {
    console.error('슬라이드 조회 오류:', error);
    errorResponse(res, error, 500);
  }
};

module.exports = {
  getSlidesByLesson
}; 