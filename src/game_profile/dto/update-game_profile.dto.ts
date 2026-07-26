import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";

export class UpdateGameProfileDto {

    @IsString()
    @IsOptional()
    @IsNotEmpty({ message: 'Debe ingresar un apodo.' })
    @Transform(({ value }) => value?.trim() || null)
    nickName: string;

}
