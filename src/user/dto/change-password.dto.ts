import {
    IsNotEmpty, MinLength, Matches
} from "class-validator";
import { Match } from "../decorators/match.decorator";

export class ChangeUserPasswordDto {

    @MinLength(6, { message: 'La contraseña debe tener minimo 6 caracteres' })
    @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
        message: 'La contraseña debe contener al menos una letra mayúscula y un número',
    })
    currentPassword: string;

    @MinLength(6, { message: 'La contraseña debe tener minimo 6 caracteres' })
    @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
        message: 'La contraseña debe contener al menos una letra mayúscula y un número',
    })
    @IsNotEmpty({ message: 'Debe ingresar una contraseña' })
    password: string;

    @Match('password', { message: 'Las contraseñas no coinciden' })
    passwordConfirm: string;

}
