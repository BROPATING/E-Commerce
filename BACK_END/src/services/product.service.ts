import { AppDataSource } from "../config/data-source";
import { getProductById, getProducts, getTaxonomy } from "../controllers/product.controller";
import { Product } from "../entities/Product";
import { ProductType } from "../entities/ProductType";

/**
 * Interface representing the available filters and pagination options for product queries.
 */
export interface ProductQuery {
    search?: string;
    typeId?: number;
    categoryId?: number;
    subCategoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    page?: number;
    limit?: number;
}

/**
 * Service handling all product-related database operations.
 */
export const ProductService = {
    /**
     * Retrieves all Product Types with their nested Categories and SubCategories.
     * Used for generating site navigation and filter sidebars.
     * @returns {Promise<ProductType[]>} A hierarchical tree of the taxonomy.
     */
    async getTaxonomy() {
        const typeRepo = await AppDataSource.getRepository(ProductType);
        return typeRepo.find({
            relations: {
                categories: {
                    subCategories: true,
                },
            },
            order: { name: 'ASC' },
        });
    },

    /**
     * Queries the database for products matching the provided filters.
     * Implements case-insensitive search, hierarchical taxonomy filtering, and pagination.
     * @param {ProductQuery} query - The filtering and pagination parameters.
     * @returns {Promise<{ products: Product[], pagination: object }>} Paginated product data.
     */
    async getProducts(query: ProductQuery) {
        // const productRepo = await AppDataSource.getRepository(Product);
        const {
            search,
            typeId,
            categoryId,
            subCategoryId,
            minPrice,
            maxPrice,
            inStock,
            page = 1,
            limit = 12,
        } = query;

        const qb = AppDataSource.getRepository(Product)
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.subCategory', 'subcategory') //Connects the Product to its Subcategory.
            .leftJoinAndSelect('subcategory.category', 'category') //Uses the Subcategory we just joined to find its parent Category.
            .leftJoinAndSelect('category.type', 'type') //Uses that Category to find the top-level Product Type.

        if (search && search.trim()) {
            //This adds an extra condition to your SQL query. 
            // It uses AND, meaning the product must match the previous filters (like typeId) AND this search term.
            qb.andWhere(
                //:search -> placeholder
                '(LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.description) LIKE LOWER(:search))',
                //The % symbol is a SQL wildcard that means "anything can be here."
                // %phone%: Will find "iPhone", "phone case", or "microphone". It looks for the word anywhere inside the text.
                { search: `%${search.trim()}%` },
            );
        }

        // ── Taxonomy filters — each is independent, can be combined ──────────────
        if (subCategoryId) {
            qb.andWhere('subCategory.id = :subCategoryId', { subCategoryId });
        } else if (categoryId) {
            qb.andWhere('category.id = :categoryId', { categoryId });
        } else if (typeId) {
            qb.andWhere('type.id = :typeId', { typeId });
        }

        // ── Price range filter ────────────────────────────────────────────────────
        if (minPrice !== undefined) {
            qb.andWhere('product.price >= :minPrice', { minPrice });
        }
        if (maxPrice !== undefined) {
            qb.andWhere('product.price <= :maxPrice', { maxPrice });
        }

        // ── In-stock filter (bonus filter) ────────────────────────────────────────
        if (inStock) {
            qb.andWhere('product.stock > 0');
        }

        // ── Pagination ────────────────────────────────────────────────────────────
        const safePage = Math.max(1, page);
        const safeLimit = Math.min(Math.max(1, limit), 50); // cap at 50 per page but 12 cause declare limit as 12
        const offset = (safePage - 1) * safeLimit;

        qb.orderBy('product.createdAt', 'DESC')  //newest products first
            .skip(offset)
            .take(safeLimit);

        const [products, total] = await qb.getManyAndCount();

        return {
            products,
            pagination: {
                total,
                page: safePage,
                limit: safeLimit,
                totalPages: Math.ceil(total / safeLimit),
            },
        };
    },

    /**
     * Finds a single product by its primary key.
     * Performs a left join to include the full SubCategory -> Category -> Type path.
     * @param {number} id - The unique ID of the product.
     * @throws {Error} 404 - If the product does not exist.
     * @returns {Promise<Product>} The found product entity.
     */
    async getProductById(id: number) {
        const product = await AppDataSource.getRepository(Product)
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.subCategory', 'subCategory')
            .leftJoinAndSelect('subCategory.category', 'category')
            .leftJoinAndSelect('category.type', 'type')
            .where('product.id = :id', { id })
            .getOne();
        
        if(!product){
            const error: any = new Error("Product not found");
            error.status = 404;
            throw error;
        }

        return product;
    }
}