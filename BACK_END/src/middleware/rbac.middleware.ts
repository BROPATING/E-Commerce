import { Request, Response, NextFunction } from "express"
import { UserRole } from "../entities/User";

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