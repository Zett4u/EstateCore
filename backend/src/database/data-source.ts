import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from backend folder or root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
if (!process.env.DB_NAME) {
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
}

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3307', 10),
  username: process.env.DB_USERNAME || 'estatecore_user',
  password: process.env.DB_PASSWORD || 'estatecore_secure_pass_2026',
  database: process.env.DB_NAME || 'estatecore_db',
  entities: [path.join(__dirname, '/../**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '/migrations/*{.ts,.js}')],
  synchronize: false, // Migrations are used as required by the specification
  logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : false,
});
