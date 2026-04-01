import { Expose } from "class-transformer";

export class GetAllPlayersResponseDto {

    @Expose()
    nickName: string;

    @Expose()
    victories: number;

    @Expose()
    defeats: number;

    @Expose()
    ties: number;

    @Expose()
    canceleds: number;

    @Expose()
    verifiyings: number;

    @Expose()
    totalGames: number;

}
