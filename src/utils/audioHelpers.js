import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.REACT_APP_GEMINI_API_KEY || ''
});

// Helper function to play audio data with format detection
const playAudioData = async (inlineData, setAudioPlaying) => {
  try {
    const audioData = inlineData.data;
    let mimeType = inlineData.mimeType || 'audio/pcm';
    
    console.log('🎵 Processing audio data:', { 
      mimeType, 
      dataLength: audioData?.length,
      dataType: typeof audioData 
    });
    
    if (!audioData) {
      throw new Error('No audio data found in inlineData');
    }
    
    // Handle different audio formats from Gemini
    let audioBlob;
    
    if (mimeType.includes('pcm') || mimeType.includes('raw')) {
      // Convert PCM to WAV format for browser compatibility
      console.log('🔄 Converting PCM to WAV format');
      audioBlob = convertPCMToWAV(audioData);
    } else if (mimeType.includes('audio/')) {
      // Direct audio format (mp3, wav, etc.)
      console.log('🎵 Using direct audio format:', mimeType);
      audioBlob = new Blob([
        Uint8Array.from(atob(audioData), c => c.charCodeAt(0))
      ], { type: mimeType });
    } else {
      // Try as generic audio
      console.log('🔄 Trying as generic audio format');
      audioBlob = new Blob([
        Uint8Array.from(atob(audioData), c => c.charCodeAt(0))
      ], { type: 'audio/wav' });
    }
    
    console.log('🎵 Created audio blob:', { 
      size: audioBlob.size, 
      type: audioBlob.type 
    });
    
    // Test if blob is valid before creating URL
    if (audioBlob.size === 0) {
      throw new Error('Audio blob is empty');
    }
    
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio();
    
    // Set up event handlers before setting src
    audio.onloadeddata = () => {
      console.log('🎵 Audio loaded successfully, duration:', audio.duration);
    };
    
    audio.oncanplay = () => {
      console.log('🎵 Audio can start playing');
    };
    
    audio.onended = () => {
      console.log('🎵 Gemini TTS playback ended');
      setAudioPlaying(null);
      URL.revokeObjectURL(audioUrl);
    };
    
    audio.onerror = (error) => {
      console.error('❌ Audio playback error details:', {
        error: error,
        audioSrc: audio.src,
        audioError: audio.error
      });
      setAudioPlaying(null);
      URL.revokeObjectURL(audioUrl);
      throw new Error(`Audio playback failed: ${audio.error?.message || 'Unknown error'}`);
    };
    
    // Set source and attempt to play
    audio.src = audioUrl;
    audio.load(); // Explicitly load the audio
    
    await audio.play();
    console.log('🎵 Gemini TTS started playing successfully!');
    
  } catch (error) {
    console.error('❌ Audio processing failed:', error);
    throw error;
  }
};

// Convert PCM data to WAV format for browser compatibility
const convertPCMToWAV = (base64PCM) => {
  try {
    const pcmData = Uint8Array.from(atob(base64PCM), c => c.charCodeAt(0));
    
    // WAV header parameters
    const sampleRate = 24000; // Common for TTS
    const numChannels = 1; // Mono
    const bitsPerSample = 16;
    
    // Calculate sizes
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const dataSize = pcmData.length;
    const fileSize = 36 + dataSize;
    
    // Create WAV header
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    
    // RIFF header
    view.setUint32(0, 0x46464952, true); // "RIFF"
    view.setUint32(4, fileSize, true);
    view.setUint32(8, 0x45564157, true); // "WAVE"
    
    // fmt chunk
    view.setUint32(12, 0x20746d66, true); // "fmt "
    view.setUint32(16, 16, true); // chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    
    // data chunk
    view.setUint32(36, 0x61746164, true); // "data"
    view.setUint32(40, dataSize, true);
    
    // Combine header and data
    const wavData = new Uint8Array(44 + dataSize);
    wavData.set(new Uint8Array(header), 0);
    wavData.set(pcmData, 44);
    
    return new Blob([wavData], { type: 'audio/wav' });
  } catch (error) {
    console.error('❌ PCM to WAV conversion failed:', error);
    throw error;
  }
};

// Main TTS function with better error handling
export const playAudioWithGemini = async (text, speaker = 'Kore', setAudioPlaying) => {
  console.log('🤖 Using Gemini 2.5 Flash TTS for:', text, 'with voice:', speaker);
  
  try {
    setAudioPlaying(text);
    
    console.log('🎯 Calling Gemini TTS...');
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{
        parts: [{
          text: text
        }]
      }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: speaker
            }
          }
        }
      }
    });

    console.log('✅ Gemini TTS response received');
    console.log('🔍 Response candidates:', response.candidates?.length);
    
    // Try to find audio data in response
    let audioFound = false;
    
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        console.log('🔍 Checking part:', part);
        if (part.inlineData) {
          console.log('🎵 Found inlineData:', {
            mimeType: part.inlineData.mimeType,
            hasData: !!part.inlineData.data
          });
          
          try {
            await playAudioData(part.inlineData, setAudioPlaying);
            audioFound = true;
            return;
          } catch (audioError) {
            console.error('❌ Failed to play this audio format:', audioError);
            // Continue to try other parts or fallback
          }
        }
      }
    }
    
    if (!audioFound) {
      console.log('⚠️ No playable audio found, using browser TTS');
      fallbackToWebSpeech(text, setAudioPlaying);
    }
    
  } catch (error) {
    console.error('❌ Gemini TTS failed:', error);
    setAudioPlaying(null);
    fallbackToWebSpeech(text, setAudioPlaying);
  }
};

// Enhanced browser TTS fallback
export const fallbackToWebSpeech = (text, setAudioPlaying) => {
  console.log('🔊 Using browser TTS fallback for:', text);
  
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
    
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fi-FI';
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1.0;
      
      utterance.onstart = () => {
        console.log('🎵 Browser TTS started');
        setAudioPlaying(text);
      };
      
      utterance.onend = () => {
        console.log('🎵 Browser TTS ended');
        setAudioPlaying(null);
      };
      
      utterance.onerror = (error) => {
        console.error('🔴 Browser TTS error:', error);
        setAudioPlaying(null);
      };
      
      // Try to find Finnish voice
      const voices = speechSynthesis.getVoices();
      const finnishVoice = voices.find(voice => 
        voice.lang.startsWith('fi') || voice.name.toLowerCase().includes('finnish')
      );
      
      if (finnishVoice) {
        utterance.voice = finnishVoice;
        console.log('🇫🇮 Using Finnish voice:', finnishVoice.name);
      } else {
        console.log('⚠️ No Finnish voice found, using default');
      }
      
      speechSynthesis.speak(utterance);
    }, 100);
  } else {
    console.error('❌ Speech synthesis not supported');
    setAudioPlaying(null);
  }
};

// Rest of your existing functions...
export const startSpeechRecognition = (targetText, setIsListening) => {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert('❌ Speech recognition not supported in this browser');
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  recognition.lang = 'fi-FI';
  recognition.continuous = false;
  recognition.interimResults = false;

  setIsListening(true);

  recognition.onresult = (event) => {
    const spokenText = event.results[0][0].transcript.toLowerCase();
    const target = targetText.toLowerCase();
    
    if (spokenText.includes(target) || target.includes(spokenText)) {
      alert('🎉 Loistava ääntäminen! Great pronunciation!');
    } else {
      alert(`🔄 Yritä uudelleen! Try again. You said: "${spokenText}"`);
    }
    setIsListening(false);
  };

  recognition.onerror = () => {
    alert('Speech recognition error. Try again.');
    setIsListening(false);
  };

  recognition.start();
};
