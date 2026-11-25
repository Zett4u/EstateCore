import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PropertyTransaction, Property } from '../types';
import { formatPHP } from '../lib/utils';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import {
  CreditCard,
  Plus,
  Building,
  User,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  AlertCircle,
} from 'lucide-react';

export const TransactionsList: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<PropertyTransaction[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Record Transaction Modal State
  const [showModal, setShowModal] = useState(false);
  const [propertyId, setPropertyId] = useState<number | ''>('');
  const [buyerId, setBuyerId] = useState<number | ''>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [transactionType, setTransactionType] = useState('Sale');
  const [paymentMethod, setPaymentMethod] = useState('BankTransfer');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isAgentOrAdmin = user?.role === 'AGENT' || user?.role === 'ADMIN';

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const txData = await api.getTransactions();
      setTransactions(txData);

      if (isAgentOrAdmin) {
        const propData = await api.getProperties();
        setProperties(propData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load transaction records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || !buyerId || !amount) {
      setSubmitError('Property ID, Buyer ID, and Amount are required.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      await api.recordTransaction({
        propertyId: Number(propertyId),
        buyerId: Number(buyerId),
        amount: Number(amount),
        transactionType,
        paymentMethod,
        transactionDate,
        notes,
      });

      setShowModal(false);
      setPropertyId('');
      setBuyerId('');
      setAmount('');
      setNotes('');
      await loadData();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to record transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics
  const totalVolume = transactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const pendingCount = transactions.filter(
    (tx) => String(tx.status).toUpperCase() === 'PENDING'
  ).length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 tracking-tight">
            Property Transactions
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            {user?.role === 'CLIENT'
              ? 'Review your recorded purchase and rental transactions.'
              : 'Record, monitor, and audit real estate sale and rental contracts.'}
          </p>
        </div>

        {isAgentOrAdmin && (
          <Button
            onClick={() => {
              setSubmitError(null);
              setShowModal(true);
            }}
            className="flex items-center space-x-2 bg-forest-700 hover:bg-forest-800 text-white rounded-xl shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Record Deal</span>
          </Button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-subtle flex items-center space-x-4">
          <div className="p-3 bg-forest-50 text-forest-700 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-mono uppercase text-stone-500 tracking-wider">Total Deals</p>
            <p className="text-2xl font-serif font-bold text-stone-900">{transactions.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-subtle flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-mono uppercase text-stone-500 tracking-wider">Total Volume</p>
            <p className="text-2xl font-serif font-bold text-stone-900">{formatPHP(totalVolume)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-subtle flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-mono uppercase text-stone-500 tracking-wider">Pending Status</p>
            <p className="text-2xl font-serif font-bold text-stone-900">{pendingCount}</p>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Transactions Table / List */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-stone-500 text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-700 mx-auto mb-3"></div>
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-stone-500 space-y-3">
            <div className="w-12 h-12 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-base font-semibold text-stone-800">No transactions recorded yet</p>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Transactions recorded by licensed agents or property buyers will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="bg-stone-50 text-[11px] uppercase font-mono tracking-wider text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="px-6 py-4">Deal ID</th>
                  <th className="px-6 py-4">Property</th>
                  <th className="px-6 py-4">Buyer / Client</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {transactions.map((tx) => (
                  <tr key={tx.transactionId || tx.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-stone-900">
                      #{tx.transactionId || tx.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-stone-900">
                        {tx.property?.title || `Property #${tx.propertyId}`}
                      </div>
                      <div className="text-xs text-stone-500">ID: {tx.propertyId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-stone-900 font-medium">
                        {tx.buyer?.fullName || `Buyer #${tx.buyerId}`}
                      </div>
                      <div className="text-xs text-stone-500">{tx.buyer?.email || `User ${tx.buyerId}`}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800">
                        {String(tx.transactionType).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-stone-900">
                      {formatPHP(Number(tx.amount))}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-stone-600">
                      {tx.paymentMethod}
                    </td>
                    <td className="px-6 py-4 text-xs text-stone-500">
                      {String(tx.transactionDate).split('T')[0]}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          String(tx.status).toUpperCase() === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : String(tx.status).toUpperCase() === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {String(tx.status).toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Transaction Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Record Property Deal / Contract"
      >
        <form onSubmit={handleRecordTransaction} className="space-y-4">
          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
              {submitError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Select Property Listing *
            </label>
            <select
              value={propertyId}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : '';
                setPropertyId(val);
                const selected = properties.find((p) => p.id === val);
                if (selected) {
                  setAmount(selected.price);
                  setTransactionType(selected.listingType === 'RENT' ? 'Rent' : 'Sale');
                }
              }}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
              required
            >
              <option value="">-- Choose a property --</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.id} - {p.title} ({p.status}) - {formatPHP(p.price)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Buyer User ID *
            </label>
            <input
              type="number"
              value={buyerId}
              onChange={(e) => setBuyerId(e.target.value ? Number(e.target.value) : '')}
              placeholder="e.g. 4 (Juan Dela Cruz)"
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
              required
            />
            <p className="text-[11px] text-stone-500 mt-0.5">
              Enter registered Client / Buyer user ID.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Transaction Type *
              </label>
              <select
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
              >
                <option value="Sale">Sale Deal</option>
                <option value="Rent">Rental Contract</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Agreed Amount (PHP) *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                placeholder="4500000"
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
              >
                <option value="BankTransfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="GCash">GCash</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="Check">Manager's Check</option>
                <option value="Financing">Bank Financing</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Transaction Date *
              </label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Contract Notes / Remarks
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Down payment confirmed, deed of sale in escrow."
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-forest-700 hover:bg-forest-800 text-white rounded-xl"
            >
              {submitting ? 'Recording Deal...' : 'Confirm & Save Transaction'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
