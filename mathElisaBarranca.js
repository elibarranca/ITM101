const args = process.argv.slice(2);

// Destructure the arguments
const [operation, num1, num2] = args;

// Convert the number strings into numbers
const a = parseFloat(num1);
const b = parseFloat(num2);

let result;

// Perform the math operation
switch (operation) {
  case "add":
    result = a + b;
    break;
  case "subtract":
    result = a - b;
    break;
  case "multiply":
    result = a * b;
    break;
  case "divide":
    if (b === 0) {
      console.log("Error: Cannot divide by zero.");
      process.exit(1);
    }
    result = a / b;
    break;
  case "exponent":
    result = Math.pow(a, b);
    break;
  default:
    console.log("Invalid operation. Please use add, subtract, multiply, divide, or exponent.");
    process.exit(1);
}

// Print the result
console.log(`The result of ${operation} ${a} and ${b} is: ${result}`);
