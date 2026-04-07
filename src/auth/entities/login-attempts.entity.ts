import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "src/user/entities/user.entity";

@Entity()
export class LoginAttempts {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        type: 'int',
    })
    attempts!: number;

    @Column({
        type: 'timestamp', 
        nullable: true
    })
    lastAttemptAt!: Date | null;

    @Column({
        type: 'timestamp',
        nullable: true
    })
    lockedUntil!: Date | null;

    // relacion
    @ManyToOne(
        () => User,
        (user) => user.userLogin,
        { onDelete: 'CASCADE' }
    )
    user!: User;

}
