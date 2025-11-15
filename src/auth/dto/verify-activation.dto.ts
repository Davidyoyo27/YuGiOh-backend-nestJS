import { IsNotEmpty, IsString } from "class-validator";

export class VerifyActivationDto {

    @IsString()
    @IsNotEmpty()
    emailOrNick: string;

    @IsString()
    @IsNotEmpty()
    codeActivation: string; 
    
}