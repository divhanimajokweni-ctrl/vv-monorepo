import { bootstrapWorker } from "./bootstrap";
async function main() {
    await bootstrapWorker();
}
main().catch((error) => {
    console.error("worker_boot_failed", error);
    process.exit(1);
});
