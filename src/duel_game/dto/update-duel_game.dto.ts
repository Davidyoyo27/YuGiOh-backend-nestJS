import { PartialType } from '@nestjs/mapped-types';
import { CreateDuelGameDto } from './create-duel_game.dto';

export class UpdateDuelGameDto extends PartialType(CreateDuelGameDto) {}
