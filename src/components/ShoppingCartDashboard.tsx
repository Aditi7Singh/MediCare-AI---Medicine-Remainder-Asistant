import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Medicine } from '../types';
import { OneMgApiService, OneMgMedicine } from '../services/oneMgApiService';
import { InventoryService } from '../services/inventoryService';

interface CartItem {
  medicine: OneMgMedicine;
  quantity: number;
  originalMedicine?: Medicine;
}

interface ShoppingCartDashboardProps {
  medicines: Medicine[];
  onRefillOrder: (medicineId: string, quantity: number) => void;
}

export const ShoppingCartDashboard: React.FC<ShoppingCartDashboardProps> = ({
  medicines,
  onRefillOrder
}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<OneMgMedicine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderStatus, setOrderStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  
  const oneMgService = OneMgApiService.getInstance();
  const inventoryService = InventoryService.getInstance();

  // Auto-populate cart with critical stock medicines
  useEffect(() => {
    const criticalMedicines = medicines.filter(m => 
      inventoryService.checkStockLevel(m) === 'critical'
    );
    
    if (criticalMedicines.length > 0) {
      loadCriticalMedicines(criticalMedicines);
    }
  }, [medicines]);

  const loadCriticalMedicines = async (criticalMedicines: Medicine[]) => {
    setLoading(true);
    try {
      const cartPromises = criticalMedicines.map(async (medicine) => {
        const results = await oneMgService.searchMedicine(medicine.name);
        if (results.length > 0) {
          return {
            medicine: results[0], // Take the first match
            quantity: medicine.totalQuantity,
            originalMedicine: medicine
          };
        }
        return null;
      });

      const cartResults = await Promise.all(cartPromises);
      const validCartItems = cartResults.filter(item => item !== null) as CartItem[];
      setCartItems(validCartItems);
    } catch (error) {
      console.error('Failed to load critical medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchMedicines = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const results = await oneMgService.searchMedicine(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (medicine: OneMgMedicine, quantity: number = 1) => {
    const existingItem = cartItems.find(item => item.medicine.id === medicine.id);
    
    if (existingItem) {
      setCartItems(prev => prev.map(item =>
        item.medicine.id === medicine.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCartItems(prev => [...prev, { medicine, quantity }]);
    }
  };

  const updateQuantity = (medicineId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(medicineId);
      return;
    }

    setCartItems(prev => prev.map(item =>
      item.medicine.id === medicineId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const removeFromCart = (medicineId: string) => {
    setCartItems(prev => prev.filter(item => item.medicine.id !== medicineId));
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.medicine.price * item.quantity), 0);
  };

  const calculateSavings = () => {
    return cartItems.reduce((savings, item) => 
      savings + ((item.medicine.mrp - item.medicine.price) * item.quantity), 0
    );
  };

  const placeOrder = async () => {
    if (cartItems.length === 0) return;

    setOrderStatus('processing');
    setLoading(true);

    try {
      // Place orders for each item
      const orderPromises = cartItems.map(item =>
        oneMgService.placeOrder(
          item.medicine.id,
          item.quantity,
          { id: 'USER123', address: 'XYZ Street, Bengaluru' }
        )
      );

      const orderResults = await Promise.all(orderPromises);
      
      // Notify parent component about successful orders
      cartItems.forEach((item, index) => {
        if (item.originalMedicine) {
          onRefillOrder(item.originalMedicine.id, item.quantity);
        }
      });

      setOrderStatus('success');
      setCartItems([]); // Clear cart after successful order
      
      setTimeout(() => setOrderStatus('idle'), 3000);
    } catch (error) {
      console.error('Order failed:', error);
      setOrderStatus('error');
      setTimeout(() => setOrderStatus('idle'), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-full">
              <ShoppingCart className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">1mg Shopping Cart</h2>
              <p className="text-green-100">Auto-refill for critical stock medicines</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-green-100 text-sm">Total Items</p>
            <p className="text-3xl font-bold">{cartItems.length}</p>
          </div>
        </div>
      </div>

      {/* Order Status */}
      {orderStatus !== 'idle' && (
        <div className={`rounded-lg p-4 ${
          orderStatus === 'processing' ? 'bg-blue-50 border border-blue-200' :
          orderStatus === 'success' ? 'bg-green-50 border border-green-200' :
          'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center space-x-3">
            {orderStatus === 'processing' && <Clock className="h-6 w-6 text-blue-600 animate-spin" />}
            {orderStatus === 'success' && <CheckCircle className="h-6 w-6 text-green-600" />}
            {orderStatus === 'error' && <AlertTriangle className="h-6 w-6 text-red-600" />}
            <div>
              <p className={`font-medium ${
                orderStatus === 'processing' ? 'text-blue-800' :
                orderStatus === 'success' ? 'text-green-800' :
                'text-red-800'
              }`}>
                {orderStatus === 'processing' && 'Processing your order...'}
                {orderStatus === 'success' && 'Order placed successfully!'}
                {orderStatus === 'error' && 'Order failed. Please try again.'}
              </p>
              {orderStatus === 'processing' && (
                <p className="text-blue-600 text-sm">This may take a few moments</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Medicines</h3>
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for medicines..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => searchMedicines(searchQuery)}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Search
            </button>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="p-6">
            <h4 className="font-medium text-gray-900 mb-4">Search Results</h4>
            <div className="space-y-3">
              {searchResults.map(medicine => (
                <div key={medicine.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={medicine.image_url} 
                      alt={medicine.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <h5 className="font-medium text-gray-900">{medicine.name}</h5>
                      <p className="text-sm text-gray-600">{medicine.manufacturer} • {medicine.pack_size}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-lg font-bold text-green-600">₹{medicine.price}</span>
                        <span className="text-sm text-gray-500 line-through">₹{medicine.mrp}</span>
                        <span className="text-sm text-green-600">{medicine.discount}% off</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => addToCart(medicine)}
                    disabled={!medicine.availability}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {medicine.availability ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cart Items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Cart Items</h3>
            {cartItems.length > 0 && (
              <button
                onClick={() => setCartItems([])}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Clear Cart
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {cartItems.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Your cart is empty</p>
              <p className="text-sm text-gray-400 mt-1">Critical stock medicines will appear here automatically</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map(item => (
                <div key={item.medicine.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={item.medicine.image_url} 
                      alt={item.medicine.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">{item.medicine.name}</h4>
                      <p className="text-sm text-gray-600">{item.medicine.manufacturer}</p>
                      <p className="text-sm text-gray-500">{item.medicine.pack_size}</p>
                      {item.originalMedicine && (
                        <div className="flex items-center space-x-2 mt-1">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-600 font-medium">Critical Stock</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-bold text-gray-900">₹{item.medicine.price}</p>
                      <p className="text-sm text-gray-500 line-through">₹{item.medicine.mrp}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.medicine.id, item.quantity - 1)}
                        className="p-1 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-12 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.medicine.id, item.quantity + 1)}
                        className="p-1 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.medicine.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Summary */}
      {cartItems.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                <span className="font-medium">₹{cartItems.reduce((sum, item) => sum + (item.medicine.mrp * item.quantity), 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-₹{calculateSavings().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Charges</span>
                <span className="text-green-600">FREE</span>
              </div>
              <hr />
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount</span>
                <span className="text-green-600">₹{calculateTotal().toFixed(2)}</span>
              </div>
              <p className="text-sm text-green-600">You save ₹{calculateSavings().toFixed(2)} on this order!</p>
            </div>

            <button
              onClick={placeOrder}
              disabled={loading || orderStatus === 'processing'}
              className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <CreditCard className="h-5 w-5" />
              <span>
                {orderStatus === 'processing' ? 'Processing...' : `Place Order - ₹${calculateTotal().toFixed(2)}`}
              </span>
            </button>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                <Package className="h-4 w-4 inline mr-1" />
                Estimated delivery: 1-2 business days
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};