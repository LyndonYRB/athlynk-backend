import "dotenv/config";
import { prisma } from "../src/config/prisma.js";
import { hashPassword } from "../src/utils/auth.js";

const password = "password123";

const users = [
  {
    email: "lyndon@example.com",
    phone: "5550001001",
    profile: {
      name: "Lyndon",
      age: 30,
      gender: "male",
      location: "New York, NY",
      skill: "intermediate",
      availability: ["morning", "evening"],
      bio: "Looking for consistent workout partners.",
      interests: ["strength", "running"],
    },
  },
  {
    email: "alex@example.com",
    phone: "5550001002",
    profile: {
      name: "Alex",
      age: 28,
      gender: "male",
      location: "Brooklyn, NY",
      skill: "intermediate",
      availability: ["evening"],
      bio: "Strength training partner.",
      interests: ["strength", "running"],
    },
  },
  {
    email: "maya@example.com",
    phone: "5550001003",
    profile: {
      name: "Maya",
      age: 27,
      gender: "female",
      location: "Queens, NY",
      skill: "beginner",
      availability: ["weekends"],
      bio: "Pilates and mobility sessions on weekends.",
      interests: ["pilates", "mobility"],
    },
  },
];

const defaultPreferences = {
  preferredActivities: ["strength", "running"],
  genderPref: "any",
  ageMin: 18,
  ageMax: 60,
  radius: 25,
  availabilityFilterOn: false,
  availabilityPref: [],
  skillPref: "any",
};

async function main() {
  const passwordHash = await hashPassword(password);

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      create: {
        email: user.email,
        phone: user.phone,
        passwordHash,
        profile: { create: user.profile },
        preference: { create: defaultPreferences },
      },
      update: {
        phone: user.phone,
        passwordHash,
        profile: { upsert: { create: user.profile, update: user.profile } },
        preference: {
          upsert: { create: defaultPreferences, update: defaultPreferences },
        },
      },
    });
  }

  console.log(`Seeded ${users.length} users. Password for all: ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
