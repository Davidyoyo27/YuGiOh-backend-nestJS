import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CancelDuelDto {

    @Transform(({ value }) => value?.trim())
    @IsString()
    @MaxLength(200, { message: 'El motivo no puede superar los 200 caracteres.' })
    @IsNotEmpty({ message: 'Debe indicara el motivo de la cancelación.' })
    cancelReason: string;

}