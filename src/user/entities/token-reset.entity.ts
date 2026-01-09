import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

// tabla que almacena los tokens para realizar los cambios 
// de contraseñas de las cuentas de los usuarios
@Entity()
export class TokenReset {

    @PrimaryGeneratedColumn()
    id: number;

    @Index() // mejora busqueda por token
    @Column({
        type: 'text',
        unique: true,
    })
    token: string;

    @Column({
        type: 'timestamp',
        precision: 6,
        nullable: false,
    })
    expirationToken: Date;

    // relacion
    @ManyToOne(
        () => User,
        (user) => user.tokenReset,
        {
            // si borras un usuario, borra los token asociados a ese usuario, 
            // asi no quedan "huerfanos" los token en la tabla
            onDelete: 'CASCADE',
            // evitas traer datos del usuario
            eager: false,
        }
    )
    user: User;

}