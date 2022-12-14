import {MigrationInterface, QueryRunner} from "typeorm";

export class UsersLastNetwork1660752848505 implements MigrationInterface {
    name = 'UsersLastNetwork1660752848505'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "walletAddresses" text NOT NULL, "ipAddress" varchar NOT NULL, "networks" text NOT NULL, "expiry" varchar NOT NULL, "lastWalletAddress" varchar NOT NULL DEFAULT (''))`);
        await queryRunner.query(`INSERT INTO "temporary_user"("id", "walletAddresses", "ipAddress", "networks", "expiry", "lastWalletAddress") SELECT "id", "walletAddresses", "ipAddress", "networks", "expiry", "lastWalletAddress" FROM "user"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`ALTER TABLE "temporary_user" RENAME TO "user"`);
        await queryRunner.query(`CREATE TABLE "temporary_user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "walletAddresses" text NOT NULL, "ipAddress" varchar NOT NULL, "networks" text NOT NULL, "expiry" varchar NOT NULL, "lastWalletAddress" varchar NOT NULL DEFAULT (''), "lastNetwork" varchar NOT NULL DEFAULT (''))`);
        await queryRunner.query(`INSERT INTO "temporary_user"("id", "walletAddresses", "ipAddress", "networks", "expiry", "lastWalletAddress") SELECT "id", "walletAddresses", "ipAddress", "networks", "expiry", "lastWalletAddress" FROM "user"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`ALTER TABLE "temporary_user" RENAME TO "user"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" RENAME TO "temporary_user"`);
        await queryRunner.query(`CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "walletAddresses" text NOT NULL, "ipAddress" varchar NOT NULL, "networks" text NOT NULL, "expiry" varchar NOT NULL, "lastWalletAddress" varchar NOT NULL DEFAULT (''))`);
        await queryRunner.query(`INSERT INTO "user"("id", "walletAddresses", "ipAddress", "networks", "expiry", "lastWalletAddress") SELECT "id", "walletAddresses", "ipAddress", "networks", "expiry", "lastWalletAddress" FROM "temporary_user"`);
        await queryRunner.query(`DROP TABLE "temporary_user"`);
        await queryRunner.query(`ALTER TABLE "user" RENAME TO "temporary_user"`);
        await queryRunner.query(`CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "walletAddresses" text NOT NULL, "ipAddress" varchar NOT NULL, "networks" text NOT NULL, "expiry" varchar NOT NULL, "twitterToken" varchar NOT NULL, "twitterSecret" varchar NOT NULL, "lastWalletAddress" varchar NOT NULL DEFAULT (''), "twitterId" varchar NOT NULL DEFAULT (''))`);
        await queryRunner.query(`INSERT INTO "user"("id", "walletAddresses", "ipAddress", "networks", "expiry", "lastWalletAddress") SELECT "id", "walletAddresses", "ipAddress", "networks", "expiry", "lastWalletAddress" FROM "temporary_user"`);
        await queryRunner.query(`DROP TABLE "temporary_user"`);
    }

}
