import { VoiceQuery, Medicine, DoseSchedule } from '../types';

export class VoiceService {
  private static instance: VoiceService;
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis = window.speechSynthesis;
  private currentLanguage: 'en' | 'hi' | 'kn' = 'en';
  private medicines: Medicine[] = [];
  private schedules: DoseSchedule[] = [];

  private constructor() {
    this.initializeSpeechRecognition();
  }

  static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  public updateMedicineData(medicines: Medicine[], schedules: DoseSchedule[]) {
    this.medicines = medicines;
    this.schedules = schedules;
  }

  private initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
    }
  }

  setLanguage(language: 'en' | 'hi' | 'kn') {
    this.currentLanguage = language;
    if (this.recognition) {
      const langCodes = {
        'en': 'en-US',
        'hi': 'hi-IN',
        'kn': 'kn-IN'
      };
      this.recognition.lang = langCodes[language];
    }
  }

  async startListening(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      this.recognition.onerror = (event) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.start();
    });
  }

  async speak(text: string, language?: 'en' | 'hi' | 'kn'): Promise<void> {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      const lang = language || this.currentLanguage;
      
      const langCodes = {
        'en': 'en-US',
        'hi': 'hi-IN',
        'kn': 'kn-IN'
      };
      
      utterance.lang = langCodes[lang];
      utterance.rate = 0.8;
      utterance.pitch = 1;
      
      utterance.onend = () => resolve();
      
      this.synthesis.speak(utterance);
    });
  }

  processQuery(query: string): VoiceQuery {
    const intent = this.identifyIntent(query);
    const response = this.generateResponse(intent, query);
    
    return {
      id: Date.now().toString(),
      query,
      language: this.currentLanguage,
      intent,
      response,
      timestamp: new Date()
    };
  }

  private identifyIntent(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    // English intents
    if (lowerQuery.includes('did i take') || lowerQuery.includes('taken') || lowerQuery.includes('have i taken')) return 'check_intake';
    if (lowerQuery.includes('next') && lowerQuery.includes('medicine')) return 'next_dose';
    if (lowerQuery.includes('stock') || lowerQuery.includes('running low') || lowerQuery.includes('refill')) return 'check_stock';
    if (lowerQuery.includes('schedule') || lowerQuery.includes('when')) return 'schedule_query';
    
    // Hindi intents
    if (lowerQuery.includes('दवा ली') || lowerQuery.includes('खाई')) return 'check_intake';
    if (lowerQuery.includes('अगली दवा') || lowerQuery.includes('कब लेनी')) return 'next_dose';
    if (lowerQuery.includes('स्टॉक') || lowerQuery.includes('खत्म')) return 'check_stock';
    
    // Kannada intents
    if (lowerQuery.includes('ಔಷಧಿ ತೆಗೆದುಕೊಂಡೆ') || lowerQuery.includes('ಸೇವಿಸಿದೆ')) return 'check_intake';
    if (lowerQuery.includes('ಮುಂದಿನ ಔಷಧಿ') || lowerQuery.includes('ಯಾವಾಗ')) return 'next_dose';
    if (lowerQuery.includes('ಸ್ಟಾಕ್') || lowerQuery.includes('ಮುಗಿಯುತ್ತಿದೆ')) return 'check_stock';
    
    return 'general_query';
  }

  private generateResponse(intent: string, query: string): string {
    const today = new Date();
    const todaySchedules = this.schedules.filter(s => 
      s.scheduledTime.toDateString() === today.toDateString()
    );

    const takenMedicines = todaySchedules
      .filter(s => s.status === 'taken')
      .map(s => this.medicines.find(m => m.id === s.medicineId)?.name)
      .filter(Boolean);

    const pendingMedicines = todaySchedules
      .filter(s => s.status === 'pending')
      .map(s => this.medicines.find(m => m.id === s.medicineId)?.name)
      .filter(Boolean);

    const lowStockMedicines = this.medicines
      .filter(m => m.remainingQuantity <= m.criticalThreshold)
      .map(m => m.name);

    const responses = {
      'en': {
        'check_intake': this.generateIntakeResponse(takenMedicines, pendingMedicines, 'en'),
        'next_dose': pendingMedicines.length > 0 
          ? `Your next medicines to take are: ${pendingMedicines.join(', ')}`
          : 'You have no pending medicines for today.',
        'check_stock': lowStockMedicines.length > 0
          ? `These medicines are running low: ${lowStockMedicines.join(', ')}. I can help you order refills.`
          : 'All your medicines have adequate stock.',
        'schedule_query': `You have ${todaySchedules.length} medicines scheduled for today. ${takenMedicines.length} taken, ${pendingMedicines.length} pending.`,
        'general_query': 'I can help you with medicine reminders, stock checks, and schedules. Try asking "Have I taken my medicine?" or "What medicines are running low?"'
      },
      'hi': {
        'check_intake': this.generateIntakeResponse(takenMedicines, pendingMedicines, 'hi'),
        'next_dose': pendingMedicines.length > 0
          ? `आपकी अगली दवाइयाँ हैं: ${pendingMedicines.join(', ')}`
          : 'आज आपकी कोई दवा बाकी नहीं है।',
        'check_stock': lowStockMedicines.length > 0
          ? `ये दवाइयाँ कम हो रही हैं: ${lowStockMedicines.join(', ')}। मैं रिफिल ऑर्डर करने में मदद कर सकता हूँ।`
          : 'आपकी सभी दवाइयों का स्टॉक पर्याप्त है।',
        'schedule_query': `आज आपकी ${todaySchedules.length} दवाइयाँ निर्धारित हैं। ${takenMedicines.length} ली गई, ${pendingMedicines.length} बाकी।`,
        'general_query': 'मैं दवा रिमाइंडर, स्टॉक चेक और शेड्यूल में आपकी मदद कर सकता हूँ।'
      },
      'kn': {
        'check_intake': this.generateIntakeResponse(takenMedicines, pendingMedicines, 'kn'),
        'next_dose': pendingMedicines.length > 0
          ? `ನಿಮ್ಮ ಮುಂದಿನ ಔಷಧಿಗಳು: ${pendingMedicines.join(', ')}`
          : 'ಇಂದು ನಿಮಗೆ ಯಾವುದೇ ಔಷಧಿ ಬಾಕಿ ಇಲ್ಲ।',
        'check_stock': lowStockMedicines.length > 0
          ? `ಈ ಔಷಧಿಗಳು ಕಡಿಮೆಯಾಗುತ್ತಿವೆ: ${lowStockMedicines.join(', ')}। ನಾನು ರೀಫಿಲ್ ಆರ್ಡರ್ ಮಾಡಲು ಸಹಾಯ ಮಾಡಬಹುದು।`
          : 'ನಿಮ್ಮ ಎಲ್ಲಾ ಔಷಧಿಗಳ ಸ್ಟಾಕ್ ಸಾಕಾಗಿದೆ।',
        'schedule_query': `ಇಂದು ನಿಮಗೆ ${todaySchedules.length} ಔಷಧಿಗಳು ನಿಗದಿಪಡಿಸಲಾಗಿದೆ। ${takenMedicines.length} ತೆಗೆದುಕೊಂಡಿದ್ದೀರಿ, ${pendingMedicines.length} ಬಾಕಿ ಇದೆ।`,
        'general_query': 'ನಾನು ಔಷಧಿ ರಿಮೈಂಡರ್, ಸ್ಟಾಕ್ ಚೆಕ್ ಮತ್ತು ಶೆಡ್ಯೂಲ್‌ನಲ್ಲಿ ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಹುದು।'
      }
    };

    return responses[this.currentLanguage][intent] || responses[this.currentLanguage]['general_query'];
  }

  private generateIntakeResponse(takenMedicines: string[], pendingMedicines: string[], language: 'en' | 'hi' | 'kn'): string {
    const responses = {
      'en': {
        taken: takenMedicines.length > 0 
          ? `Yes, you have taken: ${takenMedicines.join(', ')}.`
          : 'You haven\'t taken any medicines yet today.',
        pending: pendingMedicines.length > 0
          ? ` You still need to take: ${pendingMedicines.join(', ')}.`
          : ' You have taken all your scheduled medicines for today.'
      },
      'hi': {
        taken: takenMedicines.length > 0
          ? `हाँ, आपने ली हैं: ${takenMedicines.join(', ')}।`
          : 'आपने आज अभी तक कोई दवा नहीं ली है।',
        pending: pendingMedicines.length > 0
          ? ` आपको अभी भी लेनी हैं: ${pendingMedicines.join(', ')}।`
          : ' आपने आज की सभी निर्धारित दवाइयाँ ले ली हैं।'
      },
      'kn': {
        taken: takenMedicines.length > 0
          ? `ಹೌದು, ನೀವು ತೆಗೆದುಕೊಂಡಿದ್ದೀರಿ: ${takenMedicines.join(', ')}।`
          : 'ನೀವು ಇಂದು ಇನ್ನೂ ಯಾವುದೇ ಔಷಧಿ ತೆಗೆದುಕೊಂಡಿಲ್ಲ।',
        pending: pendingMedicines.length > 0
          ? ` ನೀವು ಇನ್ನೂ ತೆಗೆದುಕೊಳ್ಳಬೇಕು: ${pendingMedicines.join(', ')}।`
          : ' ನೀವು ಇಂದಿನ ಎಲ್ಲಾ ನಿಗದಿತ ಔಷಧಿಗಳನ್ನು ತೆಗೆದುಕೊಂಡಿದ್ದೀರಿ।'
      }
    };

    return responses[language].taken + responses[language].pending;
  }
}