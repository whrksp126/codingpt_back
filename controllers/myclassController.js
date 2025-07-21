const myclassService = require('../services/myclassService');
const { successResponse, errorResponse } = require('../utils/response');

// 모든 내강의 조회
const getAllMyclass = async (req, res) => {
  try {
    const myclasses = await myclassService.getAllMyclass();
    successResponse(res, myclasses, '내강의 목록을 성공적으로 조회했습니다.');
  } catch (error) {
    console.error('내강의 조회 오류:', error);
    errorResponse(res, error, 500);
  }
};

// 특정 상품 수강 여부 조회
const getMyClasstById = async (req, res) => {
  try {
    const { user_id, product_id } = req.query;
    const checkMyclass = await myclassService.getMyClasstById(user_id, product_id);
    console.log('컨트롤러 디비조회 성공: ', checkMyclass);
    successResponse(res, checkMyclass, '내강의 등록 여부를 성공적으로 조회했습니다.');
  } catch (error) {
    console.error('수강 여부 확인 오류:', error);
    errorResponse(res, { message: error.message }, 404);
  }
};

// 내강의 등록
const createMyclass = async (req, res) => {
  try {
    const { user_id, product_id } = req.body;
    const result = await myclassService.createMyclass(user_id, product_id);
    successResponse(res, result, '수강 등록이 완료되었습니다.');
  } catch (error) {
    errorResponse(res, { message: error.message }, 400);
  }
};

module.exports = {
    getAllMyclass,
    getMyClasstById,
    createMyclass
  }; 