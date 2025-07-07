import { Medicine, RefillOrder } from '../types';

export interface OneMgMedicine {
  id: string;
  name: string;
  manufacturer: string;
  price: number;
  mrp: number;
  discount: number;
  availability: boolean;
  prescription_required: boolean;
  pack_size: string;
  composition: string;
  image_url: string;
}

export interface OneMgOrderResponse {
  order_id: string;
  status: 'confirmed' | 'processing' | 'shipped' | 'delivered';
  estimated_delivery: string;
  tracking_id?: string;
  total_amount: number;
  payment_status: 'pending' | 'completed' | 'failed';
}

export class OneMgApiService {
  private static instance: OneMgApiService;
  private baseURL = 'https://api.1mg.com/v1';
  private apiKey = import.meta.env.VITE_REACT_APP_1MG_API_KEY || 'demo_key_123';

  private constructor() {}

  static getInstance(): OneMgApiService {
    if (!OneMgApiService.instance) {
      OneMgApiService.instance = new OneMgApiService();
    }
    return OneMgApiService.instance;
  }

  async searchMedicine(query: string): Promise<OneMgMedicine[]> {
    try {
      // Simulate API call for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('🔍 1mg API - Medicine Search:', {
        endpoint: `${this.baseURL}/medicines/search`,
        query,
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });

      // Mock response based on common medicines
      const mockMedicines: OneMgMedicine[] = [
        {
          id: '1mg_001',
          name: 'Metformin 500mg',
          manufacturer: 'Sun Pharma',
          price: 45.50,
          mrp: 52.00,
          discount: 12.5,
          availability: true,
          prescription_required: true,
          pack_size: '15 tablets',
          composition: 'Metformin Hydrochloride 500mg',
          image_url: 'https://images.pexels.com/photos/3683097/pexels-photo-3683097.jpeg?auto=compress&cs=tinysrgb&w=400'
        },
        {
          id: '1mg_002',
          name: 'Lisinopril 10mg',
          manufacturer: 'Cipla',
          price: 89.25,
          mrp: 105.00,
          discount: 15,
          availability: true,
          prescription_required: true,
          pack_size: '10 tablets',
          composition: 'Lisinopril 10mg',
          image_url: 'https://images.pexels.com/photos/3683097/pexels-photo-3683097.jpeg?auto=compress&cs=tinysrgb&w=400'
        }
      ];

      return mockMedicines.filter(med => 
        med.name.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('1mg API Search Error:', error);
      throw new Error('Failed to search medicines on 1mg');
    }
  }

  async checkAvailability(medicineId: string): Promise<boolean> {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('📦 1mg API - Availability Check:', {
        endpoint: `${this.baseURL}/medicines/${medicineId}/availability`,
        medicineId
      });

      return Math.random() > 0.1; // 90% availability
    } catch (error) {
      console.error('1mg API Availability Error:', error);
      return false;
    }
  }

  async placeOrder(
    medicineId: string, 
    quantity: number, 
    userDetails: any
  ): Promise<OneMgOrderResponse> {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const orderData = {
        medicine_id: medicineId,
        quantity,
        user_id: userDetails.id,
        delivery_address: userDetails.address,
        payment_method: 'cod'
      };

      console.log('🛒 1mg API - Place Order:', {
        endpoint: `${this.baseURL}/orders`,
        payload: orderData,
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });

      const mockResponse: OneMgOrderResponse = {
        order_id: `1MG${Date.now()}`,
        status: 'confirmed',
        estimated_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        tracking_id: `TRK${Date.now()}`,
        total_amount: quantity * 45.50,
        payment_status: 'completed'
      };

      return mockResponse;
    } catch (error) {
      console.error('1mg API Order Error:', error);
      throw new Error('Failed to place order on 1mg');
    }
  }

  async trackOrder(orderId: string): Promise<any> {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      console.log('📍 1mg API - Track Order:', {
        endpoint: `${this.baseURL}/orders/${orderId}/track`,
        orderId
      });

      return {
        order_id: orderId,
        status: 'shipped',
        current_location: 'Mumbai Distribution Center',
        estimated_delivery: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        tracking_history: [
          { status: 'confirmed', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), location: 'Order Confirmed' },
          { status: 'processing', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), location: 'Pharmacy' },
          { status: 'shipped', timestamp: new Date(), location: 'Mumbai Distribution Center' }
        ]
      };
    } catch (error) {
      console.error('1mg API Tracking Error:', error);
      throw new Error('Failed to track order');
    }
  }

  async getOrderHistory(userId: string): Promise<any[]> {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('📋 1mg API - Order History:', {
        endpoint: `${this.baseURL}/users/${userId}/orders`,
        userId
      });

      return [
        {
          order_id: '1MG1234567890',
          medicine_name: 'Metformin 500mg',
          quantity: 30,
          order_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'delivered',
          total_amount: 136.50
        },
        {
          order_id: '1MG1234567891',
          medicine_name: 'Lisinopril 10mg',
          quantity: 15,
          order_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'delivered',
          total_amount: 178.50
        }
      ];
    } catch (error) {
      console.error('1mg API History Error:', error);
      return [];
    }
  }
}