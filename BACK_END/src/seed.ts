import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from './config/data-source';
import { ProductType } from './entities/ProductType';
import { Category } from './entities/Category';
import { SubCategory } from './entities/SubCategory';
import { Product } from './entities/Product';
import { User, UserRole } from './entities/User';
import bcrypt from 'bcrypt';
/**
 * SEED SCRIPT: Data Initialization
 * Purpose: Populates the database with initial admin users and product taxonomy.
 * Strategy: Uses "Idempotent" helpers (Find-or-Create) to prevent duplicate data on re-runs.
 */
async function seed() {
  // Establish connection with the database using the shared Data Source
  await AppDataSource.initialize();
  console.log('Database connected. Starting seed...');

  // Initialize repositories for database operations
  const productTypeRepo   = AppDataSource.getRepository(ProductType);
  const categoryRepo      = AppDataSource.getRepository(Category);
  const subCategoryRepo   = AppDataSource.getRepository(SubCategory);
  const productRepo       = AppDataSource.getRepository(Product);
  const userRepo          = AppDataSource.getRepository(User);

  // ─── 1. ADMIN ACCOUNT ───────────────────────────────────────────────────────
  /**
   * Ensures a default Admin exists for initial dashboard access.
   * Bcrypt with 12 salt rounds is used for industry-standard password security.
   */ 
  const adminEmail = 'admin@gmail.com';
  let admin = await userRepo.findOne({ where: { email: adminEmail } });
  if (!admin) {
    const passwordHash = await bcrypt.hash('admin123', 12);
    admin = userRepo.create({
      name: 'Admin',
      email: adminEmail,
      passwordHash,
      role: UserRole.ADMIN,
      isLocked: false,
    });
    await userRepo.save(admin);
    console.log('Admin account created:', adminEmail);
  } else {
    console.log('Admin already exists, skipping.');
  }

  // ─── 2. TAXONOMY ────────────────────────────────────────────────────────────
  // Helper: find or create a ProductType
  /**
   * These helpers maintain relational integrity by ensuring Parent-Child links
   * are established correctly without throwing "Duplicate Entry" errors.
   */
  async function findOrCreateType(name: string): Promise<ProductType> {
    let type = await productTypeRepo.findOne({ where: { name } });
    if (!type) {
      type = productTypeRepo.create({ name });
      await productTypeRepo.save(type);
    }
    return type;
  }

  // Helper: find or create a Category under a Type
  async function findOrCreateCategory(name: string, type: ProductType): Promise<Category> {
    let cat = await categoryRepo.findOne({ where: { name } });
    if (!cat) {
      cat = categoryRepo.create({ name, type });
      await categoryRepo.save(cat);
    }
    return cat;
  }

  // Helper: find or create a SubCategory under a Category
  async function findOrCreateSubCategory(name: string, category: Category): Promise<SubCategory> {
    let sub = await subCategoryRepo.findOne({ where: { name } });
    if (!sub) {
      sub = subCategoryRepo.create({ name, category });
      await subCategoryRepo.save(sub);
    }
    return sub;
  }

  // ── Electronics ─────────────────────────────────────────────────────────────
  // Structuring the E-Commerce catalog: Type -> Category -> SubCategory
  const electronics = await findOrCreateType('Electronics');
  const peripherals = await findOrCreateCategory('Computer Peripherals', electronics);
  const keyboards   = await findOrCreateSubCategory('Keyboards', peripherals);
  const mice        = await findOrCreateSubCategory('Mice', peripherals);
  const monitors    = await findOrCreateSubCategory('Monitors', peripherals);

  const phones      = await findOrCreateCategory('Mobile Phones', electronics);
  const android     = await findOrCreateSubCategory('Android Phones', phones);
  const iphones     = await findOrCreateSubCategory('iPhones', phones);

  // ── Stationery ───────────────────────────────────────────────────────────────
  const stationery  = await findOrCreateType('Stationery');
  const kids        = await findOrCreateCategory('Kids', stationery);
  const textbooks   = await findOrCreateSubCategory('Textbooks', kids);
  const artSupplies = await findOrCreateSubCategory('Art Supplies', kids);

  const office      = await findOrCreateCategory('Office Supplies', stationery);
  const notebooks   = await findOrCreateSubCategory('Notebooks', office);

  // ── Furniture ────────────────────────────────────────────────────────────────
  const furniture   = await findOrCreateType('Furniture');
  const living      = await findOrCreateCategory('Living Room', furniture);
  const tables      = await findOrCreateSubCategory('Tables', living);
  const sofas       = await findOrCreateSubCategory('Sofas', living);

  const study       = await findOrCreateCategory('Study Room', furniture);
  const chairs      = await findOrCreateSubCategory('Chairs', study);

  console.log('Taxonomy created.');

  // ─── 3. SAMPLE PRODUCTS ─────────────────────────────────────────────────────
  // Helper: find or create a product by name
  /**
   * Populates the catalog with dummy products to test UI layouts and search logic.
   * Links products to their respective leaf-node (SubCategory).
   */
  async function findOrCreateProduct(
    name: string,
    description: string,
    price: number,
    stock: number,
    subCategory: SubCategory,
  ): Promise<void> {
    const exists = await productRepo.findOne({ where: { name } });
    if (!exists) {
      const product = productRepo.create({
        name, description, price, stock, subCategory,
        imagePath: null,
      });
      await productRepo.save(product);
    }
  }

  await findOrCreateProduct(
    'Anker Multimedia Keyboard',
    'Full-size USB keyboard with quiet keys and multimedia shortcuts.',
    1499, 50, keyboards,
  );
  await findOrCreateProduct(
    'Logitech MX Keys',
    'Premium wireless keyboard with backlit keys and multi-device support.',
    8999, 30, keyboards,
  );
  await findOrCreateProduct(
    'Logitech G502 Mouse',
    'High-performance gaming mouse with adjustable DPI and RGB lighting.',
    4999, 40, mice,
  );
  await findOrCreateProduct(
    'Dell 27" Monitor',
    'Full HD IPS display with ultra-thin bezels and 75Hz refresh rate.',
    18999, 15, monitors,
  );
  await findOrCreateProduct(
    'Samsung Galaxy S24',
    'Flagship Android smartphone with 200MP camera and 5G support.',
    74999, 25, android,
  );
  await findOrCreateProduct(
    'iPhone 15 Pro',
    'Apple flagship with titanium frame, A17 Pro chip, and ProRAW camera.',
    134999, 20, iphones,
  );
  await findOrCreateProduct(
    'Multiplication Table Book',
    'Illustrated maths textbook for kids covering tables from 1 to 20.',
    299, 100, textbooks,
  );
  await findOrCreateProduct(
    'Watercolour Paint Set',
    '24-colour professional watercolour set with reusable tin case.',
    899, 60, artSupplies,
  );
  await findOrCreateProduct(
    'Wooden Table',
    'Solid oak dining table with four legs and a smooth lacquered finish.',
    12999, 10, tables,
  );
  await findOrCreateProduct(
    'Ergonomic Study Chair',
    'Adjustable lumbar support chair ideal for long study sessions.',
    6999, 20, chairs,
  );
  await findOrCreateProduct(
    'Three-Seater Sofa',
    'Modern fabric sofa with removable cushion covers, available in grey.',
    24999, 8, sofas,
  );
  await findOrCreateProduct(
    'A5 Spiral Notebook',
    '200-page ruled notebook with thick covers and a spiral binding.',
    199, 200, notebooks,
  );

  console.log('Sample products created.');
  console.log('Seed completed successfully.');
  await AppDataSource.destroy();
}

/**
 * PROCESS WRAPPER
 * Executes the seed and catches fatal errors to provide a non-zero exit code.
 */
seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});