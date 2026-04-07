import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { DuelGame } from "./duel-game.entity";

@Entity()
export class DuelType {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        type: 'text',
        unique: true
    })
    typeName!: string;

    @Column({
        type: 'text',
        nullable: false
    })
    description!: string;

    // relacion
    @OneToMany(
        () => DuelGame,
        (duelGame) => duelGame.typeDuel
    )
    duelGameRelation!: DuelGame;
    
}
