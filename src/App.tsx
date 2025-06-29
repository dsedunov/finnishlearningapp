import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';

// Component imports
import Header from './components/Header';
import Navigation from './components/Navigation';
import StatsCards from './components/StatsCards';
import FileUpload from './components/FileUpload';
import LessonsList from './components/LessonsList';
import TheorySection from './components/TheorySection';
import ReadingSection from './components/ReadingSection';
import ExercisesSection from './components/ExercisesSection';
import FavoritesSection from './components/FavoritesSection';
import Tooltip from './components/Tooltip';
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

const App: React.FC = () => {
  // Core state
  const [currentSection, setCurrentSection] = useState('home');
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [lessons, setLessons] = useState<any[]>([]);
  const [translations, setTranslations] = useState<{[key: string]: any}>({});
  const [usageStats, setUsageStats] = useState(getUsageStats());
  
  // Exercise state
  const [exerciseAnswers, setExerciseAnswers] = useState<{[key: string]: any}>({});
  const [exerciseSubmitted, setExerciseSubmitted] = useState(false);
  
  // Audio and interaction state
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  // Tooltip state
  const [showTooltip, setShowTooltip] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  // UI state
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Persistent state using localStorage
  const [favorites, setFavorites] = useLocalStorage<any[]>('finnishApp_favorites', []);
  const [dataUrls, setDataUrls] = useLocalStorage('finnishApp_dataUrls', {
    lessons: 'https://raw.githubusercontent.com/dsedunov/finnishlearningapp/refs/heads/main/demo_lessons_json',
    translations: 'https://raw.githubusercontent.com/dsedunov/finnishlearningapp/refs/heads/main/demo_translations_json.json'
  });

  // Computed values
  const getCurrentLessons = () => lessons.length > 0 ? lessons : [];
  const getCurrentTranslations = () => translations || {};
  const currentTopic = getCurrentLessons()[currentTopicIndex] || null;

  const refreshUsageStats = () => {
    setUsageStats(getUsageStats());
  };
  
  // Data loading function
  const loadExternalData = async (url: string, type: 'lessons' | 'translations') => {
    if (!url || !url.trim()) {
      setDataError(`Please enter a valid URL for ${type}`);
      return;
    }
  
    setDataLoading(true);
    setDataError(null);
    setSuccessMessage('');
  
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
  
      // Get the raw text first to debug JSON issues
      const rawText = await response.text();
      console.log(`Raw ${type} data:`, rawText.substring(0, 200) + '...'); // Debug log
      
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (jsonError) {
        console.error(`JSON Parse Error for ${type}:`, jsonError);
        console.error(`Raw text around error:`, rawText.substring(16460, 16480)); // Show text around error position
        
        // Try to fix common JSON issues
        const cleanedText = rawText
          .replace(/}\s*{/g, '},{') // Fix concatenated objects
          .replace(/^(?!\[)/, '[')   // Add opening bracket if missing
          .replace(/(?<!\])$/, ']'); // Add closing bracket if missing
        
        try {
          data = JSON.parse(cleanedText);
          console.log(`Fixed JSON for ${type}`);
        } catch (secondError) {
          throw new Error(`Invalid JSON format in ${type} file. Please check the file structure.`);
        }
      }
  
      if (type === 'lessons') {
        const lessonsData = Array.isArray(data) ? data : data.lessons || data.lesson || [];
        if (lessonsData.length === 0) {
          throw new Error('No lessons found in the data');
        }
        setLessons(lessonsData);
        setCurrentTopicIndex(0);
        setCurrentSection('home');
        setSuccessMessage(`✅ Loaded ${lessonsData.length} lessons successfully!`);
      } else if (type === 'translations') {
        const translationsData = data.translations || data;
        const wordCount = Object.keys(translationsData).length;
        if (wordCount === 0) {
          throw new Error('No translations found in the data');
        }
        setTranslations(translationsData);
        setSuccessMessage(`✅ Loaded ${wordCount} translations successfully!`);
      }
    } catch (error) {
      console.error(`Error loading ${type}:`, error);
      setDataError(`Failed to load ${type}: ${(error as Error).message}`);
    } finally {
      setDataLoading(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };
  

  // Auto-load data on mount
  useEffect(() => {
    if (dataUrls.lessons) {
      loadExternalData(dataUrls.lessons, 'lessons');
    }
    if (dataUrls.translations) {
      loadExternalData(dataUrls.translations, 'translations');
    }
  }, []);

  // Audio functions
  const playAudio = (text: string, voiceType = 'default') => {
    console.log('🎯 playAudio called with:', { text, voiceType, audioPlaying });
    
    if (audioPlaying) {
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
      setAudioPlaying(null);
    }
    
    setTimeout(() => {
      if (voiceType === 'gemini') {
        // Try regular approach first, then streaming
        playAudioWithGemini(text, 'Kore', setAudioPlaying).catch(() => {
          console.log('🔄 Regular TTS failed, trying streaming approach');
          playAudioWithGemini(text, 'Kore', setAudioPlaying);
        });
      } else {
        fallbackToWebSpeech(text, setAudioPlaying);
      }
    }, 50);
  };

  // Text interaction handlers
  const handleTextClick = async (event: React.MouseEvent<HTMLSpanElement>) => {
    event.preventDefault();
    const target = event.target as HTMLElement;
    const word = target.textContent?.trim();
    if (!word) return;

    const currentTranslations = getCurrentTranslations();
    const cleanWord = word.replace(/[.,!?;:]/g, '');
    let translation = currentTranslations[cleanWord];
    
    if (!translation) {
      setDataLoading(true);
      const enhancedTranslation = await getEnhancedTranslation(cleanWord);
      setDataLoading(false);
      
      if (enhancedTranslation.success) {
        const newTranslation = {
          base: enhancedTranslation.data.baseTranslation,
          details: `📝 ${enhancedTranslation.data.grammaticalInfo.partOfSpeech}\n🔄 ${enhancedTranslation.data.formationRules}\n💡 ${enhancedTranslation.data.usageNotes}`,
          enhanced: enhancedTranslation.data
        };
        
        setTranslations(prev => ({
          ...prev,
          [cleanWord]: newTranslation
        }));
        
        translation = newTranslation;
      } else {
        setDataError(`Could not translate "${cleanWord}": ${enhancedTranslation.error}`);
        return;
      }
    }
    
    setSelectedText(cleanWord);
    const rect = target.getBoundingClientRect();
    setTooltipPosition({ 
      x: rect.left + rect.width / 2, 
      y: rect.top - 10 
    });
    setShowTooltip(true);
  };

  // Favorites management
  const addToFavorites = (word: string, translation?: any) => {
    const currentTranslations = getCurrentTranslations();
    const wordTranslation = translation || currentTranslations[word];

    if (wordTranslation && !favorites.some(fav => fav.word === word)) {
      const favorite = {
        id: Date.now(),
        word,
        translation: wordTranslation.base || wordTranslation,
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

  // Render clickable text
  const renderClickableText = (text: string) => {
    const words = text.split(' ');
    return words.map((word, index) => {
      const cleanWord = word.replace(/[.,!?]/g, '');
      const currentTranslations = getCurrentTranslations();
      const hasTranslation = currentTranslations[cleanWord];
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

  // Navigation handlers
  const goToHome = () => {
    setCurrentSection('home');
    setCurrentTopicIndex(0);
  };

  const goToPreviousLesson = () => {
    const currentIndex = lessons.indexOf(currentTopic);
    if (currentIndex > 0) {
      setCurrentTopicIndex(currentIndex - 1);
    }
  };

  const goToNextLesson = () => {
    const currentIndex = lessons.indexOf(currentTopic);
    if (currentIndex < lessons.length - 1) {
      setCurrentTopicIndex(currentIndex + 1);
    }
  };

  const selectLesson = (index: number) => {
    setCurrentTopicIndex(index);
    setCurrentSection('theory');
  };

  // File upload handlers
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'lessons' | 'translations') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setDataLoading(true);
    setDataError(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (type === 'lessons') {
        setLessons(Array.isArray(data) ? data : [data]);
        setSuccessMessage('Lessons successfully uploaded!');
      } else {
        setTranslations(data);
        setSuccessMessage('Translations successfully uploaded!');
      }
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setDataError(`Error uploading ${type}: Invalid JSON format`);
    } finally {
      setDataLoading(false);
    }
  };

  // Exercise handlers
  const handleExerciseAnswer = (exerciseIndex: number, itemIndex: number, answer: any) => {
    const key = `${exerciseIndex}-${itemIndex}`;
    setExerciseAnswers(prev => ({
      ...prev,
      [key]: answer
    }));
  };

  const handleBlankAnswer = (exerciseIndex: number, itemIndex: number, blankIndex: number, answer: string) => {
    const key = `${exerciseIndex}-${itemIndex}-${blankIndex}`;
    setExerciseAnswers(prev => ({
      ...prev,
      [key]: answer
    }));
  };

  const submitExercises = () => {
    setExerciseSubmitted(true);
  };

  const resetExercises = () => {
    setExerciseAnswers({});
    setExerciseSubmitted(false);
  };

  // URL handlers
  const handleUrlChange = (type: 'lessons' | 'translations', url: string) => {
    setDataUrls(prev => ({ ...prev, [type]: url }));
  };

  // Tooltip handlers
  const handleEnhanceTranslation = async (word: string) => {
    setDataLoading(true);
    const enhanced = await getEnhancedTranslation(word);
    setDataLoading(false);
    if (enhanced.success) {
      setTranslations(prev => ({
        ...prev,
        [word]: {
          base: enhanced.data.baseTranslation,
          enhanced: enhanced.data
        }
      }));
    }
  };

  // Close tooltip when clicking outside or pressing escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showTooltip) {
        setShowTooltip(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showTooltip]);

  // Close tooltip when navigating between sections
  useEffect(() => {
    setShowTooltip(false);
  }, [currentSection, currentTopicIndex]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <Header onHomeClick={goToHome} />

      <div className="container mx-auto px-4 py-6">
        {/* Loading State */}
        {dataLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg font-semibold">Loading Finnish lessons...</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            <div className="flex items-center">
              <Check className="w-5 h-5 mr-2" />
              {successMessage}
            </div>
          </div>
        )}

        {/* Error Message */}
        {dataError && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            <div className="flex items-center">
              <X className="w-5 h-5 mr-2" />
              {dataError}
              <button 
                onClick={() => setDataError(null)}
                className="ml-2 hover:bg-red-600 rounded p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <Navigation
          currentTopic={currentTopic}
          currentSection={currentSection}
          lessons={lessons}
          favoritesCount={favorites.length}
          onHomeClick={goToHome}
          onPreviousLesson={goToPreviousLesson}
          onNextLesson={goToNextLesson}
          onSectionChange={setCurrentSection}
          canGoPrevious={lessons.indexOf(currentTopic) > 0}
          canGoNext={lessons.indexOf(currentTopic) < lessons.length - 1}
        />

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Home Section */}
          {currentSection === 'home' && (
            <div>
              <StatsCards
                lessonsCount={getCurrentLessons().length}
                wordsCount={Object.keys(getCurrentTranslations()).length}
                favoritesCount={favorites.length}
              />

              <FileUpload
                dataUrls={dataUrls}
                onUrlChange={handleUrlChange}
                onLoadFromUrl={loadExternalData}
                onFileUpload={handleFileUpload}
                dataLoading={dataLoading}
              />

              <LessonsList
                lessons={getCurrentLessons()}
                onLessonSelect={selectLesson}
              />
            </div>
          )}

          {/* Theory Section */}
          {currentSection === 'theory' && (
            <TheorySection
              currentTopic={currentTopic}
              audioPlaying={audioPlaying}
              isListening={isListening}
              onPlayAudio={playAudio}
              onStartSpeechRecognition={(text: string) => startSpeechRecognition(text, setIsListening)}
              onAddToFavorites={addToFavorites}
              isFavorited={isFavorited}
              renderClickableText={renderClickableText}
            />
          )}

          {/* Reading Section */}
          {currentSection === 'reading' && (
            <ReadingSection
              currentTopic={currentTopic}
              audioPlaying={audioPlaying}
              isListening={isListening}
              exerciseSubmitted={exerciseSubmitted}
              onPlayAudio={playAudio}
              onStartSpeechRecognition={(text: string) => startSpeechRecognition(text, setIsListening)}
              onSubmitReading={() => setExerciseSubmitted(true)}
              onResetReading={() => setExerciseSubmitted(false)}
              onGoToExercises={() => setCurrentSection('exercises')}
              renderClickableText={renderClickableText}
            />
          )}

          {/* Exercises Section */}
          {currentSection === 'exercises' && (
            <ExercisesSection
              currentTopic={currentTopic}
              exerciseAnswers={exerciseAnswers}
              exerciseSubmitted={exerciseSubmitted}
              audioPlaying={audioPlaying}
              isListening={isListening}
              onAnswerChange={handleExerciseAnswer}
              onBlankAnswerChange={handleBlankAnswer}
              onPlayAudio={playAudio}
              onStartSpeechRecognition={(text: string) => startSpeechRecognition(text, setIsListening)}
              onSubmitExercises={submitExercises}
              onResetExercises={resetExercises}
            />
          )}

          {/* Favorites Section */}
          {currentSection === 'favorites' && (
            <FavoritesSection
              favorites={favorites}
              audioPlaying={audioPlaying}
              isListening={isListening}
              onPlayAudio={playAudio}
              onStartSpeechRecognition={(text: string) => startSpeechRecognition(text, setIsListening)}
              onRemoveFromFavorites={removeFromFavorites}
              onGoToTheory={() => setCurrentSection('theory')}
            />
          )}
        </div>

        {/* Tooltip */}
        <Tooltip
          show={showTooltip}
          selectedText={selectedText}
          position={tooltipPosition}
          translations={getCurrentTranslations()}
          onClose={() => setShowTooltip(false)}
          onAddToFavorites={addToFavorites}
          onPlayAudio={playAudio}
          onStartSpeechRecognition={(text: string) => startSpeechRecognition(text, setIsListening)}
          onEnhanceTranslation={handleEnhanceTranslation}
        />
      </div>
    </div>
  );
};

export default App;
