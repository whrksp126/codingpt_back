const userService = require('../services/userService');
const { successResponse, errorResponse } = require('../utils/response');


// 로그인
const login = async (req, res) => {
  try {
    const { idToken } = req.body;
    const user = await userService.login(idToken);
    successResponse(res, user, '로그인이 성공적으로 완료되었습니다.');
  } catch (error) {
    console.error('로그인 오류:', error);
    errorResponse(res, { message: error.message }, 400);
  }
};

// 엑세스 토큰 검증
const verifyAccessToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('verifyAccessToken 호출', authHeader);
    if (!authHeader) return res.status(401).json({ message: '토큰 없음' });

    const token = authHeader.split(' ')[1];
    const user = await userService.verifyAccessToken(token);
    successResponse(res, user, '토큰이 성공적으로 검증되었습니다.');
  } catch (error) {
    console.error('토큰 검증 오류:', error);
    errorResponse(res, { message: error.message }, 400);
  }
};

// 엑세스 토큰 재발급
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const user = await userService.refreshAccessToken(refreshToken);
    successResponse(res, user, '엑세스 토큰이 성공적으로 재발급되었습니다.');
  } catch (error) {
    console.error('엑세스 토큰 재발급 오류:', error);
    errorResponse(res, { message: error.message }, 400);
  }
};

// 사용자 정보 수정
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.updateUser(id, req.body);
    successResponse(res, user, '사용자 정보가 성공적으로 수정되었습니다.');
  } catch (error) {
    console.error('사용자 수정 오류:', error);
    errorResponse(res, { message: error.message }, 400);
  }
};

// 사용자 삭제
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await userService.deleteUser(id);
    successResponse(res, null, '사용자가 성공적으로 삭제되었습니다.');
  } catch (error) {
    console.error('사용자 삭제 오류:', error);
    errorResponse(res, { message: error.message }, 400);
  }
};

// 모든 사용자 조회
const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    successResponse(res, users, '사용자 목록을 성공적으로 조회했습니다.');
  } catch (error) {
    console.error('사용자 조회 오류:', error);
    errorResponse(res, error, 500);
  }
};

// 특정 사용자 조회
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    successResponse(res, user, '사용자 정보를 성공적으로 조회했습니다.');
  } catch (error) {
    console.error('사용자 조회 오류:', error);
    errorResponse(res, { message: error.message }, 404);
  }
};

// 사용자 XP 업데이트
const updateUserXp = async (req, res) => {
  try {
    const { id } = req.params;
    const { xp } = req.body;
    const result = await userService.updateUserXp(id, xp);
    successResponse(res, result, '사용자 XP가 성공적으로 업데이트되었습니다.');
  } catch (error) {
    console.error('사용자 XP 업데이트 오류:', error);
    errorResponse(res, { message: error.message }, 400);
  }
};

// 사용자 하트 업데이트
const updateUserHeart = async (req, res) => {
  try {
    const { id } = req.params;
    const { heart } = req.body;
    const result = await userService.updateUserHeart(id, heart);
    successResponse(res, result, '사용자 하트가 성공적으로 업데이트되었습니다.');
  } catch (error) {
    console.error('사용자 하트 업데이트 오류:', error);
    errorResponse(res, { message: error.message }, 400);
  }
};



module.exports = {
  login,
  verifyAccessToken,
  refreshAccessToken,
  updateUser,
  deleteUser,
  getAllUsers,
  getUserById,
  updateUserXp,
  updateUserHeart,
}; 