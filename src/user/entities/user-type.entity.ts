import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity()
export class UserType {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        type: 'text',
        unique: true
    })
    typeName!: string;

    // relacion
    @OneToMany(
        () => User,
        (user) => user.typeUser
    )
    userRelation!: User;

}