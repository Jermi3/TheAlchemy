import React, { useState } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { CartItem, PaymentMethod, ServiceType, OrderData } from '../types';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { supabase } from '../lib/supabase';

interface CheckoutProps {
  cartItems: CartItem[];
  totalPrice: number;
  onBack: () => void;
  tableNumber?: string | null;
  onOrderComplete?: (orderCode?: string | null) => void;
}

const Checkout: React.FC<CheckoutProps> = ({ cartItems, totalPrice, onBack, tableNumber: initialTableNumber, onOrderComplete }) => {
  const { paymentMethods } = usePaymentMethods();
  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('dine-in');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pickupTime, setPickupTime] = useState('5-10');
  const [customTime, setCustomTime] = useState('');
  const [tableNumber, setTableNumber] = useState(initialTableNumber || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdOrderCode, setCreatedOrderCode] = useState<string | null>(null);

  const isTableLocked = Boolean(initialTableNumber);

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  React.useEffect(() => {
    if (initialTableNumber) {
      setTableNumber(initialTableNumber);
      setServiceType('dine-in');
    }
  }, [initialTableNumber]);

  // Set default payment method when payment methods are loaded
  React.useEffect(() => {
    if (paymentMethods.length > 0 && !paymentMethod) {
      setPaymentMethod(paymentMethods[0].id as PaymentMethod);
    }
  }, [paymentMethods, paymentMethod]);

  const selectedPaymentMethod = paymentMethods.find(method => method.id === paymentMethod);
  const trimmedTableNumber = tableNumber.trim();

  const handleProceedToPayment = () => {
    setStep('payment');
  };

  const buildMessengerMessage = (items: OrderData['items'], orderCode?: string) => {
    const serviceLabel = serviceType.charAt(0).toUpperCase() + serviceType.slice(1);
    const pickupLabel = pickupTime === 'custom' ? customTime : `${pickupTime} minutes`;
    const itemLines = items
      .map(item => {
        let line = `• ${item.name}`;
        if (item.selectedVariation) {
          line += ` (${item.selectedVariation.name})`;
        }
        if (item.selectedAddOns && item.selectedAddOns.length > 0) {
          const addOnsText = item.selectedAddOns
            .map(addOn => (addOn.quantity && addOn.quantity > 1 ? `${addOn.name} x${addOn.quantity}` : addOn.name))
            .join(', ');
          line += ` + ${addOnsText}`;
        }
        line += ` x${item.quantity} - ₱${(item.totalPrice * item.quantity).toFixed(2)}`;
        return line;
      })
      .join('\n');

    const segments = [
      '🛒 The Alchemy - Mobile Bar ORDER',
      orderCode ? `🆔 Order Code: ${orderCode}` : null,
      '',
      `👤 Customer: ${customerName}`,
      `📞 Contact: ${contactNumber}`,
      `📍 Service: ${serviceLabel}`,
      serviceType === 'delivery'
        ? `🏠 Address: ${address}${landmark ? `\n🗺️ Landmark: ${landmark}` : ''}`
        : null,
      serviceType === 'pickup' ? `⏰ Pickup Time: ${pickupLabel}` : null,
      serviceType === 'dine-in' ? `🪑 Table: ${trimmedTableNumber || 'Not specified'}` : null,
      '',
      '📋 ORDER DETAILS:',
      itemLines,
      '',
      `💰 TOTAL: ₱${totalPrice}`,
      serviceType === 'delivery' ? '🛵 DELIVERY FEE:' : null,
      '',
      `💳 Payment: ${selectedPaymentMethod?.name || paymentMethod}`,
      '📸 Payment Screenshot: Please attach your payment receipt screenshot',
      notes ? `\n📝 Notes: ${notes}` : null,
      '',
      'Please confirm this order to proceed. Thank you for choosing The Alchemy - Mobile Bar! 🥟',
    ];

    return segments.filter(Boolean).join('\n');
  };

  const handlePlaceOrder = async () => {
    if (isSubmitting) return;

    setSubmitError(null);
    setCreatedOrderCode(null);
    setIsSubmitting(true);

    try {
      const orderItems = cartItems.map<OrderData['items'][number]>(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
        selectedVariation: item.selectedVariation,
        selectedAddOns: item.selectedAddOns,
      }));

      const payload: OrderData = {
        items: orderItems,
        customerName,
        contactNumber,
        serviceType,
        tableNumber: serviceType === 'dine-in' ? trimmedTableNumber || undefined : undefined,
        address: serviceType === 'delivery' ? address : undefined,
        landmark: serviceType === 'delivery' ? landmark || undefined : undefined,
        pickupTime: serviceType === 'pickup' ? (pickupTime === 'custom' ? customTime : `${pickupTime} minutes`) : undefined,
        paymentMethod,
        total: totalPrice,
        notes: notes || undefined,
        status: 'pending',
      };

      const baseMessage = buildMessengerMessage(orderItems);

      const { data, error: insertError } = await supabase
        .from('orders')
        .insert({
          customer_name: payload.customerName,
          contact_number: payload.contactNumber,
          service_type: payload.serviceType,
          table_number: payload.tableNumber ?? null,
          address: payload.address ?? null,
          landmark: payload.landmark ?? null,
          pickup_time: payload.pickupTime ?? null,
          notes: payload.notes ?? null,
          payment_method: payload.paymentMethod,
          total: payload.total,
          status: payload.status ?? 'pending',
          line_items: orderItems,
          messenger_payload: baseMessage,
        })
        .select('id, order_code')
        .single();

      if (insertError) throw insertError;

      const orderId = data?.id as string | undefined;
      const orderCode = data?.order_code as string | undefined;
      setCreatedOrderCode(orderCode ?? null);

      const finalMessage = buildMessengerMessage(orderItems, orderCode);

      if (orderId && finalMessage !== baseMessage) {
        await supabase
          .from('orders')
          .update({ messenger_payload: finalMessage })
          .eq('id', orderId);
      }

      const encodedMessage = encodeURIComponent(finalMessage);
      const messengerUrl = `https://m.me/61579693577478?text=${encodedMessage}`;
      window.open(messengerUrl, '_blank');

      onOrderComplete?.(orderCode ?? null);
    } catch (err) {
      console.error('Error placing order:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDetailsValid = customerName && contactNumber && 
    (serviceType !== 'delivery' || address) && 
    (serviceType !== 'pickup' || (pickupTime !== 'custom' || customTime)) &&
    (serviceType !== 'dine-in' || trimmedTableNumber);

  if (step === 'details') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-alchemy-cream">
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-alchemy-cream/70 hover:text-alchemy-gold transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Cart</span>
          </button>
          <h1 className="text-3xl font-playfair font-semibold text-alchemy-gold ml-8 tracking-wide">Order Details</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="alchemy-panel rounded-2xl p-6 border border-white/10">
            <h2 className="text-2xl font-playfair font-medium text-alchemy-gold mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-white/10">
                  <div>
                    <h4 className="font-medium text-alchemy-cream font-playfair tracking-wide">{item.name}</h4>
                    {item.selectedVariation && (
                      <p className="text-sm text-alchemy-cream/60">Size: {item.selectedVariation.name}</p>
                    )}
                    {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                      <p className="text-sm text-alchemy-cream/60">
                        Add-ons: {item.selectedAddOns.map(addOn => addOn.name).join(', ')}
                      </p>
                    )}
                    <p className="text-sm text-alchemy-cream/60">₱{item.totalPrice} x {item.quantity}</p>
                  </div>
                  <span className="font-semibold text-alchemy-gold">₱{item.totalPrice * item.quantity}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t border-white/10 pt-4">
              <div className="flex items-center justify-between text-2xl font-playfair font-semibold text-alchemy-gold">
                <span>Total:</span>
                <span>₱{totalPrice}</span>
              </div>
            </div>
          </div>

          {/* Customer Details Form */}
          <div className="alchemy-panel rounded-2xl p-6 border border-white/10">
            <h2 className="text-2xl font-playfair font-medium text-alchemy-gold mb-6">Customer Information</h2>
            
            <form className="space-y-6">
              {/* Customer Information */}
              <div>
                <label className="block text-sm font-medium text-alchemy-cream mb-2">Full Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 border border-white/15 bg-white/5 text-alchemy-cream rounded-lg focus:ring-2 focus:ring-alchemy-gold focus:border-transparent transition-all duration-200 placeholder:text-alchemy-cream/40"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-alchemy-cream mb-2">Contact Number *</label>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full px-4 py-3 border border-white/15 bg-white/5 text-alchemy-cream rounded-lg focus:ring-2 focus:ring-alchemy-gold focus:border-transparent transition-all duration-200 placeholder:text-alchemy-cream/40"
                  placeholder="09XX XXX XXXX"
                  required
                />
              </div>

              {/* Service Type */}
              <div>
                <label className="block text-sm font-medium text-alchemy-cream mb-3">Service Type *</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'dine-in', label: 'Dine In', icon: '🪑' },
                    { value: 'pickup', label: 'Pickup', icon: '🚶' },
                    { value: 'delivery', label: 'Delivery', icon: '🛵' }
                  ].map((option) => {
                    const isDisabled = isTableLocked && option.value !== 'dine-in';
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          if (isDisabled) return;
                          setServiceType(option.value as ServiceType);
                        }}
                        disabled={isDisabled}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                          serviceType === option.value
                            ? 'border-alchemy-gold bg-alchemy-gold text-alchemy-night shadow-lg shadow-black/40'
                            : 'border-white/15 bg-white/5 text-alchemy-cream hover:border-alchemy-gold/60'
                        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="text-2xl mb-1">{option.icon}</div>
                        <div className="text-sm font-medium">{option.label}</div>
                      </button>
                    );
                  })}
                </div>
                {isTableLocked && (
                  <p className="text-xs text-alchemy-cream/60 mt-2">
                    QR code detected dine-in at table {tableNumber}.
                  </p>
                )}
              </div>

              {/* Dine-in Details */}
              {serviceType === 'dine-in' && (
                <div>
                  <label className="block text-sm font-medium text-alchemy-cream mb-2">Table Number *</label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    readOnly={isTableLocked}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-alchemy-gold focus:border-transparent transition-all duration-200 bg-white/5 text-alchemy-cream ${
                      isTableLocked ? 'border-white/20 cursor-not-allowed text-alchemy-cream/60' : 'border-white/15'
                    }`}
                    placeholder="Enter your table number"
                    required
                  />
                  {!isTableLocked && (
                    <p className="text-xs text-alchemy-cream/60 mt-1">Let us know where you're seated so we can serve you quickly.</p>
                  )}
                </div>
              )}

              {/* Pickup Time Selection */}
              {serviceType === 'pickup' && (
                <div>
                  <label className="block text-sm font-medium text-alchemy-cream mb-3">Pickup Time *</label>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: '5-10', label: '5-10 minutes' },
                        { value: '15-20', label: '15-20 minutes' },
                        { value: '25-30', label: '25-30 minutes' },
                        { value: 'custom', label: 'Custom Time' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setPickupTime(option.value)}
                          className={`p-3 rounded-lg border-2 transition-all duration-200 text-sm ${
                            pickupTime === option.value
                              ? 'border-alchemy-gold bg-alchemy-gold text-alchemy-night shadow-lg shadow-black/40'
                              : 'border-white/15 bg-white/5 text-alchemy-cream hover:border-alchemy-gold/60'
                          }`}
                        >
                          <Clock className="h-4 w-4 mx-auto mb-1" />
                          {option.label}
                        </button>
                      ))}
                    </div>
                    
                    {pickupTime === 'custom' && (
                      <input
                        type="text"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="w-full px-4 py-3 border border-white/15 bg-white/5 text-alchemy-cream rounded-lg focus:ring-2 focus:ring-alchemy-gold focus:border-transparent transition-all duration-200 placeholder:text-alchemy-cream/40"
                        placeholder="e.g., 45 minutes, 1 hour, 2:30 PM"
                        required
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Delivery Address */}
              {serviceType === 'delivery' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-alchemy-cream mb-2">Delivery Address *</label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-4 py-3 border border-white/15 bg-white/5 text-alchemy-cream rounded-lg focus:ring-2 focus:ring-alchemy-gold focus:border-transparent transition-all duration-200 placeholder:text-alchemy-cream/40"
                      placeholder="Enter your complete delivery address"
                      rows={3}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-alchemy-cream mb-2">Landmark</label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      className="w-full px-4 py-3 border border-white/15 bg-white/5 text-alchemy-cream rounded-lg focus:ring-2 focus:ring-alchemy-gold focus:border-transparent transition-all duration-200 placeholder:text-alchemy-cream/40"
                      placeholder="e.g., Near McDonald's, Beside 7-Eleven, In front of school"
                    />
                  </div>
                </>
              )}

              {/* Special Notes */}
              <div>
                <label className="block text-sm font-medium text-alchemy-cream mb-2">Special Instructions</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-white/15 bg-white/5 text-alchemy-cream rounded-lg focus:ring-2 focus:ring-alchemy-gold focus:border-transparent transition-all duration-200 placeholder:text-alchemy-cream/40"
                  placeholder="Any special requests or notes..."
                  rows={3}
                />
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={!isDetailsValid}
                className={`w-full py-4 rounded-xl font-medium text-lg transition-all duration-200 transform ${
                  isDetailsValid
                    ? 'bg-gradient-to-r from-alchemy-gold via-alchemy-copper to-alchemy-gold text-alchemy-night hover:from-alchemy-copper hover:to-alchemy-gold hover:scale-[1.02] shadow-lg shadow-black/40'
                    : 'bg-white/5 text-alchemy-cream/40 cursor-not-allowed'
                }`}
              >
                Proceed to Payment
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Payment Step
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 text-alchemy-cream">
      <div className="flex items-center mb-8">
        <button
          onClick={() => setStep('details')}
          className="flex items-center space-x-2 text-alchemy-cream/70 hover:text-alchemy-gold transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Details</span>
        </button>
        <h1 className="text-3xl font-playfair font-semibold text-alchemy-gold ml-8 tracking-wide">Payment</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Method Selection */}
        <div className="alchemy-panel rounded-2xl p-6 border border-white/10">
          <h2 className="text-2xl font-playfair font-medium text-alchemy-gold mb-6">Choose Payment Method</h2>
          
          <div className="grid grid-cols-1 gap-4 mb-6">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center space-x-3 ${
                  paymentMethod === method.id
                    ? 'border-alchemy-gold bg-alchemy-gold/15 text-alchemy-night shadow-lg shadow-black/40'
                    : 'border-white/10 bg-white/5 text-alchemy-cream hover:border-alchemy-gold/60'
                }`}
              >
                <span className="text-2xl">💳</span>
                <span className="font-medium">{method.name}</span>
              </button>
            ))}
          </div>

          {/* Payment Details with QR Code */}
          {selectedPaymentMethod && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
              <h3 className="font-medium text-alchemy-gold mb-4">Payment Details</h3>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-alchemy-cream/70 mb-1">{selectedPaymentMethod.name}</p>
                  <p className="font-mono text-alchemy-gold font-medium">{selectedPaymentMethod.account_number}</p>
                  <p className="text-sm text-alchemy-cream/70 mb-3">Account Name: {selectedPaymentMethod.account_name}</p>
                  <p className="text-xl font-semibold text-alchemy-gold">Amount: ₱{totalPrice}</p>
                </div>
                <div className="flex-shrink-0">
                  <img 
                    src={selectedPaymentMethod.qr_code_url} 
                    alt={`${selectedPaymentMethod.name} QR Code`}
                    className="w-32 h-32 rounded-lg border-2 border-alchemy-gold/30 shadow-lg shadow-black/40"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.pexels.com/photos/8867482/pexels-photo-8867482.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop';
                    }}
                  />
                  <p className="text-xs text-alchemy-cream/60 text-center mt-2">Scan to pay</p>
                </div>
              </div>
            </div>
          )}

          {/* Reference Number */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h4 className="font-medium text-alchemy-cream mb-2">📸 Payment Proof Required</h4>
            <p className="text-sm text-alchemy-cream/70">
              After making your payment, please take a screenshot of your payment receipt and attach it when you send your order via Messenger. This helps us verify and process your order quickly.
            </p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="alchemy-panel rounded-2xl p-6 border border-white/10">
          <h2 className="text-2xl font-playfair font-medium text-alchemy-gold mb-6">Final Order Summary</h2>
          
          <div className="space-y-4 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h4 className="font-medium text-alchemy-cream mb-2">Customer Details</h4>
              <p className="text-sm text-alchemy-cream/70">Name: {customerName}</p>
              <p className="text-sm text-alchemy-cream/70">Contact: {contactNumber}</p>
              <p className="text-sm text-alchemy-cream/70">Service: {serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}</p>
              {serviceType === 'delivery' && (
                <>
                  <p className="text-sm text-alchemy-cream/70">Address: {address}</p>
                  {landmark && <p className="text-sm text-alchemy-cream/70">Landmark: {landmark}</p>}
                </>
              )}
              {serviceType === 'pickup' && (
                <p className="text-sm text-alchemy-cream/70">
                  Pickup Time: {pickupTime === 'custom' ? customTime : `${pickupTime} minutes`}
                </p>
              )}
              {serviceType === 'dine-in' && (
                <p className="text-sm text-alchemy-cream/70">Table: {trimmedTableNumber || 'Not specified'}</p>
              )}
            </div>

            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-white/10">
                <div>
                  <h4 className="font-medium text-alchemy-cream">{item.name}</h4>
                  {item.selectedVariation && (
                    <p className="text-sm text-alchemy-cream/70">Size: {item.selectedVariation.name}</p>
                  )}
                  {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                    <p className="text-sm text-alchemy-cream/70">
                      Add-ons: {item.selectedAddOns.map(addOn => 
                        addOn.quantity && addOn.quantity > 1 
                          ? `${addOn.name} x${addOn.quantity}`
                          : addOn.name
                      ).join(', ')}
                    </p>
                  )}
                  <p className="text-sm text-alchemy-cream/70">₱{item.totalPrice} x {item.quantity}</p>
                </div>
                <span className="font-semibold text-alchemy-gold">₱{item.totalPrice * item.quantity}</span>
              </div>
            ))}
          </div>
          
          <div className="border-t border-white/10 pt-4 mb-6">
            <div className="flex items-center justify-between text-2xl font-playfair font-semibold text-alchemy-gold">
              <span>Total:</span>
              <span>₱{totalPrice}</span>
            </div>
          </div>

          {submitError && (
            <div className="mb-4 bg-red-500/10 border border-red-500/40 text-red-200 px-4 py-3 rounded-xl">
              {submitError}
            </div>
          )}

          {createdOrderCode && !submitError && (
            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-xl">
              <div className="font-semibold">Order saved! Reference Code: {createdOrderCode}</div>
              <div className="text-xs text-emerald-100/80 mt-1">
                Keep this code handy — you can use it on the Track Order page to check your status anytime.
              </div>
            </div>
          )}

          <button
            onClick={handlePlaceOrder}
            disabled={isSubmitting}
            className={`w-full py-4 rounded-xl font-medium text-lg transition-all duration-200 transform shadow-lg shadow-black/40 ${
              isSubmitting
                ? 'bg-white/10 text-alchemy-cream/60 cursor-not-allowed'
                : 'bg-gradient-to-r from-alchemy-gold via-alchemy-copper to-alchemy-gold text-alchemy-night hover:from-alchemy-copper hover:to-alchemy-gold hover:scale-[1.02]'
            }`}
          >
            {isSubmitting ? 'Saving order…' : 'Place Order via Messenger'}
          </button>
          
          <p className="text-xs text-alchemy-cream/60 text-center mt-3">
            You'll be redirected to Facebook Messenger to confirm your order. Don't forget to attach your payment screenshot!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
