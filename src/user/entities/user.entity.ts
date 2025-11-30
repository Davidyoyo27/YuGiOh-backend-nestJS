import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { UserType } from "./user-type.entity";
import { TokenReset } from "./token-reset.entity";
import { UserSessions } from "src/auth/entities/user-sessions.entity";

@Entity()
export class User {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'text',
        unique: true
    })
    email: string;

    @Column({
        type: 'text',
        select: false,
    })
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
        type: 'text',
        nullable: true,
        select: false,
    })
    activationCode?: string | null;

    @Column({
        type: 'timestamp',
        nullable: true,
        select: false,
    })
    activationCodeExpires?: Date | null;

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

    @Column({
        type: 'text',
        nullable: true,
        select: false,
    })
    hashedRefreshToken: string | null;

    // relacion
    @ManyToOne(
        () => UserType,
        (userType) => userType.userRelation,
        { cascade: true, eager: true }
    )
    typeUser: UserType;

    @OneToMany(
        () => TokenReset,
        (resetToken) => resetToken.user,
        { cascade: true, eager: true }
    )
    tokenReset: TokenReset;

    @OneToMany(
        () => UserSessions,
        (session) => session.user 
    )
    user_session: UserSessions;
}
