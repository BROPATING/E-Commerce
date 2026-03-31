import e, { NextFunction, Request, Response } from 'express';
import { ProductService } from '../services/product.service';

/**
 * Fetches the complete product taxonomy tree.
 * @route GET /api/products/taxonomy
 */
export const getTaxonomy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const taxonomy = await ProductService.getTaxonomy();
        res.json({ taxonomy });
    } catch (err) {
        next(err);
    }
};

/**
 * Retrieves a paginated list of products based on various search and filter criteria.
 * Supports filtering by taxonomy hierarchy, price range, and stock availability.
 * @route GET /api/products
 * @query {string} [search] - Keyword search for name or description.
 * @query {number} [typeId] - Filter by top-level Product Type.
 * @query {number} [categoryId] - Filter by Category.
 * @query {number} [subCategoryId] - Filter by SubCategory.
 * @query {number} [minPrice] - Minimum price threshold.
 * @query {number} [maxPrice] - Maximum price threshold.
 * @query {boolean} [inStock] - If true, only returns items with stock > 0.
 * @query {number} [page=1] - The page number for results.
 * @query {number} [limit=12] - Number of items per page.
 */
export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const {
            search, typeId, categoryId, subCategoryId,
            minPrice, maxPrice, inStock, page, limit,
        } = req.query;
        const result = await ProductService.getProducts({
            search: search as string | undefined,
            typeId: typeId ? Number(typeId) : undefined,
            categoryId: categoryId ? Number(categoryId) : undefined,
            subCategoryId: subCategoryId ? Number(subCategoryId) : undefined,
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
            inStock: inStock === 'true',
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 12,
        });
        res.json({ result });
    } catch (err) {
        next(err);
    }
};

/**
 * Retrieves full details for a single product, including its taxonomy path.
 * @route GET /api/products/:id
 * @param {string} id - The numeric ID of the product.
 */
export const getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => { 
    try {
        const id = Number(req.params.id);
        if(isNaN(id)) {
            res.status(400).json({Error: "Invalid Product ID"}); 
            return;
        }
        const result = await ProductService.getProductById(id);
        res.json({result});
    } catch (err) {
        next(err);
    }
};