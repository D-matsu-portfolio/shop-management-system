const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// Supabaseの接続文字列は、プロジェクトの「Project Settings」>「Database」>「Connection string」から取得できます。
// それをRenderの環境変数 `DATABASE_URL` に設定してください。
const connectionConfig = isProduction
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false, // Supabaseへの接続にSSLが必要な場合に備える
      },
    }
  : {
      // ローカル開発用の.envファイルからの設定
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    };

const pool = new Pool(connectionConfig);

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool, // Export the pool object for transactions
};
