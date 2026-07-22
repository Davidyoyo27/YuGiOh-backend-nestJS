import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { IsOnlyLetters } from "../decorators/only-letters.decorator";
import { Transform } from "class-transformer";

export class UpdateUserDto {

    @IsString()
    @IsOptional()
    @IsOnlyLetters('El nombre solo puede contener letras.')
    @IsNotEmpty({ message: 'Debe ingresar un nombre.' })
    name?: string;

    @IsString()
    @IsOptional()
    @IsOnlyLetters('El apellido solo puede contener letras.')
    @Transform(({ value }) => value?.trim() || null)
    lastName?: string;

}
