import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { DuelState } from "./duel-state.entity";
import { DuelType } from "./duel-type.entity";
import { UserDuelGame } from "src/user_duel_game/entities/user_duel_game.entity";
import { GameProfile } from "src/game_profile/entities/game-profile.entity";

@Entity()
export class DuelGame {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'int',
        default: 2
    })
    playersNumber: number;

    @Column({
        type: 'int',
        default: 0
    })
    playersJoined: number;

    @CreateDateColumn()
    duelDateCreated: Date;

    @Column({
        type: 'timestamp',
        precision: 6,
        nullable: true
    })
    duelDateFinished: Date | null;

    // relacion
    @ManyToOne(
        () => DuelType,
        (duelType) => duelType.duelGameRelation,
        { cascade: true, eager: true }
    )
    typeDuel: DuelType;

    @ManyToOne(
        () => DuelState,
        (duelState) => duelState.duelStateRelation,
        { cascade: true, eager: true }
    )
    typeState: DuelState;

    @OneToMany(
        () => UserDuelGame,
        (userGameDuel) => userGameDuel.duelGame
    )
    userDuelGame: UserDuelGame[];

    @ManyToOne(
        () => GameProfile,
        (byCreated) => byCreated.createdDuelGameRelation,
        { cascade: true, eager: true }
    )
    createdBy: GameProfile;

    @Column({
        type: 'text',
        unique: true,
        nullable: false
    })
    roomName: string;

}
