module.exports = (sequelize, DataTypes) => {
  const Problem = sequelize.define('Problem', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    options: {
      type: DataTypes.JSON,
    },
    answer: {
      type: DataTypes.JSON,
    },
    explanation: {
      type: DataTypes.TEXT,
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  });
  Problem.associate = (models) => {
    Problem.belongsTo(models.Lesson, { foreignKey: 'lesson_id' });
  };
  return Problem;
};
