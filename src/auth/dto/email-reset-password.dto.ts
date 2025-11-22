import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class EmailResetPasswordDto {

    @IsString()
    @IsNotEmpty({ message: 'Debe introducir un correo.' })
    @IsEmail(
        {
            require_tld: true,
            allow_display_name: true,
        },
        { message: 'Debe ingresar un correo valido.' }
    )
    email: string;

}