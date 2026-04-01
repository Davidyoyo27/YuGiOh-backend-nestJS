import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsString, Matches, Min } from "class-validator";
import { DuelResult } from "src/common/utils/duel-result";

export class AddStatisticsPlayerDto {

    @IsInt()
    @Min(1)
    @IsNotEmpty({ message: 'Debe ingresar un valor a la cantidad.' })
    amount: number;

    @IsDateString()
    @IsNotEmpty({ message: 'La fecha de los duelos no puede estar vacia.' })
    date: Date;

    @IsString()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)\.(\d{3})$/, 
         //  /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(\.\d{3})?$/
        { message: 'La hora debe ser en formato HH:mm:ss.SSS (24h formato)'
    })
    @IsNotEmpty({ message: 'La hora correspondiente a la fecha no puede estar vacia.' })
    time: string;

    @IsInt()
    @Min(1)
    @IsNotEmpty({ message: 'Debe seleccionar al oponente para poder ingresar los registros.' })
    playerOpponent: number;

    @IsEnum(DuelResult, {
        message: 'El campo "resultado del duelo" es inválido.'
    })
    duelResult: DuelResult;

    @IsString()
    @IsNotEmpty({ message: 'Debe ingresar una razón del porqué está ejecutando esta acción.' })
    reason: string;

}
