import { BadRequestException, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from 'src/user/entities/user.entity';
import { TokenReset } from 'src/user/entities/token-reset.entity';
import { UserSessions } from './entities/user-sessions.entity';

import { LoginUserDto } from './dto/login-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { generateAleatoryToken, generateTimeExpirationInMinutes, generateTimeExpirationInDays } from 'src/common/utils/functions';
import { EmailService } from 'src/email/email.service';
import { RequestMetaData } from './interfaces/request-meta-data.interfaces';

@Injectable()
export class AuthService {

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(TokenReset)
        private readonly tokenResetRepository: Repository<TokenReset>,

        @InjectRepository(UserSessions)
        private readonly userSessionRepository: Repository<UserSessions>,

        private readonly jwtService: JwtService,

        private readonly emailService: EmailService,
    ) { }

    async login(loginUserDto: LoginUserDto, reqData: RequestMetaData) {

        const { password, email } = loginUserDto;

        const user = await this.userRepository.findOne({
            where: { email },
            select: { email: true, password: true, id: true, isActive: true }
        });

        if (!user) throw new UnauthorizedException('Credenciales incorrectas.')
        if (!bcrypt.compareSync(password, user.password))
            throw new UnauthorizedException('Credenciales incorrectas.')
        if (!user.isActive)
            throw new UnauthorizedException('Cuenta inactiva! Debe realizar el proceso de activación de su cuenta o comunicarse con un Administrador.')

        const timeExpirationToken = generateTimeExpirationInDays(1);

        // creamos el registro de la session del usuario
        //                                                       refreshToken null inicialmente
        const userSession = await this.createUserSession(user.id, null, reqData.ip, reqData.userAgent, timeExpirationToken);

        // generamos accessToken y refreshToken
        const tokens = await this.getTokens(user.id, user.email, userSession.id, userSession.tokenVersion);
        // guardamos el refreshToken en la BD
        await this.updateRefreshToken(userSession.id, tokens.refreshToken);

        return {
            ok: true, 
            msg: 'Logeado con exito!', 
            tokens: { 
                accessToken: tokens.accessToken, 
                refreshToken: tokens.refreshToken 
            }
        }
    }

    async sendEmailForgotPassword(email: string) {
        const user = await this.userRepository.findOne({
            where: { email },
        });

        // IMPORTANTE NO INDICAR QUE EXISTE EL CORREO, 
        // por lo que si no existe el user, simplemente no mostramos nada
        if (!user) return null;

        const token = generateAleatoryToken();
        const expiration = generateTimeExpirationInMinutes(15);

        const tokenRegister = this.tokenResetRepository.create({
            token,
            expirationToken: expiration,
            user: user
        });

        // se guarda el token en la BD
        await this.tokenResetRepository.save(tokenRegister);
        await this.emailService.sendMail(
            user.email,
            'Soporte KaibaCorp - Cambio de contraseña',
            'reset-user-password',
            {
                name: user.name,
                tokenUrl: token,
            },
        );

        return { ok: true, message: 'correo de cambio de contraseña enviado.' };
    }

    async validateTokenReset(token: string) {
        const tokenRecord = await this.tokenResetRepository.findOne({
            where: { token },
            relations: ['user'],
        });

        if (!tokenRecord) throw new NotFoundException('Token invalido.');
        if (tokenRecord.expirationToken < new Date()) throw new BadRequestException('El token ha expirado.');

        return { message: 'Token válido.', email: tokenRecord.user.email };
    }

    async resetPassword(resetPasswordDto: ResetPasswordDto) {
        const { token, newPassword } = resetPasswordDto;

        const tokenRecord = await this.tokenResetRepository.findOne({
            where: { token },
            relations: ['user'],
        });

        if (!tokenRecord) throw new NotFoundException('Token invalido.');
        if (tokenRecord.expirationToken < new Date()) throw new BadRequestException('El token ha expirado.');

        const user = tokenRecord.user;

        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        user.password = hashedPassword;

        // guardamos el cambio de la contraseña
        await this.userRepository.save(user);
        // eliminamos el registro del token en la tabla para que este no pueda reutilizarse
        await this.tokenResetRepository.remove(tokenRecord);

        return { message: 'Contraseña actualizada correctamente.' };
    }

    // genera los tokens para accessToken y refreshToken
    async getTokens(userId: string, email: string, sessionId: number, tokenVersion: number) {
        // identifier: es el que se pasara en el validate del jwtstrategy
        const payload = { identifier: userId, email, sessionId, tokenVersion };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: process.env.JWT_ACCESS_SECRET,
                expiresIn: '15m', // 15 minutos
            }),
            this.jwtService.signAsync(payload, {
                secret: process.env.JWT_REFRESH_SECRET,
                expiresIn: '1d', // un dia
            }),
        ]);

        return { accessToken, refreshToken };
    }

    async updateRefreshToken(sessionId: number, refreshToken: string, tokenVersion?: number) {
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

        return await this.userSessionRepository.update(
            { id: sessionId },
            { hashedRT: hashedRefreshToken, tokenVersion }
        );
    }

    async refreshTokens(refreshToken: string){

        if(!refreshToken) throw new UnauthorizedException('Refresh token necesario.');

        // 1. verificar criptográficamente que este token fue firmado con JWT_REFRESH_SECRET
        let payload: any;
        
        try {
            payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET,
            });
        } catch (error) {
            throw new UnauthorizedException('Refresh Token inválido o expirado.');
        }

        const { sessionId } = payload;

        // 2-. buscar la sesion
        const session = await this.userSessionRepository.findOne({
            where: { id: sessionId },
            select: ['id', 'hashedRT', 'status', 'tokenVersion'],
            relations: ['user'],
        });

        if(!session || !session.status) throw new UnauthorizedException('Sesión no encontrada o cerrada.');
        // validamos que exista un refreshToken registrado antes de hacer la comparacion de el mismo, puesto que si no, da error
        if(!session.hashedRT) throw new UnauthorizedException('La sesión no tiene refreshToken registrado.');

        if(payload.tokenVersion !== session.tokenVersion){
            await this.userSessionRepository.update({ id: sessionId }, { status: false })
            throw new ForbiddenException('Refresh Token inválido, no es posible volver a usar este Token.')
        }

        // 4. comparar el refresh token enviado con el almacenado (hash)
        const rtMatches = await bcrypt.compare(
            refreshToken,
            session.hashedRT
        );
        
        if(!rtMatches){
            // invalidamos sesion inmediatamente
            await this.userSessionRepository.update(
                { id: sessionId },
                { status: false }
            );
            
            throw new ForbiddenException('Refresh Token inválido.');
        }
        
        const newTokenVersion = session.tokenVersion += 1;
        // 5. generar nuevos tokens
        const tokens = await this.getTokens(session.user.id, session.user.email, session.id, newTokenVersion);

        // 6. guardar el nuevo refresh token con hash
        await this.updateRefreshToken(session.id, tokens.refreshToken, newTokenVersion);

        return tokens;
    }

    async logout(sessionId: number){

        await this.userSessionRepository.update(
            { id: sessionId },
            { status: false, hashedRT: null }
        );

        return { message: 'Sesión cerrada.' }
    }

    async createUserSession(userId: string, refreshToken: string | null, ip: string, userAgent: string, expiresAt: Date){
        // asignamos a la variable la posibilidad de que venga null en su valor
        let refreshTokenHashed: string | null = null;
        // si refreshToken tiene un valor se hashea, si refreshToken es null no hace nada
        if(refreshToken) refreshTokenHashed = bcrypt.hashSync(refreshToken, 10);

        const userSession = this.userSessionRepository.create({
            hashedRT: refreshTokenHashed,
            ipAddress: ip,
            userAgent,
            expiresAt,
            user: { id: userId }
        });

        await this.userSessionRepository.save(userSession);

        return userSession;
    }

}
