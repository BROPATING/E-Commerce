export interface User{
    name: string,
    email: string,
    role: 'customer' | 'admin',
    isLocked: boolean,
    createdAt: string
}