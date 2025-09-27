// add.js

// Get the arguments (skip first two: "node" and filename)
const args = process.argv.slice(2);

// Convert arguments to numbers
const num1 = Number(args[0]);
const num2 = Number(args[1]);

// Check if inputs are valid numbers
if (isNaN(num1) || isNaN(num2)) {
  console.log("Please provide two valid numbers.");
  process.exit(1);
}

const sum = num1 + num2;

console.log(`${num1} + ${num2} = ${sum}`);
