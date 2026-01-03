import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserType } from "./user-type.entity";
import { TokenReset } from "./token-reset.entity";
import { UserSessions } from "src/auth/entities/user-sessions.entity";
import { LoginAttempts } from "src/auth/entities/login-attempts.entity";
import { GameProfile } from "src/game_profile/entities/game_profile.entity";

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
        nullable: true,
        select: false,
    })
    activationCode?: string | null;

    @Column({
        type: 'timestamp',
        precision: 6,
        nullable: true,
        select: false,
    })
    activationCodeExpires?: Date | null;

    @Column({
        type: 'bool',
        default: false
    })
    isActive: boolean;

    @CreateDateColumn()
    date_created: Date;

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
    userSession: UserSessions;

    @OneToMany(
        () => LoginAttempts,
        (loginUser) => loginUser.user
    )
    userLogin: LoginAttempts;

    // solo referencia logica a la relacion uno a uno
    @OneToOne(
        () => GameProfile,
        (profile) => profile.user
    )
    gameProfile: GameProfile;

}
