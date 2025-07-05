module.exports = (sequelize, DataTypes) => {
    const ProductReviewMap = sequelize.define('ProductReviewMap', {
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      review_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
    }, {
      tableName: 'product_review_map',
      timestamps: false,
    });
  
    ProductReviewMap.associate = (models) => {
      ProductReviewMap.belongsTo(models.Product, { foreignKey: 'product_id' });
      ProductReviewMap.belongsTo(models.Review, { foreignKey: 'review_id' });
    };
  
    return ProductReviewMap;
  };