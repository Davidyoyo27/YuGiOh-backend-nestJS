import { IsBoolean } from "class-validator";

export class UpdateUserByAdminDto {

    @IsBoolean()
    isActive: boolean;

}
