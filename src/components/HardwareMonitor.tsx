import React, { useState, useEffect } from 'react';
import { 
  Wifi, WifiOff, Battery, Thermometer, Droplets, 
  Package, Activity, Zap, Clock, CheckCircle, 
  AlertTriangle, Pill, Send, RefreshCw 
} from 'lucide-react';
import { BlynkService } from '../services/blynkService';
import { BlynkData, HardwareActivity } from '../types';
import { format } from 'date-fns';

export const HardwareMonitor: React.FC = () => {
  const [blynkData, setBlynkData] = useState<BlynkData | null>(null);
  const [activities, setActivities] = useState<HardwareActivity[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const blynkService = BlynkService.getInstance();

  useEffect(() => {
    const unsubscribe = blynkService.subscribe((data: BlynkData) => {
      setBlynkData(data);
      setActivities(blynkService.getActivities());
    });

    // Initial data load
    const currentData = blynkService.getCurrentData();
    if (currentData) {
      setBlynkData(currentData);
    }
    setActivities(blynkService.getActivities());

    return unsubscribe;
  }, [blynkService]);

  const handleDispensePill = async () => {
    setIsConnecting(true);
    try {
      await blynkService.dispensePill('test-medicine');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSendNotification = async (type: 'reminder' | 'alert' | 'success') => {
    await blynkService.sendNotification(type, `Test ${type} notification`);
  };

  const handleTestConnection = async () => {
    setIsConnecting(true);
    try {
      await blynkService.testConnection();
    } finally {
      setIsConnecting(false);
    }
  };

  const getDispenserStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Ready';
      case 1: return 'Dispensing';
      case 2: return 'Empty';
      case 3: return 'Error';
      default: return 'Unknown';
    }
  };

  const getDispenserStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'text-green-600 bg-green-100';
      case 1: return 'text-blue-600 bg-blue-100';
      case 2: return 'text-orange-600 bg-orange-100';
      case 3: return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 60) return 'text-green-600';
    if (level > 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!blynkData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to hardware device...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className={`rounded-xl p-6 ${blynkData.connected ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'} text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-full">
              {blynkData.connected ? <Wifi className="h-8 w-8" /> : <WifiOff className="h-8 w-8" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold">Hardware Monitor</h2>
              <p className={`${blynkData.connected ? 'text-green-100' : 'text-red-100'}`}>
                Device {blynkData.connected ? 'Connected' : 'Offline'} • Blynk Cloud Integration
              </p>
            </div>
          </div>
          <button
            onClick={handleTestConnection}
            disabled={isConnecting}
            className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${isConnecting ? 'animate-spin' : ''}`} />
            <span>Test Connection</span>
          </button>
        </div>
      </div>

      {/* Sensor Data Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pill Count */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Pill className="h-6 w-6 text-blue-600" />
            </div>
            <span className={`text-sm px-2 py-1 rounded-full ${
              blynkData.pillCount <= 10 ? 'bg-red-100 text-red-600' : 
              blynkData.pillCount <= 20 ? 'bg-orange-100 text-orange-600' : 
              'bg-green-100 text-green-600'
            }`}>
              {blynkData.pillCount <= 10 ? 'Critical' : blynkData.pillCount <= 20 ? 'Low' : 'Good'}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Pills Remaining</h3>
          <p className="text-2xl font-bold text-gray-900">{blynkData.pillCount}</p>
        </div>

        {/* Battery Level */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Battery className="h-6 w-6 text-green-600" />
            </div>
            <div className="w-12 h-6 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  blynkData.batteryLevel > 60 ? 'bg-green-500' :
                  blynkData.batteryLevel > 30 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${blynkData.batteryLevel}%` }}
              />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Battery Level</h3>
          <p className={`text-2xl font-bold ${getBatteryColor(blynkData.batteryLevel)}`}>
            {blynkData.batteryLevel}%
          </p>
        </div>

        {/* Temperature */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Thermometer className="h-6 w-6 text-orange-600" />
            </div>
            <span className="text-sm text-gray-500">°C</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Temperature</h3>
          <p className="text-2xl font-bold text-gray-900">{blynkData.temperature}°C</p>
        </div>

        {/* Humidity */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Droplets className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">%</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Humidity</h3>
          <p className="text-2xl font-bold text-gray-900">{blynkData.humidity}%</p>
        </div>
      </div>

      {/* Device Status & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Device Status</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Package className="h-5 w-5 text-gray-400" />
                <span className="text-gray-700">Dispenser Status</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDispenserStatusColor(blynkData.dispenserStatus)}`}>
                {getDispenserStatusText(blynkData.dispenserStatus)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Pill className="h-5 w-5 text-gray-400" />
                <span className="text-gray-700">Pill Status</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                blynkData.motionSensor ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
              }`}>
                {blynkData.motionSensor ? 'Pills Taken' : 'Pills Not Taken'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <span className="text-gray-700">Last Dispensed</span>
              </div>
              <span className="text-gray-600 text-sm">
                {format(new Date(blynkData.lastDispensed), 'MMM d, h:mm a')}
              </span>
            </div>
          </div>
        </div>

        {/* Remote Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Remote Controls</h3>
          </div>
          <div className="p-6 space-y-4">
            <button
              onClick={handleDispensePill}
              disabled={isConnecting || blynkData.dispenserStatus !== 0}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Pill className="h-5 w-5" />
              <span>{isConnecting ? 'Dispensing...' : 'Dispense Pill'}</span>
            </button>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleSendNotification('reminder')}
                className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm flex items-center justify-center space-x-1"
              >
                <Send className="h-4 w-4" />
                <span>Reminder</span>
              </button>
              <button
                onClick={() => handleSendNotification('alert')}
                className="px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm flex items-center justify-center space-x-1"
              >
                <Send className="h-4 w-4" />
                <span>Alert</span>
              </button>
              <button
                onClick={() => handleSendNotification('success')}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm flex items-center justify-center space-x-1"
              >
                <Send className="h-4 w-4" />
                <span>Success</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Activity Log</h3>
        </div>
        <div className="p-6">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No recent activities</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.slice(0, 10).map(activity => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-1 rounded-full ${
                      activity.success ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {activity.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">
                        {format(activity.timestamp, 'MMM d, h:mm:ss a')}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    activity.type === 'dispense' ? 'bg-blue-100 text-blue-600' :
                    activity.type === 'notification' ? 'bg-purple-100 text-purple-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {activity.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Connection Info */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Device ID: <span className="font-mono">472146</span></p>
            <p className="text-gray-600">Auth Token: <span className="font-mono">1AJmeM-rqRBDckjI0UovAOHoOdnJOrF0</span></p>
          </div>
          <div>
            <p className="text-gray-600">Update Interval: <span className="font-medium">5 seconds</span></p>
            <p className="text-gray-600">Cloud URL: <span className="font-medium">blynk.cloud</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};