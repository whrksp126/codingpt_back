module.exports = (sequelize, DataTypes) => {
  const Section = sequelize.define('Section', {
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
  Section.associate = (models) => {
    Section.belongsTo(models.Curriculum, { foreignKey: 'curriculum_id' });
    Section.hasMany(models.Unit, { foreignKey: 'section_id', onDelete: 'CASCADE' });
  };
  return Section;
};
