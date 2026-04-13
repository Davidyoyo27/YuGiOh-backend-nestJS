import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ManualAction } from '../../common/utils/update-stats-manual-action';
import { User } from '../../user/entities/user.entity';

@Entity()
export class PlayerStatsAudit {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        type: 'int',
    })
    profileId!: number;

    // (ADD_WIN, REMOVE_WIN, ADD_LOSE, etc)
    @Column({
        type: 'enum',
        enum: ManualAction,
    })
    action!: ManualAction;

    @Column({
        type: 'int',
    })
    amount!: number;

    @Column({
        type: 'int',
    })
    oldValue!: number;

    @Column({
        type: 'int',
    })
    newValue!: number;

    @Column({
        type: 'varchar',
        length: 100,
        nullable: false,
    })
    reason!: string;

    @ManyToOne(
        () => User,
        (byPerformed) => byPerformed.playerStatsAudit
    )
    performedBy!: User;

    // asignacion de fecha y hora para auditorias, logs, etc.
    @CreateDateColumn({
        type: 'timestamptz'
    })
    createdAt!: Date;

}