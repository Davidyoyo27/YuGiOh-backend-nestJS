import { IsNotEmpty, IsString } from "class-validator";

export class VerifyActivationDto {

    @IsString()
    @IsNotEmpty({ message: 'Debe introducir un Email o Nick' })
    emailOrNick: string;

    @IsString()
    @IsNotEmpty({ message: 'Debe introducir un codigo de activacion' })
    codeActivation: string; 
    
}