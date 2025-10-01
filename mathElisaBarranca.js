/* hello.js
console.log("Hello, world!");
cd path/to/your/file
node hello.js

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

// divide.js
function divideNumbers(a, b) {
  if (typeof a !== "number" || typeof b !== "number") {
    console.log("Both arguments must be numbers.");
    return;
  }

  if (b === 0) {
    console.log("Cannot divide by zero.");
    return;
  }

  return a / b;
}

// Examples:
console.log(divideNumbers(10, 2));   // 5
console.log(divideNumbers(10, 0));   // Cannot divide by zero.
console.log(divideNumbers("x", 2));  // Both arguments must be numbers.
*/
// mathOperations.js

// Get arguments from the command line (skip first two: "node" and filename)
const args = process.argv.slice(2);

// Check if we have exactly three arguments
if (args.length !== 3) {
  console.log("Usage: node mathOperations.js <num1> <operation> <num2>");
  console.log("Operations supported: add, sub, mul, div, exp");
  process.exit(1);
}

const num1 = Number(args[0]);
const operation = args[1].toLowerCase();
const num2 = Number(args[2]);

// Check if inputs are valid numbers
if (isNaN(num1) || isNaN(num2)) {
  console.log("Both num1 and num2 must be valid numbers.");
  process.exit(1);
}

// Perform the requested operation
let result;

switch (operation) {
  case "add":
    result = num1 + num2;
    break;
  case "sub":
    result = num1 - num2;
    break;
  case "mul":
    result = num1 * num2;
    break;
  case "div":
    if (num2 === 0) {
      console.log("Error: Division by zero is not allowed.");
      process.exit(1);
    }
    result = num1 / num2;
    break;
  case "exp":
    result = num1 ** num2; // num1 raised to the power of num2
    break;
  default:
    console.log("Invalid operation. Use add, sub, mul, div, or exp.");
    process.exit(1);
}

console.log(`Result: ${result}`);

