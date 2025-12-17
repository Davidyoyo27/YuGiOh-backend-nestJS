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
export function generateTimeExpirationInDays(timeDays: number) {
    return new Date(Date.now() + timeDays * 24 * 60 * 60 * 1000); // tiempo en milisegundos desde el Date.now()
}

export function formatDateChile(date?: Date | null): Array<string> {
    if(!date) return ['fecha no disponible'];

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    const dateFinal = `${year}-${month}-${day}`;
    const hourFinal = `${hours}:${minutes}:${seconds}`;

    return [dateFinal, hourFinal];
}