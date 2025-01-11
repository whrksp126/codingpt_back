module.exports = (sequelize, DataTypes) => {
  const Streak = sequelize.define('Streak', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATEONLY, // 연속 학습 시작 날짜
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATEONLY, // 연속 학습 종료 날짜
      allowNull: false,
    },
    streak_count: {
      type: DataTypes.INTEGER, // 연속 학습 일수
      allowNull: false,
    },
  });
  Streak.associate = (models) => {
    Streak.belongsTo(models.User, { foreignKey: 'user_id' });
  };
  return Streak;
};
