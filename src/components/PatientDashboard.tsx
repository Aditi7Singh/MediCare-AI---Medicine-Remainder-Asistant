import React, { useState } from 'react';
import { User, Heart, Phone, Mail, Calendar, Activity, Pill, Clock, AlertTriangle } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { User as UserType, Medicine, DoseSchedule } from '../types';

interface PatientDashboardProps {
  user: UserType;
  medicines: Medicine[];
  schedules: DoseSchedule[];
  onUpdateProfile: (updates: Partial<UserType>) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  user,
  medicines,
  schedules,
  onUpdateProfile
}) => {
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState(user);

  const today = new Date();
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Calculate adherence for the week
  const weeklyAdherence = weekDays.map(day => {
    const daySchedules = schedules.filter(s => 
      format(s.scheduledTime, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    );
    const takenCount = daySchedules.filter(s => s.taken).length;
    return {
      date: day,
      total: daySchedules.length,
      taken: takenCount,
      percentage: daySchedules.length > 0 ? Math.round((takenCount / daySchedules.length) * 100) : 0
    };
  });

  const overallAdherence = weeklyAdherence.reduce((acc, day) => acc + day.percentage, 0) / 7;

  const handleSaveProfile = () => {
    onUpdateProfile(profileData);
    setEditMode(false);
  };

  const upcomingDoses = schedules
    .filter(s => !s.taken && !s.skipped && s.scheduledTime > new Date())
    .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Patient Profile Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-full">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-blue-100">Patient ID: {user.id}</p>
            </div>
          </div>
          <button
            onClick={() => setEditMode(!editMode)}
            className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
          >
            {editMode ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {editMode ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-2">Name</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                className="w-full px-3 py-2 bg-white/20 text-white placeholder-blue-200 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-2">Age</label>
              <input
                type="number"
                value={profileData.age}
                onChange={(e) => setProfileData({...profileData, age: parseInt(e.target.value)})}
                className="w-full px-3 py-2 bg-white/20 text-white placeholder-blue-200 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-2">Emergency Contact</label>
              <input
                type="tel"
                value={profileData.emergencyContact}
                onChange={(e) => setProfileData({...profileData, emergencyContact: e.target.value})}
                className="w-full px-3 py-2 bg-white/20 text-white placeholder-blue-200 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-2">Preferred Language</label>
              <select
                value={profileData.preferredLanguage}
                onChange={(e) => setProfileData({...profileData, preferredLanguage: e.target.value as 'en' | 'hi' | 'kn'})}
                className="w-full px-3 py-2 bg-white/20 text-white rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
                <option value="kn">ಕನ್ನಡ</option>
              </select>
            </div>
            <div className="md:col-span-2 flex space-x-2">
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-blue-200" />
              <div>
                <p className="text-blue-100 text-sm">Age</p>
                <p className="font-medium">{user.age} years</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-blue-200" />
              <div>
                <p className="text-blue-100 text-sm">Emergency Contact</p>
                <p className="font-medium">{user.emergencyContact}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Activity className="h-5 w-5 text-blue-200" />
              <div>
                <p className="text-blue-100 text-sm">Language</p>
                <p className="font-medium">{user.preferredLanguage.toUpperCase()}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Weekly Adherence</p>
              <p className="text-2xl font-bold text-green-600">{Math.round(overallAdherence)}%</p>
            </div>
            <Activity className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Medicines</p>
              <p className="text-2xl font-bold text-blue-600">{medicines.length}</p>
            </div>
            <Pill className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Caregivers</p>
              <p className="text-2xl font-bold text-purple-600">{user.caregivers.length}</p>
            </div>
            <Heart className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Next Dose</p>
              <p className="text-lg font-bold text-orange-600">
                {upcomingDoses.length > 0 ? format(upcomingDoses[0].scheduledTime, 'h:mm a') : 'None'}
              </p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Weekly Adherence Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Weekly Adherence</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-7 gap-2">
            {weeklyAdherence.map((day, index) => (
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

      {/* Upcoming Doses */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Doses</h3>
        </div>
        <div className="p-6">
          {upcomingDoses.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No upcoming doses scheduled</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingDoses.map(schedule => {
                const medicine = medicines.find(m => m.id === schedule.medicineId);
                if (!medicine) return null;

                return (
                  <div key={schedule.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-6 w-6 text-blue-500" />
                      <div>
                        <p className="font-medium text-gray-900">{medicine.name}</p>
                        <p className="text-sm text-gray-600">{medicine.dosage}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-blue-600">
                        {format(schedule.scheduledTime, 'h:mm a')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(schedule.scheduledTime, 'MMM d')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Caregiver Network */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Caregiver Network</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {user.caregivers.map(caregiver => (
              <div key={caregiver.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-pink-100 rounded-full">
                    <Heart className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{caregiver.name}</p>
                    <p className="text-sm text-gray-600">{caregiver.relationship}</p>
                    <p className="text-sm text-gray-500">{caregiver.phone}</p>
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
    </div>
  );
};