import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { DuelGame } from '../entities/duel-game.entity';

@Entity()
export class DuelState {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        type: 'text',
        unique: true
    })
    stateName!: string;

    // relacion
    @OneToMany(
        () => DuelGame,
        (duelGame) => duelGame.typeState
    )
    duelStateRelation!: DuelGame;
    
}
