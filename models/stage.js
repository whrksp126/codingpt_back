module.exports = (sequelize, DataTypes) => {
  const Stage = sequelize.define('Stage', {
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
  Stage.associate = (models) => {
    Stage.belongsTo(models.Unit, { foreignKey: 'unit_id' });
    Stage.hasMany(models.Lesson, { foreignKey: 'stage_id', onDelete: 'CASCADE' });
  };
  return Stage;
};
