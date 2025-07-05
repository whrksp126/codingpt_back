module.exports = (sequelize, DataTypes) => {
  const StoreCategory = sequelize.define('StoreCategory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'storecategory',
    timestamps: false,
  });

  StoreCategory.associate = (models) => {
    StoreCategory.hasMany(models.StoreCategoryProductMap, { foreignKey: 'category_id' });
  };

  return StoreCategory;
};
