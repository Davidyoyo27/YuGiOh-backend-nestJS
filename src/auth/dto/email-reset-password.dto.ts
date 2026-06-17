import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class EmailResetPasswordDto {

    @IsString()
    @IsEmail(
        {
            require_tld: true,
            allow_display_name: true,
        },
        { message: 'Debe ingresar un correo válido.' }
    )
    @IsNotEmpty({ message: 'Debe introducir un correo.' })
    email: string;

}