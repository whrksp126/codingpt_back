# 📁 프로젝트 구조 설명서

## 🏗️ 전체 아키텍처

```
codingpt_back/
├── 📁 config/          # 설정 파일들
├── 📁 controllers/     # 요청/응답 처리
├── 📁 docs/           # 프로젝트 문서
├── 📁 middlewares/    # 미들웨어 (로깅, 에러 처리)
├── 📁 models/         # 데이터베이스 모델
├── 📁 routes/         # API 라우트 정의
├── 📁 scripts/        # 자동화 스크립트
├── 📁 services/       # 비즈니스 로직
├── 📁 tests/          # 테스트 코드
├── 📁 utils/          # 공통 유틸리티
├── 📄 app.js          # 메인 애플리케이션
├── 📄 package.json    # 프로젝트 설정
└── 📄 README.md       # 프로젝트 소개
```

## 📂 폴더별 상세 설명

### 🔧 config/ - 설정 관리
**역할**: 애플리케이션 설정과 데이터베이스 연결 설정

#### 📄 config.json
- 환경별 설정값 (개발/스테이징/프로덕션)
- 데이터베이스 연결 정보
- API 키 및 외부 서비스 설정

#### 📄 database.js
- Sequelize ORM 설정
- 데이터베이스 연결 관리
- 마이그레이션 설정

### 🎮 controllers/ - 요청/응답 처리
**역할**: HTTP 요청을 받아서 서비스를 호출하고 응답을 반환

#### 📄 userController.js
```javascript
// 사용자 관련 API 처리
- createUser()     // 사용자 생성
- getAllUsers()    // 모든 사용자 조회
- getUserById()    // 특정 사용자 조회
- updateUser()     // 사용자 정보 수정
- deleteUser()     // 사용자 삭제
- updateUserXp()   // XP 업데이트
- updateUserHeart() // 하트 업데이트
```

#### 📄 productController.js
```javascript
// 제품 관련 API 처리
- createProduct()      // 제품 생성
- getAllProducts()     // 모든 제품 조회
- getProductById()     // 특정 제품 조회
- updateProduct()      // 제품 수정
- deleteProduct()      // 제품 삭제
- getProductsByType()  // 타입별 제품 조회
- getProductClasses()  // 제품별 클래스 조회
```

#### 📄 classController.js
```javascript
// 클래스 관련 API 처리
- createClass()        // 클래스 생성
- getAllClasses()      // 모든 클래스 조회
- getClassById()       // 특정 클래스 조회
- updateClass()        // 클래스 수정
- deleteClass()        // 클래스 삭제
- getClassProducts()   // 클래스별 제품 조회
- getClassCurriculums() // 클래스별 커리큘럼 조회
```

### 📚 docs/ - 프로젝트 문서
**역할**: 개발자들을 위한 참고 자료

#### 📄 project-structure.md (현재 파일)
- 프로젝트 구조 설명
- 각 폴더와 파일의 역할
- 개발 가이드

### 🔌 middlewares/ - 미들웨어
**역할**: 요청이 컨트롤러에 도달하기 전에 실행되는 함수들

#### 📄 logger.js
```javascript
// 요청 로깅 미들웨어
- 요청 시간, 메서드, URL, 상태 코드 기록
- 응답 시간 측정
- 에러 로깅
```

#### 📄 errorHandler.js
```javascript
// 에러 처리 미들웨어
- Sequelize 에러 처리
- 유효성 검사 에러
- 데이터베이스 연결 에러
- 일반 서버 에러
```

### 🗄️ models/ - 데이터베이스 모델
**역할**: Sequelize ORM을 사용한 데이터베이스 테이블 정의

#### 📄 user.js
```javascript
// 사용자 테이블 모델
- id, email, google_id, refresh_token
- nickname, profile_img, xp, heart
- created_at
```

#### 📄 product.js
```javascript
// 제품 테이블 모델
- id, name, description, type
- price, lecture_intro
```

#### 📄 class.js
```javascript
// 클래스 테이블 모델
- id, name, description
```

#### 📄 index.js
```javascript
// 모델 관계 설정
- User.hasMany(Review)
- Product.belongsToMany(Class)
- Class.belongsToMany(Product)
```

### 🛣️ routes/ - API 라우트
**역할**: URL 경로와 HTTP 메서드를 컨트롤러 함수와 연결

#### 📄 userRoutes.js
```javascript
// 사용자 관련 라우트
POST   /api/users              // 사용자 생성
GET    /api/users              // 모든 사용자 조회
GET    /api/users/:id          // 특정 사용자 조회
PUT    /api/users/:id          // 사용자 수정
DELETE /api/users/:id          // 사용자 삭제
PATCH  /api/users/:id/xp      // XP 업데이트
PATCH  /api/users/:id/heart   // 하트 업데이트
```

#### 📄 productRoutes.js
```javascript
// 제품 관련 라우트
POST   /api/products           // 제품 생성
GET    /api/products           // 모든 제품 조회
GET    /api/products/:id       // 특정 제품 조회
PUT    /api/products/:id       // 제품 수정
DELETE /api/products/:id       // 제품 삭제
GET    /api/products/type/:type // 타입별 제품 조회
```

#### 📄 classRoutes.js
```javascript
// 클래스 관련 라우트
POST   /api/classes            // 클래스 생성
GET    /api/classes            // 모든 클래스 조회
GET    /api/classes/:id        // 특정 클래스 조회
PUT    /api/classes/:id        // 클래스 수정
DELETE /api/classes/:id        // 클래스 삭제
```

#### 📄 index.js
```javascript
// 라우트 통합 관리
- 모든 라우트를 하나로 묶어서 관리
- API 버전 관리
```

### 🔧 scripts/ - 자동화 스크립트
**역할**: 반복적인 작업을 자동화하는 스크립트들

#### 예시 스크립트들:
```javascript
// scripts/seed.js - 초기 데이터 삽입
// scripts/backup.js - 데이터 백업
// scripts/migrate.js - 데이터베이스 마이그레이션
// scripts/setup.js - 개발 환경 설정
```

### 🎯 services/ - 비즈니스 로직
**역할**: 복잡한 비즈니스 로직을 처리하는 계층

#### 📄 userService.js
```javascript
// 사용자 비즈니스 로직
class UserService {
  async createUser(userData) {
    // 이메일 중복 확인
    // 필수 필드 검증
    // 사용자 생성
    // 환영 이메일 발송
  }
  
  async updateUser(id, updateData) {
    // 사용자 존재 확인
    // 이메일 중복 확인
    // 데이터 업데이트
  }
}
```

#### 📄 productService.js
```javascript
// 제품 비즈니스 로직
class ProductService {
  async createProduct(productData) {
    // 필수 필드 검증
    // 가격 검증
    // 제품 생성
  }
  
  async getProductById(id) {
    // 제품 조회
    // 리뷰 포함
    // 사용자 정보 포함
  }
}
```

#### 📄 classService.js
```javascript
// 클래스 비즈니스 로직
class ClassService {
  async createClass(classData) {
    // 필수 필드 검증
    // 이름 중복 확인
    // 클래스 생성
  }
  
  async addSectionToClass(classId, sectionId) {
    // 클래스 존재 확인
    // 섹션 존재 확인
    // 관계 설정
  }
}
```

### 🧪 tests/ - 테스트 코드
**역할**: 코드 품질을 보장하는 테스트들

#### 테스트 종류:
```javascript
// tests/userService.test.js - 서비스 단위 테스트
// tests/api/users.test.js - API 통합 테스트
// tests/models/user.test.js - 모델 테스트
```

### 🛠️ utils/ - 공통 유틸리티
**역할**: 여러 곳에서 재사용되는 공통 함수들

#### 📄 response.js
```javascript
// 응답 포맷팅 유틸리티
const successResponse = (res, data, message, statusCode) => {
  // 성공 응답 포맷
};

const errorResponse = (res, error, statusCode) => {
  // 에러 응답 포맷
};

const paginatedResponse = (res, data, page, limit, total) => {
  // 페이지네이션 응답 포맷
};
```

## 🔄 데이터 흐름

### 1. 요청 처리 흐름
```
클라이언트 요청
    ↓
미들웨어 (로깅, 보안, 검증)
    ↓
라우트 (URL 매칭)
    ↓
컨트롤러 (요청/응답 처리)
    ↓
서비스 (비즈니스 로직)
    ↓
모델 (데이터베이스 작업)
    ↓
응답 반환
```

### 2. 계층별 역할
```
Controller (요청/응답)
    ↓
Service (비즈니스 로직)
    ↓
Model (데이터베이스)
```

## 🎯 개발 가이드

### 새로운 기능 추가 시:
1. **모델**: 데이터베이스 테이블 정의
2. **서비스**: 비즈니스 로직 구현
3. **컨트롤러**: API 엔드포인트 구현
4. **라우트**: URL 경로 설정
5. **테스트**: 기능 검증

### 코드 작성 원칙:
- **단일 책임**: 각 파일은 하나의 역할만
- **의존성 분리**: 계층 간 의존성 최소화
- **재사용성**: 공통 로직은 utils로 분리
- **테스트 가능**: 테스트하기 쉬운 구조

## 📊 API 엔드포인트 요약

### Users API
- `POST /api/users` - 사용자 생성
- `GET /api/users` - 모든 사용자 조회
- `GET /api/users/:id` - 특정 사용자 조회
- `PUT /api/users/:id` - 사용자 수정
- `DELETE /api/users/:id` - 사용자 삭제
- `PATCH /api/users/:id/xp` - XP 업데이트
- `PATCH /api/users/:id/heart` - 하트 업데이트

### Products API
- `POST /api/products` - 제품 생성
- `GET /api/products` - 모든 제품 조회
- `GET /api/products/:id` - 특정 제품 조회
- `PUT /api/products/:id` - 제품 수정
- `DELETE /api/products/:id` - 제품 삭제
- `GET /api/products/type/:type` - 타입별 제품 조회

### Classes API
- `POST /api/classes` - 클래스 생성
- `GET /api/classes` - 모든 클래스 조회
- `GET /api/classes/:id` - 특정 클래스 조회
- `PUT /api/classes/:id` - 클래스 수정
- `DELETE /api/classes/:id` - 클래스 삭제

## 🚀 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 서버 실행
npm start

# 테스트 실행
npm test
```

---

이 문서는 프로젝트의 구조와 각 구성 요소의 역할을 이해하는 데 도움이 됩니다. 새로운 개발자가 프로젝트에 참여할 때 참고할 수 있는 가이드입니다. 