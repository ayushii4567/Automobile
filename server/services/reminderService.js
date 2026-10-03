/**
 * Apex Horizon Motors — Dynamic Reminders & Alerts Engine
 * 
 * Computes live, actionable reminders from real database transactions across:
 * 1. Payment Reminders (Unpaid balances, overdue invoices)
 * 2. Insurance Reminders (Expiring in <=30 days, or expired)
 * 3. Service Reminders (Periodic maintenance due, open tickets)
 * 4. Lead Follow-up (Hot leads, pending follow-ups)
 * 5. Test Drive (Scheduled for today/tomorrow)
 * 6. Delivery Reminders (Scheduled car deliveries this week)
 * 7. Birthday Reminders (Customer birthdays today or within 7 days)
 * 8. Anniversary Reminders (Delivery anniversaries today or within 7 days)
 */

const db = require('../db/connection');

function getDayMonthString(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length >= 3) {
    return `${parts[1]}-${parts[2]}`; // MM-DD
  }
  return '';
}

function daysBetween(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const diffTime = d1 - d2;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

const reminderService = {
  getAutomatedReminders(todayDate = '2026-10-03') {
    const today = todayDate;
    const reminders = [];

    // -------------------------------------------------------------
    // 1. PAYMENT REMINDERS (Invoices with balance_due > 0)
    // -------------------------------------------------------------
    try {
      const pendingInvoices = db.prepare(`
        SELECT 
          i.id, i.invoice_number, i.total_amount, i.paid_amount, i.balance_due,
          i.invoice_date, i.due_date, i.customer_id, i.customer_name,
          c.phone as customer_phone, c.email as customer_email,
          s.sale_order_number, v.brand, v.model
        FROM invoices i
        JOIN customers c ON i.customer_id = c.id
        LEFT JOIN sales s ON i.sale_id = s.id
        LEFT JOIN vehicles v ON i.vehicle_id = v.id
        WHERE i.balance_due > 0
        ORDER BY i.due_date ASC
      `).all();

      pendingInvoices.forEach(inv => {
        const daysDiff = daysBetween(inv.due_date, today);
        let urgency = 'Medium';
        let alertBadge = 'Upcoming Payment';

        if (daysDiff < 0) {
          urgency = 'Urgent';
          alertBadge = `Overdue by ${Math.abs(daysDiff)} days`;
        } else if (daysDiff <= 3) {
          urgency = 'High';
          alertBadge = `Due in ${daysDiff} days`;
        }

        reminders.push({
          id: `rem_pay_${inv.id}`,
          category: 'Payment',
          title: `Collect Balance: ₹${Number(inv.balance_due).toLocaleString('en-IN')} from ${inv.customer_name}`,
          description: `Invoice #${inv.invoice_number} for ${inv.brand || ''} ${inv.model || 'Vehicle'}. Paid: ₹${Number(inv.paid_amount).toLocaleString('en-IN')} / Total: ₹${Number(inv.total_amount).toLocaleString('en-IN')}`,
          dueDate: inv.due_date,
          priority: urgency,
          status: alertBadge,
          customerName: inv.customer_name,
          customerPhone: inv.customer_phone,
          customerEmail: inv.customer_email,
          entityType: 'invoice',
          entityId: inv.id,
          suggestedAction: 'whatsapp_payment_notice',
          actionPayload: {
            customerName: inv.customer_name,
            invoiceNumber: inv.invoice_number,
            vehicleName: `${inv.brand || ''} ${inv.model || ''}`,
            totalAmount: inv.total_amount,
            paidAmount: inv.paid_amount,
            balanceDue: inv.balance_due,
            dueDate: inv.due_date
          }
        });
      });
    } catch (e) {
      console.warn('Error computing payment reminders:', e.message);
    }

    // -------------------------------------------------------------
    // 2. INSURANCE REMINDERS (Expiring policies)
    // -------------------------------------------------------------
    try {
      const policies = db.prepare(`
        SELECT 
          p.*,
          c.phone as customer_phone, c.email as customer_email
        FROM insurance_policies p
        LEFT JOIN customers c ON p.customer_id = c.id
        ORDER BY p.expiry_date ASC
      `).all();

      policies.forEach(pol => {
        const daysDiff = daysBetween(pol.expiry_date, today);
        if (daysDiff <= 30) {
          let urgency = 'Medium';
          let badge = `Expires in ${daysDiff} days`;

          if (daysDiff < 0) {
            urgency = 'Urgent';
            badge = `Expired ${Math.abs(daysDiff)} days ago!`;
          } else if (daysDiff <= 7) {
            urgency = 'High';
            badge = `Expires in ${daysDiff} days!`;
          }

          reminders.push({
            id: `rem_ins_${pol.id}`,
            category: 'Insurance',
            title: `Insurance Policy Renewal: ${pol.customer_name} (${pol.vehicle_name})`,
            description: `Policy #${pol.policy_number} with ${pol.provider} (${pol.policy_type}). Premium: ₹${Number(pol.premium_amount).toLocaleString('en-IN')}`,
            dueDate: pol.expiry_date,
            priority: urgency,
            status: badge,
            customerName: pol.customer_name,
            customerPhone: pol.customer_phone,
            customerEmail: pol.customer_email,
            entityType: 'insurance',
            entityId: pol.id,
            suggestedAction: 'whatsapp_insurance_notice',
            actionPayload: {
              customerName: pol.customer_name,
              vehicleName: pol.vehicle_name,
              policyNo: pol.policy_number,
              provider: pol.provider,
              expiryDate: pol.expiry_date,
              premiumAmount: pol.premium_amount
            }
          });
        }
      });
    } catch (e) {
      console.warn('Error computing insurance reminders:', e.message);
    }

    // -------------------------------------------------------------
    // 3. SERVICE REMINDERS (Active job cards & periodic maintenance)
    // -------------------------------------------------------------
    try {
      const openServices = db.prepare(`
        SELECT 
          st.id, st.ticket_number, st.customer_name, st.customer_phone,
          st.vehicle_model, st.service_type, st.entry_date, st.expected_delivery,
          st.status, jc.job_card_number, jc.bay_number, jc.total_service_cost
        FROM service_tickets st
        LEFT JOIN job_cards jc ON jc.service_ticket_id = st.id
        WHERE st.status IN ('Open', 'Job Card Issued', 'In Progress', 'Work Completed')
      `).all();

      openServices.forEach(srv => {
        const isReady = srv.status === 'Work Completed';
        reminders.push({
          id: `rem_srv_${srv.id}`,
          category: 'Service',
          title: isReady 
            ? `Vehicle Ready for Pickup: ${srv.customer_name} (${srv.vehicle_model})` 
            : `Service Job in Progress: ${srv.ticket_number} (${srv.service_type})`,
          description: `Assigned Bay: ${srv.bay_number || 'Bay 01'} | Total Bill: ₹${Number(srv.total_service_cost || 0).toLocaleString('en-IN')}`,
          dueDate: srv.expected_delivery || srv.entry_date,
          priority: isReady ? 'High' : 'Medium',
          status: srv.status,
          customerName: srv.customer_name,
          customerPhone: srv.customer_phone,
          entityType: 'service',
          entityId: srv.id,
          suggestedAction: 'whatsapp_service_update',
          actionPayload: {
            customerName: srv.customer_name,
            jobCardNumber: srv.job_card_number || srv.ticket_number,
            vehicleName: srv.vehicle_model,
            status: srv.status,
            totalCost: srv.total_service_cost,
            bay: srv.bay_number
          }
        });
      });
    } catch (e) {
      console.warn('Error computing service reminders:', e.message);
    }

    // -------------------------------------------------------------
    // 4. LEAD FOLLOW-UP REMINDERS
    // -------------------------------------------------------------
    try {
      const leads = db.prepare(`
        SELECT l.*, c.name as customer_name, c.phone as customer_phone
        FROM leads l
        LEFT JOIN customers c ON l.customer_id = c.id
        WHERE l.status IN ('New', 'Contacted', 'Hot Lead')
      `).all();

      leads.forEach(lead => {
        const name = lead.contact_name || lead.customer_name || 'Prospect';
        const isHot = lead.status === 'Hot Lead';

        reminders.push({
          id: `rem_lead_${lead.id}`,
          category: 'Lead Follow-up',
          title: `${isHot ? '🔥 Hot Lead Follow-up' : '📞 Lead Call'}: ${name}`,
          description: `Interested in: ${lead.vehicle_interest_text || 'Vehicle'} (Budget: ₹${Number(lead.budget_min || 0).toLocaleString('en-IN')} - ₹${Number(lead.budget_max || 0).toLocaleString('en-IN')}) | Source: ${lead.source}`,
          dueDate: today,
          priority: isHot ? 'High' : 'Medium',
          status: lead.status,
          customerName: name,
          customerPhone: lead.phone || lead.customer_phone,
          entityType: 'lead',
          entityId: lead.id,
          suggestedAction: 'call_customer'
        });
      });
    } catch (e) {
      console.warn('Error computing lead reminders:', e.message);
    }

    // -------------------------------------------------------------
    // 5. TEST DRIVE REMINDERS
    // -------------------------------------------------------------
    try {
      const drives = db.prepare(`
        SELECT td.*, v.brand, v.model, v.color
        FROM test_drives td
        JOIN vehicles v ON td.vehicle_id = v.id
        WHERE td.status = 'Scheduled'
      `).all();

      drives.forEach(td => {
        const daysDiff = daysBetween(td.scheduled_date, today);
        let urgency = 'Medium';
        let badge = 'Scheduled';

        if (daysDiff === 0) {
          urgency = 'Urgent';
          badge = 'TODAY';
        } else if (daysDiff === 1) {
          urgency = 'High';
          badge = 'Tomorrow';
        }

        reminders.push({
          id: `rem_td_${td.id}`,
          category: 'Test Drive',
          title: `Test Drive with ${td.customer_name} — ${td.brand} ${td.model}`,
          description: `Time: ${td.time_slot} | Route: ${td.route_taken || 'BKC Loop'} | License: ${td.driving_license_number}`,
          dueDate: td.scheduled_date,
          priority: urgency,
          status: badge,
          customerName: td.customer_name,
          customerPhone: td.customer_phone,
          entityType: 'test_drive',
          entityId: td.id,
          suggestedAction: 'call_customer'
        });
      });
    } catch (e) {
      console.warn('Error computing test drive reminders:', e.message);
    }

    // -------------------------------------------------------------
    // 6. DELIVERY REMINDERS (Scheduled vehicle handovers)
    // -------------------------------------------------------------
    try {
      const pendingDeliveries = db.prepare(`
        SELECT 
          s.id, s.sale_order_number, s.booking_date, s.expected_delivery_date,
          c.name as customer_name, c.phone as customer_phone,
          v.brand, v.model, v.color, v.vin
        FROM sales s
        JOIN customers c ON s.customer_id = c.id
        JOIN vehicles v ON s.vehicle_id = v.id
        WHERE s.status IN ('Booked', 'Processing')
      `).all();

      pendingDeliveries.forEach(del => {
        const delDate = del.expected_delivery_date || today;
        const daysDiff = daysBetween(delDate, today);
        let urgency = 'Medium';
        let badge = `Delivery in ${daysDiff} days`;

        if (daysDiff <= 0) {
          urgency = 'Urgent';
          badge = 'Delivery TODAY / Ready for Handover';
        } else if (daysDiff <= 2) {
          urgency = 'High';
          badge = `Delivery in ${daysDiff} days`;
        }

        reminders.push({
          id: `rem_del_${del.id}`,
          category: 'Delivery',
          title: `Vehicle Delivery: ${del.customer_name} — ${del.brand} ${del.model}`,
          description: `Sale Order #${del.sale_order_number} | Color: ${del.color} | VIN: ${del.vin || 'Allocated'}. Ensure PDI certificate and ribbon kit are ready!`,
          dueDate: delDate,
          priority: urgency,
          status: badge,
          customerName: del.customer_name,
          customerPhone: del.customer_phone,
          entityType: 'sale',
          entityId: del.id,
          suggestedAction: 'call_customer'
        });
      });
    } catch (e) {
      console.warn('Error computing delivery reminders:', e.message);
    }

    // -------------------------------------------------------------
    // 7. BIRTHDAY REMINDERS (Today or within 7 days)
    // -------------------------------------------------------------
    try {
      const customers = db.prepare('SELECT id, name, phone, email, date_of_birth, customer_group FROM customers WHERE date_of_birth IS NOT NULL').all();
      const currentMMDD = getDayMonthString(today); // e.g. '10-03'

      customers.forEach(cust => {
        const birthMMDD = getDayMonthString(cust.date_of_birth);
        if (!birthMMDD) return;

        // Check if today
        const isToday = birthMMDD === currentMMDD;
        
        // Check if within 7 days
        let isUpcoming = false;
        let daysAway = 0;

        const currentYear = today.split('-')[0];
        const thisYearBirthday = `${currentYear}-${birthMMDD}`;
        const diff = daysBetween(thisYearBirthday, today);

        if (diff >= 0 && diff <= 7) {
          isUpcoming = true;
          daysAway = diff;
        }

        if (isToday || isUpcoming) {
          reminders.push({
            id: `rem_bday_${cust.id}`,
            category: 'Birthday',
            title: isToday 
              ? `🎂 TODAY is ${cust.name}'s Birthday!` 
              : `🎂 Birthday in ${daysAway} days: ${cust.name}`,
            description: `Group: ${cust.customer_group || 'VIP'} | Born: ${cust.date_of_birth}. Send festive wishes with complimentary vehicle inspection voucher!`,
            dueDate: thisYearBirthday,
            priority: isToday ? 'Urgent' : 'Medium',
            status: isToday ? 'TODAY' : `In ${daysAway} days`,
            customerName: cust.name,
            customerPhone: cust.phone,
            customerEmail: cust.email,
            entityType: 'customer',
            entityId: cust.id,
            suggestedAction: 'whatsapp_birthday_wishes',
            actionPayload: {
              customerName: cust.name
            }
          });
        }
      });
    } catch (e) {
      console.warn('Error computing birthday reminders:', e.message);
    }

    // -------------------------------------------------------------
    // 8. ANNIVERSARY REMINDERS (Delivery anniversary today or within 7 days)
    // -------------------------------------------------------------
    try {
      const sales = db.prepare(`
        SELECT 
          s.id, s.actual_delivery_date, s.booking_date,
          c.id as customer_id, c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
          v.brand, v.model
        FROM sales s
        JOIN customers c ON s.customer_id = c.id
        JOIN vehicles v ON s.vehicle_id = v.id
        WHERE s.actual_delivery_date IS NOT NULL OR s.booking_date IS NOT NULL
      `).all();

      const currentMMDD = getDayMonthString(today);

      sales.forEach(sale => {
        const anniversarySourceDate = sale.actual_delivery_date || sale.booking_date;
        const anniMMDD = getDayMonthString(anniversarySourceDate);
        if (!anniMMDD) return;

        const currentYear = today.split('-')[0];
        const thisYearAnni = `${currentYear}-${anniMMDD}`;
        const diff = daysBetween(thisYearAnni, today);

        const isToday = anniMMDD === currentMMDD;
        const isUpcoming = diff >= 0 && diff <= 7;

        if (isToday || isUpcoming) {
          const originalYear = anniversarySourceDate.split('-')[0];
          const yearsCompleted = Math.max(1, Number(currentYear) - Number(originalYear));

          reminders.push({
            id: `rem_anni_${sale.id}`,
            category: 'Anniversary',
            title: isToday
              ? `🚘 TODAY: ${yearsCompleted} Year Car Anniversary for ${sale.customer_name}!`
              : `🚘 Car Anniversary in ${diff} days: ${sale.customer_name}`,
            description: `${sale.brand} ${sale.model} purchased on ${anniversarySourceDate}. Invite for complimentary anniversary inspection and detailing!`,
            dueDate: thisYearAnni,
            priority: isToday ? 'High' : 'Medium',
            status: isToday ? 'TODAY' : `In ${diff} days`,
            customerName: sale.customer_name,
            customerPhone: sale.customer_phone,
            customerEmail: sale.customer_email,
            entityType: 'sale',
            entityId: sale.id,
            suggestedAction: 'whatsapp_anniversary_wishes',
            actionPayload: {
              customerName: sale.customer_name,
              vehicleName: `${sale.brand} ${sale.model}`
            }
          });
        }
      });
    } catch (e) {
      console.warn('Error computing anniversary reminders:', e.message);
    }

    // Sort: Urgent first, then High, then Medium, then by Due Date
    const priorityWeight = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    reminders.sort((a, b) => {
      const pDiff = (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1);
      if (pDiff !== 0) return pDiff;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

    return {
      today,
      totalReminders: reminders.length,
      urgentCount: reminders.filter(r => r.priority === 'Urgent').length,
      highCount: reminders.filter(r => r.priority === 'High').length,
      byCategory: {
        payment: reminders.filter(r => r.category === 'Payment').length,
        insurance: reminders.filter(r => r.category === 'Insurance').length,
        service: reminders.filter(r => r.category === 'Service').length,
        lead: reminders.filter(r => r.category === 'Lead Follow-up').length,
        testDrive: reminders.filter(r => r.category === 'Test Drive').length,
        delivery: reminders.filter(r => r.category === 'Delivery').length,
        birthday: reminders.filter(r => r.category === 'Birthday').length,
        anniversary: reminders.filter(r => r.category === 'Anniversary').length
      },
      reminders
    };
  }
};

module.exports = reminderService;
