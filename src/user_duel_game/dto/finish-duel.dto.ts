import { Type } from "class-transformer";
import { IsArray, IsInt, IsNotEmpty, IsNumber, Min, ValidateNested } from "class-validator";

class PlayerResultDto {

    @IsNumber()
    @IsNotEmpty()
    profileId: number;

    @IsInt()
    @Min(0, { message: 'Los puntos de vida (LP) no pueden ser menores a 0.' })
    @IsNotEmpty()
    finalLP: number;

}

export class FinishDuelDto {

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PlayerResultDto)
    players: PlayerResultDto[];

}