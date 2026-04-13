import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { DuelState } from '../entities/duel-state.entity';
import { DuelType } from '../entities/duel-type.entity';
import { UserDuelGame } from '../../user_duel_game/entities/user_duel_game.entity';
import { GameProfile } from '../../game_profile/entities/game-profile.entity';

@Entity()
export class DuelGame {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        type: 'int',
        default: 2
    })
    playersNumber!: number;

    @Column({
        type: 'int',
        default: 0
    })
    playersJoined!: number;

    @CreateDateColumn()
    duelDateCreated!: Date;

    @Column({
        type: 'timestamp',
        precision: 6,
        nullable: true
    })
    duelDateFinished!: Date | null;

    // relacion
    @ManyToOne(
        () => DuelType,
        (duelType) => duelType.duelGameRelation,
        { cascade: true, eager: true }
    )
    typeDuel!: DuelType;

    @ManyToOne(
        () => DuelState,
        (duelState) => duelState.duelStateRelation,
        { cascade: true, eager: true }
    )
    typeState!: DuelState;

    @OneToMany(
        () => UserDuelGame,
        (userGameDuel) => userGameDuel.duelGame
    )
    userDuelGame!: UserDuelGame[];

    @ManyToOne(
        () => GameProfile,
        (byCreated) => byCreated.createdDuelGameRelation,
        { cascade: true, eager: true }
    )
    createdBy!: GameProfile;

    @Column({
        type: 'text',
        nullable: false
    })
    roomName!: string;

    @Column({
        // se utiliza varchar ya que se especifica 
        // un largo de 200 caracteres como maximo
        type: 'varchar',
        length: 200,
        nullable: true
    })
    cancelReason!: string;

    @Column({
        type: 'bool',
        default: false
    })
    isManual!: boolean;

    @Column({
        type: 'text',
        nullable: true
    })
    manualBatchId!: string;

}
