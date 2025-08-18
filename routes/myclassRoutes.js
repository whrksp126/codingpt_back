const express = require('express');
const router = express.Router();
const { 
  getAllMyclass, 
  getMyClasstById,
  createMyclass,
  completeLessonWithResult
} = require('../controllers/myclassController');

// 내강의 관련 라우트
router.get('/check', getMyClasstById);                // 특정 상품 수강 여부 조회
router.get('/:userId', getAllMyclass);                // 모든 내강의 조회
router.patch('/complete', completeLessonWithResult);  // 레슨별 슬라이드 결과값 업데이트
router.post('/', createMyclass);                      // 내강의 등록

module.exports = router; 