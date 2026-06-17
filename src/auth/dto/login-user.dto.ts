import { IsEmail, IsNotEmpty, MinLength, Matches } from "class-validator";

export class LoginUserDto {

    @IsEmail(
        {
            require_tld: true,
            allow_display_name: true,
        },
        { message: 'Debe ingresar un correo válido.' }
    )
    email: string;

    @MinLength(6, { message: 'La contraseña debe tener mínimo 6 caracteres.' })
    @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
        message: 'La contraseña debe contener al menos una letra mayúscula y un número.',
    })
    @IsNotEmpty({ message: 'Debe ingresar una contraseña.' })
    password: string;

}
