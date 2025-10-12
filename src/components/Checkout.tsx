import React, { useState } from 'react';
import { ArrowLeft, AlertCircle, Copy, Check } from 'lucide-react';
import { CartItem, PaymentMethod, ServiceType, OrderData } from '../types';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { useSiteSettings } from '../hooks/useSiteSettings';
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
  const { siteSettings } = useSiteSettings();
  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>(initialTableNumber ? 'dine-in' : 'pickup');
  const [tableNumber, setTableNumber] = useState(initialTableNumber || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash');
  const [notes, setNotes] = useState('');
  const [tip, setTip] = useState<number>(0);
  const [customTip, setCustomTip] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdOrderCode, setCreatedOrderCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isTableLocked = Boolean(initialTableNumber);

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  React.useEffect(() => {
    if (initialTableNumber) {
      setTableNumber(initialTableNumber);
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
  
  // Calculate total items and check cart limit
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartLimit = siteSettings?.cart_item_limit || 50;
  const isOverLimit = totalItems > cartLimit;

  // Calculate final total with tip
  const finalTotal = totalPrice + tip;

  // Handle tip selection
  const handleTipSelect = (amount: number) => {
    setTip(amount);
    setCustomTip('');
  };

  const handleCustomTipChange = (value: string) => {
    setCustomTip(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setTip(numValue);
    } else if (value === '') {
      setTip(0);
    }
  };

  // Copy order code to clipboard
  const copyOrderCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleProceedToPayment = () => {
    setStep('payment');
  };

  const handlePlaceOrder = async () => {
    if (isSubmitting) return;
    
    // Prevent order if cart limit is exceeded
    if (isOverLimit) {
      setSubmitError(`Cart limit exceeded. You have ${totalItems} items, but the limit is ${cartLimit}.`);
      return;
    }

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
        paymentMethod,
        total: finalTotal,
        tip: tip > 0 ? tip : undefined,
        notes: notes || undefined,
        status: 'pending',
      };

      const { data, error: insertError } = await supabase
        .from('orders')
        .insert({
          customer_name: payload.customerName,
          contact_number: payload.contactNumber,
          service_type: payload.serviceType,
          table_number: payload.tableNumber ?? null,
          notes: payload.notes ?? null,
          payment_method: payload.paymentMethod,
          total: payload.total,
          tip: payload.tip ?? 0,
          status: payload.status ?? 'pending',
          line_items: orderItems,
        })
        .select('id, order_code')
        .single();

      if (insertError) throw insertError;

      const orderCode = data?.order_code as string | undefined;
      setCreatedOrderCode(orderCode ?? null);

      // Auto-copy order code to clipboard
      if (orderCode) {
        try {
          await navigator.clipboard.writeText(orderCode);
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
        } catch (err) {
          console.error('Failed to auto-copy order code:', err);
        }
      }

      onOrderComplete?.(orderCode ?? null);
    } catch (err) {
      console.error('Error placing order:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDetailsValid = customerName && contactNumber && 
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
            
            {/* Cart Limit Warning */}
            {isOverLimit && (
              <div className="mb-6 bg-red-500/10 border border-red-500/40 text-red-200 px-4 py-3 rounded-xl flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Cart Limit Exceeded</div>
                  <div className="text-xs text-red-100/80">
                    You have {totalItems} items in your cart, but the limit is {cartLimit}. Please return to cart and remove some items.
                  </div>
                </div>
              </div>
            )}
            
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
                    <p className="text-sm text-alchemy-cream/60">
                      {item.totalPrice === 0 ? 'Free' : `₱${item.totalPrice}`} x {item.quantity}
                    </p>
                  </div>
                  <span className="font-semibold text-alchemy-gold">
                    {item.totalPrice * item.quantity === 0 ? 'Free' : `₱${item.totalPrice * item.quantity}`}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="border-t border-white/10 pt-4">
              <div className="flex items-center justify-between text-2xl font-playfair font-semibold text-alchemy-gold">
                <span>Total:</span>
                <span>{totalPrice === 0 ? 'Free' : `₱${totalPrice}`}</span>
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
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'dine-in', label: 'Serve at the Table', icon: '🪑' },
                    { value: 'pickup', label: 'Pick-up at the Bar', icon: '🚶' }
                  ].map((option) => {
                    const isDisabled = false;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setServiceType(option.value as ServiceType)}
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
                    QR code detected for table service at table {tableNumber}.
                  </p>
                )}
              </div>

              {/* Table Service Details */}
              {serviceType === 'dine-in' && (
                <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-4">
                  {trimmedTableNumber ? (
                    <>
                      <p className="text-sm text-alchemy-cream/70">Serving at table</p>
                      <p className="text-2xl font-playfair font-semibold text-alchemy-gold tracking-wider">Table {trimmedTableNumber}</p>
                      <p className="text-xs text-alchemy-cream/50 mt-2">If this isn't your table, please scan the QR code at your table to place an order.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-alchemy-cream/70 mb-2">No table detected</p>
                      <p className="text-xs text-red-300">Please scan the QR code found on your table for table service.</p>
                    </>
                  )}
                </div>
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
                disabled={!isDetailsValid || isOverLimit}
                className={`w-full py-4 rounded-xl font-medium text-lg transition-all duration-200 transform ${
                  isDetailsValid && !isOverLimit
                    ? 'bg-gradient-to-r from-alchemy-gold via-alchemy-copper to-alchemy-gold text-alchemy-night hover:from-alchemy-copper hover:to-alchemy-gold hover:scale-[1.02] shadow-lg shadow-black/40'
                    : 'bg-white/5 text-alchemy-cream/40 cursor-not-allowed'
                }`}
              >
                {isOverLimit ? 'Cart Limit Exceeded' : 'Proceed to Payment'}
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

          {/* Tip Section */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
            <h3 className="font-medium text-alchemy-gold mb-4">Add a Tip (Optional)</h3>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[20, 50, 100, 200].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleTipSelect(amount)}
                  className={`py-2 px-3 rounded-lg border transition-all duration-200 ${
                    tip === amount && !customTip
                      ? 'border-alchemy-gold bg-alchemy-gold/20 text-alchemy-gold'
                      : 'border-white/10 bg-white/5 text-alchemy-cream hover:border-alchemy-gold/60'
                  }`}
                >
                  ₱{amount}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-sm text-alchemy-cream/70 mb-2">Custom Amount</label>
              <input
                type="number"
                min="0"
                step="1"
                value={customTip}
                onChange={(e) => handleCustomTipChange(e.target.value)}
                placeholder="Enter custom tip"
                className="w-full px-4 py-2 border border-white/15 bg-white/5 text-alchemy-cream rounded-lg focus:ring-2 focus:ring-alchemy-gold focus:border-transparent transition-all duration-200 placeholder:text-alchemy-cream/40"
              />
            </div>
            {tip > 0 && (
              <p className="text-sm text-alchemy-gold mt-3">
                Thank you for your tip of ₱{tip.toFixed(2)}! 💛
              </p>
            )}
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
                  <p className="text-xl font-semibold text-alchemy-gold">
                    Amount: {finalTotal === 0 ? 'Free' : `₱${finalTotal.toFixed(2)}`}
                  </p>
                  {tip > 0 && (
                    <p className="text-sm text-alchemy-cream/70 mt-1">
                      (Subtotal: ₱{totalPrice.toFixed(2)} + Tip: ₱{tip.toFixed(2)})
                    </p>
                  )}
                  <p className="text-xs text-alchemy-cream/60 mt-3">
                    Please complete payment before placing your order. Keep your payment reference for verification.
                  </p>
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
       
        </div>

        {/* Order Summary */}
        <div className="alchemy-panel rounded-2xl p-6 border border-white/10">
          <h2 className="text-2xl font-playfair font-medium text-alchemy-gold mb-6">Final Order Summary</h2>
          
          {/* Cart Limit Warning */}
          {isOverLimit && (
            <div className="mb-6 bg-red-500/10 border border-red-500/40 text-red-200 px-4 py-3 rounded-xl flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <div>
                <div className="font-semibold">Cart Limit Exceeded</div>
                <div className="text-xs text-red-100/80">
                  You have {totalItems} items in your cart, but the limit is {cartLimit}. Please return to cart and remove some items.
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-4 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h4 className="font-medium text-alchemy-cream mb-2">Customer Details</h4>
              <p className="text-sm text-alchemy-cream/70">Name: {customerName}</p>
              <p className="text-sm text-alchemy-cream/70">Contact: {contactNumber}</p>
              <p className="text-sm text-alchemy-cream/70">Service: {serviceType === 'dine-in' ? 'Serve at the Table' : 'Pick-up at the Bar'}</p>
              {serviceType === 'pickup' && (
                <p className="text-sm text-alchemy-cream/70">
                  Pick-up orders will be prepared right away.
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
                  <p className="text-sm text-alchemy-cream/70">
                    {item.totalPrice === 0 ? 'Free' : `₱${item.totalPrice}`} x {item.quantity}
                  </p>
                </div>
                <span className="font-semibold text-alchemy-gold">
                  {item.totalPrice * item.quantity === 0 ? 'Free' : `₱${item.totalPrice * item.quantity}`}
                </span>
              </div>
            ))}
          </div>
          
          <div className="border-t border-white/10 pt-4 mb-6">
            {tip > 0 && (
              <div className="flex items-center justify-between text-sm text-alchemy-cream/70 mb-2">
                <span>Subtotal:</span>
                <span>₱{totalPrice.toFixed(2)}</span>
              </div>
            )}
            {tip > 0 && (
              <div className="flex items-center justify-between text-sm text-alchemy-cream/70 mb-2">
                <span>Tip:</span>
                <span>₱{tip.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-2xl font-playfair font-semibold text-alchemy-gold">
              <span>Total:</span>
              <span>{finalTotal === 0 ? 'Free' : `₱${finalTotal.toFixed(2)}`}</span>
            </div>
          </div>

          {submitError && (
            <div className="mb-4 bg-red-500/10 border border-red-500/40 text-red-200 px-4 py-3 rounded-xl">
              {submitError}
            </div>
          )}

          {createdOrderCode && !submitError && (
            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-xl">
              <div className="font-semibold mb-2">Order saved! Reference Code:</div>
              <div className="flex items-center justify-between bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/30">
                <code className="font-mono text-lg font-bold text-emerald-100">{createdOrderCode}</code>
                <button
                  onClick={() => copyOrderCode(createdOrderCode)}
                  className="ml-3 p-2 hover:bg-emerald-500/20 rounded-lg transition-all duration-200 flex items-center space-x-2"
                  title="Copy order code"
                >
                  {copied ? (
                    <>
                      <Check className="h-5 w-5 text-emerald-300" />
                      <span className="text-sm">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-5 w-5 text-emerald-300" />
                      <span className="text-sm">Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="text-xs text-emerald-100/80 mt-2">
                Keep this code handy — you can use it on the Track Order page to check your status anytime.
              </div>
            </div>
          )}

          <button
            onClick={handlePlaceOrder}
            disabled={isSubmitting || isOverLimit}
            className={`w-full py-4 rounded-xl font-medium text-lg transition-all duration-200 transform shadow-lg shadow-black/40 ${
              isSubmitting || isOverLimit
                ? 'bg-white/10 text-alchemy-cream/60 cursor-not-allowed'
                : 'bg-gradient-to-r from-alchemy-gold via-alchemy-copper to-alchemy-gold text-alchemy-night hover:from-alchemy-copper hover:to-alchemy-gold hover:scale-[1.02]'
            }`}
          >
            {isOverLimit ? 'Cart Limit Exceeded' : isSubmitting ? 'Placing order…' : 'Place Order'}
          </button>
          
          <p className="text-xs text-alchemy-cream/60 text-center mt-3">
            Your order will be saved and you can track its status using your order code.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
