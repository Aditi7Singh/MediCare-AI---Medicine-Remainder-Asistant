import { useState, useEffect, useCallback } from 'react';
import { Medicine, DoseSchedule, User, RefillOrder } from '../types';
import { InventoryService } from '../services/inventoryService';

export const useMedicineData = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [schedules, setSchedules] = useState<DoseSchedule[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [refillOrders, setRefillOrders] = useState<RefillOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const inventoryService = InventoryService.getInstance();

  // Initialize with sample data
  useEffect(() => {
    const sampleUser: User = {
      id: '1',
      name: 'Rajesh Kumar',
      age: 65,
      emergencyContact: '+91-9876543210',
      preferredLanguage: 'en',
      caregivers: [
        {
          id: '1',
          name: 'Sunita Kumar',
          relationship: 'Daughter',
          phone: '+91-9876543211',
          email: 'sunita@example.com',
          notificationPreferences: {
            missedDose: true,
            lowStock: true,
            refillOrdered: true
          }
        }
      ]
    };

    const sampleMedicines: Medicine[] = [
      {
        id: '1',
        name: 'Metformin 500mg',
        dosage: '500mg',
        frequency: 2,
        totalQuantity: 60,
        remainingQuantity: 8, // Critical level
        criticalThreshold: 10,
        prescribedBy: 'Dr. Sharma',
        startDate: new Date('2024-01-01'),
        instructions: 'Take with meals',
        sideEffects: ['Nausea', 'Diarrhea'],
        imageUrl: 'https://images.pexels.com/photos/3683097/pexels-photo-3683097.jpeg?auto=compress&cs=tinysrgb&w=400'
      },
      {
        id: '2',
        name: 'Lisinopril 10mg',
        dosage: '10mg',
        frequency: 1,
        totalQuantity: 30,
        remainingQuantity: 4, // Critical level
        criticalThreshold: 5,
        prescribedBy: 'Dr. Patel',
        startDate: new Date('2024-01-01'),
        instructions: 'Take in the morning',
        imageUrl: 'https://images.pexels.com/photos/3683097/pexels-photo-3683097.jpeg?auto=compress&cs=tinysrgb&w=400'
      },
      {
        id: '3',
        name: 'Vitamin D3 1000IU',
        dosage: '1000IU',
        frequency: 1,
        totalQuantity: 100,
        remainingQuantity: 15, // Low level
        criticalThreshold: 15,
        prescribedBy: 'Dr. Reddy',
        startDate: new Date('2024-01-01'),
        instructions: 'Take with fatty meal',
        imageUrl: 'https://images.pexels.com/photos/3683097/pexels-photo-3683097.jpeg?auto=compress&cs=tinysrgb&w=400'
      }
    ];

    const today = new Date();
    const sampleSchedules: DoseSchedule[] = [
      {
        id: '1',
        medicineId: '1',
        scheduledTime: new Date(today.setHours(8, 0, 0, 0)),
        taken: true,
        takenAt: new Date(today.setHours(8, 15, 0, 0)),
        skipped: false,
        status: 'taken'
      },
      {
        id: '2',
        medicineId: '1',
        scheduledTime: new Date(today.setHours(20, 0, 0, 0)),
        taken: false,
        skipped: false,
        status: 'pending'
      },
      {
        id: '3',
        medicineId: '2',
        scheduledTime: new Date(today.setHours(9, 0, 0, 0)),
        taken: false,
        skipped: false,
        status: 'pending'
      },
      {
        id: '4',
        medicineId: '3',
        scheduledTime: new Date(today.setHours(10, 0, 0, 0)),
        taken: false,
        skipped: false,
        status: 'pending'
      }
    ];

    setUser(sampleUser);
    setMedicines(sampleMedicines);
    setSchedules(sampleSchedules);
    setLoading(false);
  }, []);

  const markDoseTaken = useCallback(async (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    // Update schedule
    setSchedules(prev => prev.map(s => 
      s.id === scheduleId 
        ? { ...s, taken: true, takenAt: new Date(), status: 'taken' as const }
        : s
    ));

    // Update medicine stock
    setMedicines(prev => 
      inventoryService.updateStock(schedule.medicineId, prev, true)
    );

    // Check for auto-refill
    const medicine = medicines.find(m => m.id === schedule.medicineId);
    if (medicine) {
      const refillOrder = await inventoryService.autoRefillIfNeeded(medicine);
      if (refillOrder) {
        setRefillOrders(prev => [...prev, refillOrder]);
      }
    }
  }, [schedules, medicines, inventoryService]);

  const skipDose = useCallback((scheduleId: string, reason?: string) => {
    setSchedules(prev => prev.map(s => 
      s.id === scheduleId 
        ? { ...s, skipped: true, status: 'missed' as const, notes: reason }
        : s
    ));
  }, []);

  const snoozeDose = useCallback((scheduleId: string) => {
    const snoozeUntil = new Date();
    snoozeUntil.setMinutes(snoozeUntil.getMinutes() + 30); // Snooze for 30 minutes

    setSchedules(prev => prev.map(s => 
      s.id === scheduleId 
        ? { ...s, status: 'snoozed' as const, snoozeUntil }
        : s
    ));
  }, []);

  const markTakenLate = useCallback((scheduleId: string) => {
    setSchedules(prev => prev.map(s => 
      s.id === scheduleId 
        ? { ...s, taken: true, takenAt: new Date(), status: 'taken_late' as const }
        : s
    ));

    // Update medicine stock
    const schedule = schedules.find(s => s.id === scheduleId);
    if (schedule) {
      setMedicines(prev => 
        inventoryService.updateStock(schedule.medicineId, prev, true)
      );
    }
  }, [schedules, inventoryService]);

  return {
    medicines,
    schedules,
    user,
    refillOrders,
    loading,
    markDoseTaken,
    skipDose,
    snoozeDose,
    markTakenLate,
    setUser
  };
};