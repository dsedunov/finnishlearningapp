// ===== CORE DATA INTERFACES =====

export interface ChaptersMetadata {
  version: string;
  lastUpdated: string;
  totalChapters: number;
  source: string;
}

export interface LessonProgress {
  theory_completed: boolean;
  reading_completed: boolean;
  exercises_completed: number;
  total_exercises: number;
}

export interface GrammarRule {
  rule: string;
  explanation: string;
  examples: string[];
}

export interface TheorySection {
  title: string;
  subtitle: string;
  content: string;
  grammar?: GrammarRule[];
  vocabulary?: VocabularyItem[];
}

export interface VocabularyItem {
  finnish: string;
  russian: string;
  usage: string;
  formality?: 'formal' | 'informal' | 'very_informal';
  pronunciation?: string;
}

export interface Theory {
  sections: TheorySection[];
}

export interface DialogueLine {
  speaker: string;
  text: string;
  translation?: string;
  emotion?: string;
}

export interface Reading {
  title: string;
  subtitle: string;
  description: string;
  dialogue_id: string;
  audio_type: 'enhanced' | 'standard';
  preferredTTS: 'enhanced' | 'standard';
  dialogue?: DialogueLine[];
  questions?: Array<{
    question: string;
    answer: string;
    translation?: string;
  }>;
}

export interface ExerciseItem {
  id: string;
  sentence?: string;
  prompt?: string;
  text_id?: string;
  question?: string;
  answer?: string;
  blanks?: string[];
  options?: string[];
  correct?: string | number;
  translation?: string;
  missing_parts?: Array<{
    speaker: string;
    text: string;
  }>;
}

export type ExerciseType = 
  | 'listening_exercise' 
  | 'grammar_fill' 
  | 'written_task' 
  | 'listening_comprehension' 
  | 'listening_repurposed' 
  | 'dialogue_complete' 
  | 'pronunciation_drill';

export interface Exercise {
  type: ExerciseType;
  original_exercise?: string;
  title: string;
  status?: string;
  instruction: string;
  script_id?: string;
  items?: ExerciseItem[];
  questions?: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
  scenario?: string;
}

export interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  progress: LessonProgress;
  theory: Theory;
  reading: Reading;
  exercises: Exercise[];
}

export interface Chapter {
  id: number;
  title: string;
  subtitle: string;
  pageNumbers: string;
  difficulty: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  estimatedHours: number;
  lessons: Lesson[];
}

export interface ChaptersData {
  metadata: ChaptersMetadata;
  chapters: Chapter[];
}

// ===== VOCABULARY INTERFACES =====

export interface VocabularyMetadata {
  version: string;
  lastUpdated: string;
  totalWords: number;
  source: string;
}

export interface VocabularyEntry {
  baseForm: string;
  russian: string;
  grammarInfo: string;
  pronunciation: string;
  examples: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  sourceChapter: string;
  frequency: 'high' | 'medium' | 'low';
  tags: string[];
  verbType?: string;
}

export interface VocabularyData {
  metadata: VocabularyMetadata;
  vocabulary: { [key: string]: VocabularyEntry };
}

// ===== AUDIO SCRIPTS INTERFACES =====

export interface AudioScriptsMetadata {
  version: string;
  lastUpdated: string;
  totalScripts: number;
  source: string;
}

export interface AudioScript {
  id: string;
  text: string;
  lang: string;
  type: 'dialogue' | 'pronunciation' | 'exercise' | 'reading';
  preferredTTS: 'enhanced' | 'standard';
  sourceChapter: string;
  estimatedDuration: number;
  note?: string;
}

export interface AudioScriptsData {
  metadata: AudioScriptsMetadata;
  scripts: AudioScript[];
}

// ===== PROGRESS TRACKING INTERFACES =====

export interface AppProgress {
  chapters: { [chapterId: string]: ChapterProgress };
  lastUpdated: string;
  totalCompletedLessons: number;
}

export interface ChapterProgress {
  chapterId: number;
  lessons: { [lessonId: string]: LessonProgressDetailed };
  chapterCompleted: boolean;
  startedAt?: string;
  completedAt?: string;
}

export interface LessonProgressDetailed {
  lessonId: string;
  theory_completed: boolean;
  theory_completedAt?: string;
  reading_completed: boolean;
  reading_completedAt?: string;
  exercises_completed: number;
  total_exercises: number;
  exercises_completedAt?: string;
  lessonFullyCompleted: boolean;
  startedAt?: string;
  lastAccessedAt: string;
  completedAt?: string;
}

// ===== COMPONENT PROP INTERFACES =====

export interface AppState {
  chaptersData: ChaptersData | null;
  vocabularyData: VocabularyData | null;
  audioScriptsData: AudioScriptsData | null;
  currentChapter: Chapter | null;
  currentLesson: Lesson | null;
  currentSection: 'home' | 'chapter' | 'theory' | 'reading' | 'exercises' | 'favorites';
  appProgress: AppProgress;
  favorites: FavoriteWord[];
}

export interface FavoriteWord {
  id: number;
  word: string;
  translation: string;
  sourceChapter?: string;
  addedAt: Date;
}

// ===== NAVIGATION COMPONENT INTERFACES =====

export interface ChapterNavigationProps {
  chapters: Chapter[];
  currentChapter: Chapter | null;
  appProgress: AppProgress;
  onChapterSelect: (chapter: Chapter) => void;
  onHomeClick: () => void;
  onGoToFavorites: () => void;
  favoritesCount: number;
}

export interface LessonNavigationProps {
  chapter: Chapter;
  currentLesson: Lesson | null;
  chapterProgress: ChapterProgress;
  onLessonSelect: (lesson: Lesson) => void;
  onBackToChapter: () => void;
  onHomeClick: () => void;
}

export interface SectionNavigationProps {
  lesson: Lesson;
  currentSection: 'theory' | 'reading' | 'exercises';
  lessonProgress: LessonProgressDetailed;
  onSectionChange: (section: 'theory' | 'reading' | 'exercises') => void;
  onBackToLessons: () => void;
  onHomeClick: () => void;
}

// ===== SECTION COMPONENT INTERFACES =====

export interface TheorySectionProps {
  lesson: Lesson;
  vocabularyData: VocabularyData;
  audioScriptsData: AudioScriptsData;
  isCompleted: boolean;
  audioPlaying: string | null;
  isListening: boolean;
  onPlayAudio: (text: string, voiceType?: 'enhanced' | 'standard') => void;
  onStartSpeechRecognition: (text: string) => void;
  onAddToFavorites: (word: string, translation: any) => void;
  onCompleteTheory: () => void;
  onRestartTheory: () => void;
  isFavorited: (word: string) => boolean;
  renderClickableText: (text: string) => React.ReactNode;
}

export interface ReadingSectionProps {
  lesson: Lesson;
  audioScriptsData: AudioScriptsData;
  isCompleted: boolean;
  audioPlaying: string | null;
  isListening: boolean;
  onPlayAudio: (text: string, voiceType?: 'enhanced' | 'standard') => void;
  onStartSpeechRecognition: (text: string) => void;
  onCompleteReading: () => void;
  onRestartReading: () => void;
  onGoToExercises: () => void;
  renderClickableText: (text: string) => React.ReactNode;
}

export interface ExercisesSectionProps {
  lesson: Lesson;
  audioScriptsData: AudioScriptsData;
  exercisesCompleted: number;
  totalExercises: number;
  isAllCompleted: boolean;
  exerciseAnswers: { [key: string]: any };
  exerciseSubmitted: boolean;
  audioPlaying: string | null;
  isListening: boolean;
  onAnswerChange: (exerciseIndex: number, itemIndex: number, answer: any) => void;
  onBlankAnswerChange: (exerciseIndex: number, itemIndex: number, blankIndex: number, answer: string) => void;
  onPlayAudio: (text: string, voiceType?: 'enhanced' | 'standard') => void;
  onStartSpeechRecognition: (text: string) => void;
  onSubmitExercises: () => void;
  onResetExercises: () => void;
  onCompleteExercises: () => void;
  onRestartExercises: () => void;
}

export interface FavoritesSectionProps {
  favorites: FavoriteWord[];
  vocabularyData: VocabularyData;
  audioPlaying: string | null;
  isListening: boolean;
  onPlayAudio: (text: string, voiceType?: 'enhanced' | 'standard') => void;
  onStartSpeechRecognition: (text: string) => void;
  onRemoveFromFavorites: (word: string) => void;
  onGoToTheory: () => void;
}

export interface TooltipProps {
  show: boolean;
  selectedText: string;
  position: { x: number; y: number };
  translations: any;
  onClose: () => void;
  onAddToFavorites: (word: string, translation?: any) => void;
  onPlayAudio: (text: string, voiceType?: 'enhanced' | 'standard') => void;
  onStartSpeechRecognition: (text: string) => void;
  onEnhanceTranslation: (word: string) => void;
}

// ===== EXERCISE TYPE UTILITIES =====

export const ExerciseTypeIcons = {
  written_task: '📝',
  pronunciation_drill: '🎤',
  listening_exercise: '🎧',
  dialogue_complete: '💬',
  grammar_fill: '📝',
  listening_comprehension: '🎧',
  listening_repurposed: '🎧'
} as const;

export const ExerciseTypeLabels = {
  written_task: 'Written Task',
  pronunciation_drill: 'Pronunciation',
  listening_exercise: 'Listening',
  dialogue_complete: 'Dialogue',
  grammar_fill: 'Grammar',
  listening_comprehension: 'Comprehension',
  listening_repurposed: 'Listening Practice'
} as const;

// ===== AUDIO UTILITIES =====

export interface AudioConfig {
  shouldUseEnhancedTTS: (text: string) => boolean;
  getAudioIcon: (text: string) => '⚡' | '🔊';
  getAudioScript: (scriptId: string, scripts: AudioScript[]) => AudioScript | null;
}

// ===== DATA LOADING INTERFACES =====

export interface DataLoadingState {
  chaptersLoading: boolean;
  vocabularyLoading: boolean;
  audioScriptsLoading: boolean;
  chaptersError: string | null;
  vocabularyError: string | null;
  audioScriptsError: string | null;
}

// ===== UTILITY FUNCTIONS TYPES =====

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface ProgressUtils {
  getLessonStatus: (progress: LessonProgressDetailed) => ProgressStatus;
  getChapterStatus: (progress: ChapterProgress) => ProgressStatus;
  calculateOverallProgress: (appProgress: AppProgress) => number;
  getProgressIcon: (status: ProgressStatus) => '⏳' | '🔄' | '✅';
  getExerciseTypesInLesson: (lesson: Lesson) => string[];
  getExerciseTypesSummary: (lesson: Lesson) => string;
}

// ===== LEGACY COMPATIBILITY =====

// Keep some legacy interfaces for compatibility
export interface FileUploadProps {
  dataUrls?: any;
  onUrlChange?: any;
  onLoadFromUrl?: any;
  onFileUpload?: any;
  dataLoading?: boolean;
}