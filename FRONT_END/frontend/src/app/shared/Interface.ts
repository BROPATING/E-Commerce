export interface User{
    name: string,
    email: string,
    role: 'customer' | 'admin',
    isLocked: boolean,
    createdAt: string | Date;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  imagePath: string | null;
  subCategory?: {
    id: number;
    name: string;
    category: {
      id: number;
      name: string;
      type: { id: number; name: string; };
    };
  };
  createdAt: string;
}

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

export interface ProductsResponse {
  products: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TaxonomyType {
  id: number;
  name: string;
  categories: {
    id: number;
    name: string;
    subCategories: { id: number; name: string; }[];
  }[];
}

export interface CartItem {
  id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number;
    imagePath: string | null;
    stock: number;
  };
}

export interface Cart {
  items: CartItem[];
  total: number;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  isLocked: boolean;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  quantity: number;
  priceAtPurchase: number;
  product: {
    id: number;
    name: string;
    imagePath: string | null;
    price: number;
  };
}

export interface Order {
  id: number;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  items?: OrderItem[];
  user?: {
    id: number;
    name: string;
    email: string;
    createdAt: string | Date;
  };
}

