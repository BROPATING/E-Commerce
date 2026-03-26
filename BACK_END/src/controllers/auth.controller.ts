import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import bcrypt from 'bcrypt';

const userRepo = AppDataSource.getRepository(User);

export const register = async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    try {
        let user = await userRepo.findOne({ where: { email: email } });
        if (!user) {
            const passwordHash = await bcrypt.hash(password, 12);
            const newUser = userRepo.create({
                name,
                email,
                passwordHash
            });
            await userRepo.save(newUser);
            res.status(201).json({
                message: "User Registered Successfully",
                user: { id: newUser.id, email: newUser.email }
            })
        } else {
            res.status(400).json({ message: "User Already Exist" });
        }
    } catch (err) {
        console.error("Registration Error: ", err);
        res.status(500).json({
            message: "Registration Failed",
            error: "Error: ", err
        });
    }
};
export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        let user = await userRepo.findOne({ where: { email: email } });
        if (user) {
            const isPassword = await bcrypt.compare(password, user.passwordHash);
            if (!isPassword) {
                // Added 'return' so it stops here if password is wrong
                return res.status(401).json({
                    message: "Invalid Credential",
                    error: "Incorrect Password"
                });
            }
        } else {
            return res.status(401).json({
                message: "Invalid Credential",
                error: "User Not Exist"
            });
        }
        // This only runs if the 'if' and 'else' above didn't trigger a return
        return res.status(201).json({
            message: "Login Successfull",
            user: { id: user.id, email: user.email, name: user.name }
        })
    }
    catch (err) {
        res.status(500).json({
            message: "Login failed",
            error: `Error: ${err}`
        });
    }
}

export const deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        let user = await userRepo.findOne({ where: { id: parseInt(id as string) } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        await userRepo.remove(user);
        return res.status(200).json({ message: "User deleted successfully", userId: id, name: user.name});
    } catch (err) {
        return res.status(500).json({ message: "Delete failed", error: err });
    }
}
export const logout = (_req: Request, res: Response) => { res.status(501).json({ message: 'Not implemented' }); };
export const forgotPassword = (_req: Request, res: Response) => { res.status(501).json({ message: 'Not implemented' }); };
export const resetPassword = (_req: Request, res: Response) => { res.status(501).json({ message: 'Not implemented' }); };
export const getMe = (_req: Request, res: Response) => { res.status(501).json({ message: 'Not implemented' }); };