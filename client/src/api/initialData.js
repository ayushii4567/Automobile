export const initialData = {
  settings: {
    showroomName: "AutoCore Motors Showroom",
    tagline: "Authorized Premium Automobile Dealership",
    dealerLicense: "DL-MH-02-SHOWROOM-2024",
    currency: "₹",
    currencyCode: "INR",
    defaultTaxRate: 10,
    email: "contact@autocoreshowroom.com",
    phone: "+91 98765 43210",
    address: "Showroom 12, Automobile Hub, Andheri East, Mumbai, MH 400069",
    operatingHours: "Mon - Sat: 9:30 AM - 7:30 PM | Sun: 10:00 AM - 4:00 PM",
    socials: {
      instagram: "@autocoreshowroom",
      youtube: "AutoCoreMotors",
      twitter: "@AutoCoreMotors"
    }
  },

  vehicles: [
    {
      id: "veh-1",
      brand: "Mahindra",
      model: "XUV700 AX7 Luxury",
      year: 2024,
      category: "SUV",
      color: "Midnight Black",
      fuel: "Diesel",
      transmission: "6-Speed Automatic",
      engine: "2.2L mHawk Turbo Diesel",
      horsepower: 182,
      mileage: 120,
      price: 2150000,
      vin: "MA1TA2BK5P829104",
      stock: 2,
      status: "Available",
      image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
      features: ["ADAS Level 2", "Panoramic Skyroof", "Dual HD Screens", "Sony 3D Sound System"]
    },
    {
      id: "veh-2",
      brand: "Tata",
      model: "Safari Dark Edition",
      year: 2024,
      category: "SUV",
      color: "Oberon Black",
      fuel: "Diesel",
      transmission: "6-Speed Automatic",
      engine: "2.0L Kryotec Turbocharged",
      horsepower: 168,
      mileage: 85,
      price: 1980000,
      vin: "MAT621980P349012",
      stock: 1,
      status: "Available",
      image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
      features: ["Ventilated Seats", "360 Surround Camera", "JBL Audio System", "Electronic Parking Brake"]
    }
  ],

  customers: [
    {
      id: "cust-1",
      name: "Rahul Sharma",
      email: "rahul.sharma@outlook.in",
      phone: "+91 98765 43210",
      city: "Mumbai, Maharashtra",
      status: "VIP",
      interestedVehicle: "Mahindra XUV700 AX7 Luxury",
      budget: 2500000,
      notes: "Interested in 7-seater diesel automatic with ADAS pack. Prefers fast delivery."
    },
    {
      id: "cust-2",
      name: "Ananya Verma",
      email: "ananya.verma@gmail.com",
      phone: "+91 98201 54321",
      city: "Pune, Maharashtra",
      status: "Active Buyer",
      interestedVehicle: "Tata Safari Dark Edition",
      budget: 2300000,
      notes: "Looking for Dark Edition variant. Requested highway test drive."
    }
  ],

  sales: [
    {
      id: "sale-101",
      invoiceNo: "INV-2026-0881",
      customerId: "cust-2",
      customerName: "Ananya Verma",
      vehicleId: "veh-2",
      vehicleName: "Tata Safari Dark Edition (2024)",
      vin: "MAT621980P349012",
      basePrice: 1980000,
      discount: 20000,
      taxRate: 10,
      taxAmount: 196000,
      totalAmount: 2156000,
      paymentMethod: "Net Banking / RTGS",
      salesAgent: "Rajesh Sharma",
      saleDate: "2026-09-14",
      deliveryDate: "2026-09-18",
      status: "Delivered"
    },
    {
      id: "sale-102",
      invoiceNo: "INV-2026-0882",
      customerId: "cust-1",
      customerName: "Rahul Sharma",
      vehicleId: "veh-1",
      vehicleName: "Mahindra XUV700 AX7 Luxury (2024)",
      vin: "MA1TA2BK5P829104",
      basePrice: 2150000,
      discount: 25000,
      taxRate: 10,
      taxAmount: 212500,
      totalAmount: 2337500,
      paymentMethod: "Car Loan / HDFC Bank",
      salesAgent: "Priya Patel",
      saleDate: "2026-09-17",
      deliveryDate: "2026-09-21",
      status: "Processing"
    }
  ],

  testdrives: [
    {
      id: "td-1",
      customerName: "Ananya Verma",
      customerPhone: "+91 98201 54321",
      vehicleId: "veh-2",
      vehicleName: "Tata Safari Dark Edition",
      date: "2026-09-17",
      timeSlot: "15:30 - 16:30",
      drivingLicense: "DL-MH-142019-0091",
      assignedStaff: "Rajesh Sharma",
      status: "Scheduled",
      notes: "VIP client. 45-min highway and automatic transmission drive."
    },
    {
      id: "td-2",
      customerName: "Rahul Sharma",
      customerPhone: "+91 98765 43210",
      vehicleId: "veh-1",
      vehicleName: "Mahindra XUV700 AX7 Luxury",
      date: "2026-09-18",
      timeSlot: "11:30 - 12:30",
      drivingLicense: "DL-MH-122020-0045",
      assignedStaff: "Priya Patel",
      status: "Scheduled",
      notes: "Client requested ADAS features and Panoramic Skyroof demonstration."
    }
  ],

  enquiries: [
    {
      id: "enq-1",
      customerName: "Rahul Sharma",
      phone: "+91 98765 43210",
      email: "rahul.sharma@outlook.in",
      vehicleOfInterest: "Mahindra XUV700 AX7 Luxury",
      source: "Walk-in",
      status: "Hot Lead",
      budget: 2500000,
      notes: "Looking for immediate delivery, discussed quotation and financing options.",
      createdAt: "2026-09-15"
    },
    {
      id: "enq-2",
      customerName: "Ananya Verma",
      phone: "+91 98201 54321",
      email: "ananya.verma@gmail.com",
      vehicleOfInterest: "Tata Safari Dark Edition",
      source: "Website",
      status: "Follow-up",
      budget: 2300000,
      notes: "Test drive completed, evaluating trade-in valuation for old Creta.",
      createdAt: "2026-09-16"
    }
  ],

  quotations: [
    {
      id: "quot-1",
      quotationNo: "QT-2026-001",
      customerId: "cust-1",
      customerName: "Rahul Sharma",
      customerPhone: "+91 98765 43210",
      customerEmail: "rahul.sharma@outlook.in",
      vehicleId: "veh-1",
      vehicleName: "Mahindra XUV700 AX7 Luxury (2024)",
      exShowroomPrice: 2150000,
      rtoTax: 215000,
      insurance: 75000,
      warrantyPack: 25000,
      accessories: 15000,
      discount: 40000,
      totalAmount: 2440000,
      validUntil: "2026-10-01",
      status: "Sent",
      createdAt: "2026-09-16",
      notes: "Includes 5-year extended warranty and genuine accessory pack."
    },
    {
      id: "quot-2",
      quotationNo: "QT-2026-002",
      customerId: "cust-2",
      customerName: "Ananya Verma",
      customerPhone: "+91 98201 54321",
      customerEmail: "ananya.verma@gmail.com",
      vehicleId: "veh-2",
      vehicleName: "Tata Safari Dark Edition (2024)",
      exShowroomPrice: 1980000,
      rtoTax: 198000,
      insurance: 68000,
      warrantyPack: 20000,
      accessories: 10000,
      discount: 30000,
      totalAmount: 2246000,
      validUntil: "2026-10-05",
      status: "Accepted",
      createdAt: "2026-09-17",
      notes: "Client accepted pro-forma. Processing financing with SBI auto loan."
    }
  ],

  parts: [
    {
      id: "part-1",
      partNo: "APX-BRK-700",
      name: "Brembo Front Brake Pad Set",
      category: "Braking",
      compatibleModel: "Mahindra XUV700 / Scorpio-N",
      stock: 12,
      minStock: 4,
      unitCost: 1800,
      sellingPrice: 2800,
      supplier: "Brembo Auto Parts India",
      location: "Shelf A-04"
    },
    {
      id: "part-2",
      partNo: "APX-FLT-SAF",
      name: "Mobil 1 High Performance Oil Filter",
      category: "Maintenance",
      compatibleModel: "Tata Safari / Harrier 2.0L",
      stock: 25,
      minStock: 5,
      unitCost: 350,
      sellingPrice: 650,
      supplier: "Mobil India Distribution",
      location: "Shelf B-01"
    }
  ],

  procurement: [
    {
      id: "po-1",
      poNumber: "PO-2026-081",
      supplier: "Mahindra & Mahindra Ltd. Chakan Plant",
      brand: "Mahindra",
      model: "XUV700 AX7 Luxury Diesel AT",
      year: 2024,
      vin: "MA1TA2BK5P829105",
      exteriorColor: "Dazzling Silver",
      category: "SUV",
      expectedDelivery: "2026-09-28",
      purchaseCost: 1850000,
      suggestedRetailPrice: 2150000,
      status: "In Transit",
      notes: "Batch dispatch from Pune factory. Carrier tracking #IND-9021."
    },
    {
      id: "po-2",
      poNumber: "PO-2026-082",
      supplier: "Tata Motors Ltd. Pimpri Plant",
      brand: "Tata",
      model: "Safari Accomplished Plus 6S",
      year: 2024,
      vin: "MAT621980P349013",
      exteriorColor: "Cosmic Gold",
      category: "SUV",
      expectedDelivery: "2026-10-02",
      purchaseCost: 1700000,
      suggestedRetailPrice: 1980000,
      status: "Ordered",
      notes: "Custom factory order with panoramic roof package."
    }
  ],

  services: [
    {
      id: "srv-1",
      ticketNo: "SRV-9021",
      customerName: "Rahul Sharma",
      customerPhone: "+91 98765 43210",
      vehicleModel: "Mahindra XUV700 (2024)",
      vin: "MA1TA2BK5P829104",
      serviceType: "First Periodic Service & Oil Change",
      technician: "Vikram Malhotra",
      estimatedCost: 3500,
      entryDate: "2026-09-17",
      expectedCompletion: "2026-09-18",
      status: "In Progress",
      notes: "General inspection, engine oil replacement, ECU diagnostic scan."
    },
    {
      id: "srv-2",
      ticketNo: "SRV-9022",
      customerName: "Ananya Verma",
      customerPhone: "+91 98201 54321",
      vehicleModel: "Tata Safari (2024)",
      vin: "MAT621980P349012",
      serviceType: "Wheel Balancing & Alignment Check",
      technician: "Sunil Kamble",
      estimatedCost: 1800,
      entryDate: "2026-09-16",
      expectedCompletion: "2026-09-16",
      status: "Completed",
      notes: "Completed test drive alignment. Delivered to customer."
    }
  ],

  staff: [
    {
      id: "stf-1",
      name: "Rajesh Sharma",
      role: "Senior Sales Manager",
      department: "Showroom Sales",
      email: "rajesh.sharma@autocoreshowroom.com",
      phone: "+91 98200 11223",
      status: "Active",
      salesClosed: 24,
      revenueGenerated: 4800000,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
    },
    {
      id: "stf-2",
      name: "Priya Patel",
      role: "Key Account Executive",
      department: "Client Relations & VIP",
      email: "priya.patel@autocoreshowroom.com",
      phone: "+91 98200 44556",
      status: "Active",
      salesClosed: 18,
      revenueGenerated: 3600000,
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80"
    }
  ]
};
