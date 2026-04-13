import { MigrationInterface, QueryRunner } from "typeorm";

// RECORDAR: los migrations son los indices agregados a las tablas o querys en BD
// y el porque se agregan aca y no directamente en la BD es para tener un un RESPALDO 
// de que y cuando se agregaron estos
export class AddIndexesUserDuelGame1775681351993 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX idx_udg_game_profile_id
            ON user_duel_game("gameProfileId");
        `);

        await queryRunner.query(`
            CREATE INDEX idx_udg_game_profile_id_result
            ON user_duel_game("gameProfileId", result);
        `);

        await queryRunner.query(`
            CREATE INDEX idx_udg_duel_game_id 
            ON user_duel_game("duelGameId");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_udg_game_profile_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_udg_game_profile_id_result`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_udg_duel_game_id`);
    }

}
