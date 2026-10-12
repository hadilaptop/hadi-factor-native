import React, { useState, useEffect } from 'react';
import { StyleSheet, StatusBar, View, ActivityIndicator } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import HomeScreen from './src/screens/HomeScreen';
import AccountScreen from './src/screens/AccountScreen';
import CustomersScreen from './src/screens/CustomersScreen';
import InvoicesScreen from './src/screens/InvoiceScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CustomerLedger from './src/screens/CustomerLedger';
import CustomerFullStatement from './src/screens/CustomerFullStatement';
import CustomerPayment from './src/screens/CustomerPayment';
import BottomNav from './src/components/BottomNav';
import { Customer, getCustomers, saveCustomer, deleteCustomer } from './src/storage/customerStorage';
import { getInvoices, deleteInvoice, StoredInvoice } from './src/storage/invoiceStorage';
import { getPayments, savePayment, deletePayment, Payment } from './src/storage/paymentStorage';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [settingsReturnScreen, setSettingsReturnScreen] = useState('dashboard');
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentToEdit, setPaymentToEdit] = useState<any | null>(null);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [customerFormReturnScreen, setCustomerFormReturnScreen] = useState('dashboard');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<StoredInvoice | null>(null);
  const [invoiceMode, setInvoiceMode] = useState<"preview" | "form" | null>(null);
  const [customersLoaded, setCustomersLoaded] = useState(false);
  const [invoiceReturnScreen, setInvoiceReturnScreen] = useState('dashboard');

  useEffect(() => {
    async function loadAppFonts() {
      await Font.loadAsync({ Vazirmatn: require('./assets/fonts/Vazirmatn-FD-Bold.ttf') });
      setFontsLoaded(true);
    }
    async function loadCustomers() {
      try {
        const savedCustomers = await getCustomers();
        const savedInvoices = await getInvoices();
        const savedPayments = await getPayments();
        setCustomers(savedCustomers);
        setInvoices(savedInvoices);
        setPayments(savedPayments);
      } catch (error) { console.error('خطا در بارگذاری مشتری‌ها:', error); }
      finally { setCustomersLoaded(true); }
    }
    loadAppFonts();
    loadCustomers();
  }, []);

  const handleSaveCustomer = async (customer: Customer) => {
    try {
      const success = await saveCustomer(customer);
      if (!success) return false;
      setCustomers((current) => {
        const index = current.findIndex((item) => String(item.id) === String(customer.id));
        if (index === -1) return [...current, customer];
        const updated = [...current];
        updated[index] = customer;
        return updated;
      });
      setCustomerToEdit(null);
      return true;
    } catch (error) { console.error('خطا در ذخیره مشتری:', error); return false; }
  };

  const handleSaveInvoice = (invoice: StoredInvoice) => {
    setInvoices((current) => {
      const index = current.findIndex((item) => String(item.id) === String(invoice.id));
      if (index === -1) return [...current, invoice];
      const updated = [...current];
      updated[index] = invoice;
      return updated;
    });
  };

  const handleDeleteInvoice = async (invoiceId: string | number) => {
    const success = await deleteInvoice(invoiceId);
    if (success) setInvoices((current) => current.filter((item) => String(item.id) !== String(invoiceId)));
  };

  const handleSavePayment = async (payment: Payment) => {
    const success = await savePayment(payment);
    if (!success) return false;
    setPayments((current) => {
      const index = current.findIndex((item) => String(item.id) === String(payment.id));
      if (index === -1) return [...current, payment];
      const updated = [...current];
      updated[index] = payment;
      return updated;
    });
    setPaymentToEdit(null);
    return true;
  };

  const handleDeletePayment = async (paymentId: string | number) => {
    const success = await deletePayment(paymentId);
    if (success) setPayments((current) => current.filter((item) => String(item.id) !== String(paymentId)));
  };

  const handleOpenCustomerPayment = (payment?: any) => {
    setPaymentToEdit(payment ?? null);
    if (payment?.customerId) {
      const item = customers.find((customer) => String(customer.id) === String(payment.customerId));
      if (item) setSelectedCustomer(item);
    }
    setCurrentScreen('customerPayment');
  };

  const handleDeleteCustomer = async (customerId: string | number) => {
    try {
      const success = await deleteCustomer(customerId);
      if (!success) return;
      setCustomers((current) => current.filter((customer) => String(customer.id) !== String(customerId)));
    } catch (error) { console.error('خطا در حذف مشتری:', error); }
  };

  const handleEditCustomer = (customer: Customer) => {
    setCustomerFormReturnScreen('customers');
    setCustomerToEdit(customer);
    setCurrentScreen('newAccount');
  };

  const handleSelectCustomerLedger = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCurrentScreen('customerLedger');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <HomeScreen onNavigate={(screen: string) => {
          if (screen === 'newAccount') setCustomerFormReturnScreen('dashboard');
          if (screen === 'invoice') {
            setInvoiceReturnScreen('dashboard');
            setSelectedCustomer(null); setSelectedInvoice(null); setInvoiceMode(null);
          }
          setCurrentScreen(screen);
        }} customerCount={customers.length} isInitialized={customersLoaded} />;
      case 'newAccount':
        return <AccountScreen onNavigate={(screen: string) => {
          if (screen !== 'newAccount') setCustomerToEdit(null);
          setCurrentScreen(screen);
        }} onSave={handleSaveCustomer} customerToEdit={customerToEdit}
          returnScreen={customerFormReturnScreen} existingCustomers={customers} />;
      case 'customers':
        return <CustomersScreen onNavigate={setCurrentScreen} customers={customers}
          onDeleteCustomer={handleDeleteCustomer} onEditCustomer={handleEditCustomer}
          onSelectCustomerLedger={handleSelectCustomerLedger} />;
      case 'customerLedger':
        return selectedCustomer ? <CustomerLedger customer={selectedCustomer} customers={customers}
          payments={payments} invoices={invoices} onDeletePayment={handleDeletePayment}
          onDeleteInvoice={handleDeleteInvoice} onOpenPayment={handleOpenCustomerPayment}
          onNavigate={setCurrentScreen} onOpenInvoice={(customer, invoice, mode) => {
            setSelectedCustomer(customer); setSelectedInvoice(invoice ?? null);
            setInvoiceMode(mode ?? null); setInvoiceReturnScreen('customerLedger'); setCurrentScreen('invoice');
          }} /> : null;
      case 'customerStatement':
        return selectedCustomer ? <CustomerFullStatement customer={selectedCustomer} payments={payments}
          invoices={invoices} onBack={() => setCurrentScreen('customerLedger')}
          onNavigate={setCurrentScreen}
          onSaveSettlement={async (settlement) => { await handleSavePayment(settlement); }} /> : null;
      case 'customerPayment':
        return <CustomerPayment customers={customers} customer={selectedCustomer}
          paymentToEdit={paymentToEdit} onBack={() => {
            setPaymentToEdit(null);
            setCurrentScreen(selectedCustomer ? 'customerLedger' : 'customers');
          }} onSavePayment={handleSavePayment} />;
      case 'invoice':
        return <InvoicesScreen onNavigate={setCurrentScreen} returnScreen={invoiceReturnScreen} initialCustomer={selectedCustomer}
          customers={customers} onInvoiceSaved={handleSaveInvoice}
          invoiceToEdit={selectedInvoice} initialMode={invoiceMode} />;
      case 'settings':
        return <SettingsScreen onNavigate={setCurrentScreen} returnScreen={settingsReturnScreen} />;
      default:
        return <HomeScreen onNavigate={setCurrentScreen} />;
    }
  };

  if (!fontsLoaded || !customersLoaded) return <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#10b981" />
  </View>;

  return <SafeAreaProvider><SafeAreaView style={styles.container} edges={['left', 'right']}>
    <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
    {renderScreen()}
    <BottomNav
      activeTab={currentScreen === 'customerPayment' ? 'receipt' : currentScreen}
      onNavigate={(screen) => {
        if (screen === 'settings') setSettingsReturnScreen(currentScreen);
        if (screen === 'newAccount') {
          setCustomerToEdit(null); setCustomerFormReturnScreen('dashboard');
        }
        if (screen === 'receipt') {
          setSelectedCustomer(null); setPaymentToEdit(null); setCurrentScreen('customerPayment');
          return;
        }
        setCurrentScreen(screen);
      }}
    />
  </SafeAreaView></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eaf6fc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0d2b43' },
});
