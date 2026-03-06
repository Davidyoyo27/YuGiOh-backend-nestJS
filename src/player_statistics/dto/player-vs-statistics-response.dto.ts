import { Expose } from "class-transformer";

export class PlayerVsStatisticsResponseDto {

    @Expose()
    totalDuels: number;

    @Expose()
    winsPlayer1: number;

    @Expose()
    winsPlayer2: number;

    @Expose()
    ties: number;

    @Expose()
    percentagePlayer1: number;

    @Expose()
    percentagePlayer2: number;
    
}
