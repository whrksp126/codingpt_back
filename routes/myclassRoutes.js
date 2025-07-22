const express = require('express');
const router = express.Router();
const { 
  getAllMyclass, 
  getMyClasstById,
  createMyclass
} = require('../controllers/myclassController');

// 제품 관련 라우트
router.get('/check', getMyClasstById);        // 특정 상품 수강 여부 조회
router.get('/:userId', getAllMyclass);           // 모든 내강의 조회
router.post('/', createMyclass);                    // 내강의 등록

module.exports = router; 