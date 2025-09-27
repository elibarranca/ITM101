// materials.js

// Get the task from the command line
const args = process.argv.slice(2);
const task = args[0]?.toLowerCase();

// Data for materials & tools
const materialsAndTools = {
  shelf: {
    materials: ["Shelf board", "Wall anchors", "Screws"],
    tools: ["Drill", "Screwdriver", "Measuring tape", "Level"]
  },
  shed: {
    materials: [
      "Wood planks",
      "Concrete or wood foundation",
      "Roofing material",
      "Siding",
      "Nails & screws"
    ],
    tools: ["Hammer", "Saw", "Drill", "Measuring tape", "Level", "Ladder"]
  },
  fence: {
    materials: ["Fence posts", "Wooden panels or planks", "Concrete mix", "Nails & screws"],
    tools: ["Shovel", "Hammer", "Drill", "Measuring tape", "Level", "Post hole digger"]
  }
};

// Show results
if (!task) {
  console.log("Please provide a project name (shelf, shed, fence). Example:");
  console.log("  node materials.js shed");
} else if (!materialsAndTools[task]) {
  console.log(`Sorry, I don't have materials & tools for '${task}'.`);
  console.log("Available options: shelf, shed, fence");
} else {
  console.log(`Materials & Tools for building a ${task}:`);
  console.log("---------------------------------------");
  console.log("Materials:");
  materialsAndTools[task].materials.forEach(m => console.log("- " + m));
  console.log("\nTools:");
  materialsAndTools[task].tools.forEach(t => console.log("- " + t));
}
node materials.js shed
node materials.js shelf
node materials.js fence
