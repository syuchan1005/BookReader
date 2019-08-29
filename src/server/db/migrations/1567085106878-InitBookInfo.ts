/* eslint-disable import/prefer-default-export,class-methods-use-this */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitBookInfo1567085106878 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query('CREATE TABLE "book_info" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "thumbnail" varchar NOT NULL)');
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query('DROP TABLE IF EXISTS "book_info"');
  }
}
