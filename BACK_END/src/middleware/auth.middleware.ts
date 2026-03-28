import { Request, Response, NextFunction } from "express"
import { SessionStore } from "./sessionStore";
import { AppDataSource } from "../config/data-source";
import { User, UserRole } from "../entities/User";
import jwt from "jsonwebtoken";

/**
 * Extends Express's Request interface to carry the authenticated user
 */
declare global {
    namespace Express {
        interface Request {
            user?: User
        }
    }
}

interface JwtPayLoad {
    userId: number,
    role: string,
    email: string
}

/**
 * Authenticate Middleware
 * Validate JWT token
 * Store the session
 * Attaches the full User object to req.user on success.
 * Must be applied to every protected route. 
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.cookies?.authToken;
        if (!token) {
            res.status(401).json({ error: "Authentication required" });
            return;
        }

        let payLoad: JwtPayLoad;
        try {
            // ! is undefined or string 
            payLoad = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayLoad;
        } catch (err) {
            res.status(401).json({ Error: "Invalid or expired token" });
            return;
        }

        const session = SessionStore.get(token);
        if (!session) {
            res.status(401).json({ Error: "Session expired. Please login again" });
            return;
        }

        const userRepo = await AppDataSource.getRepository(User);
        const user = await userRepo.findOne({ where: { id: payLoad.userId } });
        if (!user) {
            SessionStore.deleteToken(token);
            res.status(401).json({ Error: "User no longer exist" });
            return;
        }

        if (user.isLocked) {
            SessionStore.deleteAllForUser(token);
            res.status(401).json({ Error: "Your account is locked. Please contact support." });
            return;
        }
        req.user = user;
        next();

    } catch (err) {
        next();
    }
}

/**
 * Middleware that restrict the access as per the role
 * @param roles - One or more UserRoles allowed to access the route.
 * @returns An Express middleware function.
 */
export const requireRole = (...roles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if(!req.user || !roles.includes(req.user.role as UserRole)){
            res.status(401).json({error: "Permission denied to access this resource"});
            return;
        }
        next();
    }
}

/**
 * OPTIONAL AUTH MIDDLEWARE (Basically for the Guest)
 * Tries to authenticate but does not block the request if no token exists. 
 * Used on public routes where logged-in users get extra capabilities
 * (e.g., product detail page shows "Add to Cart" only when logged in).
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies?.authToken;
        if(!token) return next();

        const payLoad = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayLoad;

        const session = SessionStore.get(token);
        if(!session) return next();

        const userRepo = await AppDataSource.getRepository(User);
        const user = await userRepo.findOne({where: {id: payLoad.userId}});
        if(user && !user.isLocked) req.user = user;

        next();
    } catch (error) {
        console.log("Optional Auth Error: ", error);
        next();
    }
}


/**
 * declare global
    This tells TypeScript, "I'm not just talking about this one file; I want to change a definition that exists across 
    the entire project." Without this, your changes would only work inside the middleware file.

 * namespace Express
    Express organizes its types inside a "namespace" (think of it as a folder for code). 
    You are telling TypeScript you want to open that specific folder to make an adjustment.

 * ?: This means it is optional. Why? Because when a request first hits your server (like a login request), 
    there is no user attached yet! It only exists after your auth middleware runs.
 */
