import { IsString, MinLength, IsNotEmpty, Matches } from "class-validator";

export class ResetPasswordDto {

    @IsNotEmpty()
    @IsString()
    token: string;

    @MinLength(6, { message: 'La contraseña debe tener minimo 6 caracteres.' })
    @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
        message: 'La contraseña debe contener al menos una letra mayúscula y un número.',
    })
    @IsNotEmpty({ message: 'Debe ingresar una contraseña.' })
    @Matches(/^\S+$/, {
        message: 'La contraseña no puede contener espacios.',
    })
    newPassword: string;

}
