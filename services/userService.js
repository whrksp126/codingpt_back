const { User, StudyHeatmapLog } = require('../models');
const { fn, col, Op } = require('sequelize');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const ACCESS_SECRET = process.env.ACCESS_SECRET || 'ENV_NOT_FOUND_ACCESS_SECRET';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'ENV_NOT_FOUND_REFRESH_SECRET';
const GOOGLE_ANDROID_CLIENT_ID = process.env.GOOGLE_ANDROID_CLIENT_ID || 'ENV_NOT_FOUND_GOOGLE_ANDROID_CLIENT_ID';
const GOOGLE_WEB_CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID || 'ENV_NOT_FOUND_GOOGLE_WEB_CLIENT_ID';

// Google OAuth 클라이언트 생성
const client = new OAuth2Client();

class UserService {
  // Google OAuth 로그인 (자동 회원가입 포함)
  async login(idToken) {
    if(!idToken) {
      throw new Error('idToken이 필요합니다.');
    }

    try {
      // 1. Google ID 토큰 검증
      const ticket = await client.verifyIdToken({
        idToken,
        audience: GOOGLE_WEB_CLIENT_ID,
      });
      console.log('✅ Google 토큰 검증 성공');

      // 2. 토큰 페이로드 추출
      const payload = ticket.getPayload();
      const { sub: google_id, email, name } = payload;
      
      if(!email || !google_id) {
        throw new Error('Google 토큰에서 이메일 또는 Google ID를 찾을 수 없습니다.');
      }
      console.log('✅ 토큰 페이로드 추출 성공:', { email, google_id, name });

      // 3. 사용자 조회 또는 생성
      let foundUser = await User.findOne({ where: { email } });
      console.log('✅ 사용자 조회 완료:', foundUser ? '기존 사용자' : '새 사용자');
      
      if(!foundUser) {        
        foundUser = await User.create({
          email,
          nickname: name,
          google_id,
          created_at: new Date(),
        });
        console.log('✅ 새 사용자 생성 성공:', foundUser.id);
      }

      // 4. JWT 토큰 생성
      const accessToken = jwt.sign(
        { id: foundUser.id, email: foundUser.email }, 
        ACCESS_SECRET, 
        { expiresIn: '20s' } // 테스트용 20초
      );
      const refreshToken = jwt.sign(
        { id: foundUser.id, email: foundUser.email}, 
        REFRESH_SECRET, 
        { expiresIn: '30d' }
      );
      console.log('✅ JWT 토큰 생성 성공');

      // 5. Refresh Token 업데이트
      await User.update({ refresh_token: refreshToken }, { where: { id: foundUser.id } });
      console.log('✅ Refresh Token 업데이트 성공');
      
      console.log("accessToken:", accessToken);
      console.log("refreshToken:", refreshToken);
      
      return { accessToken, refreshToken };

    } catch (error) {
      // 구체적인 에러 메시지 제공
      if (error.message.includes('Wrong recipient')) {
        throw new Error('Google 클라이언트 ID가 일치하지 않습니다. 토큰 검증 실패.');
      } else if (error.message.includes('Token used too late')) {
        throw new Error('Google 토큰이 만료되었습니다. 다시 로그인해주세요.');
      } else if (error.message.includes('Invalid token')) {
        throw new Error('유효하지 않은 Google 토큰입니다.');
      } else if (error.name === 'SequelizeValidationError') {
        throw new Error('사용자 데이터 생성 중 유효성 검사 실패: ' + error.message);
      } else if (error.name === 'SequelizeUniqueConstraintError') {
        throw new Error('이미 존재하는 사용자입니다.');
      } else if (error.name === 'SequelizeConnectionError') {
        throw new Error('데이터베이스 연결 오류가 발생했습니다.');
      } else {
        console.error('🔍 상세 에러 정보:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        throw new Error(`로그인 처리 중 오류가 발생했습니다: ${error.message}`);
      }
    }
  }

  // 로그아웃
  async logout(authHeader) {
    try {
      if (!authHeader) {
        throw new Error('토큰이 필요합니다.');
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        throw new Error('토큰 형식이 잘못되었습니다.');
      }

      // Access Token 검증
      const decoded = jwt.verify(token, ACCESS_SECRET);
      console.log('✅ 토큰 검증 성공:', decoded.id);

      // Refresh Token을 빈 문자열로 설정하여 무효화
      await User.update({ refresh_token: '' }, { where: { id: decoded.id } });
      console.log('✅ 로그아웃 성공:', decoded.id);
      
      return { message: '로그아웃이 완료되었습니다.' };
    } catch (error) {
      console.error('로그아웃 오류:', error);
      throw new Error('토큰이 유효하지 않습니다.');
    }
  }

  // 엑세스 토큰 검증
  async verifyAccessToken(token) {
    try {
      console.log("token:", token);
      const decoded = jwt.verify(token, ACCESS_SECRET);
      console.log("decoded:", decoded);
      return decoded;
    } catch (err) {
      console.error('JWT 검증 오류:', err.message);
      throw new Error('토큰이 유효하지 않습니다.');
    }
  }
  
  // 엑세스 토큰 재발급
  // 기한 임박 시 리프레시 토큰 재발급
  async refreshAccessToken(refreshToken) {
    console.log("refreshToken:", refreshToken);
    if(!refreshToken || refreshToken === '') {
      throw new Error('refreshToken 없음');
    }
    try {
      // 실제 리프레시 토큰의 exp 값 확인
      //const decoded = jwt.decode(refreshToken, { complete: true });
      //console.log('refreshToken payload:', decoded.payload);

      const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
      const now = Math.floor(Date.now() / 1000); // 현재 시간 (초)

      const newAccessToken = jwt.sign(
        { id: decoded.id, email: decoded.email },
        ACCESS_SECRET,
        { expiresIn: '20s' } // 테스트용 20초
      );

      const timeRemaining = decoded.exp - now;

      // refreshToken 남은 시간이 1일 미만이면 새로 발급 (테스트)
      let newRefreshToken = null;
      if (timeRemaining < 60 * 60 * 24) {
        newRefreshToken = jwt.sign(
          { id: decoded.id, email: decoded.email },
          REFRESH_SECRET,
          { expiresIn: '30d' }
          );
        console.log('Refresh Token 재발급 : ', newRefreshToken);
        // DB에 업데이트
        await User.update({ refresh_token: newRefreshToken }, { where: { id: decoded.id } });
      }

      const response = { accessToken: newAccessToken };
      if (newRefreshToken) response.refreshToken = newRefreshToken;
      return response;
    } catch (err) {
      console.error('Refresh Token 검증 실패:', err);
      if (err.name === 'TokenExpiredError') {
        throw new Error('만료된 refreshToken입니다. 재로그인이 필요합니다.');
      } else if (err.name === 'JsonWebTokenError') {
        throw new Error('위조되었거나 유효하지 않은 refreshToken입니다.');
      } else {
        throw new Error('refreshToken 검증 중 알 수 없는 오류가 발생했습니다.');
      }
    }
  }














  // 사용자 정보 수정 (복잡한 검증 로직 포함)
  async updateUser(id, updateData) {
    const { email, nickname, profile_img } = updateData;
    
    // 1. 사용자 존재 확인
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('해당 사용자를 찾을 수 없습니다.');
    }
    
    // 2. 이메일 변경 시 중복 확인
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        throw new Error('이미 존재하는 이메일입니다.');
      }
    }
    
    // 3. 업데이트할 필드만 수정
    if (email) user.email = email;
    if (nickname) user.nickname = nickname;
    if (profile_img !== undefined) user.profile_img = profile_img;
    
    await user.save();
    return user;
  }
  
  // 사용자 삭제
  async deleteUser(id) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('해당 사용자를 찾을 수 없습니다.');
    }
    
    await user.destroy();
    return true;
  }
  
  // 모든 사용자 조회
  async getAllUsers() {
    return await User.findAll({
      attributes: ['id', 'email', 'nickname', 'profile_img', 'xp', 'heart', 'created_at']
    });
  }
  
  // 특정 사용자 조회
  async getUserById(id) {
    const user = await User.findByPk(id, {
      attributes: ['id', 'email', 'nickname', 'profile_img', 'xp', 'heart', 'created_at']
    });
    
    if (!user) {
      throw new Error('해당 사용자를 찾을 수 없습니다.');
    }
    
    return user;
  }
  
  // XP 업데이트
  async updateUserXp(id, xp) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('해당 사용자를 찾을 수 없습니다.');
    }
    
    user.xp += xp;
    await user.save();
    
    return { xp: user.xp };
  }
  
  // 하트 업데이트
  async updateUserHeart(id, heart) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('해당 사용자를 찾을 수 없습니다.');
    }
    
    user.heart = heart;
    await user.save();
    
    return { heart: user.heart };
  }

  // 학습 히트맵 데이터 조회 함수
  async getStudyHeatmap(userId) {
    // 현재 날짜 기준으로 6개월 전 1일 ~ 이번 달 말일까지 범위 계산
    const today = new Date();
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // 이번 달 마지막 날
    const startDate = new Date(today.getFullYear(), today.getMonth() - 5, 1); // 6개월 전 1일
  
    const results = await StudyHeatmapLog.findAll({
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', col('id')), 'count'],
      ],
      where: {
        user_id: userId,
        created_at: {
          [Op.between]: [startDate, endDate],
        },
      },
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true,
    });
    //console.log('userService : ', results);
    // count를 숫자형으로 변환해서 반환
    const parsed = results.map(item => ({
      date: item.date,
      count: Number(item.count),
    }));
    return parsed; // [{ date: '2025-04-02', count: 2 }, ...]
  };
}


module.exports = new UserService(); 