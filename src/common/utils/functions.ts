import { randomBytes } from 'crypto';
import { Request } from 'express-serve-static-core';
import { RequestMetaData } from 'src/auth/interfaces/request-meta-data.interfaces';

// genera un codigo alfanumerico de 8 caracteres
export function generateActivationCode() {
    const code = randomBytes(4).toString('hex'); // 8 caracteres
    return code;
}

// genera cantidad de tiempo en minutos           ↓↓↓↓
export function generateTimeExpirationInMinutes(timeMinutes: number) {
    return new Date(Date.now() + timeMinutes * 60 * 1000);
}

// genera un token aleatorio
export function generateAleatoryToken() {
    return randomBytes(32).toString('hex');
}

// utiliza Request de express para obtener la ip del dispositivo que esta usando el usuario
export const getClientData = (req: Request): RequestMetaData => {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || req.ip || 'Desconocido';
    const userAgent = req.headers['user-agent'] || 'Desconocido';

    return {
        // normalizacion del valor para garantizar que siempre se convierta en string
        ip: String(ip),
        userAgent
    };
}

// genera cantidad de tiempo en dias           ↓↓↓↓
export function generateTimeExpirationInDays(timeDays: number){
    return new Date(Date.now() + timeDays * 24 * 60 * 60 * 1000); // tiempo en milisegundos desde el Date.now()
}