import bcrypt from 'bcrypt';
import { AppDataSource } from '../config/data-source';
import { User, UserRole } from '../entities/User';

// ── Seed data ─────────────────────────────────────────────────────────
const ADMIN_USER = {
  name:     "Store Admin",
  email:    "admin@gmail.com",
  password: "Admin@123",
  role:     UserRole.ADMIN,
};

const CUSTOMER_USERS = [
  { name: "Kiro",  email: "kiro@gmail.com", password: "kiro123" },
  { name: "Sanya", email: "san@gmail.com",  password: "san123"  },
  { name: "Ved",   email: "ved@gmail.com",  password: "ved123"  },
  { name: "Sao",   email: "sao@gmail.com",  password: "sao123"  },
];

// ── Helpers ───────────────────────────────────────────────────────────
async function upsertUser(
  userRepo: ReturnType<typeof AppDataSource.getRepository<User>>,
  data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }
): Promise<boolean> {
  const existing = await userRepo.findOne({ where: { email: data.email } });
  if (existing) return false;   // already exists — skip

  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = userRepo.create({
    name:         data.name,
    email:        data.email,
    passwordHash,
    role:         data.role,
    isLocked:     false,
  });
  await userRepo.save(user);
  return true;
}

// ── Main export ───────────────────────────────────────────────────────
export async function seedAdmin(): Promise<void> {
  const userRepo = AppDataSource.getRepository(User);

  // ── Admin ──────────────────────────────────────────────────────────
  const adminCreated = await upsertUser(userRepo, {
    ...ADMIN_USER,
    role: UserRole.ADMIN,
  });

  if (adminCreated) {
    console.log(`  ✓ Admin   : ${ADMIN_USER.email} / ${ADMIN_USER.password}`);
  } else {
    console.log(`  Admin already exists, skipping.`);
  }

  // ── Customers ──────────────────────────────────────────────────────
  let created = 0;
  for (const customer of CUSTOMER_USERS) {
    const wasCreated = await upsertUser(userRepo, {
      ...customer,
      role: UserRole.CUSTOMER,
    });
    if (wasCreated) {
      console.log(`  ✓ Customer: ${customer.email} / ${customer.password}`);
      created++;
    }
  }

  if (created === 0) {
    console.log(`  Customer accounts already exist, skipping.`);
  }
}