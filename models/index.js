const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
  }
);

const db = {};

// Program (최상위 레벨)
// Curriculum (예: JS 기초, HTML 기초, CSS 기초 등).
// Section (예: 변수 섹션, 함수 섹션).
// Unit (예: 변수 학습을 위한 여러 유닛)
// Stage (예: 레슨을 묶는 단위)
// Lesson (스테이지를 구성하는 가장 작은 학습 단위. 문제를 포함)
// Problem (각 레슨에서 제공되는 문제 데이터)


// models 폴더의 모든 모델 파일을 읽어서 Sequelize에 추가
fs.readdirSync(__dirname)
  .filter((file) => file !== 'index.js' && file.endsWith('.js'))
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// 모델 간 관계 설정
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});


db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;