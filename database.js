const { sequelize } = require('./models');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공!');
  } catch (error) {
    console.error('데이터베이스 연결 실패:', error);
  }
})();