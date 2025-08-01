
import { db } from '../db';
import { quizAttemptsTable, quizzesTable } from '../db/schema';
import { type SubmitQuizInput, type QuizAttempt } from '../schema';
import { eq } from 'drizzle-orm';

export const submitQuiz = async (input: SubmitQuizInput): Promise<QuizAttempt> => {
  try {
    // First, get the quiz to check if it exists and get the passing score
    const quiz = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, input.quiz_id))
      .execute();

    if (quiz.length === 0) {
      throw new Error(`Quiz with ID ${input.quiz_id} not found`);
    }

    const quizData = quiz[0];

    // Parse the answers to calculate score
    let parsedAnswers;
    let parsedQuestions;
    try {
      parsedAnswers = JSON.parse(input.answers);
      parsedQuestions = JSON.parse(quizData.questions);
    } catch (error) {
      throw new Error('Invalid JSON format in answers or questions');
    }

    // Calculate score based on correct answers
    let correctAnswers = 0;
    const totalQuestions = parsedQuestions.length;

    for (let i = 0; i < totalQuestions; i++) {
      const question = parsedQuestions[i];
      const userAnswer = parsedAnswers[i];
      
      if (question && userAnswer !== undefined && question.correct_answer === userAnswer) {
        correctAnswers++;
      }
    }

    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const isPassed = score >= quizData.passing_score;

    // Insert the quiz attempt
    const result = await db.insert(quizAttemptsTable)
      .values({
        user_id: input.user_id,
        quiz_id: input.quiz_id,
        answers: input.answers,
        score: score,
        is_passed: isPassed,
        completed_at: new Date()
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Quiz submission failed:', error);
    throw error;
  }
};
