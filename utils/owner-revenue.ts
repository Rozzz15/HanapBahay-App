import { getRentPaymentsByOwner, RentPayment } from './tenant-payments';

export interface MonthlyRevenueOverview {
  totalRentalIncome: number; // Total amount received from all paid payments
  pendingPayments: number; // Total amount of pending payments
  completedPayments: number; // Count of completed (paid) payments
  overduePayments: number; // Total amount of overdue payments
  month: string; // YYYY-MM format
  paymentCounts: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
  };
}

/**
 * Get monthly revenue overview for an owner
 * @param ownerId - The owner's user ID
 * @param month - Optional month in YYYY-MM format. Defaults to current month
 * @returns Monthly revenue breakdown by payment status
 */
export async function getMonthlyRevenueOverview(
  ownerId: string,
  month?: string
): Promise<MonthlyRevenueOverview> {
  try {
    // Default to current month if not provided
    const targetMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM format

    // Get all rent payments for this owner
    const allPayments = await getRentPaymentsByOwner(ownerId);
    
    // Get all bookings to verify payments are from active tenants (approved bookings, not rejected/cancelled/deleted)
    const { db } = await import('./db');
    const allBookings = await db.list<any>('bookings');
    const activeBookings = allBookings.filter(
      b => b.ownerId === ownerId && 
      b.status === 'approved' &&
      !b.isDeleted && // Exclude soft-deleted bookings
      b.status !== 'rejected' && // Exclude rejected bookings
      b.status !== 'cancelled' // Exclude cancelled bookings
    );
    const activeBookingIds = new Set(activeBookings.map(b => b.id));
    
    // Filter payments to only include those from active tenants (approved bookings, not deleted/rejected)
    // Also exclude rejected payments
    const activePayments = allPayments.filter(p => 
      activeBookingIds.has(p.bookingId) && 
      p.status !== 'rejected' // Exclude rejected payments
    );

    // Filter payments for the target month (for pending/overdue calculations)
    const monthPayments = activePayments.filter(
      (payment) => payment.paymentMonth === targetMonth
    );

    // Calculate total rental income (sum of ALL paid payments, regardless of month)
    // This shows all confirmed/accepted payments the owner has received
    const allPaidPayments = activePayments.filter(
      (p) => p.status === 'paid'
    );
    const totalRentalIncome = allPaidPayments.reduce(
      (sum, p) => sum + (p.totalAmount || 0),
      0
    );
    
    // For month-specific metrics, use only payments for the target month
    const paidPayments = monthPayments.filter(
      (p) => p.status === 'paid'
    );

    // Calculate pending payments (pending or pending_owner_confirmation)
    // CRITICAL FIX: Apply 7-day rule - next month's payment should only show 7 days before next month
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const twoMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 2, 1);
    
    // Calculate if we're within 7 days of next month
    const daysUntilNextMonth = Math.floor((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const shouldShowNextMonthPayments = daysUntilNextMonth <= 7;
    
    const allPendingPayments = activePayments.filter(
      (p) => {
        // CRITICAL FIX: Exclude paid payments from pending count
        if (p.status === 'paid') return false;
        
        // Don't count payments that are marked as rejected (check rejectedAt field)
        // Note: Rejected payments now have status 'pending' or 'overdue' but are marked by rejectedAt
        if ((p as any).rejectedAt && p.status !== 'paid') return false;
        
        // Only count pending or pending_owner_confirmation statuses
        if (p.status === 'pending' || p.status === 'pending_owner_confirmation') {
          // CRITICAL: First payments (with advance deposit, totalAmount > monthlyRent) should ALWAYS show
          // regardless of date, because tenant must pay before moving in
          const isFirstPayment = p.totalAmount && p.totalAmount > (p.monthlyRent || 0);
          if (isFirstPayment) {
            console.log(`  ⭐ Including FIRST PAYMENT (with advance): ₱${p.totalAmount} for ${p.paymentMonth}`);
            return true; // Always show first payments with advance deposit
          }
          
          // Check payment month
          const paymentMonth = new Date(p.paymentMonth + '-01');
          
          // CRITICAL FIX: Only include next month's payments if we're within 7 days
          if (paymentMonth.getTime() === nextMonth.getTime()) {
            // This is a next month payment - only show if within 7 days
            return shouldShowNextMonthPayments;
          }
          
          // For current month or beyond next month, use existing logic
          const isCurrentMonth = paymentMonth.getTime() === currentMonth.getTime();
          return isCurrentMonth;
        }
        
        return false;
      }
    );
    
    // Also include pending payments from approved bookings that haven't been paid yet
    // These are initial booking payments that are still pending
    // IMPORTANT: Only count bookings that DON'T have a payment record yet (to avoid double counting)
    // CRITICAL FIX: Also exclude bookings that have ANY paid payment records
    const bookingsWithPaymentRecords = new Set(allPayments.map(p => p.bookingId));
    const bookingsWithPaidPayments = new Set(
      allPayments.filter(p => p.status === 'paid').map(p => p.bookingId)
    );
    
    const pendingBookingPayments = allBookings.filter(
      (b) => {
        // CRITICAL FIX: Exclude bookings that already have paid payment records
        // This prevents counting bookings with paymentStatus='pending' that actually have paid payments
        if (bookingsWithPaidPayments.has(b.id)) {
          return false;
        }
        
        // Only count approved bookings with pending payment status that aren't deleted/rejected
        // AND don't have a payment record yet (to avoid double counting)
        if (b.ownerId === ownerId && 
            b.status === 'approved' && 
            b.paymentStatus === 'pending' &&
            !b.isDeleted && // Exclude soft-deleted bookings
            b.status !== 'rejected' && // Exclude rejected bookings
            b.status !== 'cancelled' && // Exclude cancelled bookings
            !bookingsWithPaymentRecords.has(b.id)) { // CRITICAL: Don't count if payment record exists
          // Check if the booking start date is in the current or next month
          if (b.startDate) {
            const bookingStartDate = new Date(b.startDate);
            const bookingMonth = new Date(bookingStartDate.getFullYear(), bookingStartDate.getMonth(), 1);
            const isCurrentOrNextMonth = bookingMonth >= currentMonth && bookingMonth < twoMonthsFromNow;
            return isCurrentOrNextMonth;
          }
          // If no start date, include it (shouldn't happen but handle gracefully)
          return true;
        }
        return false;
      }
    );
    
    // Calculate total pending payments from rent payments (ALL pending payments, not just current month)
    const pendingRentPayments = allPendingPayments.reduce(
      (sum, p) => sum + (p.totalAmount || 0),
      0
    );
    
    // Calculate total pending payments from bookings WITHOUT payment records (to avoid double counting)
    const pendingBookingPaymentsAmount = pendingBookingPayments.reduce(
      (sum, b) => sum + (b.totalAmount || 0),
      0
    );
    
    // CRITICAL: The pendingRentPayments ALREADY includes the first payment from approved bookings
    // because createInitialPaymentForApprovedBooking creates a pending payment record immediately
    // So we only add booking amounts if there's NO payment record (backup for edge cases)
    const pendingPayments = pendingRentPayments + pendingBookingPaymentsAmount;
    
    console.log('💰 PENDING PAYMENTS BREAKDOWN:');
    console.log(`  - From rent payment records (pending): ₱${pendingRentPayments}`);
    console.log(`  - From bookings without records: ₱${pendingBookingPaymentsAmount}`);
    console.log(`  - TOTAL PENDING: ₱${pendingPayments}`);
    
    // For month-specific pending count, use only payments for the target month
    const pendingPaymentList = monthPayments.filter(
      (p) =>
        // CRITICAL FIX: Exclude paid payments from pending count
        (p.status === 'pending' || p.status === 'pending_owner_confirmation') &&
        p.status !== 'paid' &&
        !(p as any).rejectedAt // Also exclude rejected payments
    );
    
    // Also count pending bookings for the target month
    const targetMonthDate = new Date(targetMonth + '-01');
    const nextTargetMonth = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth() + 1, 1);
    const pendingBookingsForMonth = allBookings.filter(
      (b) => {
        // CRITICAL FIX: Exclude bookings that already have paid payment records
        if (bookingsWithPaidPayments.has(b.id)) {
          return false;
        }
        
        if (b.ownerId === ownerId && 
            b.status === 'approved' && 
            b.paymentStatus === 'pending' &&
            !b.isDeleted && // Exclude soft-deleted bookings
            b.status !== 'rejected' && // Exclude rejected bookings
            b.status !== 'cancelled' && // Exclude cancelled bookings
            !bookingsWithPaymentRecords.has(b.id)) { // CRITICAL: Don't count if payment record exists
          if (b.startDate) {
            const bookingStartDate = new Date(b.startDate);
            const bookingMonth = new Date(bookingStartDate.getFullYear(), bookingStartDate.getMonth(), 1);
            return bookingMonth >= targetMonthDate && bookingMonth < nextTargetMonth;
          }
          return false;
        }
        return false;
      }
    );

    // Completed payments count (number of ALL paid payments, not just current month)
    // This shows the total count of all confirmed/accepted payments
    const completedPayments = allPaidPayments.length;

    // Calculate overdue payments (only from active tenants)
    const allOverduePayments = activePayments.filter(
      (p) => p.status === 'overdue'
    );
    const overduePaymentList = monthPayments.filter(
      (p) => p.status === 'overdue'
    );
    const overduePayments = overduePaymentList.reduce(
      (sum, p) => sum + (p.totalAmount || 0),
      0
    );

    // Payment counts for additional insights
    // Include both rent payments and booking payments in the counts
    const paymentCounts = {
      total: monthPayments.length + pendingBookingsForMonth.length,
      paid: paidPayments.length,
      pending: pendingPaymentList.length + pendingBookingsForMonth.length,
      overdue: overduePaymentList.length,
    };

    console.log(`💰 Monthly revenue overview for owner ${ownerId} (${targetMonth}):`, {
      totalRentalIncome,
      allPaidPaymentsCount: allPaidPayments.length,
      monthPaidPaymentsCount: paidPayments.length,
      allPendingPaymentsCount: allPendingPayments.length,
      monthPendingPaymentsCount: pendingPaymentList.length,
      pendingBookingPaymentsCount: pendingBookingPayments.length,
      pendingBookingPaymentsAmount,
      pendingRentPayments,
      pendingPayments,
      completedPayments,
      overduePayments,
      paymentCounts,
    });
    
    // DEBUG: Log detailed breakdown of pending payments source
    console.log('🔍 DEBUG - Pending Payment Breakdown:');
    console.log('  - From Rent Payments (pending/pending_owner_confirmation):', pendingRentPayments);
    console.log('  - From Bookings (paymentStatus=pending, no payment records):', pendingBookingPaymentsAmount);
    console.log('  - Total Pending:', pendingPayments);
    console.log('  - allPendingPaymentsCount:', allPendingPayments.length);
    console.log('  - monthPendingPaymentsCount:', pendingPaymentList.length);
    
    if (pendingBookingPayments.length > 0) {
      console.log('🔍 DEBUG - Pending Bookings Details:');
      pendingBookingPayments.forEach(b => {
        console.log(`  Booking ID: ${b.id}, Amount: ₱${b.totalAmount}, Status: ${b.status}, PaymentStatus: ${b.paymentStatus}`);
      });
    }
    
    if (allPendingPayments.length > 0) {
      console.log('🔍 DEBUG - ALL Pending Rent Payments Details:');
      allPendingPayments.forEach(p => {
        console.log(`  Payment ID: ${p.id}, Amount: ₱${p.totalAmount}, Status: ${p.status}, Month: ${p.paymentMonth}, BookingID: ${p.bookingId}, TenantID: ${p.tenantId}`);
      });
    }
    
    console.log('🔍 DEBUG - ALL Payments (to check for paid status):');
    allPayments.filter(p => p.status === 'paid').forEach(p => {
      console.log(`  ✅ PAID Payment ID: ${p.id}, Amount: ₱${p.totalAmount}, Status: ${p.status}, Month: ${p.paymentMonth}`);
    });
    
    console.log('🔍 DEBUG - Checking for duplicate or wrong status:');
    const paymentsGroupedByMonth = allPayments.reduce((acc, p) => {
      if (!acc[p.paymentMonth]) acc[p.paymentMonth] = [];
      acc[p.paymentMonth].push(p);
      return acc;
    }, {} as Record<string, any[]>);
    Object.entries(paymentsGroupedByMonth).forEach(([month, payments]) => {
      console.log(`  Month ${month}: ${payments.length} payments`);
      payments.forEach(p => {
        console.log(`    - ID: ${p.id}, Status: ${p.status}, Amount: ₱${p.totalAmount}`);
      });
    });

    return {
      totalRentalIncome,
      pendingPayments,
      completedPayments,
      overduePayments,
      month: targetMonth,
      paymentCounts,
    };
  } catch (error) {
    console.error('❌ Error getting monthly revenue overview:', error);
    // Return empty overview on error
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    return {
      totalRentalIncome: 0,
      pendingPayments: 0,
      completedPayments: 0,
      overduePayments: 0,
      month: targetMonth,
      paymentCounts: {
        total: 0,
        paid: 0,
        pending: 0,
        overdue: 0,
      },
    };
  }
}

