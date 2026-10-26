// ==============================================================================
// HOW WE SPEAK — DATABASE SCHEMA TYPES (TypeScript)
// Maps directly to PostgreSQL Supabase schema:
// - 20261025000000_create_core_schema.sql
// - 20261025010000_enhance_rehearsal_plans.sql
// ==============================================================================

export type Archetype = 'Avoider' | 'Pursuer' | 'Validator' | 'Freezer'

export type CoupleSpaceStatus = 'pending_pair' | 'active' | 'unlinked'

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked'

export type ExerciseStatus = 'in_progress' | 'both_shared' | 'completed'

export type ProductKey =
  | 'trial'
  | 'men-edition'
  | 'women-edition'
  | 'bundle'
  | 'script-collection'
  | 'sex-talk'
  | 'workspace-pro'

export type EntitlementStatus = 'active' | 'expired' | 'refunded' | 'revoked'

export type SituationCategory =
  | 'partner-distant'
  | 'recurring-argument'
  | 'need-boundary'
  | 'future-talk'
  | 'other'

export type CommunicationGoal =
  | 'understand'
  | 'explain-feelings'
  | 'ask-change'
  | 'establish-boundary'
  | 'resolve-disagreement'

export type PreferredTone =
  | 'gentle'
  | 'calm-clear'
  | 'firm-respectful'

export type CommunicationMethod =
  | 'text'
  | 'face-to-face'
  | 'call'

export interface StructuredAIResult {
  neutralSummary: string
  openings: {
    gentle: string
    direct: string
    firm: string
  }
  comparisonExplanation: string
  followups: {
    receptive: string
    disagreement: string
    defensiveness: string
    requestForTime: string
  }
  nextStep: string
  disclaimer: string
}

export interface Profile {
  id: string
  email: string
  display_name: string | null
  archetype: Archetype
  created_at: string
  updated_at: string
}

export interface CouplesSpace {
  id: string
  partner_1_id: string
  partner_2_id: string | null
  status: CoupleSpaceStatus
  room_name: string
  created_at: string
  updated_at: string
  partner_1?: Profile
  partner_2?: Profile
}

export interface WorkspaceInvitation {
  id: string
  space_id: string
  inviter_id: string
  invitee_email: string | null
  token: string
  status: InvitationStatus
  expires_at: string
  created_at: string
  accepted_at: string | null
}

export interface FollowupPractice {
  partnerResponse: string
  counterScript: string
}

export interface RehearsalPlan {
  id: string
  user_id: string
  title: string
  situation_raw: string
  situation_category: SituationCategory
  communication_goal: CommunicationGoal
  selected_tone: PreferredTone
  communication_method: CommunicationMethod
  additional_context?: string | null
  chosen_script: string
  nervous_system_insight?: string | null
  structured_result?: StructuredAIResult
  custom_edits?: {
    chosenOpening?: string
    notes?: string
    editedFollowup?: string
  }
  practice_followups: FollowupPractice[]
  action_reminders: string[]
  created_at: string
  updated_at: string
}

export interface CouplesExercise {
  id: string
  space_id: string
  topic: string
  status: ExerciseStatus
  joint_summary: string | null
  joint_summary_generated_at: string | null
  created_at: string
  updated_at: string
}

export interface PrivateReflection {
  id: string
  exercise_id: string
  space_id: string
  user_id: string
  trigger_notes: string
  felt_emotions: string[]
  underlying_need: string
  hopes_for_conversation: string | null
  is_shared: boolean
  shared_at: string | null
  created_at: string
  updated_at: string
  user?: Profile
}

export interface Entitlement {
  id: string
  user_id: string | null
  customer_email: string
  product_key: ProductKey
  source: 'gumroad' | 'system_trial' | 'admin' | 'stripe'
  status: EntitlementStatus
  valid_until: string | null
  gumroad_sale_id: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface UsageRecord {
  id: string
  user_id: string
  action_type: 'ai_rehearsal' | 'ai_followup' | 'ai_joint_summary' | 'ai_mira'
  tokens_used: number
  created_at: string
}

export interface MiraStructuredAdvice {
  whatWeKnow?: string
  whatMightBeHappening?: string
  whatYouCanDo?: string
  whatYouCouldSay?: string
  whatToWatchFor?: string
  followUpQuestion?: string
}

export interface MiraConversation {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface MiraMessage {
  id: string
  conversation_id: string
  user_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  structured_data?: MiraStructuredAdvice | null
  created_at: string
}

export interface MiraPreferences {
  id: string
  user_id: string
  communication_preference: 'gentle' | 'balanced' | 'direct'
  advice_style: 'listen' | 'practical' | 'words' | 'challenge' | 'both-perspectives'
  response_length: 'short' | 'moderate' | 'detailed'
  personal_priorities: string[]
  custom_priority?: string | null
  persistent_memory_enabled: boolean
  created_at: string
  updated_at: string
}

export interface MiraMemory {
  id: string
  user_id: string
  category: string
  content: string
  created_at: string
  updated_at: string
}

export interface ScriptFavorite {
  id: string
  user_id: string
  script_id: string
  created_at: string
}

export interface SharedCoupleSession {
  id: string
  space_id: string
  topic: string
  status: 'active' | 'paused' | 'completed'
  partner_1_perspective: string | null
  partner_1_shared: boolean
  partner_2_perspective: string | null
  partner_2_shared: boolean
  mira_assistance_requested: boolean
  mira_suggestion: string | null
  agreed_next_steps: string[]
  created_at: string
  updated_at: string
}

export interface CoupleMiraSettings {
  id: string
  space_id: string
  individual_prefs: Record<string, any>
  joint_rules: {
    no_blaming: boolean
    no_taking_sides: boolean
    reflect_both: boolean
    realistic_actions: boolean
    avoid_clinical_jargon: boolean
  }
  created_at: string
  updated_at: string
}
