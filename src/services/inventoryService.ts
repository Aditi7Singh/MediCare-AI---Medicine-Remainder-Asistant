import { Medicine, RefillOrder } from '../types';
import { OneMgApiService } from './oneMgApiService';

export class InventoryService {
  private static instance: InventoryService;
  private oneMgService = OneMgApiService.getInstance();

  private constructor() {}

  static getInstance(): InventoryService {
    if (!InventoryService.instance) {
      InventoryService.instance = new InventoryService();
    }
    return InventoryService.instance;
  }

  checkStockLevel(medicine: Medicine): 'critical' | 'low' | 'adequate' {
    if (medicine.remainingQuantity <= medicine.criticalThreshold) {
      return 'critical';
    } else if (medicine.remainingQuantity <= medicine.criticalThreshold * 2) {
      return 'low';
    }
    return 'adequate';
  }

  calculateDaysRemaining(medicine: Medicine): number {
    if (medicine.frequency === 0) return 0;
    return Math.floor(medicine.remainingQuantity / medicine.frequency);
  }

  async autoRefillIfNeeded(medicine: Medicine): Promise<RefillOrder | null> {
    const stockLevel = this.checkStockLevel(medicine);
    
    if (stockLevel === 'critical') {
      try {
        // Check availability on 1mg
        const available = await this.oneMgService.checkAvailability(`1mg_${medicine.id}`);
        
        if (available) {
          // Place order through 1mg API
          const orderResponse = await this.oneMgService.placeOrder(
            `1mg_${medicine.id}`,
            medicine.totalQuantity,
            { id: 'USER123', address: 'XYZ Street, Bengaluru' }
          );

          return {
            id: Date.now().toString(),
            medicineId: medicine.id,
            quantity: medicine.totalQuantity,
            orderDate: new Date(),
            estimatedDelivery: new Date(orderResponse.estimated_delivery),
            status: orderResponse.status as 'confirmed',
            orderId1MG: orderResponse.order_id
          };
        }
      } catch (error) {
        console.error('Auto-refill failed:', error);
      }
    }
    
    return null;
  }

  predictRefillDate(medicine: Medicine): Date {
    const daysRemaining = this.calculateDaysRemaining(medicine);
    const refillDate = new Date();
    refillDate.setDate(refillDate.getDate() + daysRemaining);
    return refillDate;
  }

  updateStock(medicineId: string, medicines: Medicine[], taken: boolean): Medicine[] {
    return medicines.map(medicine => {
      if (medicine.id === medicineId && taken) {
        return {
          ...medicine,
          remainingQuantity: Math.max(0, medicine.remainingQuantity - 1)
        };
      }
      return medicine;
    });
  }

  async searchMedicineOnOneMg(query: string) {
    try {
      return await this.oneMgService.searchMedicine(query);
    } catch (error) {
      console.error('Failed to search medicine on 1mg:', error);
      return [];
    }
  }

  async trackOrder(orderId: string) {
    try {
      return await this.oneMgService.trackOrder(orderId);
    } catch (error) {
      console.error('Failed to track order:', error);
      return null;
    }
  }

  calculateStockValue(medicines: Medicine[]): number {
    // Estimate stock value based on average medicine prices
    return medicines.reduce((total, medicine) => {
      const estimatedPrice = 50; // Average price per tablet
      return total + (medicine.remainingQuantity * estimatedPrice);
    }, 0);
  }

  getStockAlerts(medicines: Medicine[]): Array<{
    type: 'critical' | 'low' | 'expiring';
    medicine: Medicine;
    message: string;
  }> {
    const alerts = [];

    medicines.forEach(medicine => {
      const stockLevel = this.checkStockLevel(medicine);
      const daysRemaining = this.calculateDaysRemaining(medicine);

      if (stockLevel === 'critical') {
        alerts.push({
          type: 'critical' as const,
          medicine,
          message: `Only ${medicine.remainingQuantity} tablets left (${daysRemaining} days)`
        });
      } else if (stockLevel === 'low') {
        alerts.push({
          type: 'low' as const,
          medicine,
          message: `Running low: ${medicine.remainingQuantity} tablets remaining`
        });
      }

      // Check for expiring medicines (if endDate exists)
      if (medicine.endDate) {
        const daysToExpiry = Math.ceil((medicine.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        if (daysToExpiry <= 30 && daysToExpiry > 0) {
          alerts.push({
            type: 'expiring' as const,
            medicine,
            message: `Expires in ${daysToExpiry} days`
          });
        }
      }
    });

    return alerts;
  }
}