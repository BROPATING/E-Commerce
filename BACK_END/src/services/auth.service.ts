import strict from "node:assert/strict";
import { AppDataSource } from "../config/data-source";
import { User, UserRole } from "../entities/User";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import { SessionStore } from "../middleware/sessionStore";

const SALT_ROUND = 12;
const JWT_EXPIRES_IN = '7d';
const RESET_CODE_EXPIRY_MINUTES = 10;

/**
   * Registers a new customer account.
   * Validates uniqueness, hashes the password, persists the user.
   * Returns the created user (without passwordHash).
   */
/*
* In simple terms, Omit is a TypeScript "Utility Type" that acts like a filter for your objects. 
   * It tells TypeScript: "Takethe User type, but remove the passwordHash property from it."
   * Why do we use it?
   * When you define your User entity, it includes the passwordHash. However, in your AuthService.register, 
   * you are returning the user data to the frontend.
   * You never, ever want to send a password hash to the frontend, even if it's hashed. By using Omit, you are creating a "Safe
   * User" type for your return value.* */
export const AuthService = {
    async register(name: string, email: string, password: string): Promise<Omit<User, 'passwordHash'>> {
        const normalisedEmail = email.toLowerCase().trim();
        const userRepo = await AppDataSource.getRepository(User);
        const existing = await userRepo.findOne({ where: { email: normalisedEmail } });
        if (existing) {
            const error: any = new Error('An account with this email already exists');
            error.status = 409; // 409 Conflict — resource already exists
            throw error;
        }
        const passwordHash = await bcrypt.hash(password, SALT_ROUND);
        const user = userRepo.create({
            name: name.trim(),
            email: normalisedEmail,
            passwordHash,
            role: UserRole.CUSTOMER,
            isLocked: false
        });

        const saved = await userRepo.save(user);

        // Strip passwordHash before returning — never send it over the wire
        const { passwordHash: _, ...safeUser } = saved;
        return safeUser as Omit<User, 'passwordHash'>;
    },

    async login(email: string, password: string): Promise<{token: string; user: Omit<User, 'passwordHash'>}>{
        const userRepo = await AppDataSource.getRepository(User);
        const normalisedEmail = email.toLowerCase().trim();
        const user = await userRepo.findOne({where: {email: normalisedEmail}});
        const isMatch = await bcrypt.compare(password, user?.passwordHash!); 

        if(!user || !isMatch){
            const error: any = new Error("Invalid Credential");
            error.status = 403;
            throw error;
        }
    
        if(user.isLocked){
            const error: any = new Error("Your Account is Locked");
            error.status = 403;
            throw error;
        }

        const token = jwt.sign(
            {
                useeId: user.id,
                role: user.role,
                email: user.email
            },
            process.env.JWT_SECRET!,
            {
                expiresIn: JWT_EXPIRES_IN
            }
        )

        SessionStore.set(token, {
            userId: user.id,
            role: user.role,
            email: user.email
        })

        const {passwordHash: _, ...safeUser} = user;
        return {token, user: safeUser as Omit<User, 'passwordHash'>};
    },

    logout(token: string): void{
        SessionStore.deleteToken(token);
    },

    async getMe(userId: number): Promise<Omit<User, 'passwordHash'>>{
        const userRepo = await AppDataSource.getRepository(User);
        const user = await userRepo.findOne({where: {id: userId}});

        if(!user){
            const error: any = new Error("User not found");
            error.status = 404;
            throw error;
        }

        const {passwordHash: _, ...safeUser} = user;
        return safeUser as Omit<User, 'passwordHash'>;
    }
}


/**
 * {
  id: number;
  name: string;
  email: string;
  role: string;
  passwordHash: string; // The "dangerous" part
}

* {
  id: number;
  name: string;
  email: string;
  role: string;
  // passwordHash is GONE!
}
 */