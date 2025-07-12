const express = require('express');
const router = express.Router();
const { 
  login,
  verifyAccessToken,
  refreshAccessToken,
  updateUser, 
  deleteUser,
  getAllUsers, 
  getUserById, 
  updateUserXp, 
  updateUserHeart,
} = require('../controllers/userController');

// 사용자 관련 라우트
router.post('/login', login); // 로그인
router.get('/verify', verifyAccessToken); // 엑세스 토큰 검증
router.post('/refresh', refreshAccessToken); // 엑세스 토큰 재발급

router.get('/', getAllUsers); // 모든 사용자 조회
router.get('/:id', getUserById); // 특정 사용자 조회
router.put('/:id', updateUser); // 사용자 정보 수정
router.delete('/:id', deleteUser); // 사용자 삭제
router.patch('/:id/xp', updateUserXp); // 사용자 XP 업데이트
router.patch('/:id/heart', updateUserHeart); // 사용자 하트 업데이트

module.exports = router;