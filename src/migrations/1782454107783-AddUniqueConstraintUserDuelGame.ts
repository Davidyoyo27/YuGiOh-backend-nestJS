import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqueConstraintUserDuelGame1782454107783 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE user_duel_game 
            ADD CONSTRAINT uq_udg_duel_game_profile 
            UNIQUE ("duelGameId", "gameProfileId");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE user_duel_game 
            DROP CONSTRAINT IF EXISTS uq_udg_duel_game_profile;
        `);
    }

}
