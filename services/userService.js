const { User } = require('../models');
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
    try{
      try {
        const ticket = await client.verifyIdToken({
          idToken,
          audience: GOOGLE_WEB_CLIENT_ID,
        });
        let payload;
        try {
          payload = ticket.getPayload();
        } catch (payloadError) {
          console.error('getPayload() 오류:', payloadError);
          // ticket이 직접 payload인 경우
          if (ticket.sub || ticket.email) {
            payload = ticket;
            console.log('ticket을 직접 payload로 사용');
          } else {
            throw new Error('토큰 페이로드를 추출할 수 없습니다.');
          }
        }
        
        const { sub: google_id, email, name } = payload;
        let foundUser = await User.findOne({ where: { email } });
        if(!foundUser) {
          // 새 사용자 생성 시 임시 refresh_token 설정
          const tempRefreshToken = jwt.sign(
            { email, google_id }, 
            REFRESH_SECRET, 
            { expiresIn: '30d' }
          );
          
          foundUser = await User.create({
            email,
            nickname: name,
            google_id,
            refresh_token: tempRefreshToken,
            created_at: new Date(),
          });
        }
        const accessToken = jwt.sign(
          { id: foundUser.id, email: foundUser.email }, 
          ACCESS_SECRET, 
          { expiresIn: '60' } // 확인차 60초 설정
        );
        const refreshToken = jwt.sign(
          { id: foundUser.id, email: foundUser.email}, 
          REFRESH_SECRET, 
          { expiresIn: '30d' }
        );

        await User.update({ refresh_token: refreshToken }, { where: { id: foundUser.id } });
        console.log("accessToken:", accessToken);
        console.log("refreshToken:", refreshToken);
        return { accessToken, refreshToken };
      } catch (verifyError) {
        console.error('🔍 Google ID 토큰 검증 상세 에러:', {
          name: verifyError.name,
          message: verifyError.message,
          code: verifyError.code,
          status: verifyError.status
        });
        
        throw verifyError;
      }
      // const { sub: google_id, email, name } = ticket.getPayload();
      // console.log('google_id:', google_id);
      // if(!email || !google_id) {
      //   throw new Error('Invalid Google token');
      // }

      // console.log('email:', email);
      

    } catch(err) {
      console.error('ID Token 검증 실패:', err);
      throw new Error('유효하지 않은 idToken입니다.');  
    }
  }

  // 엑세스 토큰 검증
  async verifyAccessToken(token) {
    try {
      console.log('----------------');
      const decoded = jwt.verify(token, ACCESS_SECRET);
      return decoded;
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new Error('토큰 만료됨');
      }
  
      console.error('JWT 검증 오류:', err.message);
      throw new Error('토큰 유효하지 않음');
    }
  }
  
  // 엑세스 토큰 재발급
  async refreshAccessToken(refreshToken) {
    if(!refreshToken) {
      throw new Error('refreshToken 없음');
    }
    try {
      const payload = jwt.verify(refreshToken, REFRESH_SECRET);

      const newAccessToken = jwt.sign(
        { id: payload.id, email: payload.email },
        ACCESS_SECRET,
        { expiresIn: '60' } // 확인차 60초 설정
      );

      return { accessToken: newAccessToken };

    } catch (err) {
      console.error('Refresh Token 검증 실패:', err);
      throw new Error('유효하지 않은 refreshToken입니다.');
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
    
    user.xp = xp;
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
}

module.exports = new UserService(); 