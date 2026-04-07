import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "src/user/entities/user.entity";

@Entity()
export class UserSessions {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        type: 'text',
        nullable: true,
    })
    hashedRT!: string | null;

    @Column({
        type: 'int',
        default: 0
    })
    tokenVersion!: number;

    @Column({
        type: 'text',
        nullable: true,
    })
    ipAddress!: string;

    @Column({
        type: 'text',
        nullable: true,
    })
    userAgent!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @Column({
        type: 'timestamp',
        precision: 6,
        nullable: true,
    })
    expiresAt!: Date;

    // última vez que el usuario utilizó esa sesión para hacer una petición autenticada.
    @Column({
        type: 'timestamp',
        precision: 6,
        nullable: true,
    })
    lastUsedAt!: Date;

    @Column({
        type: 'bool',
        default: true,
    })
    status!: boolean;

    // relacion
    @ManyToOne(
        () => User,
        (user) => user.userSession,
        { onDelete: 'CASCADE' },
    )
    user!: User;

}
