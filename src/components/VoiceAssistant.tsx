import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Globe, MessageSquare, Sparkles } from 'lucide-react';
import { VoiceService } from '../services/voiceService';
import { VoiceQuery, Medicine, DoseSchedule } from '../types';

interface VoiceAssistantProps {
  language: 'en' | 'hi' | 'kn';
  onLanguageChange: (language: 'en' | 'hi' | 'kn') => void;
  medicines: Medicine[];
  schedules: DoseSchedule[];
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  language,
  onLanguageChange,
  medicines,
  schedules
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastQuery, setLastQuery] = useState<VoiceQuery | null>(null);
  const [voiceService] = useState(() => VoiceService.getInstance());

  useEffect(() => {
    voiceService.setLanguage(language);
    voiceService.updateMedicineData(medicines, schedules);
  }, [language, medicines, schedules, voiceService]);

  const handleStartListening = async () => {
    try {
      setIsListening(true);
      const transcript = await voiceService.startListening();
      const query = voiceService.processQuery(transcript);
      setLastQuery(query);
      
      setIsSpeaking(true);
      await voiceService.speak(query.response, language);
      setIsSpeaking(false);
    } catch (error) {
      console.error('Voice recognition error:', error);
    } finally {
      setIsListening(false);
    }
  };

  const handleTestQuery = async (text: string) => {
    const query = voiceService.processQuery(text);
    setLastQuery(query);
    
    setIsSpeaking(true);
    await voiceService.speak(query.response, language);
    setIsSpeaking(false);
  };

  const languageOptions = [
    { code: 'en' as const, name: 'English', flag: '🇺🇸' },
    { code: 'hi' as const, name: 'हिंदी', flag: '🇮🇳' },
    { code: 'kn' as const, name: 'ಕನ್ನಡ', flag: '🇮🇳' }
  ];

  const sampleQueries = {
    'en': [
      'Have I taken my medicine today?',
      'What medicines do I still need to take?',
      'Which medicines are running low?',
      'When is my next dose?'
    ],
    'hi': [
      'क्या मैंने आज अपनी दवा ली है?',
      'मुझे अभी भी कौन सी दवाइयाँ लेनी हैं?',
      'कौन सी दवाइयाँ कम हो रही हैं?',
      'मेरी अगली खुराक कब है?'
    ],
    'kn': [
      'ನಾನು ಇಂದು ನನ್ನ ಔಷಧಿ ತೆಗೆದುಕೊಂಡಿದ್ದೇನೆಯೇ?',
      'ನಾನು ಇನ್ನೂ ಯಾವ ಔಷಧಿಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಬೇಕು?',
      'ಯಾವ ಔಷಧಿಗಳು ಕಡಿಮೆಯಾಗುತ್ತಿವೆ?',
      'ನನ್ನ ಮುಂದಿನ ಡೋಸ್ ಯಾವಾಗ?'
    ]
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">AI Voice Assistant</h2>
                <p className="text-purple-100">Your intelligent health companion</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Globe className="h-5 w-5 text-purple-200" />
              <select
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as 'en' | 'hi' | 'kn')}
                className="px-3 py-2 bg-white/20 text-white rounded-xl border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
              >
                {languageOptions.map(option => (
                  <option key={option.code} value={option.code} className="text-gray-900">
                    {option.flag} {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Voice Control */}
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <button
                onClick={handleStartListening}
                disabled={isListening || isSpeaking}
                className={`relative w-24 h-24 rounded-full transition-all transform hover:scale-105 ${
                  isListening
                    ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50'
                    : isSpeaking
                    ? 'bg-blue-500 animate-pulse shadow-lg shadow-blue-500/50'
                    : 'bg-gradient-to-br from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 shadow-lg'
                } text-white disabled:opacity-50`}
              >
                {isListening ? (
                  <Mic className="h-10 w-10 mx-auto" />
                ) : isSpeaking ? (
                  <Volume2 className="h-10 w-10 mx-auto" />
                ) : (
                  <MicOff className="h-10 w-10 mx-auto" />
                )}
              </button>
              
              {(isListening || isSpeaking) && (
                <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping"></div>
              )}
            </div>

            <div className="mt-6">
              <p className="text-lg font-medium text-gray-900 mb-2">
                {isListening
                  ? '🎤 Listening... Please speak now'
                  : isSpeaking
                  ? '🔊 Speaking response...'
                  : '👋 Tap to start voice interaction'
                }
              </p>
              <p className="text-sm text-gray-500">
                Currently using: {languageOptions.find(l => l.code === language)?.name}
              </p>
            </div>
          </div>

          {/* Sample Queries */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-purple-600" />
              Try asking me:
            </h3>
            <div className="grid gap-3">
              {sampleQueries[language].map((query, index) => (
                <button
                  key={index}
                  onClick={() => handleTestQuery(query)}
                  disabled={isSpeaking}
                  className="text-left p-4 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 hover:from-blue-50 hover:to-purple-50 border border-gray-200 hover:border-blue-300 transition-all text-sm disabled:opacity-50 group"
                >
                  <span className="text-gray-700 group-hover:text-blue-700">"{query}"</span>
                </button>
              ))}
            </div>
          </div>

          {/* Last Query Response */}
          {lastQuery && (
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
                Last Conversation:
              </h3>
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2 font-medium">You asked:</p>
                  <p className="text-gray-900">{lastQuery.query}</p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-sm text-blue-600 mb-2 font-medium">AI Assistant responded:</p>
                  <p className="text-blue-900 font-medium">{lastQuery.response}</p>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Intent: {lastQuery.intent}</span>
                  <span>{lastQuery.timestamp.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};