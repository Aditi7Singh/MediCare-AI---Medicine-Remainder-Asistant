import { Medicine, RefillOrder } from '../types';

export class APIService {
  private static instance: APIService;
  private baseURL = 'https://mock-1mg.com/api';

  private constructor() {}

  static getInstance(): APIService {
    if (!APIService.instance) {
      APIService.instance = new APIService();
    }
    return APIService.instance;
  }

  async simulateRefillOrder(medicine: Medicine, quantity: number): Promise<RefillOrder> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate 1MG API response
    const mockResponse = {
      success: true,
      orderId: `1MG${Date.now()}`,
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
      status: 'confirmed' as const
    };

    console.log('🔄 Simulating 1MG API Call:', {
      endpoint: `${this.baseURL}/refill`,
      payload: {
        user_id: "USER123",
        medicine_name: medicine.name,
        quantity: quantity,
        delivery_address: "XYZ Street, Bengaluru"
      },
      response: mockResponse
    });

    return {
      id: Date.now().toString(),
      medicineId: medicine.id,
      quantity,
      orderDate: new Date(),
      estimatedDelivery: mockResponse.estimatedDelivery,
      status: mockResponse.status,
      orderId1MG: mockResponse.orderId
    };
  }

  async checkMedicineAvailability(medicineName: string): Promise<boolean> {
    // Simulate availability check
    await new Promise(resolve => setTimeout(resolve, 800));
    return Math.random() > 0.1; // 90% availability rate
  }

  async sendCaregiverNotification(
    caregiverPhone: string, 
    message: string, 
    type: string
  ): Promise<boolean> {
    // Simulate SMS/notification service
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('📱 Caregiver Notification Sent:', {
      to: caregiverPhone,
      message,
      type,
      timestamp: new Date().toISOString()
    });

    return true;
  }
}