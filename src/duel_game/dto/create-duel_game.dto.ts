import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";
import { IsRoomNameUnique } from "../decorators/validators/is-room-name-unique.validator";

export class CreateDuelGameDto {

    @IsString()
    @IsNotEmpty({ message: 'Debe ingresar un nombre para la sala.' })
    @MaxLength(50, { message: 'El nombre de la sala no puede superar los 50 caracteres.' })
    @IsRoomNameUnique()
    roomName: string;

    @IsOptional()
    @IsNumber()
    playersNumber: number;

    @IsNotEmpty({ message: 'Debe ingresar el tipo de Duelo' })
    @IsNumber()
    typeDuel: number;

}
