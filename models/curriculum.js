module.exports = (sequelize, DataTypes) => {
  const Curriculum = sequelize.define('Curriculum', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  });
  Curriculum.associate = (models) => {
    Curriculum.belongsTo(models.Program, { foreignKey: 'program_id' });
    Curriculum.hasMany(models.Section, { foreignKey: 'curriculum_id', onDelete: 'CASCADE' });
  };
  return Curriculum;
};
