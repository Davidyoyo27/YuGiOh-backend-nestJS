import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

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

    // esta fecha es manual, no puede ser automatica 
    // puesto que representa un evento de negocio
    @Column({
        type: 'timestamp', 
        precision: 6,
        nullable: true
    })
    lastAttemptAt: Date | null;

    @Column({
        type: 'timestamp',
        precision: 6,
        nullable: true
    })
    lockedUntil: Date | null;

    @CreateDateColumn()
    createdAt: Date;

}
