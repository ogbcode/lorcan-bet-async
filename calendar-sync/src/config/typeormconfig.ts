import { TypeOrmModuleOptions } from '@nestjs/typeorm';
require('dotenv').config();

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  // url: process.env.POSTGRES_URL,
  // migrations: [__dirname + '/../database/migrations/*{.ts,.js}'], // Migration files directory
  extra: {
    charset: 'utf8mb4_unicode_ci',
  },
  synchronize:true, // Auto-create database tables based on entities (not recommended for production)
  autoLoadEntities: true, // Automatically load entity files
  logging: false, // Disable logging SQL queries
 
};
