import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserType } from "./user-type.entity";

@Entity()
export class User {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'text',
        unique: true
    })
    email: string;

    @Column('text')
    password: string;

    @Column('text')
    name: string;

    @Column({
        type: 'text',
        nullable: true,
    })
    lastName: string | null;

    @Column({
        type: 'text',
        unique: true,
        nullable: true,
    })
    nickName: string | null;

    @Column({
        type: 'bool',
        default: false
    })
    isActive: boolean;

    @Column({ 
        type: 'timestamp', 
        default: () => 'CURRENT_TIMESTAMP' 
    })
    date_created: Date;

    // relacion
    @ManyToOne(
        () => UserType,
        (userType) => userType.userRelation,
        { cascade: true, eager: true }
    )
    typeUser: UserType;

}