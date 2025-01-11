module.exports = (sequelize, DataTypes) => {
  const StudyLog = sequelize.define('StudyLog', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    curriculum_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    lesson_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    study_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER, // 학습 시간 (분 단위)
      allowNull: false,
    },
    is_completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });
  StudyLog.associate = (models) => {
    StudyLog.belongsTo(models.User, { foreignKey: 'user_id' });
    StudyLog.belongsTo(models.Curriculum, { foreignKey: 'curriculum_id' });
    StudyLog.belongsTo(models.Lesson, { foreignKey: 'lesson_id' });
  };
  return StudyLog;
};
