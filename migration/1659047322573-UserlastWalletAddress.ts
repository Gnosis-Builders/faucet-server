import {MigrationInterface, QueryRunner} from "typeorm";

export class UserlastWalletAddress1659047322573 implements MigrationInterface {
    name = 'UserlastWalletAddress1659047322573'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "walletAddresses" text NOT NULL, "ipAddress" varchar NOT NULL, "networks" text NOT NULL, "expiry" varchar NOT NULL, "twitterToken" varchar NOT NULL, "twitterSecret" varchar NOT NULL, "lastWalletAddress" varchar NOT NULL DEFAULT (''))`);
        await queryRunner.query(`INSERT INTO "temporary_user"("id", "walletAddresses", "ipAddress", "networks", "expiry", "twitterToken", "twitterSecret") SELECT "id", "walletAddresses", "ipAddress", "networks", "expiry", "twitterToken", "twitterSecret" FROM "user"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`ALTER TABLE "temporary_user" RENAME TO "user"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" RENAME TO "temporary_user"`);
        await queryRunner.query(`CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "walletAddresses" text NOT NULL, "ipAddress" varchar NOT NULL, "networks" text NOT NULL, "expiry" varchar NOT NULL, "twitterToken" varchar NOT NULL, "twitterSecret" varchar NOT NULL)`);
        await queryRunner.query(`INSERT INTO "user"("id", "walletAddresses", "ipAddress", "networks", "expiry", "twitterToken", "twitterSecret") SELECT "id", "walletAddresses", "ipAddress", "networks", "expiry", "twitterToken", "twitterSecret" FROM "temporary_user"`);
        await queryRunner.query(`DROP TABLE "temporary_user"`);
    }

}
