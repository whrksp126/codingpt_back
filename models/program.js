module.exports = (sequelize, DataTypes) => {
  const Program = sequelize.define('Program', {
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
  });
  Program.associate = (models) => {
    Program.hasMany(models.Curriculum, { foreignKey: 'program_id', onDelete: 'CASCADE' });
  };
  return Program;
};
