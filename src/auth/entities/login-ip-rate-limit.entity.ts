import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class IpRateLimit {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'varchar',
        length: 45,
        unique: true
    })
    ip: string;

    @Column({
        default: 0
    })
    attempts: number;

    @Column({
        type: 'int',
        default: 0
    })
    lockLevel: number;

    @Column({
        type: 'timestamp', 
        nullable: true
    })
    lastAttemptAt: Date | null;

    @Column({
        type: 'timestamp',
        nullable: true
    })
    lockedUntil: Date | null;

    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP'
    })
    createdAt: Date;

}
