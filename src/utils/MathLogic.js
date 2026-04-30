export class MathLogic {
  static generateProblem() {
    const isAddition = Math.random() > 0.5;
    let a, b, answer, questionString;

    if (isAddition) {
      a = Math.floor(Math.random() * 9) + 1;
      b = Math.floor(Math.random() * 9) + 1;
      answer = a + b;
      questionString = `${a} + ${b}`;
    } else {
      a = Math.floor(Math.random() * 9) + 1;
      b = Math.floor(Math.random() * 9) + 1;
      if (a < b) {
        // Swap to ensure positive result
        const temp = a;
        a = b;
        b = temp;
      }
      answer = a - b;
      questionString = `${a} - ${b}`;
    }

    // Generate two incorrect answers unique from the correct one
    const options = [answer];
    while (options.length < 3) {
      const wrongAnswer = Math.floor(Math.random() * 18); // 0 to 17
      if (!options.includes(wrongAnswer)) {
        options.push(wrongAnswer);
      }
    }

    // Shuffle options
    options.sort(() => Math.random() - 0.5);

    return {
      questionString,
      answer,
      options
    };
  }
}
