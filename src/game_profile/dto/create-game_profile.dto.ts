import { IsNotEmpty } from "class-validator";
import { IsNickNameUnique } from "../decorators/validators/is-nickname-unique.validator";
import { Transform } from "class-transformer";

export class CreateGameProfileDto {

    // @IsString()
    @IsNickNameUnique()
    @IsNotEmpty({ message: 'Debe ingresar un apodo.' })
    @Transform(({ value }) => value?.trim() || null)
    nickName: string;
    
}
