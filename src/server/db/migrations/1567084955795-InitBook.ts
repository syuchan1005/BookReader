/* eslint-disable import/prefer-default-export,class-methods-use-this */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitBook1567084955795 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query('CREATE TABLE "book" ("id" varchar PRIMARY KEY NOT NULL, "thumbnail" varchar NOT NULL, "number" integer NOT NULL, "pages" integer NOT NULL, "infoId" varchar)');
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query('DROP TABLE IF EXISTS "book"');
  }
}
