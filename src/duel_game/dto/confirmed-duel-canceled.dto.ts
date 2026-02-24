import { IsBoolean, IsNotEmpty } from "class-validator";

export class ConfirmedDuelCanceledDto {

    @IsBoolean({ message: 'Se debe enviar la confirmación de la cancelación del duelo.' })
    @IsNotEmpty({ message: 'El valor no puede estar vacío.' })
    confirmationCanceledDuel: boolean;

}