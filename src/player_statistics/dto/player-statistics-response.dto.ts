import { Expose } from "class-transformer";

export class PlayerStatisticsResponseDto {

    @Expose()
    victories: number;

    @Expose()
    defeats: number;

    @Expose()
    ties: number;

    @Expose()
    canceled: number;

    @Expose()
    verifying: number;

    @Expose()
    totalDuelGames: number;

    @Expose()
    percentageVictories: number;

    @Expose()
    percentageDefeats: number;

    @Expose()
    percentageTies: number;
    
}
