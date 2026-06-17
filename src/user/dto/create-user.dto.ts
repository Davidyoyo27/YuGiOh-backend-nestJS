import {
    IsEmail, IsNotEmpty, IsOptional, IsString,
    MinLength, Matches
} from "class-validator";
import { Match } from "../decorators/match.decorator";
import { IsOnlyLetters } from "../decorators/only-letters.decorator";
import { Transform } from "class-transformer";
import { IsEmailUnique } from "../decorators/validators/is-email-unique.validator"

export class CreateUserDto {

    @IsString()
    @IsOnlyLetters('El nombre solo puede contener letras.')
    @IsNotEmpty({ message: 'Debe ingresar un nombre.' })
    name: string;

    @IsString()
    @IsOptional()
    @IsOnlyLetters('El apellido solo puede contener letras.')
    @Transform(({ value }) => value?.trim() || null)
    lastName?: string;

    @IsEmail(
        {
            require_tld: true,
            allow_display_name: true,
        },
        { message: 'Debe ingresar un correo válido.' }
    )
    @IsEmailUnique()
    email: string;

    @MinLength(6, { message: 'La contraseña debe tener mínimo  6 caracteres.' })
    @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
        message: 'La contraseña debe contener al menos una letra mayúscula y un número.',
    })
    @IsNotEmpty({ message: 'Debe ingresar una contraseña.' })
    @Matches(/^\S+$/, {
        message: 'La contraseña no puede contener espacios.',
    })
    password: string;

    @Match('password', { message: 'Las contraseñas no coinciden.' })
    @Matches(/^\S+$/, {
        message: 'La contraseña no puede contener espacios.',
    })
    passwordConfirm: string;

}
