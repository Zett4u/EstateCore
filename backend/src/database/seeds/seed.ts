import { AppDataSource } from '../data-source';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '../../common/enums/role.enum';
import { PropertyType, ListingType, PropertyStatus } from '../../common/enums/property.enum';
import { InquiryStatus } from '../../common/enums/inquiry.enum';
import { AppointmentStatus } from '../../common/enums/appointment.enum';
import { User } from '../../users/entities/user.entity';
import { Property } from '../../properties/entities/property.entity';
import { Inquiry } from '../../inquiries/entities/inquiry.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';

async function runSeed() {
  console.log('--- Connecting to EstateCore Database for Seeding ---');
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const propertyRepo = AppDataSource.getRepository(Property);
  const inquiryRepo = AppDataSource.getRepository(Inquiry);
  const appointmentRepo = AppDataSource.getRepository(Appointment);

  // Check if users already exist
  const existingUsers = await userRepo.count();
  if (existingUsers > 0) {
    console.log('Database already contains records. Skipping seed to prevent duplicate records.');
    await AppDataSource.destroy();
    return;
  }

  console.log('Seeding Users...');
  const defaultPassword = await bcrypt.hash('Password123!', 10);

  // 1. Admin User
  const admin = userRepo.create({
    fullName: 'System Administrator',
    email: 'admin@estatecore.local',
    password: defaultPassword,
    role: UserRole.ADMIN,
    isActive: true,
  });
  await userRepo.save(admin);

  // 2. Agents
  const agent1 = userRepo.create({
    fullName: 'Maria Santos',
    email: 'maria.santos@estatecore.local',
    password: defaultPassword,
    role: UserRole.AGENT,
    isActive: true,
  });
  const agent2 = userRepo.create({
    fullName: 'Carlos Reyes',
    email: 'carlos.reyes@estatecore.local',
    password: defaultPassword,
    role: UserRole.AGENT,
    isActive: true,
  });
  await userRepo.save([agent1, agent2]);

  // 3. Clients
  const client1 = userRepo.create({
    fullName: 'Juan Dela Cruz',
    email: 'juan.delacruz@client.local',
    password: defaultPassword,
    role: UserRole.CLIENT,
    isActive: true,
  });
  const client2 = userRepo.create({
    fullName: 'Elena Roxas',
    email: 'elena.roxas@client.local',
    password: defaultPassword,
    role: UserRole.CLIENT,
    isActive: true,
  });
  await userRepo.save([client1, client2]);

  console.log('Seeding Properties...');
  const propertiesData: Partial<Property>[] = [
    {
      title: 'Modern High-Rise Condominium in BGC',
      description: 'Luxury 2-bedroom condo with panoramic skyline views, premium fixtures, and rooftop amenities.',
      propertyType: PropertyType.CONDOMINIUM,
      listingType: ListingType.SALE,
      price: 18500000.00,
      location: 'Bonifacio Global City, Taguig',
      address: '7th Avenue corner 28th Street, BGC',
      bedrooms: 2,
      bathrooms: 2,
      floorArea: 86.50,
      lotArea: 0.00,
      status: PropertyStatus.AVAILABLE,
      agentId: agent1.id,
    },
    {
      title: 'Spacious 4-Bedroom Suburban Family Home',
      description: 'Well-appointed two-storey home with a landscaped garden, 2-car garage, and private security.',
      propertyType: PropertyType.HOUSE,
      listingType: ListingType.SALE,
      price: 24000000.00,
      location: 'Alabang, Muntinlupa',
      address: '14 Orchid Lane, Hillsborough Village',
      bedrooms: 4,
      bathrooms: 3,
      floorArea: 280.00,
      lotArea: 350.00,
      status: PropertyStatus.AVAILABLE,
      agentId: agent1.id,
    },
    {
      title: 'Prime Commercial Corner Lot for Development',
      description: 'Strategic commercial parcel along major thoroughfare, ideal for retail plaza or office hub.',
      propertyType: PropertyType.COMMERCIAL,
      listingType: ListingType.SALE,
      price: 52000000.00,
      location: 'Quezon City',
      address: 'EDSA corner East Avenue, Diliman',
      bedrooms: 0,
      bathrooms: 0,
      floorArea: 450.00,
      lotArea: 800.00,
      status: PropertyStatus.AVAILABLE,
      agentId: agent2.id,
    },
    {
      title: 'Contemporary 3-Storey Townhouse',
      description: 'Gated community residence with automated garage, modular kitchen, and smart home lighting.',
      propertyType: PropertyType.TOWNHOUSE,
      listingType: ListingType.RENT,
      price: 75000.00,
      location: 'San Juan City',
      address: '88 P. Guevarra Street, Addition Hills',
      bedrooms: 3,
      bathrooms: 3,
      floorArea: 195.00,
      lotArea: 110.00,
      status: PropertyStatus.AVAILABLE,
      agentId: agent2.id,
    },
    {
      title: 'Cozy Studio Apartment in Makati Central Business District',
      description: 'Fully furnished studio unit walking distance from Greenbelt and Ayala Avenue business offices.',
      propertyType: PropertyType.APARTMENT,
      listingType: ListingType.RENT,
      price: 35000.00,
      location: 'Makati City',
      address: 'Legazpi Village, Dela Rosa Street',
      bedrooms: 1,
      bathrooms: 1,
      floorArea: 38.00,
      lotArea: 0.00,
      status: PropertyStatus.AVAILABLE,
      agentId: agent1.id,
    },
    {
      title: 'Scenic Agricultural & Residential Land',
      description: 'Fresh mountain breeze property suitable for leisure farm, vacation villa, or agritourism.',
      propertyType: PropertyType.LAND,
      listingType: ListingType.SALE,
      price: 12500000.00,
      location: 'Tagaytay, Cavite',
      address: 'Barangay Mendez Crossing East',
      bedrooms: 0,
      bathrooms: 0,
      floorArea: 0.00,
      lotArea: 1500.00,
      status: PropertyStatus.AVAILABLE,
      agentId: agent2.id,
    },
  ];

  const savedProperties: Property[] = [];
  for (const item of propertiesData) {
    const prop = propertyRepo.create(item);
    savedProperties.push(await propertyRepo.save(prop));
  }

  console.log('Seeding Inquiries...');
  const inquiry1 = inquiryRepo.create({
    clientId: client1.id,
    propertyId: savedProperties[0].id,
    assignedAgentId: agent1.id,
    subject: 'Request for BGC Condo Viewing & Payment Terms',
    message: 'Hello Maria, I am interested in cash discount options and available bank financing partners.',
    contactNumber: '+63 917 555 0101',
    status: InquiryStatus.QUALIFIED,
  });

  const inquiry2 = inquiryRepo.create({
    clientId: client2.id,
    propertyId: savedProperties[3].id,
    assignedAgentId: agent2.id,
    subject: 'Lease Terms and Parking Allocation',
    message: 'Good day Carlos, does the monthly rent include the condominium association dues and parking?',
    contactNumber: '+63 920 555 0202',
    status: InquiryStatus.PENDING,
  });

  const inquiry3 = inquiryRepo.create({
    clientId: client1.id,
    propertyId: savedProperties[1].id,
    assignedAgentId: agent1.id,
    subject: 'Alabang House Title Status Verification',
    message: 'Inquiring if the property title is clean and ready for immediate transfer upon closing.',
    contactNumber: '+63 917 555 0101',
    status: InquiryStatus.CONTACTED,
  });

  await inquiryRepo.save([inquiry1, inquiry2, inquiry3]);

  console.log('Seeding Appointments...');
  const appt1 = appointmentRepo.create({
    propertyId: savedProperties[0].id,
    clientId: client1.id,
    agentId: agent1.id,
    appointmentDate: '2026-12-05',
    appointmentTime: '10:00',
    status: AppointmentStatus.CONFIRMED,
    notes: 'Client requested physical site visit with building engineer.',
  });

  const appt2 = appointmentRepo.create({
    propertyId: savedProperties[3].id,
    clientId: client2.id,
    agentId: agent2.id,
    appointmentDate: '2026-12-07',
    appointmentTime: '14:30',
    status: AppointmentStatus.PENDING,
    notes: 'Prospective tenant viewing with spouse.',
  });

  await appointmentRepo.save([appt1, appt2]);

  console.log('=== Seed Completed Successfully! ===');
  console.log('Users created:');
  console.log(' - Admin:  admin@estatecore.local / Password123!');
  console.log(' - Agent:  maria.santos@estatecore.local / Password123!');
  console.log(' - Agent:  carlos.reyes@estatecore.local / Password123!');
  console.log(' - Client: juan.delacruz@client.local / Password123!');
  console.log(' - Client: elena.roxas@client.local / Password123!');

  await AppDataSource.destroy();
}

runSeed().catch((err) => {
  console.error('Seed execution error:', err);
  process.exit(1);
});
