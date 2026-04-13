import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';

// archivo de configuracion para que las Migrations puedan funcionar
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT!,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
});
