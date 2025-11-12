import {
    IsEmail, IsNotEmpty, IsOptional, IsString,
    MinLength, Matches
} from "class-validator";
import { Match } from "../decorators/match.decorator";
import { IsOnlyLetters } from "../decorators/only-letters.decorator";
import { Transform } from "class-transformer";

export class CreateUserDto {

    @IsEmail(
        {
            require_tld: true,
            allow_display_name: true,
        },
        { message: 'Debe ingresar un correo valido' }
    )
    email: string;

    @MinLength(6, { message: 'La contraseña debe tener minimo 6 caracteres' })
    @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
        message: 'La contraseña debe contener al menos una letra mayúscula y un número',
    })
    @IsNotEmpty({ message: 'Debe ingresar una contraseña' })
    password: string;

    @Match('password', { message: 'Las contraseñas no coinciden' })
    passwordConfirm: string;

    @IsString()
    @IsNotEmpty({ message: 'Debe ingresar un nombre' })
    @IsOnlyLetters('El nombre solo puede contener letras')
    // @Match('^[A-Za-zÁÉÍÓÚáéíóúÑñ]+$')
    name: string;

    @IsString()
    @IsOptional()
    @IsOnlyLetters('El apellido solo puede contener letras')
    @Transform(({ value }) => value?.trim() || null)
    lastName?: string;

    @IsString()
    @IsOptional()
    nickName?: string;

}
