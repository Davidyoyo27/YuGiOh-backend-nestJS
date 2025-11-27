import { BadRequestException, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from 'src/user/entities/user.entity';
import { TokenReset } from 'src/user/entities/token-reset.entity';

import { LoginUserDto } from './dto/login-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { generateAleatoryToken, generateTimeExpiration } from 'src/common/utils/functions';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class AuthService {

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(TokenReset)
        private readonly tokenResetRepository: Repository<TokenReset>,

        private readonly jwtService: JwtService,

        private readonly emailService: EmailService,
    ) { }

    async login(loginUserDto: LoginUserDto) {

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

        // generamos accessToken y refreshToken
        const tokens = await this.getTokens(user.id, user.email);
        // guardamos el refreshToken en la BD
        await this.updateRefreshToken(user.id, tokens.refreshToken);

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
        const expiration = generateTimeExpiration(15);

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
    async getTokens(userId: string, email: string) {
        // identifier: es el que se pasara en el validate del jwtstrategy
        const payload = { identifier: userId, email };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: process.env.JWT_ACCESS_SECRET,
                expiresIn: '1m',
            }),
            this.jwtService.signAsync(payload, {
                secret: process.env.JWT_REFRESH_SECRET,
                expiresIn: '1d',
            }),
        ]);

        return { accessToken, refreshToken };
    }

    async updateRefreshToken(userId: string, refreshToken: string) {
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

        await this.userRepository.update(
            { id: userId },
            { hashedRefreshToken },
        );
    }

    async refreshTokens(userId: string, refreshToken: string){

        // 1. verificar criptográficamente que este token fue firmado con JWT_REFRESH_SECRET
        let payload;

        try {
            payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET,
            });
        } catch (error) {
            throw new UnauthorizedException('Refresh Token inválido o expirado.');
        }

        // 2. el token debe pertenecer al mismo usuario
        if(payload.identifier !== userId) throw new UnauthorizedException('Refresh Token no corresponde al usuario.');

        // 3. buscar el usuario con el refreshToken guardado
        const user = await this.userRepository.findOne({
            where: { id: userId },
            select: ['id', 'email', 'hashedRefreshToken'],
        });

        if(!user || !user.hashedRefreshToken) throw new ForbiddenException('Acceso Denegado.');

        // 4. comparar el refresh token enviado con el almacenado (hash)
        const rtMatches = await bcrypt.compare(
            refreshToken,
            user.hashedRefreshToken
        );

        if(!rtMatches) throw new ForbiddenException('RefreshToken invalido.');

        // 5. generar nuevos tokens
        const tokens = await this.getTokens(user.id, user.email);
        // 6. guardar el nuevo refresh token con hash
        await this.updateRefreshToken(user.id, tokens.refreshToken);

        return tokens;
    }

    async logout(userId: string){
        await this.userRepository.update(
            { id: userId },
            { hashedRefreshToken: null }
        );
    }

}
