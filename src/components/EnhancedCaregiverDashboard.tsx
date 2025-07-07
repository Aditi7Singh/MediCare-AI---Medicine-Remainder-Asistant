import React, { useState, useEffect } from 'react';
import { Heart, Phone, Mail, AlertTriangle, CheckCircle, Clock, Activity, TrendingUp, Bell } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { User, Medicine, DoseSchedule } from '../types';

interface EnhancedCaregiverDashboardProps {
  user: User;
  medicines: Medicine[];
  schedules: DoseSchedule[];
  onSendAlert: (type: string, message: string) => void;
}

export const EnhancedCaregiverDashboard: React.FC<EnhancedCaregiverDashboardProps> = ({
  user,
  medicines,
  schedules,
  onSendAlert
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month'>('today');
  const [alerts, setAlerts] = useState<any[]>([]);

  const today = new Date();
  const getFilteredSchedules = () => {
    switch (selectedTimeframe) {
      case 'today':
        return schedules.filter(s => 
          format(s.scheduledTime, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
        );
      case 'week':
        return schedules.filter(s => 
          s.scheduledTime >= subDays(today, 7)
        );
      case 'month':
        return schedules.filter(s => 
          s.scheduledTime >= subDays(today, 30)
        );
      default:
        return schedules;
    }
  };

  const filteredSchedules = getFilteredSchedules();
  const adherenceRate = filteredSchedules.length > 0 
    ? Math.round((filteredSchedules.filter(s => s.taken).length / filteredSchedules.length) * 100)
    : 100;

  const missedDoses = filteredSchedules.filter(s => 
    !s.taken && !s.skipped && s.scheduledTime < new Date()
  );

  const criticalMedicines = medicines.filter(m => m.remainingQuantity <= m.criticalThreshold);

  // Generate alerts
  useEffect(() => {
    const newAlerts = [];
    
    if (missedDoses.length > 0) {
      newAlerts.push({
        id: 'missed_doses',
        type: 'critical',
        title: `${missedDoses.length} Missed Dose${missedDoses.length > 1 ? 's' : ''}`,
        message: `${user.name} has missed ${missedDoses.length} dose(s) today`,
        timestamp: new Date(),
        action: 'Call Patient'
      });
    }

    if (criticalMedicines.length > 0) {
      newAlerts.push({
        id: 'low_stock',
        type: 'warning',
        title: 'Low Medicine Stock',
        message: `${criticalMedicines.length} medicine(s) running low`,
        timestamp: new Date(),
        action: 'Order Refill'
      });
    }

    if (adherenceRate < 80) {
      newAlerts.push({
        id: 'poor_adherence',
        type: 'warning',
        title: 'Poor Adherence',
        message: `Adherence rate is ${adherenceRate}% - below target`,
        timestamp: new Date(),
        action: 'Schedule Check-in'
      });
    }

    setAlerts(newAlerts);
  }, [missedDoses.length, criticalMedicines.length, adherenceRate, user.name]);

  const handleSendAlert = (type: string, caregiverId: string) => {
    const caregiver = user.caregivers.find(c => c.id === caregiverId);
    if (caregiver) {
      onSendAlert(type, `Alert sent to ${caregiver.name}`);
    }
  };

  const getAdherenceTrend = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, 6 - i);
      const daySchedules = schedules.filter(s => 
        format(s.scheduledTime, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      const taken = daySchedules.filter(s => s.taken).length;
      return {
        date,
        total: daySchedules.length,
        taken,
        percentage: daySchedules.length > 0 ? Math.round((taken / daySchedules.length) * 100) : 0
      };
    });
    return last7Days;
  };

  const adherenceTrend = getAdherenceTrend();

  return (
    <div className="space-y-6">
      {/* Patient Overview */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-full">
              <Heart className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-pink-100">Age: {user.age} • Emergency: {user.emergencyContact}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-pink-100 text-sm">Monitoring Status</p>
            <p className="text-xl font-bold">
              {alerts.filter(a => a.type === 'critical').length > 0 ? 'Critical' : 'Stable'}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/20 rounded-lg p-3">
            <p className="text-pink-100 text-sm">Today's Adherence</p>
            <p className="text-2xl font-bold">{adherenceRate}%</p>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <p className="text-pink-100 text-sm">Missed Doses</p>
            <p className="text-2xl font-bold">{missedDoses.length}</p>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <p className="text-pink-100 text-sm">Active Alerts</p>
            <p className="text-2xl font-bold">{alerts.length}</p>
          </div>
        </div>
      </div>

      {/* Time Frame Selector */}
      <div className="flex space-x-2">
        {['today', 'week', 'month'].map(timeframe => (
          <button
            key={timeframe}
            onClick={() => setSelectedTimeframe(timeframe as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedTimeframe === timeframe
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
          </button>
        ))}
      </div>

      {/* Critical Alerts */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
            <h3 className="text-lg font-semibold text-red-800">Active Alerts</h3>
          </div>
          <div className="space-y-3">
            {alerts.map(alert => (
              <div key={alert.id} className="flex items-center justify-between bg-white rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    alert.type === 'critical' ? 'bg-red-100' : 'bg-orange-100'
                  }`}>
                    {alert.type === 'critical' ? (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Bell className="h-5 w-5 text-orange-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{alert.title}</p>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                    <p className="text-xs text-gray-500">
                      {format(alert.timestamp, 'h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSendAlert('call', user.caregivers[0]?.id)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                  >
                    {alert.action}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Adherence Trend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">7-Day Adherence Trend</h3>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-sm text-green-600 font-medium">
                {adherenceTrend[adherenceTrend.length - 1]?.percentage}% today
              </span>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-7 gap-2">
            {adherenceTrend.map((day, index) => (
              <div key={index} className="text-center">
                <p className="text-xs text-gray-500 mb-2">{format(day.date, 'EEE')}</p>
                <div className="relative">
                  <div className="w-full h-20 bg-gray-100 rounded-lg flex items-end justify-center">
                    <div 
                      className={`w-full rounded-lg ${
                        day.percentage >= 90 ? 'bg-green-500' :
                        day.percentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ height: `${Math.max(day.percentage, 5)}%` }}
                    />
                  </div>
                  <p className="text-xs font-medium mt-1">{day.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Schedule View */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedTimeframe === 'today' ? "Today's" : 
             selectedTimeframe === 'week' ? "This Week's" : "This Month's"} Schedule
          </h3>
        </div>
        <div className="p-6">
          {filteredSchedules.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No medications scheduled for this period</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSchedules.map(schedule => {
                const medicine = medicines.find(m => m.id === schedule.medicineId);
                if (!medicine) return null;

                return (
                  <div
                    key={schedule.id}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                      schedule.taken
                        ? 'bg-green-50 border-green-200'
                        : schedule.skipped
                        ? 'bg-gray-50 border-gray-200'
                        : !schedule.taken && schedule.scheduledTime < new Date()
                        ? 'bg-red-50 border-red-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {schedule.taken ? (
                          <CheckCircle className="h-8 w-8 text-green-500" />
                        ) : schedule.skipped ? (
                          <AlertTriangle className="h-8 w-8 text-gray-400" />
                        ) : !schedule.taken && schedule.scheduledTime < new Date() ? (
                          <AlertTriangle className="h-8 w-8 text-red-500" />
                        ) : (
                          <Clock className="h-8 w-8 text-blue-500" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{medicine.name}</h3>
                        <p className="text-sm text-gray-600">{medicine.dosage} • {medicine.instructions}</p>
                        <p className="text-sm text-gray-500">
                          Scheduled: {format(schedule.scheduledTime, 'MMM d, h:mm a')}
                          {schedule.takenAt && (
                            <span className="ml-2 text-green-600">
                              • Taken at {format(schedule.takenAt, 'h:mm a')}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {!schedule.taken && !schedule.skipped && schedule.scheduledTime < new Date() && (
                        <button
                          onClick={() => handleSendAlert('reminder', user.caregivers[0]?.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                        >
                          Send Reminder
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Caregiver Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Caregiver Network</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {user.caregivers.map(caregiver => (
              <div key={caregiver.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Heart className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{caregiver.name}</p>
                    <p className="text-sm text-gray-600">{caregiver.relationship}</p>
                    <p className="text-sm text-gray-500">{caregiver.phone}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSendAlert('call', caregiver.id)}
                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleSendAlert('email', caregiver.id)}
                    className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleSendAlert('alert', caregiver.id)}
                    className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                  >
                    <Bell className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};