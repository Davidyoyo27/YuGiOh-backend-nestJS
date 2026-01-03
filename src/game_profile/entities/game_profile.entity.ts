import { User } from "src/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, 
    OneToOne, PrimaryGeneratedColumn, UpdateDateColumn 
} from "typeorm";

@Entity()
export class GameProfile {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'text',
        unique: true,
        nullable: true
    })
    nickName?: string | null;

    @Column({
        type: 'text',
        nullable: true
    })
    avatarImage?: string;

    @CreateDateColumn()
    createdAt: Date;

    // con @UpdateDateColumn se dispara de manera automatica
    //  cuando se realiza un .save() o un .update()
    @UpdateDateColumn()
    // “última versión válida del registro”
    updatedAt?: Date;

    // relacion
    // la relacion uno a uno parte de aca porque es el gameProfile el que extrae los datos del User
    // y tambien un User puede existir sin un gameProfile pero un gameProfile sin el User NO ES POSIBLE
    @OneToOne(
        () => User,
        (user) => user.gameProfile,
        { onDelete: 'CASCADE', eager: true }
    )
    @JoinColumn()  // OBLIGATORIO en relaciones 1:1, esto para que reconosca donde vive la clave foranea
    user: User;

}
