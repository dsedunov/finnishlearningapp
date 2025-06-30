import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ChapterNavigation from './components/ChapterNavigation';
import LessonNavigation from './components/LessonNavigation';
import SectionNavigation from './components/SectionNavigation';
import TheorySection from './components/TheorySection';
import ReadingSection from './components/ReadingSection';
import ExercisesSection from './components/ExercisesSection';
import FavoritesSection from './components/FavoritesSection';
import Tooltip from './components/Tooltip';
import { 
  AppState, 
  AppProgress, 
  Chapter, 
  Lesson, 
  ChaptersData, 
  VocabularyData, 
  AudioScriptsData,
  LessonProgress,
  LessonProgressDetailed,
  ChapterProgress,
  FavoriteWord
} from './types';

// Import JSON data directly
import chaptersData from './data/chapters.json';
import vocabularyData from './data/vocabulary.json';
import audioScriptsData from './data/audio_scripts.json';

// ===== INITIAL STATE =====
const initialAppState: AppState = {
  currentSection: 'home',
  currentChapter: null,
  currentLesson: null,
  chaptersData: null,
  vocabularyData: null,
  audioScriptsData: null,
  appProgress: {
    chapters: {},
    totalCompletedLessons: 0,
    lastUpdated: new Date().toISOString()
  },
  favorites: []
};

const initialProgress: AppProgress = {
  chapters: {},
  totalCompletedLessons: 0,
  lastUpdated: new Date().toISOString()
};

// ===== MAIN COMPONENT =====
function App() {
  // ===== STATE =====
  const [appState, setAppState] = useState<AppState>(initialAppState);
  const [appProgress, setAppProgress] = useState<AppProgress>(initialProgress);
  const [favorites, setFavorites] = useState<FavoriteWord[]>([]);
  const [exerciseAnswers, setExerciseAnswers] = useState<{[key: string]: string}>({});
  const [exerciseSubmitted, setExerciseSubmitted] = useState<{[key: string]: boolean}>({});
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [selectedText, setSelectedText] = useState<string>('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [audioPlaying, setAudioPlaying] = useState<string>('');
  const [isListening, setIsListening] = useState(false);

  // ===== COMPUTED VALUES =====
  const currentLessonProgress = appState.currentChapter && appState.currentLesson 
    ? appProgress.chapters[appState.currentChapter.id]?.lessons[appState.currentLesson.id]
    : null;

  // ===== PROGRESS MANAGEMENT =====
  const initializeProgressForNewData = useCallback((chaptersData: ChaptersData) => {
    const savedProgress = localStorage.getItem('finnishAppProgress');
    let progress: AppProgress;

    if (savedProgress) {
      try {
        progress = JSON.parse(savedProgress);
      } catch {
        progress = { 
          chapters: {}, 
          totalCompletedLessons: 0,
          lastUpdated: new Date().toISOString()
        };
      }
    } else {
      progress = { 
        chapters: {}, 
        totalCompletedLessons: 0,
        lastUpdated: new Date().toISOString()
      };
    }

    let totalCompletedLessons = 0;

    chaptersData.chapters.forEach(chapter => {
      if (!progress.chapters[chapter.id]) {
        progress.chapters[chapter.id] = { 
          chapterId: chapter.id,
          chapterCompleted: false,
          lessons: {} 
        };
      }

      chapter.lessons.forEach(lesson => {
        if (!progress.chapters[chapter.id].lessons[lesson.id]) {
          progress.chapters[chapter.id].lessons[lesson.id] = {
            lessonId: lesson.id,
            theory_completed: false,
            reading_completed: false,
            exercises_completed: 0,
            total_exercises: lesson.exercises.length,
            lessonFullyCompleted: false,
            lastAccessedAt: ""
          };
        } else if (progress.chapters[chapter.id].lessons[lesson.id].lessonFullyCompleted) {
          totalCompletedLessons++;
        }
      });
    });

    progress.totalCompletedLessons = totalCompletedLessons;
    progress.lastUpdated = new Date().toISOString();

    setAppProgress(progress);
    localStorage.setItem('finnishAppProgress', JSON.stringify(progress));
  }, []);

  const saveProgress = useCallback((newProgress: AppProgress) => {
    setAppProgress(newProgress);
    localStorage.setItem('finnishAppProgress', JSON.stringify(newProgress));
  }, []);

  // ===== NAVIGATION FUNCTIONS =====
  const goToHome = useCallback(() => {
    console.log('goToHome clicked');
    setAppState(prev => ({
      ...prev,
      currentSection: 'home',
      currentChapter: null,
      currentLesson: null
    }));
  }, []);

  const goToFavorites = useCallback(() => {
    console.log('goToFavorites clicked');
    setAppState(prev => ({
      ...prev,
      currentSection: 'favorites'
    }));
  }, []);

  const selectChapter = useCallback((chapter: Chapter) => {
    console.log('selectChapter clicked:', chapter.title);
    setAppState(prev => ({
      ...prev,
      currentSection: 'chapter',
      currentChapter: chapter,
      currentLesson: null
    }));
  }, []);

  const selectLesson = useCallback((lesson: Lesson) => {
    console.log('selectLesson clicked:', lesson.title);
    setAppState(prev => ({
      ...prev,
      currentSection: 'theory',
      currentLesson: lesson
    }));
  }, []);

  const changeSection = useCallback((section: AppState['currentSection']) => {
    console.log('changeSection clicked:', section);
    setAppState(prev => ({
      ...prev,
      currentSection: section
    }));
  }, []);

  const goToTheory = useCallback(() => {
    setAppState(prev => ({
      ...prev,
      currentSection: 'theory'
    }));
  }, []);

  // ===== COMPLETION FUNCTIONS =====
  const completeTheory = useCallback(() => {
    if (!appState.currentChapter || !appState.currentLesson) return;

    const newProgress = { ...appProgress };
    const chapterProgress = newProgress.chapters[appState.currentChapter.id];
    const lessonProgress = chapterProgress.lessons[appState.currentLesson.id];
    
    lessonProgress.theory_completed = true;
    checkLessonCompletion(lessonProgress, appState.currentLesson);
    
    saveProgress(newProgress);
    setSuccessMessage('Theory completed! 🎉');
    setTimeout(() => setSuccessMessage(''), 3000);
  }, [appState.currentChapter, appState.currentLesson, appProgress, saveProgress]);

  const completeReading = useCallback(() => {
    if (!appState.currentChapter || !appState.currentLesson) return;

    const newProgress = { ...appProgress };
    const chapterProgress = newProgress.chapters[appState.currentChapter.id];
    const lessonProgress = chapterProgress.lessons[appState.currentLesson.id];
    
    lessonProgress.reading_completed = true;
    checkLessonCompletion(lessonProgress, appState.currentLesson);
    
    saveProgress(newProgress);
    setSuccessMessage('Reading completed! 📖');
    setTimeout(() => setSuccessMessage(''), 3000);
  }, [appState.currentChapter, appState.currentLesson, appProgress, saveProgress]);

  const completeExercises = useCallback(() => {
    if (!appState.currentChapter || !appState.currentLesson) return;

    const newProgress = { ...appProgress };
    const chapterProgress = newProgress.chapters[appState.currentChapter.id];
    const lessonProgress = chapterProgress.lessons[appState.currentLesson.id];
    
    lessonProgress.exercises_completed = appState.currentLesson.exercises.length;
    checkLessonCompletion(lessonProgress, appState.currentLesson);
    
    saveProgress(newProgress);
    setSuccessMessage('Exercises completed! ✅');
    setTimeout(() => setSuccessMessage(''), 3000);
  }, [appState.currentChapter, appState.currentLesson, appProgress, saveProgress]);

  const checkLessonCompletion = (lessonProgress: LessonProgressDetailed, lesson: Lesson) => {
    const isComplete = lessonProgress.theory_completed && 
                      lessonProgress.reading_completed && 
                      lessonProgress.exercises_completed === lesson.exercises.length;
    
    if (isComplete && !lessonProgress.lessonFullyCompleted) {
      lessonProgress.lessonFullyCompleted = true;
      lessonProgress.lastAccessedAt = new Date().toISOString();
      setAppProgress(prev => ({
        ...prev,
        totalCompletedLessons: prev.totalCompletedLessons + 1,
        lastUpdated: new Date().toISOString()
      }));
    }
  };

  // ===== FAVORITES MANAGEMENT =====
  const addToFavorites = useCallback((word: string) => {
    const translation = appState.vocabularyData?.vocabulary[word];
    
    // Extract the actual translation string
    let translationText: string;
    if (typeof translation === 'string') {
      translationText = translation;
    } else if (translation && typeof translation === 'object') {
      translationText = translation.russian || translation.baseForm || 'Translation available';
    } else {
      translationText = 'Translation not available';
    }
    
    const favoriteWord: FavoriteWord = { 
      id: Date.now(),
      word, 
      translation: translationText, // Use the extracted string
      addedAt: new Date() 
    };
    
    if (!favorites.find(fav => fav.word === word)) {
      const newFavorites = [...favorites, favoriteWord];
      setFavorites(newFavorites);
      localStorage.setItem('finnishAppFavorites', JSON.stringify(newFavorites));
      setSuccessMessage(`Added "${word}" to favorites! ⭐`);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  }, [favorites, appState.vocabularyData]);  

  const removeFromFavorites = useCallback((word: string) => {
    const newFavorites = favorites.filter(fav => fav.word !== word);
    setFavorites(newFavorites);
    localStorage.setItem('finnishAppFavorites', JSON.stringify(newFavorites));
  }, [favorites]);

  const isFavorited = useCallback((word: string) => {
    return favorites.some(fav => fav.word === word);
  }, [favorites]);

  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  // ===== AUDIO FUNCTIONS =====
  const playAudio = useCallback((text: string, voiceType?: 'enhanced' | 'standard') => {
    console.log('Playing audio for:', text, 'with voice type:', voiceType);
    
    if (voiceType === 'enhanced') {
      setIsGeneratingAudio(true); // Start showing progress
      // Use Gemini TTS for enhanced audio
      import('./utils/geminiAI').then(({ playAudioWithGemini }) => {
        playAudioWithGemini(text, 'Kore', setAudioPlaying).catch((error) => {
          console.log('🔄 Falling back to browser TTS due to:', error.message);
          // Fallback to browser TTS if Gemini fails
          fallbackToWebSpeech(text, setAudioPlaying);
        }).finally(() => {
          setIsGeneratingAudio(false); // Stop showing progress
        });
      }).catch((importError) => {
        console.log('🔄 Failed to import Gemini AI, using browser TTS:', importError);
        fallbackToWebSpeech(text, setAudioPlaying);
        setIsGeneratingAudio(false); // Stop showing progress
      });
    } else {
      // Use optimized browser TTS for standard audio
      fallbackToWebSpeech(text, setAudioPlaying);
    }
  }, []);

// Add this new helper function right after playAudio
const fallbackToWebSpeech = (text: string, setAudioPlaying: (text: string) => void) => {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
    
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Optimized settings for Finnish
      utterance.lang = 'fi-FI';
      utterance.rate = 0.75; // Slightly slower for better pronunciation
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onstart = () => setAudioPlaying(text);
      utterance.onend = () => setAudioPlaying(''); // Use empty string instead of null
      utterance.onerror = () => setAudioPlaying(''); // Use empty string instead of null
      
      // Try to find the best Finnish voice
      const voices = speechSynthesis.getVoices();
      let finnishVoice = null;
      
      // Priority order for Finnish voices
      const preferredVoices = [
        'Microsoft Heidi - Finnish (Finland)',
        'Google suomi',
        'Finnish Finland',
        'fi-FI'
      ];
      
      for (const preferred of preferredVoices) {
        finnishVoice = voices.find(voice => 
          voice.name.includes(preferred) || 
          voice.lang.startsWith('fi')
        );
        if (finnishVoice) break;
      }
      
      if (finnishVoice) {
        utterance.voice = finnishVoice;
        console.log('🇫🇮 Using Finnish voice:', finnishVoice.name);
      } else {
        console.log('⚠️ No Finnish voice found, using default');
      }
      
      speechSynthesis.speak(utterance);
    }, 100);
  } else {
    setAudioPlaying(''); // Use empty string instead of null
  }
};

// ===== CACHE MANAGEMENT =====
const clearAudioCache = useCallback(async () => {
  try {
    const { clearAudioCache: clearCache } = await import('./utils/geminiAI');
    await clearCache();
    setSuccessMessage('Audio cache cleared! 🗑️');
    setTimeout(() => setSuccessMessage(''), 3000);
  } catch (error) {
    console.error('Failed to clear cache:', error);
    setSuccessMessage('Failed to clear cache ❌');
    setTimeout(() => setSuccessMessage(''), 3000);
  }
}, []);

const getCacheStats = useCallback(async () => {
  try {
    const { getAudioCacheStats } = await import('./utils/geminiAI');
    const stats = await getAudioCacheStats();
    console.log('📊 Audio cache stats:', stats);
    setSuccessMessage(`Cache: ${stats.count} files, ${stats.totalSizeMB}MB 📊`);
    setTimeout(() => setSuccessMessage(''), 5000);
  } catch (error) {
    console.error('Failed to get cache stats:', error);
    setSuccessMessage('Failed to get cache stats ❌');
    setTimeout(() => setSuccessMessage(''), 3000);
  }
}, []);


  // ===== TEXT INTERACTION =====
  const renderClickableText = useCallback((text: string) => {
    if (!appState.vocabularyData) return <span>{text}</span>;
  
    const words = text.split(/(\s+|[.,!?;:])/);
    return (
      <span>
        {words.map((word, index) => {
          const cleanWord = word.toLowerCase().replace(/[.,!?;:]/g, '');
          const hasTranslation = appState.vocabularyData!.vocabulary[cleanWord];
          
          if (hasTranslation && word.trim()) {
            return (
              <span
                key={index}
                className="cursor-pointer hover:bg-yellow-200 transition-colors duration-200 inline-block"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔍 Clicked word:', cleanWord);
                  console.log('🔍 Translation data:', hasTranslation);
                  console.log('🔍 Vocabulary data structure:', appState.vocabularyData!.vocabulary[cleanWord]);
                  
                  const rect = e.currentTarget.getBoundingClientRect();
                  setSelectedText(cleanWord);
                  setTooltipPosition({
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10
                  });
                  setShowTooltip(true);
                  
                  console.log('🔍 Tooltip should show now');
                }}
                style={{ position: 'relative' }}
              >
                {word}
              </span>
            );
          }
          return <span key={index}>{word}</span>;
        })}
      </span>
    );
  }, [appState.vocabularyData]);
  
  

  // ===== SPEECH RECOGNITION =====
  const startSpeechRecognition = useCallback((targetText: string, setListening: (listening: boolean) => void) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'fi-FI';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      const target = targetText.toLowerCase();
      
      if (transcript.includes(target) || target.includes(transcript)) {
        setSuccessMessage('Great pronunciation! 🎤');
      } else {
        setSuccessMessage('Keep practicing! Try again. 🎤');
      }
      setTimeout(() => setSuccessMessage(''), 3000);
    };

    recognition.onerror = () => {
      setListening(false);
      console.error('Speech recognition error');
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  }, []);

  // ===== EFFECTS =====
  useEffect(() => {
    // Set data directly from imports
    setAppState(prev => ({
      ...prev,
      chaptersData: chaptersData as ChaptersData,
      vocabularyData: vocabularyData as VocabularyData,
      audioScriptsData: audioScriptsData as AudioScriptsData
    }));
    
    // Initialize progress with the imported data
    initializeProgressForNewData(chaptersData as ChaptersData);
    
    // Load saved favorites
    const savedFavorites = localStorage.getItem('finnishAppFavorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    }
  }, [initializeProgressForNewData]);

  // ===== RENDER =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header 
        onHomeClick={goToHome}
      />

      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {successMessage}
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        
        {/* Home Section */}
        {appState.currentSection === 'home' && appState.chaptersData && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">
                Welcome to Finnish Learning! 🇫🇮
              </h1>
              <p className="text-lg text-gray-600">
                Choose a chapter to begin your Finnish journey
              </p>
            </div>

            <ChapterNavigation 
              chapters={appState.chaptersData.chapters}
              onChapterSelect={(chapter) => {
                console.log('Chapter selected:', chapter);
                selectChapter(chapter);
              }}
              appProgress={appProgress}
              currentChapter={appState.currentChapter}
              onHomeClick={goToHome}
              onGoToFavorites={goToFavorites}
              favoritesCount={favorites.length}
            />
          </div>
        )}

        {/* Chapter Section */}
{appState.currentSection === 'chapter' && appState.currentChapter && (
  <div>
    <LessonNavigation 
      chapter={appState.currentChapter}
      currentLesson={appState.currentLesson}
      chapterProgress={appProgress.chapters[appState.currentChapter.id]}
      onLessonSelect={selectLesson}
      onBackToChapter={goToHome}
      onHomeClick={goToHome}
    />
  </div>
)}

{/* Lesson Sections */}
{appState.currentLesson && appState.currentChapter && (
  <div>
    {/* Section Navigation */}
    <SectionNavigation 
      lesson={appState.currentLesson}
      currentSection={appState.currentSection as 'theory' | 'reading' | 'exercises'}
      lessonProgress={currentLessonProgress!}
      onSectionChange={changeSection}
      onBackToLessons={() => selectChapter(appState.currentChapter!)}
      onHomeClick={goToHome}
    />

    {/* Theory Section */}
    {appState.currentSection === 'theory' && appState.vocabularyData && appState.audioScriptsData && (
      <TheorySection 
        lesson={appState.currentLesson}
        vocabularyData={appState.vocabularyData}
        audioScriptsData={appState.audioScriptsData}
        isCompleted={currentLessonProgress?.theory_completed || false}
        audioPlaying={audioPlaying}
        isListening={isListening}
        onPlayAudio={playAudio}
        onStartSpeechRecognition={(text: string) => startSpeechRecognition(text, setIsListening)}
        onAddToFavorites={(word: string, translation: any) => addToFavorites(word)}
        onCompleteTheory={completeTheory}
        onRestartTheory={() => {
          // Reset theory progress if needed
          console.log('Restart theory');
        }}
        isFavorited={isFavorited}
        renderClickableText={renderClickableText}
      />
    )}

    {/* Reading Section */}
{appState.currentSection === 'reading' && appState.audioScriptsData && (
  <ReadingSection 
    lesson={appState.currentLesson}
    audioScriptsData={appState.audioScriptsData}
    isCompleted={currentLessonProgress?.reading_completed || false}
    audioPlaying={audioPlaying}
    isListening={isListening}
    isGeneratingAudio={isGeneratingAudio} // Add this prop
    onPlayAudio={playAudio}
    onStartSpeechRecognition={(text: string) => startSpeechRecognition(text, setIsListening)}
    onCompleteReading={completeReading}
    onRestartReading={() => {
      console.log('Restart reading');
    }}
    onGoToExercises={() => changeSection('exercises')}
    renderClickableText={renderClickableText}
  />
)}

    {/* Exercises Section */}
    {appState.currentSection === 'exercises' && appState.audioScriptsData && (
      <ExercisesSection 
        lesson={appState.currentLesson}
        audioScriptsData={appState.audioScriptsData}
        exercisesCompleted={currentLessonProgress?.exercises_completed || 0}
        totalExercises={appState.currentLesson.exercises.length}
        isAllCompleted={currentLessonProgress?.exercises_completed === appState.currentLesson.exercises.length}
        exerciseAnswers={exerciseAnswers}
        exerciseSubmitted={Object.keys(exerciseSubmitted).length > 0}
        audioPlaying={audioPlaying}
        isListening={isListening}
        onAnswerChange={(exerciseIndex: number, itemIndex: number, answer: any) => {
          const key = `${exerciseIndex}-${itemIndex}`;
          setExerciseAnswers(prev => ({ ...prev, [key]: answer }));
        }}
        onBlankAnswerChange={(exerciseIndex: number, itemIndex: number, blankIndex: number, answer: string) => {
          const key = `${exerciseIndex}-${itemIndex}-${blankIndex}`;
          setExerciseAnswers(prev => ({ ...prev, [key]: answer }));
        }}
        onPlayAudio={playAudio}
        onStartSpeechRecognition={(text: string) => startSpeechRecognition(text, setIsListening)}
        onSubmitExercises={() => {
          // Mark exercises as submitted
          const lessonId = appState.currentLesson!.id;
          setExerciseSubmitted(prev => ({ ...prev, [lessonId]: true }));
        }}
        onResetExercises={() => {
          // Reset exercise answers
          setExerciseAnswers({});
          setExerciseSubmitted({});
        }}
        onCompleteExercises={completeExercises}
        onRestartExercises={() => {
          // Reset and restart exercises
          setExerciseAnswers({});
          setExerciseSubmitted({});
        }}
      />
    )}
  </div>
)}
        {/* Favorites Section */}
        {appState.currentSection === 'favorites' && appState.vocabularyData && (
          <FavoritesSection 
            favorites={favorites}
            onRemoveFromFavorites={removeFromFavorites}
            onPlayAudio={playAudio}
            audioPlaying={audioPlaying}
            vocabularyData={appState.vocabularyData}
            isListening={isListening}
            onStartSpeechRecognition={(text: string) => startSpeechRecognition(text, setIsListening)}
            onGoToTheory={goToTheory}
          />
        )}
      </div>

      {/* Tooltip */}
{showTooltip && selectedText && appState.vocabularyData && (
  <Tooltip 
    show={showTooltip}
    selectedText={selectedText}
    position={tooltipPosition}
    translations={appState.vocabularyData.vocabulary}
    onClose={() => {
      console.log('🔍 Closing tooltip');
      setShowTooltip(false);
    }}
    onAddToFavorites={(word: string, translation?: any) => {
      console.log('🔍 Adding to favorites:', word);
      addToFavorites(word);
      setShowTooltip(false);
    }}
    onPlayAudio={(text: string, voiceType?: string) => {
      console.log('🔍 Playing audio:', text, voiceType);
      if (voiceType === 'gemini') {
        playAudio(text, 'enhanced');
      } else {
        playAudio(text, 'standard');
      }
    }}
    onStartSpeechRecognition={(text: string) => {
      console.log('🔍 Starting speech recognition:', text);
      startSpeechRecognition(text, setIsListening);
    }}
    onEnhanceTranslation={(word: string) => {
      console.log('🔍 Enhancing translation for:', word);
      // Add your enhancement logic here
    }}
  />
)}

    </div>
  );
}

export default App;
