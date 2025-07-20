
import { addMonths, isSameDay, format, isToday, addDays } from 'date-fns';

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  tckn: string;
  address: string;
  registrationDate: string;
  subscriptionStart: string;
  monthlyPaymentDate: number;
  totalAmount: number;
  paidMonths: number[];
  currentMonth: number;
  paymentMethod: string;
}

export interface AutomaticOrder {
  id: string;
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerTckn: string;
  customerAddress: string;
  amount: number;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdDate: string;
  dueDate: string;
  monthNumber: number;
  orderId: string;
  isAutomatic: boolean;
}

export class AutomaticOrderService {
  private static STORAGE_KEY_ORDERS = 'automaticOrders';
  private static STORAGE_KEY_CUSTOMERS = 'customers';
  private static STORAGE_KEY_COUNTER = 'orderCounter';

  // Default orders - 8. ay siparişini siliyoruz
  private static getDefaultOrders(): AutomaticOrder[] {
    return [
      {
        id: "auto-1720166400000-1-7",
        customerId: 1,
        customerName: "Nur Aslan",
        customerEmail: "psk.dan.nuraslans@gmail.com",
        customerPhone: "05445826360",
        customerTckn: "41170262508",
        customerAddress: "Döndü sokak 34 İçerenköy/Ataşehir",
        amount: 1798.80,
        paymentMethod: "bank_transfer",
        status: 'completed',
        createdDate: "2025-07-05 10:00:00",
        dueDate: "2025-07-05",
        monthNumber: 7,
        orderId: "AUTO-2025-0001",
        isAutomatic: true
      }
    ];
  }

  // Default customers
  private static getDefaultCustomers(): Customer[] {
    return [
      {
        id: 1,
        name: "Nur Aslan",
        email: "psk.dan.nuraslans@gmail.com",
        phone: "05445826360",
        tckn: "41170262508",
        address: "Döndü sokak 34 İçerenköy/Ataşehir",
        registrationDate: "2024-01-05",
        subscriptionStart: "2024-01-05",
        monthlyPaymentDate: 5,
        totalAmount: 1798.80,
        paidMonths: [1, 2, 3, 4, 5, 6, 7],
        currentMonth: 12,
        paymentMethod: "bank_transfer"
      }
    ];
  }

  // Load orders from localStorage
  private static loadOrders(): AutomaticOrder[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY_ORDERS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Error loading orders from localStorage:', error);
    }
    return this.getDefaultOrders();
  }

  // Save orders to localStorage
  private static saveOrders(orders: AutomaticOrder[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY_ORDERS, JSON.stringify(orders));
    } catch (error) {
      console.warn('Error saving orders to localStorage:', error);
    }
  }

  // Load customers from localStorage
  private static loadCustomers(): Customer[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY_CUSTOMERS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Error loading customers from localStorage:', error);
    }
    return this.getDefaultCustomers();
  }

  // Save customers to localStorage
  private static saveCustomers(customers: Customer[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
    } catch (error) {
      console.warn('Error saving customers to localStorage:', error);
    }
  }

  // Load order counter from localStorage
  private static loadOrderCounter(): number {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY_COUNTER);
      if (stored) {
        return parseInt(stored, 10);
      }
    } catch (error) {
      console.warn('Error loading order counter from localStorage:', error);
    }
    return 2;
  }

  // Save order counter to localStorage
  private static saveOrderCounter(counter: number): void {
    try {
      localStorage.setItem(this.STORAGE_KEY_COUNTER, counter.toString());
    } catch (error) {
      console.warn('Error saving order counter to localStorage:', error);
    }
  }

  // Get current orders
  private static get orders(): AutomaticOrder[] {
    return this.loadOrders();
  }

  // Get current customers
  private static get customers(): Customer[] {
    return this.loadCustomers();
  }

  // Get current order counter
  private static get orderCounter(): number {
    return this.loadOrderCounter();
  }

  // Set order counter
  private static set orderCounter(value: number) {
    this.saveOrderCounter(value);
  }

  // Müşteri ödeme tarihi güncelleme fonksiyonu
  static updateCustomerPaymentDate(customerId: number, newPaymentDate: number): boolean {
    const customers = this.loadCustomers();
    const customerIndex = customers.findIndex(customer => customer.id === customerId);
    if (customerIndex !== -1) {
      customers[customerIndex].monthlyPaymentDate = newPaymentDate;
      this.saveCustomers(customers);
      console.log(`Müşteri ${customerId} için ödeme tarihi ${newPaymentDate}. güne güncellendi`);
      return true;
    }
    console.log(`Müşteri ${customerId} bulunamadı`);
    return false;
  }

  // Sipariş silme fonksiyonu ekle
  static deleteOrder(orderId: string): boolean {
    const orders = this.loadOrders();
    const orderIndex = orders.findIndex(order => order.orderId === orderId);
    if (orderIndex !== -1) {
      orders.splice(orderIndex, 1);
      this.saveOrders(orders);
      console.log(`Sipariş silindi: ${orderId}`);
      return true;
    }
    console.log(`Silinecek sipariş bulunamadı: ${orderId}`);
    return false;
  }

  // Güncellenmiş müşteri listesini getir
  static getCustomers(): Customer[] {
    return [...this.loadCustomers()];
  }

  // Müşteriler için otomatik siparişleri kontrol et ve oluştur
  static checkAndCreateAutomaticOrders(customers: Customer[]): AutomaticOrder[] {
    const today = new Date();
    const newOrders: AutomaticOrder[] = [];
    const currentOrders = this.loadOrders();

    // Güncel müşteri bilgilerini kullan
    const currentCustomers = customers.length > 0 ? customers : this.loadCustomers();

    currentCustomers.forEach(customer => {
      // 24 ay tamamlanmış müşterileri atla
      if (customer.paidMonths.length >= 24) {
        console.log(`${customer.name} için 24 ay tamamlandı, otomatik sipariş oluşturulmayacak`);
        return;
      }

      const registrationDate = new Date(customer.subscriptionStart);
      const currentDate = new Date();
      
      // Bir sonraki ödenmemiş ayı bul
      const nextUnpaidMonth = this.getNextUnpaidMonth(customer.paidMonths);
      
      if (nextUnpaidMonth <= 24) {
        // Bu ayın ödeme tarihi - kayıt tarihinden başlayarak hesapla
        const nextPaymentDate = new Date(registrationDate);
        nextPaymentDate.setMonth(registrationDate.getMonth() + (nextUnpaidMonth - 1));
        nextPaymentDate.setDate(customer.monthlyPaymentDate);
        
        // Eğer bu tarih geçmişte kalıyorsa, bir sonraki yıla ayarla
        if (nextPaymentDate < registrationDate) {
          nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
        }
        
        console.log(`${customer.name} için ${nextUnpaidMonth}. ay ödeme tarihi: ${format(nextPaymentDate, 'dd/MM/yyyy')}`);
        console.log(`Bugünün tarihi: ${format(currentDate, 'dd/MM/yyyy')}`);
        
        // Sadece ödeme tarihi bugün ise sipariş oluştur
        if (isSameDay(nextPaymentDate, currentDate)) {
          // Bu ay için zaten otomatik sipariş oluşturulmuş mu kontrol et
          const existingOrder = currentOrders.find(order => 
            order.customerId === customer.id && 
            order.monthNumber === nextUnpaidMonth &&
            order.isAutomatic
          );

          if (!existingOrder) {
            const newOrder = this.createAutomaticOrder(customer, nextUnpaidMonth, nextPaymentDate);
            newOrders.push(newOrder);
            currentOrders.push(newOrder);
            console.log(`${customer.name} için ${nextUnpaidMonth}. ay otomatik siparişi oluşturuldu`);
          } else {
            console.log(`${customer.name} için ${nextUnpaidMonth}. ay siparişi zaten mevcut`);
          }
        } else {
          console.log(`${customer.name} için ${nextUnpaidMonth}. ay ödeme tarihi henüz gelmedi: ${format(nextPaymentDate, 'dd/MM/yyyy')}`);
        }
      }
    });

    // Güncellenmiş siparişleri kaydet
    if (newOrders.length > 0) {
      this.saveOrders(currentOrders);
    }

    return newOrders;
  }

  // Bir sonraki ödenmemiş ayı bul
  private static getNextUnpaidMonth(paidMonths: number[]): number {
    for (let month = 1; month <= 24; month++) {
      if (!paidMonths.includes(month)) {
        return month;
      }
    }
    return 25; // Tüm aylar ödenmiş
  }

  // Otomatik sipariş oluştur
  private static createAutomaticOrder(customer: Customer, monthNumber: number, dueDate: Date): AutomaticOrder {
    const orderId = `AUTO-${new Date().getFullYear()}-${String(this.orderCounter).padStart(4, '0')}`;
    this.orderCounter = this.orderCounter + 1;

    // Paket ücreti KDV dahil 1798.80 TL
    const packageAmount = 1798.80;

    const order: AutomaticOrder = {
      id: `auto-${Date.now()}-${customer.id}-${monthNumber}`,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerTckn: customer.tckn,
      customerAddress: customer.address,
      amount: packageAmount,
      paymentMethod: customer.paymentMethod,
      status: 'pending',
      createdDate: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      dueDate: format(dueDate, 'yyyy-MM-dd'),
      monthNumber: monthNumber,
      orderId: orderId,
      isAutomatic: true
    };

    console.log(`Otomatik sipariş oluşturuldu: ${customer.name} için ${monthNumber}. ay - ${orderId} - Tutar: ${order.amount} TL (KDV Dahil)`);
    return order;
  }

  // Tüm otomatik siparişleri getir
  static getAllAutomaticOrders(): AutomaticOrder[] {
    return [...this.loadOrders()];
  }

  // Sipariş durumunu güncelle
  static updateOrderStatus(orderId: string, status: 'pending' | 'completed' | 'cancelled'): boolean {
    const orders = this.loadOrders();
    const customers = this.loadCustomers();
    
    const orderIndex = orders.findIndex(order => order.orderId === orderId);
    if (orderIndex !== -1) {
      const oldStatus = orders[orderIndex].status;
      orders[orderIndex].status = status;
      
      console.log(`Sipariş durumu güncellendi: ${orderId} -> ${oldStatus} => ${status}`);
      
      // Eğer ödeme tamamlandıysa, müşterinin ödeme geçmişini güncelle
      if (status === 'completed') {
        const order = orders[orderIndex];
        const customerIndex = customers.findIndex(customer => customer.id === order.customerId);
        
        if (customerIndex !== -1) {
          // Ödenen aylar listesine bu ayı ekle (eğer zaten yoksa)
          if (!customers[customerIndex].paidMonths.includes(order.monthNumber)) {
            customers[customerIndex].paidMonths.push(order.monthNumber);
            customers[customerIndex].paidMonths.sort((a, b) => a - b); // Sırala
            console.log(`✅ Müşteri ${order.customerName} için ${order.monthNumber}. ay ödeme geçmişine eklendi`);
            console.log(`📊 Güncel ödenen aylar: [${customers[customerIndex].paidMonths.join(', ')}]`);
            
            // Müşteri verilerini kaydet
            this.saveCustomers(customers);
          }
        }
        
        console.log(`✅ ${order.customerName} - ${order.monthNumber}. ay ödemesi tamamlandı ve müşteri kaydı güncellendi`);
      }
      
      // Eğer ödeme iptal edildiyse, müşterinin ödeme geçmişinden çıkar
      if (status === 'cancelled' && oldStatus === 'completed') {
        const order = orders[orderIndex];
        const customerIndex = customers.findIndex(customer => customer.id === order.customerId);
        
        if (customerIndex !== -1) {
          // Ödenen aylar listesinden bu ayı çıkar
          const monthIndex = customers[customerIndex].paidMonths.indexOf(order.monthNumber);
          if (monthIndex > -1) {
            customers[customerIndex].paidMonths.splice(monthIndex, 1);
            console.log(`❌ Müşteri ${order.customerName} için ${order.monthNumber}. ay ödeme geçmişinden çıkarıldı`);
            console.log(`📊 Güncel ödenen aylar: [${customers[customerIndex].paidMonths.join(', ')}]`);
            
            // Müşteri verilerini kaydet
            this.saveCustomers(customers);
          }
        }
      }
      
      // Siparişleri kaydet
      this.saveOrders(orders);
      return true;
    }
    console.log(`❌ Sipariş bulunamadı: ${orderId}`);
    return false;
  }

  // Sipariş bilgilerini güncelle
  static updateOrder(orderId: string, updateData: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerTckn: string;
    customerAddress: string;
    amount: number;
  }): boolean {
    const orders = this.loadOrders();
    const orderIndex = orders.findIndex(order => order.orderId === orderId);
    if (orderIndex !== -1) {
      orders[orderIndex] = {
        ...orders[orderIndex],
        customerName: updateData.customerName,
        customerEmail: updateData.customerEmail,
        customerPhone: updateData.customerPhone,
        customerTckn: updateData.customerTckn,
        customerAddress: updateData.customerAddress,
        amount: updateData.amount
      };
      
      // Siparişleri kaydet
      this.saveOrders(orders);
      console.log(`Sipariş güncellendi: ${orderId}`, updateData);
      return true;
    }
    console.log(`Güncellenecek sipariş bulunamadı: ${orderId}`);
    return false;
  }

  // Müşteri için bekleyen siparişleri getir
  static getPendingOrdersForCustomer(customerId: number): AutomaticOrder[] {
    const orders = this.loadOrders();
    return orders.filter(order => 
      order.customerId === customerId && 
      order.status === 'pending'
    );
  }

  // Günlük kontrol fonksiyonu - her gün çalıştırılmalı
  static dailyCheck(customers: Customer[]): AutomaticOrder[] {
    console.log('🔄 Günlük otomatik sipariş kontrolü başlatılıyor...');
    console.log(`Kontrol edilen müşteri sayısı: ${customers.length}`);
    
    const newOrders = this.checkAndCreateAutomaticOrders(customers);
    const allOrders = this.loadOrders();
    
    if (newOrders.length > 0) {
      console.log(`✅ ${newOrders.length} yeni otomatik sipariş oluşturuldu`);
      newOrders.forEach(order => {
        console.log(`- ${order.customerName}: ${order.monthNumber}. ay - ${order.amount} TL`);
      });
    } else {
      console.log('ℹ️ Bugün için yeni otomatik sipariş yok');
    }

    console.log(`📊 Toplam otomatik sipariş: ${allOrders.length}`);
    console.log(`📊 Bekleyen: ${allOrders.filter(o => o.status === 'pending').length}`);
    console.log(`📊 Tamamlanan: ${allOrders.filter(o => o.status === 'completed').length}`);

    return newOrders;
  }

  // Müşteri ödemesini manuel olarak işaretle (test için)
  static markCustomerMonthAsPaid(customerId: number, monthNumber: number): void {
    console.log(`Manuel ödeme işaretlendi: Müşteri ${customerId} - ${monthNumber}. ay`);
  }

  // Test için demo veri oluştur
  static createDemoOrder(customer: Customer): AutomaticOrder {
    const nextMonth = this.getNextUnpaidMonth(customer.paidMonths);
    const dueDate = new Date();
    return this.createAutomaticOrder(customer, nextMonth, dueDate);
  }
}
