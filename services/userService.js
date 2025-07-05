const { User } = require('../models');

class UserService {
  // 사용자 생성 (복잡한 검증 로직 포함)
  async createUser(userData) {
    const { email, google_id, refresh_token, nickname, profile_img } = userData;
    
    // 1. 필수 필드 검증
    if (!email || !google_id || !refresh_token || !nickname) {
      throw new Error('필수 필드가 누락되었습니다.');
    }
    
    // 2. 이메일 중복 확인
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('이미 존재하는 이메일입니다.');
    }
    
    // 3. 사용자 생성
    const user = await User.create({
      email,
      google_id,
      refresh_token,
      nickname,
      profile_img: profile_img || null,
      created_at: new Date()
    });
    
    return user;
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