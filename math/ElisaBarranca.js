// elisabarranca.js
// Browser version of mathElisaBarranca.js

document.getElementById("calculateBtn").addEventListener("click", function() {
  const operation = document.getElementById("operation").value;
  const num1 = parseFloat(document.getElementById("num1").value);
  const num2 = parseFloat(document.getElementById("num2").value);
  const resultDiv = document.getElementById("result");

  // validate input
  if (isNaN(num1) || isNaN(num2)) {
    resultDiv.textContent = "Please enter valid numbers.";
    return;
  }

  let result;

  // Perform the same math logic as mathElisaBarranca.js
  switch (operation) {
    case "add":
      result = num1 + num2;
      break;
    case "subtract":
      result = num1 - num2;
      break;
    case "multiply":
      result = num1 * num2;
      break;
    case "divide":
      if (num2 === 0) {
        resultDiv.textContent = "Error: Cannot divide by zero.";
        return;
      }
      result = num1 / num2;
      break;
    case "exponent":
      result = Math.pow(num1, num2);
      break;
    default:
      resultDiv.textContent = "Invalid operation.";
      return;
  }

  resultDiv.textContent = `The result of ${operation} ${num1} and ${num2} is: ${result}`;
});
