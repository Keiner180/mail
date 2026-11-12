import { initializeDefaultProviderApps } from "../src/lib/provisioning/init-defaults";

async function main() {
  console.log("Starting Enterprise Defaults Seeding...");
  await initializeDefaultProviderApps();
  console.log("Enterprise Defaults Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error during enterprise seeding:", e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
