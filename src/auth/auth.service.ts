import { BadRequestException, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response } from 'express';

import { User } from '../user/entities/user.entity';
import { TokenReset } from '../user/entities/token-reset.entity';
import { UserSessions } from '../auth/entities/user-sessions.entity';
import { LoginAttempts } from '../auth/entities/login-attempts.entity';
import { IpRateLimit } from '../auth/entities/login-ip-rate-limit.entity';

import { LoginUserDto } from './dto/login-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import {
    generateAleatoryToken, generateTimeExpirationInMinutes,
    generateTimeExpirationInDays, formatDateChile, resolveLockLevel
} from 'src/common/utils/functions';
import { EmailService } from 'src/email/email.service';
import { RequestMetaData } from './interfaces/request-meta-data.interfaces';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(TokenReset)
        private readonly tokenResetRepository: Repository<TokenReset>,

        @InjectRepository(UserSessions)
        private readonly userSessionRepository: Repository<UserSessions>,

        @InjectRepository(LoginAttempts)
        private readonly userLoginAttemptRepository: Repository<LoginAttempts>,

        @InjectRepository(IpRateLimit)
        private readonly loginIPRateLimitRepository: Repository<IpRateLimit>,

        private readonly jwtService: JwtService,

        private readonly emailService: EmailService,

        private readonly configService: ConfigService,
    ) { }

    async login(loginUserDto: LoginUserDto, reqData: RequestMetaData, res: Response) {

        const { password, email } = loginUserDto;
        const { ip } = reqData;

        const user = await this.userRepository.findOne({
            where: { email },
            select: { email: true, password: true, id: true, isActive: true }
        });

        if (!user) {
            // si el email no existe de igual manera cuenta el intento de IP
            await this.checkIpRateLimit(ip);
            throw new UnauthorizedException('Credenciales incorrectas.');
        }

        // verificar si el usuario puede hacer login (no esta bloqueado)
        // bloqueo por intentos de login fallidos
        const canLoginResult = await this.canUserLogin(user.id);
        // bloqueo por IP por intentos fallidos
        const canLoginResByIP = await this.canUserLoginIP(ip);

        if (!canLoginResult.canLogin) throw new UnauthorizedException(canLoginResult.message);
        if (!canLoginResByIP.canLogin) throw new UnauthorizedException(canLoginResByIP.message);

        if (!bcrypt.compareSync(password, user.password)) {
            // si la contraseña es incorrecta, registramos el intento fallido
            await this.loginAttemptByUser(user.id);
            await this.checkIpRateLimit(ip);
            throw new UnauthorizedException('Credenciales incorrectas.')
        }

        if (!user.isActive)
            throw new UnauthorizedException
                ('Cuenta inactiva! Debe realizar el proceso de activación de su cuenta o comunicarse con un Administrador.')

        // reseteamos intentos fallidos de login e IP por login exitoso
        await this.resetLoginAttempts(user.id);
        await this.resetIpAttempts(ip);

        const timeExpirationToken = generateTimeExpirationInDays(1);

        // creamos el registro de la session del usuario
        //                                                       refreshToken null inicialmente
        const userSession = await this.createUserSession(user.id, null, reqData.ip, reqData.userAgent, timeExpirationToken);

        let max_session: number = Number(process.env.MAX_SESSIONS_USER) || 0;
        await this.maxSessionsUser(user.id, max_session);

        // generamos accessToken y refreshToken
        const tokens = await this.getTokens(user.id, user.email, userSession.id, userSession.tokenVersion);
        // guardamos el refreshToken en la BD
        await this.updateRefreshToken(userSession.id, tokens.refreshToken);

        const accessToken = tokens.accessToken;
        const refreshToken = tokens.refreshToken;

        this.saveCookies(res, accessToken, refreshToken);

        return {
            ok: true,
            message: 'Logeado con exito!',
            user: {
                id: user.id,
                userName: user.name,
                email: user.email,
                role: user.typeUser,
            },
        }
    }

    async forgotPassword(email: string) {
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

        return { ok: true, message: 'Correo de cambio de contraseña enviado.' };
    }

    async validateTokenReset(token: string) {
        const tokenRecord = await this.tokenResetRepository.findOne({
            where: { token },
            relations: ['user'],
        });

        if (!tokenRecord) throw new NotFoundException('Token inválido.');
        if (tokenRecord.expirationToken < new Date()) throw new BadRequestException('El token ha expirado.');

        return { message: 'Token válido.', email: tokenRecord.user.email };
    }

    async resetPassword(resetPasswordDto: ResetPasswordDto) {
        const { token, newPassword } = resetPasswordDto;

        const tokenRecord = await this.tokenResetRepository.findOne({
            where: { token },
            relations: ['user'],
        });

        if (!tokenRecord) throw new NotFoundException('Token inválido.');
        if (tokenRecord.expirationToken < new Date()) throw new BadRequestException('El token ha expirado.');

        const user = tokenRecord.user;

        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        user.password = hashedPassword;

        // guardamos el cambio de la contraseña
        await this.userRepository.save(user);
        // eliminamos el registro del token en la tabla para que este no pueda reutilizarse
        await this.tokenResetRepository.update(
            { user: { id: user.id } },
            { token: null, usedToken: new Date() }
        );

        return { ok: true, message: 'Contraseña actualizada correctamente.' };
    }

    // genera los tokens para accessToken y refreshToken
    async getTokens(userId: string, email: string, sessionId: number, tokenVersion: number) {
        // identifier: es el que se pasara en el validate del jwtstrategy
        const payload = { identifier: userId, email, sessionId, tokenVersion };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: process.env.JWT_ACCESS_SECRET,
                expiresIn: this.configService.getOrThrow<string>('jwt.accessExpires') as any,
            }),
            this.jwtService.signAsync(payload, {
                secret: process.env.JWT_REFRESH_SECRET,
                expiresIn: this.configService.getOrThrow<string>('jwt.refreshExpires') as any,
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

    async refreshTokens(req: Request, res: Response) {

        const refreshToken = req.cookies?.refresh_token;

        if (!refreshToken) throw new UnauthorizedException('Refresh token necesario.');

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

        if (!session || !session.status) throw new UnauthorizedException('Sesión no encontrada o cerrada.');
        // validamos que exista un refreshToken registrado antes de hacer la comparacion de el mismo, puesto que si no, da error
        if (!session.hashedRT) throw new UnauthorizedException('La sesión no tiene refreshToken registrado.');

        if (payload.tokenVersion !== session.tokenVersion) {
            await this.userSessionRepository.update({ id: sessionId }, { status: false })
            throw new ForbiddenException('Refresh Token inválido, no es posible volver a usar este Token.')
        }

        // 4. comparar el refresh token enviado con el almacenado (hash)
        const rtMatches = await bcrypt.compare(
            refreshToken,
            session.hashedRT
        );

        if (!rtMatches) {
            // invalidamos sesion inmediatamente
            await this.userSessionRepository.update(
                { id: sessionId },
                { status: false }
            );

            throw new ForbiddenException('Refresh Token inválido.');
        }

        // El refresh fue valido actualizamos el lastUsedAt
        await this.userSessionRepository.update(
            { id: sessionId },
            { lastUsedAt: new Date() }
        );

        const newTokenVersion = session.tokenVersion += 1;
        // 5. generar nuevos tokens
        const tokens = await this.getTokens(session.user.id, session.user.email, session.id, newTokenVersion);

        // 6. guardar el nuevo refresh token con hash
        await this.updateRefreshToken(session.id, tokens.refreshToken, newTokenVersion);

        // rescribimos ambas cookies por el proceso de volver a "refrescar el token"
        this.saveCookies(res, tokens.accessToken, tokens.refreshToken);

        return {
            ok: true,
            message: "Token refrescado correctamente.",
        };
    }

    async logout(sessionId: number, res: Response) {

        await this.userSessionRepository.update(
            { id: sessionId },
            { status: false, hashedRT: null }
        );

        res.clearCookie('access_token');
        res.clearCookie('refresh_token');

        return {
            ok: true,
            message: 'Sesión cerrada.'
        }
    }

    async createUserSession(userId: string, refreshToken: string | null, ip: string, userAgent: string, expiresAt: Date) {
        // asignamos a la variable la posibilidad de que venga null en su valor
        let refreshTokenHashed: string | null = null;
        // si refreshToken tiene un valor se hashea, si refreshToken es null no hace nada
        if (refreshToken) refreshTokenHashed = bcrypt.hashSync(refreshToken, 10);

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

    // funcion que maneja el maximo de sesiones por usuario y 
    // si este se excede en dichas sesiones se "elimina" la mas antigua
    async maxSessionsUser(userId: string, maxSessions: number) {
        const sessions = await this.userSessionRepository.find({
            where: { user: { id: userId }, status: true },
            select: ['id', 'lastUsedAt', 'status'],
            order: { createdAt: 'DESC' }
        });

        if (sessions.length <= maxSessions) return;

        const activeSessions = sessions
            .slice(0, maxSessions)
            .map(session => session.id);

        const sessionsToClose = sessions
            .filter(session => !activeSessions.includes(session.id))
            .map(session => session.id);

        if (sessionsToClose.length === 0) return;

        await this.userSessionRepository
            .createQueryBuilder()
            .update(UserSessions)
            .set({ status: false })
            .where('id IN (:...id)', { id: sessionsToClose })
            .execute();

    }

    // funcion que verifica los intentos fallidos del usuario para iniciar sesion, en caso de fallar 
    // la cantidad determinada de estos intentos su cuenta se bloquea por X cantidad de tiempo
    async loginAttemptByUser(userId: string) {

        // buscamos si existe algun registro asociado a ese usuario
        const searchUser = await this.userLoginAttemptRepository.findOne({ where: { user: { id: userId } } });

        const now = new Date();

        // si no existe, lo creamos y salir
        if (!searchUser) {
            const newLogAttempt = await this.userLoginAttemptRepository.create({
                attempts: 1,  // primer intento fallido
                lastAttemptAt: now,
                user: { id: userId }
            });

            await this.userLoginAttemptRepository.save(newLogAttempt);
            return;
        }

        // verificamos su el bloqueo sigue activo
        if (searchUser?.lockedUntil && searchUser.lockedUntil > now) {
            return;  // no incrementamos intentos ni hacemos cambios
        }

        // si hay bloqueo pero ya expiro, reseteamos
        if (searchUser.lockedUntil && searchUser.lockedUntil <= now) {
            await this.userLoginAttemptRepository.update(
                { id: searchUser.id },
                {
                    attempts: 0,
                    lastAttemptAt: now,
                    lockedUntil: null
                }
            )
            return;
        }

        // incrementamos intentos (solo si hay bloqueo activo)
        const newAttempt = (searchUser.attempts || 0) + 1;
        let lockedUntil: Date | null = null;

        // verificar si es el 4to intento y si es asi, debemos bloquear (al 4to intento fallido)
        if (newAttempt >= 4) {
            // le sumamos 8 horas a la fecha y hora actual
            lockedUntil = new Date(Date.now() + (+process.env.HOURS_USER_LOCKED_FAILED_LOGIN! * 60 * 60 * 1000));
        }

        // actualizamos
        await this.userLoginAttemptRepository.update(
            { id: searchUser.id },
            {
                attempts: newAttempt,
                lockedUntil,
                lastAttemptAt: now
            }
        );
    }

    // verifica si el usuario posee o no un bloqueo en el login y permite si este pueden o no iniciar sesion
    async canUserLogin(userId: string): Promise<{ canLogin: boolean; message?: string }> {

        const loginAttempt = await this.userLoginAttemptRepository.findOne({
            where: { user: { id: userId } }
        });

        if (!loginAttempt) {
            return { canLogin: true }
        }

        const now = new Date();

        // verificar si el bloqueo aun esta activo
        if (loginAttempt.lockedUntil && loginAttempt.lockedUntil > now) {
            const formattedDate = formatDateChile(loginAttempt.lockedUntil);
            return {
                canLogin: false,
                message: `Hemos detectado varios intentos fallidos por lo que tu cuenta ha sido bloqueada temporalmente.` +
                    `\nEl acceso se reestablecerá el ${formattedDate[0]} a las ${formattedDate[1]} hrs.`
            };
        }

        // si hay fecha de bloqueo pero ya expiro, limpiarla automaticamente
        if (loginAttempt.lockedUntil && loginAttempt.lockedUntil <= now) {
            await this.userLoginAttemptRepository.update(
                { id: loginAttempt.id },
                { lockedUntil: null, attempts: 0 }
            );
            return { canLogin: true };
        }

        // si no hay bloqueo, puede hacer login
        return { canLogin: true };
    }

    // si el login es exitoso, RESETEAMOS los intentos fallidos
    async resetLoginAttempts(userId: string) {
        await this.userLoginAttemptRepository.update(
            { user: { id: userId } },
            { attempts: 0, lockedUntil: null, lastAttemptAt: null }
        );
    }

    // funcion que identifica la IP y registra intentos fallidos de login de esta
    // se bloquea dicho login a la IP cuando se alcanzan los 10 intentos
    async checkIpRateLimit(ip: string) {

        // buscamos algun registro por la IP del dispositivo que esta realizando el login
        const ipExists = await this.loginIPRateLimitRepository.findOne({
            where: { ip },
        });

        const now = new Date();

        // si no existe algun registro con esa IP, lo creamos
        if (!ipExists) {
            const ipLoginAttempt = await this.loginIPRateLimitRepository.create({
                ip,
                attempts: 1,  // con un intento fallido
            });

            await this.loginIPRateLimitRepository.save(ipLoginAttempt);
            return;
        }

        // verificar que si hay bloqueo y este es menor al tiempo actual (ya expiro), reseteamos los intentos
        if (ipExists.lockedUntil && ipExists.lockedUntil <= now) {
            await this.loginIPRateLimitRepository.update(
                { ip },
                { lockedUntil: null }
            );
            return;
        }

        // poliza de bloqueo con la cantidad de tiempo de bloqueo 
        // respecto de la cantidad de intentos que ha realizado el usuario, 
        // esto vendria siendo el bloqueo progresivo
        const LOCK_POLICY = [
            { minAttempts: 10, lockMinutes: 10 },
            { minAttempts: 15, lockMinutes: 30 },
            { minAttempts: 20, lockMinutes: 60 },
            { minAttempts: 30, lockMinutes: 1440 },
        ];

        const newAttempt = ipExists.attempts + 1;
        const { level, lockMinutes } = resolveLockLevel(newAttempt, LOCK_POLICY)

        // si el nivel es mayor al lockLevel existente en la BD 
        // le asignamos el nuevo nivel, un nuevo intento y el tiempo de bloqueo asignado
        if (level > ipExists.lockLevel && lockMinutes) {
            await this.loginIPRateLimitRepository.update(
                { ip },
                {
                    attempts: newAttempt,
                    lockLevel: level,
                    lockedUntil: generateTimeExpirationInMinutes(lockMinutes)
                }
            )

            return;
        }

        // si no sube de nivel, como base simplemente aumentamos los intentos
        await this.loginIPRateLimitRepository.update(
            { ip },
            {
                attempts: newAttempt,
                lastAttemptAt: new Date(),
            }
        );

    }

    // verificamos si el bloqueo esta activo o no para permitir al usuario hacer login
    async canUserLoginIP(ip: string): Promise<{ canLogin: boolean; message?: string }> {

        const searchIP = await this.loginIPRateLimitRepository.findOne({
            where: { ip }
        });

        if (!searchIP) return { canLogin: true };

        const now = new Date();

        // si el bloqueo esta activo
        if (searchIP.lockedUntil && searchIP.lockedUntil > now) {
            const formattedDate = formatDateChile(searchIP.lockedUntil);
            return {
                canLogin: false,
                message: `Hemos detectado actividad inusual desde tu dirección IP.` +
                    `\nPor seguridad, el acceso ha sido bloqueado temporalmente hasta el ${formattedDate[0]} a las ${formattedDate[1]} hrs.`
            }
        }

        // si el bloqueo ya expiro
        if (searchIP.lockedUntil && searchIP.lockedUntil <= now) {
            await this.loginIPRateLimitRepository.update(
                { ip },
                { lockedUntil: null }
            );
            return { canLogin: true }
        }

        return { canLogin: true };
    }

    // si el login es exitoso, RESETEAMOS los intentos fallidos en este caso de la IP
    async resetIpAttempts(ip: string) {
        await this.loginIPRateLimitRepository.update(
            { ip },
            { attempts: 0, lockedUntil: null, lastAttemptAt: new Date() }
        );
    }

    // comprueba en el front el usuario que esta en la sesion
    async checkAuth(userId: string) {

        const userDB = await this.userRepository.findOne({
            where: {
                id: userId
            },
            relations: ['gameProfile']
        });

        if (!userDB) throw new UnauthorizedException('Usuario no encontrado.');

        return {
            ok: true,
            user: {
                id: userDB.id,
                userName: userDB.name,
                email: userDB.email,
                role: userDB.typeUser.id,
                profileId: userDB.gameProfile?.id ?? null,
            }
        };
    }

    // guarda las cookies que seran tomadas luego desde el front
    async saveCookies(res: Response, accessToken: string, refreshToken: string) {

        // guarda la cookie llamada access_token
        const TokAcess = res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: false,  // true en produccion HTTPS
            sameSite: 'lax',
            maxAge: 1000 * 60 * 15, // 15 min
        });

        // guarda la cookie llamada refresh_token
        const TokRefr = res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 24  // 1 dia
        });

        return {
            accessToken: TokAcess,
            refreshToken: TokRefr
        }
    }

}
