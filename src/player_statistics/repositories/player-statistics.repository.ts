import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

@Injectable()
export class PlayerStatisticsRepository {
    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource,
    ) { }

    // llamada al SP/funcion en la BD
    async getStatisticsPlayer(profileId: number) {
        const result = await this.dataSource.query(
            'SELECT * FROM statisticsPlayer($1)',
            [profileId]
        );

        return result[0];
    }

    // llamada al SP/funcion en la BD
    async getStatisticsPlayerVSPlayer(profileId: number, playerId: number) {
        const result = await this.dataSource.query(
            'SELECT * FROM statisticsPlayerVsPlayer($1, $2)',
            [profileId, playerId]
        );

        return result[0];
    }

    // llamada al SP/funcion en la BD
    async getAllPlayers() {

        return await this.dataSource
            .createQueryBuilder()
            .select('*')
            .from('(SELECT * FROM getAllPlayers())', 'players')
            .getRawMany();
    }

    async lastsDuelsResultsByUser(profileId: number, hoursPerSession: number, months: number) {
        const result = await this.dataSource.query(
            'SELECT * FROM lastsDuelsResultsByUser($1, $2, $3)',
            [profileId, hoursPerSession, months]
        );

        return result;
    }

}