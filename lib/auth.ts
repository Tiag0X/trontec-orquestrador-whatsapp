import { SignJWT, jwtVerify } from 'jose'

const secretKey = process.env.JWT_SECRET_KEY || 'trontec-super-secret-key-123!@#' // Should be in .env in production
const encodedKey = new TextEncoder().encode(secretKey)

export type SessionPayload = {
    userId: string
    role: string
    email: string
    permissions: string[]
}

export async function encrypt(payload: SessionPayload) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(encodedKey)
}

export async function decrypt(token: string | undefined = '') {
    try {
        const { payload } = await jwtVerify(token, encodedKey, {
            algorithms: ['HS256'],
        })
        return payload as SessionPayload
    } catch (error) {
        return null
    }
}
