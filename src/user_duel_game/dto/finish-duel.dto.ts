import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsNumber, Min, ValidateNested } from "class-validator";

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
    @ArrayMinSize(2, { message: 'El duelo debe tener dos jugadores para poder finalizar.' })
    @ArrayMaxSize(2, { message: 'El duelo no puede tener mas de dos jugadores.' })
    @ValidateNested({ each: true })
    @Type(() => PlayerResultDto)
    players: PlayerResultDto[];

}