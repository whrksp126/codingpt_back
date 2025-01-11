module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    current_hearts: {
      type: DataTypes.INTEGER,
      defaultValue: 5, // 기본값: 5개
    },
    max_hearts: {
      type: DataTypes.INTEGER,
      defaultValue: 5, // 최대 하트 수
    },
    next_heart_time: {
      type: DataTypes.DATE, // 다음 하트 생성 시간
    },
    auto_generate_interval: {
      type: DataTypes.INTEGER, // 하트 자동 생성 간격 (분 단위)
      defaultValue: 60, // 기본값: 60분
    },
  });
  return User;
};
