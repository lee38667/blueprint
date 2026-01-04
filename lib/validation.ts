// Simple validation utilities (no external dependencies)

interface ValidationError {
  field: string
  message: string
}

export class ValidationResult {
  errors: ValidationError[] = []

  addError(field: string, message: string) {
    this.errors.push({ field, message })
  }

  isValid(): boolean {
    return this.errors.length === 0
  }

  firstError(): string | null {
    return this.errors.length > 0 ? this.errors[0].message : null
  }
}

export const Validators = {
  // Notes
  validateNoteForm: (title: string, content: string): ValidationResult => {
    const result = new ValidationResult()
    if (!title?.trim()) result.addError('title', 'Title is required')
    else if (title.length > 200) result.addError('title', 'Title max 200 characters')
    
    if (!content?.trim()) result.addError('content', 'Content is required')
    else if (content.length > 10000) result.addError('content', 'Content max 10000 characters')
    
    return result
  },

  // Tasks
  validateTaskForm: (title: string, dueDate?: string): ValidationResult => {
    const result = new ValidationResult()
    if (!title?.trim()) result.addError('title', 'Task title required')
    else if (title.length > 200) result.addError('title', 'Max 200 characters')
    
    if (dueDate) {
      const date = new Date(dueDate)
      if (isNaN(date.getTime())) result.addError('due_date', 'Invalid date')
    }
    
    return result
  },

  // Goals
  validateGoalForm: (title: string): ValidationResult => {
    const result = new ValidationResult()
    if (!title?.trim()) result.addError('title', 'Goal title required')
    else if (title.length > 200) result.addError('title', 'Max 200 characters')
    return result
  },

  // Finance
  validateFinanceLog: (amount: number | string, type: string): ValidationResult => {
    const result = new ValidationResult()
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    
    if (isNaN(num) || num <= 0) result.addError('amount', 'Amount must be positive')
    if (!['income', 'expense'].includes(type)) result.addError('type', 'Invalid type')
    
    return result
  },

  // Body Stats
  validateBodyStat: (weight?: string, sleep?: string, stress?: string): ValidationResult => {
    const result = new ValidationResult()
    
    if (weight && (isNaN(parseFloat(weight)) || parseFloat(weight) <= 0)) {
      result.addError('weight', 'Weight must be positive')
    }
    if (sleep && (isNaN(parseFloat(sleep)) || parseFloat(sleep) < 0 || parseFloat(sleep) > 24)) {
      result.addError('sleep', 'Sleep must be 0-24 hours')
    }
    if (stress && (isNaN(parseInt(stress)) || parseInt(stress) < 1 || parseInt(stress) > 10)) {
      result.addError('stress', 'Stress must be 1-10')
    }
    
    return result
  },

  // Mood
  validateMoodLog: (moodScore: number | string, stressScore?: number | string): ValidationResult => {
    const result = new ValidationResult()
    const mood = typeof moodScore === 'string' ? parseInt(moodScore) : moodScore
    const stress = typeof stressScore === 'string' ? parseInt(stressScore) : stressScore
    
    if (isNaN(mood) || mood < 1 || mood > 10) result.addError('mood', 'Mood must be 1-10')
    if (stress && (isNaN(stress) || stress < 1 || stress > 10)) result.addError('stress', 'Stress must be 1-10')
    
    return result
  },

  // Notifications
  validateNotification: (title: string): ValidationResult => {
    const result = new ValidationResult()
    if (!title?.trim()) result.addError('title', 'Title required')
    else if (title.length > 200) result.addError('title', 'Max 200 characters')
    return result
  }
}

// Legacy schema objects for reference (not used at runtime)
export const NoteFormSchema = {}
export const TaskFormSchema = {}
export const GoalFormSchema = {}
export const FinanceLogSchema = {}
export const FinanceSummarySchema = {}
export const BodyStatSchema = {}
export const MoodLogSchema = {}
export const NotificationSchema = {}

