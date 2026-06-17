import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../entities/user.entity";

// tabla que almacena los tokens para realizar los cambios 
// de contraseñas de las cuentas de los usuarios
@Entity()
export class TokenReset {

    @PrimaryGeneratedColumn()
    id!: number;

    @Index() // mejora busqueda por token
    @Column({
        type: 'text',
        unique: true,
        nullable: true,
    })
    token!: string | null;

    @Column({
        type: 'timestamp',
        precision: 6,
        nullable: false,
    })
    expirationToken!: Date;

    // campo para verificar cuando fue usado en token
    @Column({
        type: 'timestamp',
        precision: 6,
        nullable: true,
    })
    usedToken: Date;

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
    user!: User;

}