import postgres from 'postgres';

// 환경 변수 또는 로컬 기본 PostgreSQL 연결 정보
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/marucompany';

// PostgreSQL 클라이언트 인스턴스 생성 (Max 10 커넥션 풀 제공)
const sql = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export async function initializeDatabase() {
  console.log('🔄 PostgreSQL 데이터베이스 스키마 검증 및 마이그레이션 기동...');
  
  try {
    // 1. Settings 테이블 생성
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        llm_type VARCHAR(50) NOT NULL,
        llm_url VARCHAR(255) NOT NULL,
        llm_model VARCHAR(255),
        telegram_token VARCHAR(255),
        chat_id VARCHAR(100),
        calendar_linked BOOLEAN DEFAULT TRUE,
        brain_path VARCHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 2. Chat Messages 테이블 생성
    await sql`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id VARCHAR(100) PRIMARY KEY,
        sender VARCHAR(50) NOT NULL,
        sender_name VARCHAR(100) NOT NULL,
        text TEXT NOT NULL,
        timestamp VARCHAR(100) NOT NULL
      )
    `;

    // 3. Transactions 테이블 생성
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(100) PRIMARY KEY,
        item VARCHAR(255) NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        time VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL
      )
    `;

    // 4. Activity Logs 테이블 생성
    await sql`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('✅ 데이터베이스 스키마 검증 완료. 4대 핵심 테이블(settings, chat_messages, transactions, activity_logs)이 안전하게 확보되었습니다.');
  } catch (error) {
    console.error('❌ 데이터베이스 스키마 생성 중 치명적인 장애가 감지되었습니다:', error);
    console.log('💡 안내: PostgreSQL 서버가 실행 중이며 로컬 포트 5432가 열려있는지 확인해 주세요. (미구동 시 프론트엔드는 Graceful Fallback 모드로 안전하게 작동합니다.)');
  }
}

export default sql;
