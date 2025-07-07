import React, { useState, useEffect } from 'react';
import { Pill, Users, Mic, Settings, Download, Package, ShoppingCart, Monitor, Menu, X } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { VoiceAssistant } from './components/VoiceAssistant';
import { EnhancedCaregiverDashboard } from './components/EnhancedCaregiverDashboard';
import { StockDashboard } from './components/StockDashboard';
import { PatientDashboard } from './components/PatientDashboard';
import { ShoppingCartDashboard } from './components/ShoppingCartDashboard';
import { HardwareMonitor } from './components/HardwareMonitor';
import { useMedicineData } from './hooks/useMedicineData';

type Tab = 'dashboard' | 'voice' | 'patient' | 'caregiver' | 'stock' | 'cart' | 'hardware' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [language, setLanguage] = useState<'en' | 'hi' | 'kn'>('en');
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const {
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
  } = useMedicineData();

  // PWA Install Prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleRefillOrder = (medicineId: string, quantity: number) => {
    console.log(`Refill order placed for medicine ${medicineId}, quantity: ${quantity}`);
  };

  const handleSendAlert = (type: string, message: string) => {
    console.log(`Alert sent: ${type} - ${message}`);
  };

  const handleUpdateProfile = (updates: Partial<typeof user>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  // Check for critical stock medicines to show cart notification
  const criticalStockCount = medicines.filter(m => m.remainingQuantity <= m.criticalThreshold).length;

  const tabs = [
    { id: 'dashboard' as Tab, name: 'Dashboard', icon: Pill, color: 'blue' },
    { id: 'voice' as Tab, name: 'AI Assistant', icon: Mic, color: 'purple' },
    { id: 'patient' as Tab, name: 'Profile', icon: Users, color: 'green' },
    { id: 'caregiver' as Tab, name: 'Caregiver', icon: Users, color: 'pink' },
    { id: 'stock' as Tab, name: 'Inventory', icon: Package, color: 'orange' },
    { 
      id: 'cart' as Tab, 
      name: 'Shop', 
      icon: ShoppingCart,
      color: 'emerald',
      badge: criticalStockCount > 0 ? criticalStockCount : undefined
    },
    { id: 'hardware' as Tab, name: 'IoT Device', icon: Monitor, color: 'indigo' },
    { id: 'settings' as Tab, name: 'Settings', icon: Settings, color: 'gray' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <Pill className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-600" />
          </div>
          <p className="text-gray-600 font-medium">Loading your health dashboard...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            medicines={medicines}
            schedules={schedules}
            onMarkTaken={markDoseTaken}
            onSkipDose={skipDose}
            onSnoozeDose={snoozeDose}
            onMarkTakenLate={markTakenLate}
          />
        );
      case 'voice':
        return (
          <VoiceAssistant
            language={language}
            onLanguageChange={setLanguage}
            medicines={medicines}
            schedules={schedules}
          />
        );
      case 'patient':
        return user ? (
          <PatientDashboard
            user={user}
            medicines={medicines}
            schedules={schedules}
            onUpdateProfile={handleUpdateProfile}
          />
        ) : null;
      case 'caregiver':
        return user ? (
          <EnhancedCaregiverDashboard
            user={user}
            medicines={medicines}
            schedules={schedules}
            onSendAlert={handleSendAlert}
          />
        ) : null;
      case 'stock':
        return (
          <StockDashboard
            medicines={medicines}
            refillOrders={refillOrders}
            onRefillOrder={handleRefillOrder}
          />
        );
      case 'cart':
        return (
          <ShoppingCartDashboard
            medicines={medicines}
            onRefillOrder={handleRefillOrder}
          />
        );
      case 'hardware':
        return <HardwareMonitor />;
      case 'settings':
        return (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Settings className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Settings & Preferences</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Customize your medicine reminders, notifications, and app preferences. 
              Advanced settings coming soon.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* PWA Install Banner */}
      {showInstallPrompt && (
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 z-50 shadow-lg">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Download className="h-5 w-5" />
              </div>
              <span className="font-medium">Install MediCare AI for quick access</span>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleInstallApp}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Install
              </button>
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-40 ${showInstallPrompt ? 'mt-16' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Pill className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  MediCare AI
                </h1>
                <p className="text-xs text-gray-500">Smart Health Companion</p>
              </div>
            </div>
            
            {/* Desktop User Info */}
            {user && (
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">Welcome back!</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.name.charAt(0)}
                  </span>
                </div>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-lg">
          <div className="px-4 py-2 space-y-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? `bg-${tab.color}-50 text-${tab.color}-600`
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{tab.name}</span>
                  {tab.badge && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-white/50 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto py-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all whitespace-nowrap relative ${
                    activeTab === tab.id
                      ? `bg-${tab.color}-50 text-${tab.color}-600 shadow-sm`
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{tab.name}</span>
                  {tab.badge && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>

      {/* Floating Notifications */}
      {refillOrders.length > 0 && (
        <div className="fixed bottom-6 right-6 max-w-sm z-30">
          {refillOrders.slice(-1).map(order => (
            <div key={order.id} className="bg-white rounded-2xl p-4 shadow-lg border border-green-200 backdrop-blur-sm">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-green-800">Order Confirmed!</h4>
                  <p className="text-sm text-green-700">
                    Order #{order.orderId1MG} placed successfully
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Delivery: {order.estimatedDelivery.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Critical Stock Alert */}
      {criticalStockCount > 0 && activeTab !== 'cart' && activeTab !== 'stock' && (
        <div className="fixed bottom-6 left-6 max-w-sm z-30">
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-red-200 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <Package className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-red-800">Stock Alert</h4>
                  <p className="text-sm text-red-700">
                    {criticalStockCount} medicine{criticalStockCount > 1 ? 's' : ''} running low
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('cart')}
                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;