import {
    Column, Entity, ManyToOne,
    PrimaryGeneratedColumn
} from "typeorm";
import { DuelGame } from '../../duel_game/entities/duel-game.entity';
import { GameProfile } from '../../game_profile/entities/game-profile.entity';
import { DuelResult } from '../../common/utils/duel-result';

@Entity()
export class UserDuelGame {

    @PrimaryGeneratedColumn()
    id!: number;

    // relacion
    // id_duel_game = ID del juego mismo, de los puntos de vida
    @ManyToOne(
        () => DuelGame,
        (gameDuel) => gameDuel.userDuelGame,
        { onDelete: 'CASCADE' }
    )
    duelGame!: DuelGame;

    // id_game_profile = ID de el perfil del usuario, osea el jugador
    @ManyToOne(
        () => GameProfile,
        (profileGame) => profileGame.userDuelGameRelation,
        { onDelete: 'CASCADE' }
    )
    gameProfile!: GameProfile;

    @Column({
        type: 'enum',
        enum: DuelResult,
        nullable: true,
    })
    result!: DuelResult | null;

    @Column({
        type: 'int',
        nullable: true
    })
    finalLP!: number | null;

    @Column({
        type: 'timestamp',
        precision: 6,
    })
    createdAt!: Date;

    @Column({
        type: 'timestamp',
        precision: 6,
        nullable: true
    })
    finishedAt!: Date | null;

    @Column({
        type: 'text',
        nullable: true
    })
    manualBatchId!: string;

}
