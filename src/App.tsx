import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';

// Import new types
import {
  ChaptersData,
  VocabularyData,
  AudioScriptsData,
  AppState,
  AppProgress,
  Chapter,
  Lesson,
  LessonProgressDetailed,
  ChapterProgress,
  DataLoadingState,
  FavoriteWord,
  ProgressStatus
} from './types';

// Component imports
import Header from './components/Header';
import ChapterNavigation from './components/ChapterNavigation';
import LessonNavigation from './components/LessonNavigation';
import SectionNavigation from './components/SectionNavigation';
import StatsCards from './components/StatsCards';
import TheorySection from './components/TheorySection';
import ReadingSection from './components/ReadingSection';
import ExercisesSection from './components/ExercisesSection';
import FavoritesSection from './components/FavoritesSection';
import Tooltip from './components/Tooltip';
import ServerDebugTool from './ServerDebugTool';
import chaptersDataImport from './data/chapters.json';
import vocabularyDataImport from './data/vocabulary.json';
import audioScriptsDataImport from './data/audio_scripts.json';


// Utility imports
import { 
  getEnhancedTranslation, 
  enhanceTranslationWithAI,
  getUsageStats
} from './utils/geminiAI';

import { 
  playAudioWithGemini, 
  fallbackToWebSpeech,
  startSpeechRecognition,
} from './utils/audioHelpers';

// Hook imports
import useLocalStorage from './hooks/useLocalStorage';

// ===== UTILITY FUNCTIONS =====

// Audio utility - implement 6+ word rule
const shouldUseEnhancedTTS = (text: string): boolean => {
  const wordCount = text.trim().split(/\s+/).length;
  return wordCount > 6;
};

const getAudioIcon = (text: string): '⚡' | '🔊' => {
  return shouldUseEnhancedTTS(text) ? '⚡' : '🔊';
};

// Progress utility functions
const getLessonStatus = (progress: LessonProgressDetailed): ProgressStatus => {
  if (progress.lessonFullyCompleted) return 'completed';
  if (progress.theory_completed || progress.reading_completed || progress.exercises_completed > 0) {
    return 'in_progress';
  }
  return 'not_started';
};

const getProgressIcon = (status: ProgressStatus): '⏳' | '🔄' | '✅' => {
  switch (status) {
    case 'completed': return '✅';
    case 'in_progress': return '🔄';
    case 'not_started': return '⏳';
  }
};

const createEmptyProgress = (): AppProgress => ({
  chapters: {},
  lastUpdated: new Date().toISOString(),
  totalCompletedLessons: 0
});

const createEmptyLessonProgress = (lessonId: string, totalExercises: number): LessonProgressDetailed => ({
  lessonId,
  theory_completed: false,
  reading_completed: false,
  exercises_completed: 0,
  total_exercises: totalExercises,
  lessonFullyCompleted: false,
  lastAccessedAt: new Date().toISOString()
});

// ===== MAIN APP COMPONENT =====

const App: React.FC = () => {
  // ===== CORE STATE =====
  const [appState, setAppState] = useState<AppState>({
    chaptersData: null,
    vocabularyData: null,
    audioScriptsData: null,
    currentChapter: null,
    currentLesson: null,
    currentSection: 'home',
    appProgress: createEmptyProgress(),
    favorites: []
  });

  // ===== DATA LOADING STATE =====
  const [dataLoading, setDataLoading] = useState<DataLoadingState>({
    chaptersLoading: false,
    vocabularyLoading: false,
    audioScriptsLoading: false,
    chaptersError: null,
    vocabularyError: null,
    audioScriptsError: null
  });

  // ===== EXERCISE STATE =====
  const [exerciseAnswers, setExerciseAnswers] = useState<{[key: string]: any}>({});
  const [exerciseSubmitted, setExerciseSubmitted] = useState(false);
  
  // ===== AUDIO STATE =====
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  // ===== TOOLTIP STATE =====
  const [showTooltip, setShowTooltip] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  // ===== UI STATE =====
  const [successMessage, setSuccessMessage] = useState('');
  const [usageStats, setUsageStats] = useState(getUsageStats());
  
  // ===== PERSISTENT STATE =====
  const [favorites, setFavorites] = useLocalStorage<FavoriteWord[]>('finnishApp_favorites_v2', []);
  const [appProgress, setAppProgress] = useLocalStorage<AppProgress>('finnishApp_progress_v2', createEmptyProgress());

  // ===== SYNC FAVORITES WITH APP STATE =====
  useEffect(() => {
    setAppState(prev => ({ ...prev, favorites }));
  }, [favorites]);

  // ===== DATA LOADING FUNCTIONS =====
  
  const loadChaptersData = async (url: string) => {
    setDataLoading(prev => ({ ...prev, chaptersLoading: true, chaptersError: null }));
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const rawText = await response.text();
      const data: ChaptersData = JSON.parse(rawText);
      
      setAppState(prev => ({ ...prev, chaptersData: data }));
      setSuccessMessage(`✅ Loaded ${data.chapters.length} chapters successfully!`);
      
      // Initialize progress for any new chapters/lessons
      initializeProgressForNewData(data);
      
    } catch (error) {
      const errorMessage = `Failed to load chapters: ${(error as Error).message}`;
      setDataLoading(prev => ({ ...prev, chaptersError: errorMessage }));
      console.error('Chapters loading error:', error);
    } finally {
      setDataLoading(prev => ({ ...prev, chaptersLoading: false }));
    }
  };

  const loadVocabularyData = async (url: string) => {
    setDataLoading(prev => ({ ...prev, vocabularyLoading: true, vocabularyError: null }));
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const rawText = await response.text();
      const data: VocabularyData = JSON.parse(rawText);
      
      setAppState(prev => ({ ...prev, vocabularyData: data }));
      setSuccessMessage(`✅ Loaded ${Object.keys(data.vocabulary).length} vocabulary entries!`);
      
    } catch (error) {
      const errorMessage = `Failed to load vocabulary: ${(error as Error).message}`;
      setDataLoading(prev => ({ ...prev, vocabularyError: errorMessage }));
      console.error('Vocabulary loading error:', error);
    } finally {
      setDataLoading(prev => ({ ...prev, vocabularyLoading: false }));
    }
  };

  const loadAudioScriptsData = async (url: string) => {
    setDataLoading(prev => ({ ...prev, audioScriptsLoading: true, audioScriptsError: null }));
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const rawText = await response.text();
      const data: AudioScriptsData = JSON.parse(rawText);
      
      setAppState(prev => ({ ...prev, audioScriptsData: data }));
      setSuccessMessage(`✅ Loaded ${data.scripts.length} audio scripts!`);
      
    } catch (error) {
      const errorMessage = `Failed to load audio scripts: ${(error as Error).message}`;
      setDataLoading(prev => ({ ...prev, audioScriptsError: errorMessage }));
      console.error('Audio scripts loading error:', error);
    } finally {
      setDataLoading(prev => ({ ...prev, audioScriptsLoading: false }));
    }
  };

  // Initialize progress for new chapters/lessons
  const initializeProgressForNewData = (chaptersData: ChaptersData) => {
    setAppProgress(currentProgress => {
      const newProgress = { ...currentProgress };
      
      chaptersData.chapters.forEach(chapter => {
        if (!newProgress.chapters[chapter.id]) {
          newProgress.chapters[chapter.id] = {
            chapterId: chapter.id,
            lessons: {},
            chapterCompleted: false
          };
        }
        
        const chapterProgress = newProgress.chapters[chapter.id];
        chapter.lessons.forEach(lesson => {
          if (!chapterProgress.lessons[lesson.id]) {
            chapterProgress.lessons[lesson.id] = createEmptyLessonProgress(
              lesson.id, 
              lesson.exercises.length
            );
          }
        });
      });
      
      newProgress.lastUpdated = new Date().toISOString();
      return newProgress;
    });
  };

  // ===== NAVIGATION FUNCTIONS =====
  
  const goToHome = () => {
    setAppState(prev => ({ 
      ...prev, 
      currentSection: 'home',
      currentChapter: null,
      currentLesson: null 
    }));
  };

  const goToFavorites = () => {
    setAppState(prev => ({ ...prev, currentSection: 'favorites' }));
  };

  const selectChapter = (chapter: Chapter) => {
    setAppState(prev => ({ 
      ...prev, 
      currentChapter: chapter,
      currentLesson: null,
      currentSection: 'chapter'
    }));
  };

  const selectLesson = (lesson: Lesson) => {
    setAppState(prev => ({ 
      ...prev, 
      currentLesson: lesson,
      currentSection: 'theory'
    }));
    
    // Update last accessed time
    if (appState.currentChapter) {
      updateLessonProgress(appState.currentChapter.id, lesson.id, {
        lastAccessedAt: new Date().toISOString()
      });
    }
  };

  const changeSection = (section: 'theory' | 'reading' | 'exercises') => {
    setAppState(prev => ({ ...prev, currentSection: section }));
  };

  // ===== PROGRESS MANAGEMENT =====
  
  const updateLessonProgress = (chapterId: number, lessonId: string, updates: Partial<LessonProgressDetailed>) => {
    setAppProgress(currentProgress => {
      const newProgress = { ...currentProgress };
      
      if (!newProgress.chapters[chapterId]) {
        newProgress.chapters[chapterId] = {
          chapterId,
          lessons: {},
          chapterCompleted: false
        };
      }
      
      const chapterProgress = newProgress.chapters[chapterId];
      if (!chapterProgress.lessons[lessonId]) {
        chapterProgress.lessons[lessonId] = createEmptyLessonProgress(lessonId, 0);
      }
      
      const lessonProgress = chapterProgress.lessons[lessonId];
      Object.assign(lessonProgress, updates);
      
      // Check if lesson is fully completed
      const isFullyCompleted = lessonProgress.theory_completed && 
                             lessonProgress.reading_completed && 
                             lessonProgress.exercises_completed >= lessonProgress.total_exercises;
      
      if (isFullyCompleted && !lessonProgress.lessonFullyCompleted) {
        lessonProgress.lessonFullyCompleted = true;
        lessonProgress.completedAt = new Date().toISOString();
      }
      
      newProgress.lastUpdated = new Date().toISOString();
      return newProgress;
    });
  };

  const completeTheory = () => {
    if (appState.currentChapter && appState.currentLesson) {
      updateLessonProgress(appState.currentChapter.id, appState.currentLesson.id, {
        theory_completed: true,
        theory_completedAt: new Date().toISOString()
      });
    }
  };

  const completeReading = () => {
    if (appState.currentChapter && appState.currentLesson) {
      updateLessonProgress(appState.currentChapter.id, appState.currentLesson.id, {
        reading_completed: true,
        reading_completedAt: new Date().toISOString()
      });
    }
  };

  const completeExercises = () => {
    if (appState.currentChapter && appState.currentLesson) {
      updateLessonProgress(appState.currentChapter.id, appState.currentLesson.id, {
        exercises_completed: appState.currentLesson.exercises.length,
        exercises_completedAt: new Date().toISOString()
      });
    }
  };

  // ===== AUDIO FUNCTIONS =====
  
  const playAudio = (text: string, voiceType?: 'enhanced' | 'standard') => {
    console.log('🎯 playAudio called with:', { text, voiceType, audioPlaying });
    
    if (audioPlaying) {
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
      setAudioPlaying(null);
    }
    
    setTimeout(() => {
      // Use voiceType if provided, otherwise apply 6+ word rule
      const useEnhanced = voiceType === 'enhanced' || 
                         (voiceType !== 'standard' && shouldUseEnhancedTTS(text));
      
      if (useEnhanced) {
        playAudioWithGemini(text, 'Kore', setAudioPlaying).catch(() => {
          console.log('🔄 Enhanced TTS failed, falling back to browser TTS');
          fallbackToWebSpeech(text, setAudioPlaying);
        });
      } else {
        fallbackToWebSpeech(text, setAudioPlaying);
      }
    }, 50);
  };

  // ===== TEXT INTERACTION =====
  
  const handleTextClick = async (event: React.MouseEvent<HTMLSpanElement>) => {
    event.preventDefault();
    const target = event.target as HTMLElement;
    const word = target.textContent?.trim();
    if (!word) return;

    const cleanWord = word.replace(/[.,!?;:]/g, '');
    let translation = appState.vocabularyData?.vocabulary[cleanWord];
    
    if (!translation) {
      setDataLoading(prev => ({ ...prev, vocabularyLoading: true }));
      const enhancedTranslation = await getEnhancedTranslation(cleanWord);
      setDataLoading(prev => ({ ...prev, vocabularyLoading: false }));
      
      if (enhancedTranslation.success) {
        // Store in temporary state for this session
        translation = {
          baseForm: cleanWord,
          russian: enhancedTranslation.data.translation,
          grammarInfo: enhancedTranslation.data.partOfSpeech,
          pronunciation: '',
          examples: enhancedTranslation.data.examples || [],
          difficulty: enhancedTranslation.data.difficulty,
          sourceChapter: 'ai_generated',
          frequency: 'medium',
          tags: []
        };
      }
    }
    
    if (translation) {
      setSelectedText(cleanWord);
      const rect = target.getBoundingClientRect();
      setTooltipPosition({ 
        x: rect.left + rect.width / 2, 
        y: rect.top - 10 
      });
      setShowTooltip(true);
    }
  };

  const renderClickableText = (text: string) => {
    const words = text.split(' ');
    return words.map((word, index) => {
      const cleanWord = word.replace(/[.,!?]/g, '');
      const hasTranslation = appState.vocabularyData?.vocabulary[cleanWord];
      const isRussian = /[а-яё]/i.test(cleanWord);
      
      return (
        <span
          key={index}
          className={hasTranslation && !isRussian ? 'cursor-pointer hover:bg-blue-100 hover:text-blue-600 rounded px-1 transition-colors' : ''}
          onClick={hasTranslation && !isRussian ? handleTextClick : undefined}
          onDoubleClick={!isRussian && hasTranslation ? () => {
            addToFavorites(cleanWord, hasTranslation);
          } : undefined}
        >
          {word}
          {index < words.length - 1 && ' '}
        </span>
      );
    });
  };

  // ===== FAVORITES MANAGEMENT =====
  
  const addToFavorites = (word: string, translationData?: any) => {
    const translation = translationData || appState.vocabularyData?.vocabulary[word];
    
    if (translation && !favorites.some(fav => fav.word === word)) {
      const favorite: FavoriteWord = {
        id: Date.now(),
        word,
        translation: translation.russian || translation.baseForm || translation,
        sourceChapter: translation.sourceChapter,
        addedAt: new Date()
      };
      setFavorites(prev => [...prev, favorite]);
    }
  };

  const removeFromFavorites = (word: string) => {
    setFavorites(prev => prev.filter(fav => fav.word !== word));
  };

  const isFavorited = (word: string) => {
    return favorites.some(fav => fav.word === word);
  };

  // ===== AUTO-LOAD DATA ON MOUNT =====
  
  useEffect(() => {
    // Use directly imported data instead of fetching
    setAppState(prev => ({
      ...prev,
      chaptersData: chaptersDataImport as ChaptersData,
     // vocabularyData: vocabularyDataImport as VocabularyData,
      audioScriptsData: audioScriptsDataImport as AudioScriptsData
    }));
    
    // Initialize progress for the chapters
    initializeProgressForNewData(chaptersDataImport as ChaptersData);
    
    setSuccessMessage('✅ All data loaded successfully!');
  }, []);

  // ===== SUCCESS MESSAGE AUTO-HIDE =====
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // ===== COMPUTED VALUES =====
  
  const isLoading = dataLoading.chaptersLoading || dataLoading.vocabularyLoading || dataLoading.audioScriptsLoading;
  const hasErrors = dataLoading.chaptersError || dataLoading.vocabularyError || dataLoading.audioScriptsError;
  const currentLessonProgress = appState.currentChapter && appState.currentLesson ? 
    appProgress.chapters[appState.currentChapter.id]?.lessons[appState.currentLesson.id] : null;

  // ===== RENDER =====
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <ServerDebugTool />
    </div>
  );
};

export default App;