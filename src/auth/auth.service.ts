import { UnauthorizedException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginUserDto } from './dto/login-user.dto';

import { User } from 'src/user/entities/user.entity';

import bcrypt from 'bcrypt';
import { JwtPayload } from './interfaces/jwt-payload.interfaces';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        private readonly jwtService: JwtService,
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

        return { ok: true, msg: 'Logeado con exito!', ...user, token: this.getJwtToken({ id: user.id }) };
    }

    private getJwtToken(payload: JwtPayload) {
        const token = this.jwtService.sign(payload);
        return token;
    }

}
