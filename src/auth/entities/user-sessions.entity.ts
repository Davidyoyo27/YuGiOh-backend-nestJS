import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "src/user/entities/user.entity";

@Entity()
export class UserSessions {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'text', 
        nullable: true,
    })
    hashedRT: string | null;

    @Column({
        type: 'int',
        default: 0
    })
    tokenVersion: number;

    @Column({
        type: 'text',
        nullable: true,
    })
    ipAddress: string;

    @Column({
        type: 'text',
        nullable: true,
    })
    userAgent: string;

    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP'
    })
    createdAt: Date;

    @Column({
        type: 'timestamp',
        nullable: true,
    })
    expiresAt: Date;

    @Column({
        type: 'bool',
        default: true,
    })
    status: boolean;

    // relacion
    @ManyToOne(
        () => User,
        (user) => user.userSession,
        { onDelete: 'CASCADE' },
    )
    user: User;

}
