import React from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle, Pill, SunSnow as Snooze, XCircle, ClockIcon, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { Medicine, DoseSchedule } from '../types';
import { InventoryService } from '../services/inventoryService';
import { BlynkService } from '../services/blynkService';

interface DashboardProps {
  medicines: Medicine[];
  schedules: DoseSchedule[];
  onMarkTaken: (scheduleId: string) => void;
  onSkipDose: (scheduleId: string) => void;
  onSnoozeDose: (scheduleId: string) => void;
  onMarkTakenLate: (scheduleId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  medicines,
  schedules,
  onMarkTaken,
  onSkipDose,
  onSnoozeDose,
  onMarkTakenLate
}) => {
  const inventoryService = InventoryService.getInstance();
  const blynkService = BlynkService.getInstance();
  const today = new Date();
  const todaySchedules = schedules.filter(s => 
    format(s.scheduledTime, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
  );

  const upcomingDoses = todaySchedules.filter(s => s.status === 'pending');
  const completedDoses = todaySchedules.filter(s => s.status === 'taken');
  const missedDoses = todaySchedules.filter(s => s.status === 'missed');
  const snoozedDoses = todaySchedules.filter(s => s.status === 'snoozed');
  const criticalMedicines = medicines.filter(m => 
    inventoryService.checkStockLevel(m) === 'critical'
  );

  const handleDispenseFromHardware = async (medicineId: string) => {
    try {
      const success = await blynkService.dispensePill(medicineId);
      if (success) {
        const schedule = todaySchedules.find(s => s.medicineId === medicineId && s.status === 'pending');
        if (schedule) {
          onMarkTaken(schedule.id);
        }
      }
    } catch (error) {
      console.error('Failed to dispense from hardware:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taken': return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'missed': return <XCircle className="h-6 w-6 text-red-500" />;
      case 'snoozed': return <Snooze className="h-6 w-6 text-yellow-500" />;
      case 'taken_late': return <ClockIcon className="h-6 w-6 text-orange-500" />;
      default: return <Clock className="h-6 w-6 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'taken': return 'bg-green-50 border-green-200';
      case 'missed': return 'bg-red-50 border-red-200';
      case 'snoozed': return 'bg-yellow-50 border-yellow-200';
      case 'taken_late': return 'bg-orange-50 border-orange-200';
      default: return 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md';
    }
  };

  const statCards = [
    {
      title: "Today's Doses",
      value: todaySchedules.length,
      icon: Calendar,
      color: 'blue',
      bgGradient: 'from-blue-500 to-blue-600'
    },
    {
      title: "Completed",
      value: completedDoses.length,
      icon: CheckCircle,
      color: 'green',
      bgGradient: 'from-green-500 to-green-600'
    },
    {
      title: "Pending",
      value: upcomingDoses.length,
      icon: Clock,
      color: 'orange',
      bgGradient: 'from-orange-500 to-orange-600'
    },
    {
      title: "Snoozed",
      value: snoozedDoses.length,
      icon: Snooze,
      color: 'yellow',
      bgGradient: 'from-yellow-500 to-yellow-600'
    },
    {
      title: "Low Stock",
      value: criticalMedicines.length,
      icon: AlertTriangle,
      color: 'red',
      bgGradient: 'from-red-500 to-red-600'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}!
        </h1>
        <p className="text-gray-600">Here's your health overview for {format(today, 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className={`bg-gradient-to-br ${card.bgGradient} rounded-2xl p-6 text-white transform hover:scale-105 transition-all duration-200`}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold">{card.value}</div>
              </div>
              <p className="text-white/80 text-sm font-medium">{card.title}</p>
            </div>
          );
        })}
      </div>

      {/* Critical Stock Alerts */}
      {criticalMedicines.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mr-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-800">Critical Stock Alert</h3>
          </div>
          <div className="grid gap-3">
            {criticalMedicines.map(medicine => (
              <div key={medicine.id} className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center space-x-3">
                  <img 
                    src={medicine.imageUrl} 
                    alt={medicine.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{medicine.name}</p>
                    <p className="text-sm text-red-600">
                      Only {medicine.remainingQuantity} tablets left
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-600">
                    {inventoryService.calculateDaysRemaining(medicine)} days left
                  </p>
                  <p className="text-xs text-gray-500">Auto-refill available</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Schedule */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Today's Medicine Schedule</h2>
          <p className="text-gray-600 mt-1">Track your daily medication routine</p>
        </div>
        
        <div className="p-6">
          {todaySchedules.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Pill className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No medications scheduled for today</p>
              <p className="text-gray-400 text-sm mt-1">Enjoy your medicine-free day!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todaySchedules.map(schedule => {
                const medicine = medicines.find(m => m.id === schedule.medicineId);
                if (!medicine) return null;

                return (
                  <div
                    key={schedule.id}
                    className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all duration-200 ${getStatusColor(schedule.status)}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(schedule.status)}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{medicine.name}</h3>
                        <p className="text-gray-600">{medicine.dosage} • {medicine.instructions}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>📅 {format(schedule.scheduledTime, 'h:mm a')}</span>
                          {schedule.takenAt && (
                            <span className="text-green-600">
                              ✅ Taken at {format(schedule.takenAt, 'h:mm a')}
                            </span>
                          )}
                          {schedule.snoozeUntil && (
                            <span className="text-yellow-600">
                              ⏰ Snoozed until {format(schedule.snoozeUntil, 'h:mm a')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {schedule.status === 'pending' && (
                      <div className="flex flex-col space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => onMarkTaken(schedule.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium text-sm"
                          >
                            ✅ Taken
                          </button>
                          <button
                            onClick={() => onMarkTakenLate(schedule.id)}
                            className="px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-medium text-sm"
                          >
                            ⏰ Late
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => onSnoozeDose(schedule.id)}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors font-medium text-sm"
                          >
                            😴 Snooze
                          </button>
                          <button
                            onClick={() => onSkipDose(schedule.id)}
                            className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium text-sm"
                          >
                            ❌ Missed
                          </button>
                        </div>
                        <button
                          onClick={() => handleDispenseFromHardware(medicine.id)}
                          className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium text-sm flex items-center justify-center space-x-2"
                        >
                          <Zap className="h-4 w-4" />
                          <span>IoT Dispense</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};