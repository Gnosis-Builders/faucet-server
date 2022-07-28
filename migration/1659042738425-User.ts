import { MigrationInterface, QueryRunner } from 'typeorm';

export class User1659042738425 implements MigrationInterface {
  name = 'User1659042738425';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "walletAddresses" text NOT NULL, "ipAddress" varchar NOT NULL, "networks" text NOT NULL, "expiry" varchar NOT NULL, "twitterToken" varchar NOT NULL, "twitterSecret" varchar NOT NULL)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
