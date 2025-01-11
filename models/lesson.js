module.exports = (sequelize, DataTypes) => {
  const Lesson = sequelize.define('Lesson', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  });
  Lesson.associate = (models) => {
    Lesson.belongsTo(models.Stage, { foreignKey: 'stage_id' });
    Lesson.hasMany(models.Problem, { foreignKey: 'lesson_id', onDelete: 'CASCADE' });
  };
  return Lesson;
};
