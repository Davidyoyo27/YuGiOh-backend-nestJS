import { Expose } from "class-transformer";

// UserResponseDTO usado en admin al bloquear un usuario (isActive: false)
export class SuperAdminResponseDto {

    // solo los campos que tengan el @Expose seran los que se mostraran en el ResponseDTO
    @Expose()
    email: string;

    @Expose()
    name: string;

    @Expose()
    lastName: string;
    
}
