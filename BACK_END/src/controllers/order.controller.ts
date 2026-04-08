import { NextFunction, Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import { ApiError } from '../utils/ApiError/ApiError';

/**
 * Get all orders for the authenticated user.
 */
export const getMyOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => { 
    try {
        const result = await OrderService.getMyOrders(req.user!.id);
        res.json({orders: result});
    } catch (err) {
        next(err);
    }
};

/**
 * Get a specific order by ID for the authenticated user.
 */
export const getOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => { 
    try {
        const orderId = Number(req.params.id);
        if(!orderId) throw new ApiError("User Id Is Required", 400);
        const order = await OrderService.getOrderById(req.user!.id, orderId);
        res.json(order);
    } catch (err) {
        next(err);
    }
};

/**
 * Place a new order with a payment method.
 */
export const checkout = async (req: Request, res: Response, next: NextFunction): Promise<void> => { 
    try {
        const { paymentMethod } = req.body;
        if(!paymentMethod) {
            res.status(400).json({Error: "Payment Method Is Required"});
            return;
        }
        const order = await OrderService.checkout(req.user!.id, paymentMethod);
        res.status(201).json({message: "Order Placed Successfully", 
            order});
    } catch (err) {
        next(err);
    }
};