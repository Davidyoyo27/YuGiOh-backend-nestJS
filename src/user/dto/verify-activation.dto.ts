import { IsNotEmpty, IsString } from "class-validator";

export class VerifyActivationDto {

    @IsString()
    @IsNotEmpty({ message: 'Debe introducir un Email.' })
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'Debe introducir un código de activación.' })
    codeActivation: string; 
    
}