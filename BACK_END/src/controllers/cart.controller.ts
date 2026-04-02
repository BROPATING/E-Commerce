import { NextFunction, Request, Response } from 'express';
import { CartSerice } from '../services/cart.service';

/**
 * Get the current user's cart.
 * Takes the JWT token from the user 
 * @param req Express request (expects authenticated user)
 * @param res Express response
 * @param next Express next middleware
 * @returns JSON cart contents
 */
export const getCart = async (req: Request, res: Response, next: NextFunction):Promise<void> => { 
    try {
        // "Trust me, I've already checked the JWT token, the user exists."
        const getUserCart = await CartSerice.getCart(req.user!.id);
        res.json(getUserCart);
    } catch (err) {
        next(err);
    }
};

/**
 * Controller: Add an item to the cart.
 * - Validates that productId is provided in the request body.
 * - Defaults quantity to 1 if not specified.
 * - Delegates addition logic to CartService.
 * @params res with 201 Created and the new cart item.
 */
export const addToCart = async (req: Request, res: Response, next: NextFunction):Promise<void> => { 
    try {
        const {productId, quantity = 1} = req.body;
        if(!productId) {res.status(400).json(({Error: "ProductId is required"})); return;}
        
        const item = await CartSerice.addToCart(req.user!.id, Number(productId), Number(quantity));
        res.status(201).json({message: "Item Added To Cart", item});
    } catch (err) {
        next(err);
    }
};

/**
 * Controller: Update the quantity of an existing cart item.
 * - Validates that productId and quantity are provided.
 * - Delegates update logic to CartService.
 * Responds with 200 OK and the updated cart item.
 */
export const updateCartItem = async (req: Request, res: Response, next: NextFunction):Promise<void> => { 
    try {
        const {productId, quantity} = req.body;
        if(!productId || quantity === undefined) {
            res.status(400).json({Error: "ProductId is Required"});
            return;
        }
        const update = await CartSerice.updateCartItem(req.user!.id, productId, quantity);
        res.json({message: "Cart Updated Successfully", update});
    } catch (err) {
        next(err);
    }
};

/**
 * Controller: Remove an item from the cart.
 * - Validates productId from route params.
 * - Delegates removal logic to CartService.
 * Responds with 200 OK and confirmation message.
 */
export const removeFromCart = async (req: Request, res: Response, next: NextFunction):Promise<void> => { 
    try {
        const prodId = Number(req.params.productId);
        if(!prodId){
            res.status(400).json({Error: "Invalid ProductId"});
            return;
        }
        const result = await CartSerice.removeFromCart(req.user!.id, prodId);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

/**
 * Clear all items from the user's cart
 * @param next Express next middleware
 * @returns JSON confirmation message
 */
export const clearCart = async (req: Request, res: Response, next: NextFunction):Promise<void> => { 
    try {
        const result = await CartSerice.clearCart(req.user!.id);
        res.json(result);
    } catch (err) {
        next(err);
    }
};