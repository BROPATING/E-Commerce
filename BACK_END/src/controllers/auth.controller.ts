import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { AuthService } from '../services/auth.service';

const userRepo = AppDataSource.getRepository(User);

/**
 * Validation rules for registration.
 * These run as middleware before the controller function.
 */
export const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 3 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
];
export const register = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
     try {
    // Check validation results from express-validator middleware
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { name, email, password } = req.body;
    const user = await AuthService.register(name, email, password);

    res.status(201).json({
      message: 'Account created successfully',
      user,
    });
  } catch (err) {
    next(err); // Passes to global error handler declare in app.ts 500
  }
};

export const login = async(req: Request, res: Response) => {
    const {email, password} = req.body;
    const user = await AuthService.login(email, password);

    res.status(201).json({message: "Login Successfull", user});
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

/**
 * export const register = async (req: Request, res: Response) => {
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
 */

/**
 * export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const userRepo = await AppDataSource.getRepository(User);
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
 */
