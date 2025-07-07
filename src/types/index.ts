export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: number; // times per day
  totalQuantity: number;
  remainingQuantity: number;
  criticalThreshold: number;
  prescribedBy: string;
  startDate: Date;
  endDate?: Date;
  instructions: string;
  sideEffects?: string[];
  imageUrl?: string;
}

export interface DoseSchedule {
  id: string;
  medicineId: string;
  scheduledTime: Date;
  taken: boolean;
  takenAt?: Date;
  skipped: boolean;
  status: 'pending' | 'taken' | 'missed' | 'snoozed' | 'taken_late';
  snoozeUntil?: Date;
  notes?: string;
}

export interface User {
  id: string;
  name: string;
  age: number;
  emergencyContact: string;
  preferredLanguage: 'en' | 'hi' | 'kn';
  caregivers: Caregiver[];
}

export interface Caregiver {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  notificationPreferences: {
    missedDose: boolean;
    lowStock: boolean;
    refillOrdered: boolean;
  };
}

export interface VoiceQuery {
  id: string;
  query: string;
  language: 'en' | 'hi' | 'kn';
  intent: string;
  response: string;
  timestamp: Date;
}

export interface RefillOrder {
  id: string;
  medicineId: string;
  quantity: number;
  orderDate: Date;
  estimatedDelivery: Date;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  orderId1MG?: string;
}

export interface Notification {
  id: string;
  type: 'reminder' | 'missed_dose' | 'low_stock' | 'refill_ordered' | 'caregiver_alert';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  recipientType: 'user' | 'caregiver';
}

export interface BlynkData {
  pillCount: number;
  batteryLevel: number;
  temperature: number;
  humidity: number;
  dispenserStatus: number; // 0=ready, 1=dispensing, 2=empty, 3=error
  motionSensor: boolean;
  lastDispensed: number;
  connected: boolean;
}

export interface HardwareActivity {
  id: string;
  type: 'dispense' | 'notification' | 'status_change';
  message: string;
  timestamp: Date;
  success: boolean;
}