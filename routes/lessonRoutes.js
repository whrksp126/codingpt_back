const express = require('express');
const router = express.Router();
const { 
  getSlidesByLesson
} = require('../controllers/lessonController');

// 레슨 관련 라우트
// router.get('/:lessonId/slides', getSlidesByLesson); // 레슨별 슬라이드 조회
router.get('/slides', getSlidesByLesson);              // 레슨별 슬라이드 조회

module.exports = router;