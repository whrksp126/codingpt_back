module.exports = (sequelize, DataTypes) => {
  const Unit = sequelize.define('Unit', {
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
  Unit.associate = (models) => {
    Unit.belongsTo(models.Section, { foreignKey: 'section_id' });
    Unit.hasMany(models.Stage, { foreignKey: 'unit_id', onDelete: 'CASCADE' });
  };
  return Unit;
};
