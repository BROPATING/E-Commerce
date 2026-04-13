import { AppDataSource } from "../config/data-source";
import { Category } from "../entities/Category";
import { ProductType } from "../entities/ProductType";
import { SubCategory } from "../entities/SubCategory";

export async function seedTaxonomy(): Promise<void> {
  const typeRepo = AppDataSource.getRepository(ProductType);
  const catRepo = AppDataSource.getRepository(Category);
  const subRepo = AppDataSource.getRepository(SubCategory);

  // Skip if data already exists
  const count = await typeRepo.count();
  if (count > 0) {
    console.log("  Taxonomy already seeded, skipping.");
    return;
  }

  // Define the full taxonomy tree
  const taxonomy = [
    {
      name: "Electronics",
      categories: [
        {
          name: "Computer Peripherals",
          subCategories: ["Keyboards", "Mice", "Monitors", "Webcams"],
        },
        {
          name: "Mobile Accessories",
          subCategories: ["Chargers", "Cases", "Earphones"],
        },
      ],
    },
    {
      name: "Stationery",
      categories: [
        {
          name: "Writing",
          subCategories: ["Pens", "Pencils", "Markers"],
        },
        {
          name: "Kids",
          subCategories: ["Textbooks", "Activity Books", "Art Supplies"],
        },
      ],
    },
    {
      name: "Furniture",
      categories: [
        {
          name: "Home",
          subCategories: ["Tables", "Chairs", "Shelves"],
        },
        {
          name: "Office",
          subCategories: ["Desks", "Office Chairs", "Storage"],
        },
      ],
    },
  ];

  for (const typeData of taxonomy) {
    // Save the ProductType
    const productType = typeRepo.create({ name: typeData.name });
    await typeRepo.save(productType);

    for (const catData of typeData.categories) {
      // Save the Category linked to the ProductType
      const category = catRepo.create({
        name: catData.name,
        type: productType,
      });
      await catRepo.save(category);

      for (const subName of catData.subCategories) {
        // Save each SubCategory linked to the Category
        const sub = subRepo.create({
          name: subName,
          category,
        });
        await subRepo.save(sub);
      }
    }
  }

  console.log("Taxonomy seeded: 3 types, 6 categories, 18 sub-categories.");
}