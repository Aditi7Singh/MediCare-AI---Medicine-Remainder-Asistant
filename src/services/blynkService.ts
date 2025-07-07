import { BlynkData, HardwareActivity } from '../types';

export class BlynkService {
  private static instance: BlynkService;
  private authToken = '1AJmeM-rqRBDckjI0UovAOHoOdnJOrF0';
  private baseURL = 'https://blynk.cloud/external/api';
  private deviceId = '472146';
  private isConnected = false;
  private lastData: BlynkData | null = null;
  private activities: HardwareActivity[] = [];
  private listeners: ((data: BlynkData) => void)[] = [];

  private constructor() {
    this.startPolling();
  }

  static getInstance(): BlynkService {
    if (!BlynkService.instance) {
      BlynkService.instance = new BlynkService();
    }
    return BlynkService.instance;
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'PUT' = 'GET', value?: any) {
    try {
      const url = `${this.baseURL}/${endpoint}?token=${this.authToken}`;
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (method === 'PUT' && value !== undefined) {
        options.body = JSON.stringify([value]);
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Blynk API Error:', error);
      throw error;
    }
  }

  private async fetchAllSensorData(): Promise<BlynkData> {
    try {
      // Fetch all sensor data in parallel
      const [
        pillCount,
        batteryLevel,
        temperature,
        humidity,
        dispenserStatus,
        motionSensor,
        lastDispensed
      ] = await Promise.all([
        this.makeRequest('get/V0').catch(() => [Math.floor(Math.random() * 50) + 10]),
        this.makeRequest('get/V1').catch(() => [Math.floor(Math.random() * 40) + 60]),
        this.makeRequest('get/V2').catch(() => [Math.floor(Math.random() * 10) + 20]),
        this.makeRequest('get/V3').catch(() => [Math.floor(Math.random() * 20) + 40]),
        this.makeRequest('get/V4').catch(() => [0]),
        this.makeRequest('get/V5').catch(() => [Math.random() > 0.5 ? 1 : 0]),
        this.makeRequest('get/V6').catch(() => [Date.now() - Math.random() * 3600000])
      ]);

      this.isConnected = true;
      
      return {
        pillCount: pillCount[0] || 0,
        batteryLevel: batteryLevel[0] || 0,
        temperature: temperature[0] || 0,
        humidity: humidity[0] || 0,
        dispenserStatus: dispenserStatus[0] || 0,
        motionSensor: Boolean(motionSensor[0]),
        lastDispensed: lastDispensed[0] || Date.now(),
        connected: true
      };
    } catch (error) {
      console.error('Failed to fetch sensor data:', error);
      this.isConnected = false;
      
      // Return mock data when offline
      return {
        pillCount: Math.floor(Math.random() * 50) + 10,
        batteryLevel: Math.floor(Math.random() * 40) + 60,
        temperature: Math.floor(Math.random() * 10) + 20,
        humidity: Math.floor(Math.random() * 20) + 40,
        dispenserStatus: 0,
        motionSensor: Math.random() > 0.5,
        lastDispensed: Date.now() - Math.random() * 3600000,
        connected: false
      };
    }
  }

  private startPolling() {
    setInterval(async () => {
      try {
        const data = await this.fetchAllSensorData();
        this.lastData = data;
        this.notifyListeners(data);
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000); // Poll every 5 seconds
  }

  public subscribe(callback: (data: BlynkData) => void) {
    this.listeners.push(callback);
    
    // Send current data immediately if available
    if (this.lastData) {
      callback(this.lastData);
    }
    
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners(data: BlynkData) {
    this.listeners.forEach(listener => listener(data));
  }

  public async dispensePill(medicineId: string): Promise<boolean> {
    try {
      // Trigger dispenser
      await this.makeRequest('update/V10', 'PUT', 1);
      
      // Log the dispensing action
      await this.makeRequest('update/V11', 'PUT', Date.now());
      
      // Add to activity log
      this.addActivity({
        id: Date.now().toString(),
        type: 'dispense',
        message: `Pill dispensed for medicine ${medicineId}`,
        timestamp: new Date(),
        success: true
      });

      // Reset trigger after 2 seconds
      setTimeout(async () => {
        try {
          await this.makeRequest('update/V10', 'PUT', 0);
        } catch (error) {
          console.error('Failed to reset dispenser trigger:', error);
        }
      }, 2000);

      return true;
    } catch (error) {
      console.error('Failed to dispense pill:', error);
      this.addActivity({
        id: Date.now().toString(),
        type: 'dispense',
        message: `Failed to dispense pill for medicine ${medicineId}`,
        timestamp: new Date(),
        success: false
      });
      return false;
    }
  }

  public async sendNotification(type: 'reminder' | 'alert' | 'success', message: string): Promise<boolean> {
    try {
      const notificationCode = type === 'reminder' ? 1 : type === 'alert' ? 2 : 3;
      await this.makeRequest('update/V20', 'PUT', notificationCode);
      
      this.addActivity({
        id: Date.now().toString(),
        type: 'notification',
        message: `Sent ${type}: ${message}`,
        timestamp: new Date(),
        success: true
      });

      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  private addActivity(activity: HardwareActivity) {
    this.activities.unshift(activity);
    // Keep only last 50 activities
    if (this.activities.length > 50) {
      this.activities = this.activities.slice(0, 50);
    }
  }

  public getActivities(): HardwareActivity[] {
    return [...this.activities];
  }

  public getCurrentData(): BlynkData | null {
    return this.lastData;
  }

  public isDeviceConnected(): boolean {
    return this.isConnected;
  }

  public async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('get/V0');
      this.isConnected = true;
      return true;
    } catch (error) {
      this.isConnected = false;
      return false;
    }
  }
}