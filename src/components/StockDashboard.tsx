import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, TrendingDown, ShoppingCart, Clock, CheckCircle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { Medicine, RefillOrder } from '../types';
import { OneMgApiService, OneMgMedicine } from '../services/oneMgApiService';
import { InventoryService } from '../services/inventoryService';

interface StockDashboardProps {
  medicines: Medicine[];
  refillOrders: RefillOrder[];
  onRefillOrder: (medicineId: string, quantity: number) => void;
}

export const StockDashboard: React.FC<StockDashboardProps> = ({
  medicines,
  refillOrders,
  onRefillOrder
}) => {
  const [oneMgMedicines, setOneMgMedicines] = useState<OneMgMedicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [orderingMedicine, setOrderingMedicine] = useState<string | null>(null);
  
  const oneMgService = OneMgApiService.getInstance();
  const inventoryService = InventoryService.getInstance();

  const criticalStock = medicines.filter(m => inventoryService.checkStockLevel(m) === 'critical');
  const lowStock = medicines.filter(m => inventoryService.checkStockLevel(m) === 'low');
  const adequateStock = medicines.filter(m => inventoryService.checkStockLevel(m) === 'adequate');

  useEffect(() => {
    loadOrderHistory();
    // Auto-load critical medicines for 1mg search
    if (criticalStock.length > 0) {
      searchCriticalMedicines();
    }
  }, [criticalStock.length]);

  const loadOrderHistory = async () => {
    try {
      const history = await oneMgService.getOrderHistory('USER123');
      setOrderHistory(history);
    } catch (error) {
      console.error('Failed to load order history:', error);
    }
  };

  const searchCriticalMedicines = async () => {
    if (criticalStock.length === 0) return;
    
    setLoading(true);
    try {
      // Search for the first critical medicine
      const results = await oneMgService.searchMedicine(criticalStock[0].name);
      setOneMgMedicines(results);
    } catch (error) {
      console.error('1mg search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchOneMg = async (medicineName: string) => {
    setLoading(true);
    try {
      const results = await oneMgService.searchMedicine(medicineName);
      setOneMgMedicines(results);
    } catch (error) {
      console.error('1mg search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRefill = async (medicine: Medicine) => {
    setOrderingMedicine(medicine.id);
    try {
      setLoading(true);
      const orderResponse = await oneMgService.placeOrder(
        `1mg_${medicine.id}`,
        medicine.totalQuantity,
        { id: 'USER123', address: 'XYZ Street, Bengaluru' }
      );
      
      onRefillOrder(medicine.id, medicine.totalQuantity);
      alert(`✅ Order placed successfully!\n\nOrder ID: ${orderResponse.order_id}\nEstimated Delivery: ${new Date(orderResponse.estimated_delivery).toLocaleDateString()}\nTotal Amount: ₹${orderResponse.total_amount}`);
    } catch (error) {
      console.error('Order failed:', error);
      alert('❌ Failed to place order. Please try again.');
    } finally {
      setLoading(false);
      setOrderingMedicine(null);
    }
  };

  const handleOrderFromOneMg = async (oneMgMedicine: OneMgMedicine) => {
    setOrderingMedicine(oneMgMedicine.id);
    try {
      setLoading(true);
      const orderResponse = await oneMgService.placeOrder(
        oneMgMedicine.id,
        1,
        { id: 'USER123', address: 'XYZ Street, Bengaluru' }
      );
      
      alert(`✅ Order placed successfully!\n\nMedicine: ${oneMgMedicine.name}\nOrder ID: ${orderResponse.order_id}\nPrice: ₹${oneMgMedicine.price}\nEstimated Delivery: ${new Date(orderResponse.estimated_delivery).toLocaleDateString()}`);
    } catch (error) {
      console.error('Order failed:', error);
      alert('❌ Failed to place order. Please try again.');
    } finally {
      setLoading(false);
      setOrderingMedicine(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stock Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Critical Stock</p>
              <p className="text-3xl font-bold">{criticalStock.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Low Stock</p>
              <p className="text-3xl font-bold">{lowStock.length}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-orange-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Adequate Stock</p>
              <p className="text-3xl font-bold">{adequateStock.length}</p>
            </div>
            <Package className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Active Orders</p>
              <p className="text-3xl font-bold">{refillOrders.filter(o => o.status !== 'delivered').length}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Critical Stock Alert */}
      {criticalStock.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
            <h3 className="text-lg font-semibold text-red-800">🚨 Immediate Attention Required</h3>
          </div>
          <div className="space-y-3">
            {criticalStock.map(medicine => (
              <div key={medicine.id} className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center space-x-3">
                  <img 
                    src={medicine.imageUrl} 
                    alt={medicine.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{medicine.name}</p>
                    <p className="text-sm text-red-600">
                      ⚠️ Only {medicine.remainingQuantity} tablets left • 
                      {inventoryService.calculateDaysRemaining(medicine)} days remaining
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => searchOneMg(medicine.name)}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    🔍 Search 1mg
                  </button>
                  <button
                    onClick={() => handleQuickRefill(medicine)}
                    disabled={loading || orderingMedicine === medicine.id}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {orderingMedicine === medicine.id ? '⏳ Ordering...' : '🛒 Quick Order'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1mg Search Results */}
      {oneMgMedicines.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">🏥 Tata 1mg Search Results</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <ExternalLink className="h-4 w-4" />
                <span>Powered by 1mg API</span>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {oneMgMedicines.map(medicine => (
                <div key={medicine.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors bg-gradient-to-r from-white to-blue-50">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={medicine.image_url} 
                      alt={medicine.name}
                      className="w-16 h-16 rounded-lg object-cover border"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">{medicine.name}</h4>
                      <p className="text-sm text-gray-600">{medicine.manufacturer} • {medicine.pack_size}</p>
                      <p className="text-sm text-gray-500">{medicine.composition}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-lg font-bold text-green-600">₹{medicine.price}</span>
                        <span className="text-sm text-gray-500 line-through">₹{medicine.mrp}</span>
                        <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
                          {medicine.discount}% OFF
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-2">
                      {medicine.availability ? (
                        <span className="text-green-600 text-sm font-medium bg-green-100 px-2 py-1 rounded-full">
                          ✅ In Stock
                        </span>
                      ) : (
                        <span className="text-red-600 text-sm font-medium bg-red-100 px-2 py-1 rounded-full">
                          ❌ Out of Stock
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleOrderFromOneMg(medicine)}
                      disabled={!medicine.availability || loading || orderingMedicine === medicine.id}
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {orderingMedicine === medicine.id ? '⏳ Ordering...' : '🛒 Buy Now on 1mg'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Current Inventory */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">📦 Current Inventory</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {medicines.map(medicine => {
              const stockLevel = inventoryService.checkStockLevel(medicine);
              const daysRemaining = inventoryService.calculateDaysRemaining(medicine);
              
              return (
                <div key={medicine.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={medicine.imageUrl} 
                      alt={medicine.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">{medicine.name}</h4>
                      <p className="text-sm text-gray-600">{medicine.dosage} • {medicine.frequency}x daily</p>
                      <p className="text-sm text-gray-500">Prescribed by {medicine.prescribedBy}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className={`text-sm font-medium ${
                          stockLevel === 'critical' ? 'text-red-600' :
                          stockLevel === 'low' ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {medicine.remainingQuantity} / {medicine.totalQuantity}
                        </p>
                        <p className="text-xs text-gray-500">{daysRemaining} days left</p>
                      </div>
                      
                      <div className="w-16 h-2 bg-gray-200 rounded-full">
                        <div 
                          className={`h-2 rounded-full ${
                            stockLevel === 'critical' ? 'bg-red-500' :
                            stockLevel === 'low' ? 'bg-orange-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${(medicine.remainingQuantity / medicine.totalQuantity) * 100}%` }}
                        />
                      </div>

                      {stockLevel === 'critical' && (
                        <button
                          onClick={() => searchOneMg(medicine.name)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                        >
                          🛒 Reorder
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Order History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">📋 Recent Orders</h3>
        </div>
        <div className="p-6">
          {orderHistory.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No recent orders</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orderHistory.map(order => (
                <div key={order.order_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      order.status === 'delivered' ? 'bg-green-100' :
                      order.status === 'shipped' ? 'bg-blue-100' : 'bg-orange-100'
                    }`}>
                      {order.status === 'delivered' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : order.status === 'shipped' ? (
                        <Package className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-orange-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{order.medicine_name}</p>
                      <p className="text-sm text-gray-600">
                        Order #{order.order_id} • Qty: {order.quantity}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(order.order_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">₹{order.total_amount}</p>
                    <p className={`text-sm capitalize ${
                      order.status === 'delivered' ? 'text-green-600' :
                      order.status === 'shipped' ? 'text-blue-600' : 'text-orange-600'
                    }`}>
                      {order.status === 'delivered' ? '✅ Delivered' :
                       order.status === 'shipped' ? '🚚 Shipped' : '⏳ Processing'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};