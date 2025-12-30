import { IsOptional, IsString } from "class-validator";
import { IsNickNameUnique } from "../decorators/validators/is-nickname-unique.validator";

export class CreateGameProfileDto {

    @IsString()
    @IsOptional()
    @IsNickNameUnique()
    nickName?: string;

}
