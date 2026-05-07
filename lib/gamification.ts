import type { BodyPart, BodyWorkout, QuestType } from '../types/models'

export const BODY_PARTS: BodyPart[] = ['head', 'arms', 'chest', 'abs', 'legs', 'back']

export const DAILY_EXP_BY_TYPE: Record<QuestType, number> = {
  task: 10,
  habit: 20,
  workout: 50,
  body_part: 50,
}

export const DAILY_GOLD_BY_TYPE: Record<QuestType, number> = {
  task: 5,
  habit: 10,
  workout: 25,
  body_part: 20,
}

export interface SkillChoice {
  name: string
  description: string
}

export interface QuestGenerationTask {
  id: string
  title: string
  priority: 'low' | 'normal' | 'high'
  status: string
  project: string | null
  due_date: string | null
}

export interface QuestGenerationHabit {
  id: string
  name: string
  frequency: 'daily' | 'weekly'
  currentStreak: number
  completedToday: boolean
}

export interface QuestGenerationGoal {
  id: string
  title: string
  status: string
  target_date: string | null
}

export interface GeneratedQuestPayload {
  name: string
  description: string
  type: QuestType
  exp_reward: number
  gold_reward: number
  linked_id: string | null
  body_part?: BodyPart | null
}

export interface QuestGenerationContext {
  tasks: QuestGenerationTask[]
  habits: QuestGenerationHabit[]
  goals: QuestGenerationGoal[]
  bodyWorkouts: BodyWorkout[]
}

const BODY_UNLOCKS_BY_LEVEL: Record<number, BodyPart[]> = {
  1: ['head', 'arms'],
  2: ['head', 'arms', 'chest'],
  3: ['head', 'arms', 'chest', 'abs'],
  4: ['head', 'arms', 'chest', 'abs', 'back'],
}

export function getLevelThreshold(level: number) {
  return 100 + Math.max(0, level - 1) * 40
}

export function getUnlockedAreasForLevel(level: number): BodyPart[] {
  if (level >= 5) return [...BODY_PARTS]
  return BODY_UNLOCKS_BY_LEVEL[level] ?? BODY_UNLOCKS_BY_LEVEL[1]
}

export function applyProgress(level: number, exp: number, gainedExp: number) {
  let nextLevel = level
  let nextExp = exp + gainedExp

  while (nextExp >= getLevelThreshold(nextLevel)) {
    nextExp -= getLevelThreshold(nextLevel)
    nextLevel += 1
  }

  return {
    level: nextLevel,
    exp: nextExp,
    leveledUp: nextLevel > level,
    unlockedAreas: getUnlockedAreasForLevel(nextLevel),
  }
}

export function clampReward(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)))
}

export function getPassiveRewards(type: QuestType) {
  return {
    exp: DAILY_EXP_BY_TYPE[type],
    gold: DAILY_GOLD_BY_TYPE[type],
  }
}

export function getSkillChoices(level: number, preferredBodyPart?: BodyPart | null): SkillChoice[] {
  const label = preferredBodyPart ? preferredBodyPart[0].toUpperCase() + preferredBodyPart.slice(1) : 'Shadow'

  return [
    {
      name: 'Focus Strike',
      description: 'Boosts tiny-start momentum so one finished quest turns into a combo chain instead of a stall.',
    },
    {
      name: 'Endurance',
      description: 'Strengthens habit streak recovery and makes low-energy days less likely to break the run.',
    },
    {
      name: `${label} Mastery`,
      description: `Channels more EXP into your ${preferredBodyPart ?? 'overall'} progression whenever you train with intent.`,
    },
  ].map((choice, index) => ({
    ...choice,
    description: level >= 5 && index === 0 ? `${choice.description} Higher ranks also open gates faster.` : choice.description,
  }))
}

export function summarizeBodyProgress(workouts: BodyWorkout[]) {
  return BODY_PARTS.reduce<Record<BodyPart, { sessions: number; reps: number; sets: number }>>((acc, bodyPart) => {
    const items = workouts.filter((workout) => workout.body_part === bodyPart)
    acc[bodyPart] = {
      sessions: items.length,
      reps: items.reduce((sum, workout) => sum + (workout.reps ?? 0), 0),
      sets: items.reduce((sum, workout) => sum + (workout.sets ?? 0), 0),
    }
    return acc
  }, {} as Record<BodyPart, { sessions: number; reps: number; sets: number }>)
}

export function getLowestBodyPart(workouts: BodyWorkout[]): BodyPart {
  const summary = summarizeBodyProgress(workouts)
  return [...BODY_PARTS].sort((left, right) => {
    const leftScore = summary[left].sessions * 1000 + summary[left].sets * 10 + summary[left].reps
    const rightScore = summary[right].sessions * 1000 + summary[right].sets * 10 + summary[right].reps
    return leftScore - rightScore
  })[0]
}

function createTaskQuest(task: QuestGenerationTask, index: number): GeneratedQuestPayload {
  const weight = task.priority === 'high' ? 1 : task.priority === 'normal' ? 0.75 : 0.55
  return {
    name: index === 0 ? 'Raid the Priority Gate' : index === 1 ? 'Purge the Backlog Shade' : 'Clear the Side-Quest Corridor',
    description: `Break "${task.title}" into one visible first move, then strike before your attention drifts. Tiny starts still count as hunter-grade progress.`,
    type: 'task',
    exp_reward: clampReward(55 * weight, 10, 100),
    gold_reward: clampReward(22 * weight, 5, 50),
    linked_id: task.id,
  }
}

function createHabitQuest(habit: QuestGenerationHabit): GeneratedQuestPayload {
  const streakBonus = habit.currentStreak > 0 ? Math.min(habit.currentStreak, 5) * 4 : 0
  return {
    name: 'Protect the Streak Rune',
    description: `Your ${habit.name.toLowerCase()} ritual is glowing faintly. Secure a one-tap completion now to keep the rune from fading out.`,
    type: 'habit',
    exp_reward: clampReward(24 + streakBonus, 10, 100),
    gold_reward: clampReward(10 + streakBonus / 2, 5, 50),
    linked_id: habit.id,
  }
}

function createBodyQuest(bodyPart: BodyPart): GeneratedQuestPayload {
  return {
    name: `Forge the ${bodyPart[0].toUpperCase() + bodyPart.slice(1)} Arsenal`,
    description: `This zone has the weakest aura right now. Log a short ${bodyPart} session to strengthen the silhouette and cash in a high-value recovery reward.`,
    type: 'body_part',
    exp_reward: 50,
    gold_reward: 20,
    linked_id: null,
    body_part: bodyPart,
  }
}

function createGoalQuest(goal: QuestGenerationGoal): GeneratedQuestPayload {
  return {
    name: 'Scout the Boss Route',
    description: `Advance "${goal.title}" with a planning micro-step, not a marathon. One small act keeps the gate open and your future self less overloaded.`,
    type: 'task',
    exp_reward: 28,
    gold_reward: 12,
    linked_id: null,
  }
}

export function fallbackGenerateQuests(context: QuestGenerationContext): GeneratedQuestPayload[] {
  const openTasks = context.tasks
    .filter((task) => task.status !== 'done')
    .sort((left, right) => {
      const score = (task: QuestGenerationTask) => {
        const priority = task.priority === 'high' ? 3 : task.priority === 'normal' ? 2 : 1
        const dueBoost = task.due_date ? 2 : 0
        return priority * 10 + dueBoost
      }
      return score(right) - score(left)
    })

  const endangeredHabit = context.habits
    .filter((habit) => !habit.completedToday)
    .sort((left, right) => right.currentStreak - left.currentStreak)[0]

  const weakestBodyPart = getLowestBodyPart(context.bodyWorkouts)
  const activeGoal = context.goals.find((goal) => goal.status !== 'completed')

  const quests: GeneratedQuestPayload[] = []

  openTasks.slice(0, 2).forEach((task, index) => quests.push(createTaskQuest(task, index)))

  if (endangeredHabit) {
    quests.push(createHabitQuest(endangeredHabit))
  }

  quests.push(createBodyQuest(weakestBodyPart))

  if (quests.length < 5 && activeGoal) {
    quests.push(createGoalQuest(activeGoal))
  }

  return quests.slice(0, Math.max(3, Math.min(5, quests.length)))
}

export function sanitizeGeneratedQuest(input: Partial<GeneratedQuestPayload>, fallback: GeneratedQuestPayload): GeneratedQuestPayload {
  return {
    name: (input.name || fallback.name || 'Clear the Next Gate').trim(),
    description: (input.description || fallback.description || 'Take one tiny action and keep the run alive.').trim(),
    type: input.type && ['task', 'habit', 'workout', 'body_part'].includes(input.type) ? input.type : fallback.type,
    exp_reward: clampReward(input.exp_reward ?? fallback.exp_reward, 10, 100),
    gold_reward: clampReward(input.gold_reward ?? fallback.gold_reward, 5, 50),
    linked_id: input.linked_id ?? fallback.linked_id ?? null,
    body_part: input.body_part ?? fallback.body_part ?? null,
  }
}
