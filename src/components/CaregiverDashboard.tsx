import React from 'react';
import { Heart, Phone, Mail, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { User, Medicine, DoseSchedule } from '../types';

interface CaregiverDashboardProps {
  user: User;
  medicines: Medicine[];
  schedules: DoseSchedule[];
}

export const CaregiverDashboard: React.FC<CaregiverDashboardProps> = ({
  user,
  medicines,
  schedules
}) => {
  const today = new Date();
  const todaySchedules = schedules.filter(s => 
    format(s.scheduledTime, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
  );

  const adherenceRate = todaySchedules.length > 0 
    ? Math.round((todaySchedules.filter(s => s.taken).length / todaySchedules.length) * 100)
    : 100;

  const missedDoses = todaySchedules.filter(s => 
    !s.taken && !s.skipped && s.scheduledTime < new Date()
  );

  return (
    <div className="space-y-6">
      {/* Patient Info */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-white/20 rounded-full">
            <Heart className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-pink-100">Age: {user.age} • Emergency: {user.emergencyContact}</p>
          </div>
        </div>
      </div>

      {/* Adherence Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Today's Adherence</h3>
            <div className={`text-2xl font-bold ${
              adherenceRate >= 90 ? 'text-green-600' : 
              adherenceRate >= 70 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {adherenceRate}%
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                adherenceRate >= 90 ? 'bg-green-500' : 
                adherenceRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${adherenceRate}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Doses Taken</p>
              <p className="text-2xl font-bold text-green-600">
                {todaySchedules.filter(s => s.taken).length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Missed Doses</p>
              <p className="text-2xl font-bold text-red-600">{missedDoses.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Alerts */}
      {missedDoses.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
            <h3 className="text-lg font-semibold text-red-800">Missed Doses Alert</h3>
          </div>
          <div className="space-y-3">
            {missedDoses.map(schedule => {
              const medicine = medicines.find(m => m.id === schedule.medicineId);
              return (
                <div key={schedule.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                  <div>
                    <p className="font-medium text-gray-900">{medicine?.name}</p>
                    <p className="text-sm text-gray-600">
                      Scheduled: {format(schedule.scheduledTime, 'h:mm a')}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                      <Phone className="h-4 w-4" />
                    </button>
                    <button className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors">
                      <Mail className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Caregiver Contacts */}
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
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                    <Phone className="h-4 w-4" />
                  </button>
                  <button className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors">
                    <Mail className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Medicine Inventory */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Medicine Inventory</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {medicines.map(medicine => (
              <div key={medicine.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <img 
                    src={medicine.imageUrl} 
                    alt={medicine.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{medicine.name}</p>
                    <p className="text-sm text-gray-600">{medicine.dosage} • {medicine.frequency}x daily</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    medicine.remainingQuantity <= medicine.criticalThreshold 
                      ? 'text-red-600' 
                      : 'text-green-600'
                  }`}>
                    {medicine.remainingQuantity} left
                  </p>
                  <p className="text-xs text-gray-500">of {medicine.totalQuantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};