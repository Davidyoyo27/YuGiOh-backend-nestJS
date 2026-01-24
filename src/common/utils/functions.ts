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

// genera cantidad de tiempo en dias           ↓↓↓↓
export function generateTimeExpirationInDays(timeDays: number) {
    return new Date(Date.now() + timeDays * 24 * 60 * 60 * 1000); // tiempo en milisegundos desde el Date.now()
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

// funcion que entrega la fecha y hora con formato separada en 1: fecha 2: hora
export function formatDateChile(date?: Date | null): Array<string> {
    if (!date) return ['fecha no disponible'];

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

// funcion que evalua el nivel de bloqueo que necesita el usuario 
// segun cantidad de intentos de login determina el tiempo de bloqueo
// y eso corresponde al nivel de bloqueo
export const resolveLockLevel = (attempts: number, lockPolicy): { level: number; lockMinutes: number | null; } => {
    let level: number = 0;
    let lockMinutes: number | null = null;

    lockPolicy.forEach((policy, index) => {
        if (attempts >= policy.minAttempts) {
            level = index + 1;
            lockMinutes = policy.lockMinutes;
        }
    });

    return { level, lockMinutes };
}

// funcion para validar si un numero es par o impar
export function isNumberPairPositive(valor: any) {
    // 1. Validar formato si es string (regex simple)
    if (typeof valor === 'string') {
        if (!/^[1-9][0-9]*[02468]$|^0$/.test(valor)) {
            return false;
        }
        valor = parseInt(valor, 10);
    }

    // 2. Validación matemática (operador módulo)
    return typeof valor === 'number' &&
        !isNaN(valor) &&
        Number.isInteger(valor) &&
        valor >= 0 &&
        valor % 2 === 0;
}
