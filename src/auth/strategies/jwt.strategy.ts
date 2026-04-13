import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { User } from '../../user/entities/user.entity';
import { UserSessions } from '../../auth/entities/user-sessions.entity';

import { JwtPayload } from "../interfaces/jwt-payload.interfaces";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(UserSessions)
        private readonly userSessionRepository: Repository<UserSessions>,

        configService: ConfigService,
    ) {
        super({
            secretOrKey: configService.get('JWT_ACCESS_SECRET') as string,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        });
    }

    async validate(payload: JwtPayload) {

        const { identifier, sessionId } = payload;

        const user = await this.userRepository.findOne({
            where: { id: identifier },
            relations: ['typeUser', 'gameProfile'],
        });

        if (!user) throw new UnauthorizedException('Token invalido.');
        if (!user.isActive)
            throw new UnauthorizedException('Usuario inactivo, favor comunicarse con un administrador.');

        // la variable puede ser de tipo string o number, si el usuario no tiene creado un perfil se le asigna
        // el siguiente valor 'usuario sin perfil', de lo contrario, si tiene perfil, se le asigna el id de ese perfil
        const profileId: string | number = (!user.gameProfile) ? 'usuario sin perfil' : user.gameProfile.id;

        // actualizamos la fecha cada vez que se utilizo una sesion 
        // para hacer una peticion autenticada (acceso con access token)
        await this.userSessionRepository.update(
            { id: sessionId },
            { lastUsedAt: new Date() }
        );

        return { id: user.id, email: user.email, role: user.typeUser.id, sessionId, profileId };
    }

}
