-- ========================================================================
-- ESTATECORE - REAL ESTATE MANAGEMENT SYSTEM
-- ITEC 116 - Systems Integration and Architecture 2
-- Instructor: John Vincent A. Dallego, MIT
-- Student:    Cabico, Cristina O. (BSIT 4-C)
-- Generated:  2026-11-26T04:46:48.451Z
-- Database:   MySQL 8.4 Engine (InnoDB, UTF-8 / utf8mb4)
-- ========================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;
SET time_zone = '+08:00';

-- Table structure for table `users`
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fullName` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `firstName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `contactNumber` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('ADMIN','AGENT','CLIENT') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CLIENT',
  `isActive` tinyint NOT NULL DEFAULT '1',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_users_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `users` (5 records)
INSERT INTO `users` (`id`, `fullName`, `firstName`, `lastName`, `email`, `contactNumber`, `password`, `role`, `isActive`, `createdAt`, `updatedAt`) VALUES
(1, 'System Administrator', 'System', 'Administrator', 'admin@estatecore.local', NULL, '$2a$10$Z1nEnPKpL6WPRhOmeBTUYuJGz9vjn0qYjR6d3NYufBSHrRp3I6MPK', 'ADMIN', 1, '2026-11-23 22:25:50', '2026-11-25 20:46:35'),
(2, 'Maria Santos', 'Maria', 'Santos', 'maria.santos@estatecore.local', NULL, '$2a$10$Z1nEnPKpL6WPRhOmeBTUYuJGz9vjn0qYjR6d3NYufBSHrRp3I6MPK', 'AGENT', 1, '2026-11-23 22:25:50', '2026-11-25 20:46:35'),
(3, 'Carlos Reyes', 'Carlos', 'Reyes', 'carlos.reyes@estatecore.local', NULL, '$2a$10$Z1nEnPKpL6WPRhOmeBTUYuJGz9vjn0qYjR6d3NYufBSHrRp3I6MPK', 'AGENT', 1, '2026-11-23 22:25:50', '2026-11-25 20:46:35'),
(4, 'Juan Dela Cruz', 'Juan', 'Dela Cruz', 'juan.delacruz@client.local', NULL, '$2a$10$Z1nEnPKpL6WPRhOmeBTUYuJGz9vjn0qYjR6d3NYufBSHrRp3I6MPK', 'CLIENT', 1, '2026-11-23 22:25:50', '2026-11-25 20:46:35'),
(5, 'Elena Roxas', 'Elena', 'Roxas', 'elena.roxas@client.local', NULL, '$2a$10$Z1nEnPKpL6WPRhOmeBTUYuJGz9vjn0qYjR6d3NYufBSHrRp3I6MPK', 'CLIENT', 1, '2026-11-23 22:25:50', '2026-11-25 20:46:35');

-- Table structure for table `agents`
DROP TABLE IF EXISTS `agents`;
CREATE TABLE `agents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `licenseNumber` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `agencyName` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verificationStatus` enum('PENDING_VERIFICATION','VERIFIED','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING_VERIFICATION',
  `specialization` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_agents_userId` (`userId`),
  CONSTRAINT `FK_agents_userId` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `agents` (2 records)
INSERT INTO `agents` (`id`, `userId`, `licenseNumber`, `agencyName`, `verificationStatus`, `specialization`, `createdAt`, `updatedAt`) VALUES
(1, 2, NULL, NULL, 'PENDING_VERIFICATION', NULL, '2026-11-25 20:46:35', '2026-11-25 20:46:35'),
(2, 3, NULL, NULL, 'PENDING_VERIFICATION', NULL, '2026-11-25 20:46:35', '2026-11-25 20:46:35');

-- Table structure for table `properties`
DROP TABLE IF EXISTS `properties`;
CREATE TABLE `properties` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ownerId` int DEFAULT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `propertyType` enum('HOUSE','APARTMENT','CONDOMINIUM','COMMERCIAL','LAND','TOWNHOUSE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `listingType` enum('SALE','RENT') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `location` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `bedrooms` int NOT NULL DEFAULT '1',
  `bathrooms` int NOT NULL DEFAULT '1',
  `floorArea` decimal(10,2) NOT NULL DEFAULT '0.00',
  `lotArea` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` enum('AVAILABLE','RESERVED','SOLD','RENTED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AVAILABLE',
  `agentId` int DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IDX_properties_propertyType` (`propertyType`),
  KEY `IDX_properties_listingType` (`listingType`),
  KEY `IDX_properties_location` (`location`),
  KEY `IDX_properties_status` (`status`),
  KEY `FK_properties_agentId` (`agentId`),
  KEY `FK_properties_ownerId` (`ownerId`),
  CONSTRAINT `FK_properties_agentId` FOREIGN KEY (`agentId`) REFERENCES `agents` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `FK_properties_ownerId` FOREIGN KEY (`ownerId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `properties` (6 records)
INSERT INTO `properties` (`id`, `ownerId`, `title`, `description`, `propertyType`, `listingType`, `price`, `location`, `city`, `address`, `bedrooms`, `bathrooms`, `floorArea`, `lotArea`, `status`, `agentId`, `createdAt`, `updatedAt`) VALUES
(1, NULL, 'Modern High-Rise Condominium in BGC', 'Luxury 2-bedroom condo with panoramic skyline views, premium fixtures, and rooftop amenities.', 'CONDOMINIUM', 'SALE', '18500000.00', 'Bonifacio Global City, Taguig', 'Taguig', '7th Avenue corner 28th Street, BGC', 2, 2, '86.50', '0.00', 'AVAILABLE', 1, '2026-11-23 22:25:50', '2026-11-25 20:46:35'),
(2, NULL, 'Spacious 4-Bedroom Suburban Family Home', 'Well-appointed two-storey home with a landscaped garden, 2-car garage, and private security.', 'HOUSE', 'SALE', '24000000.00', 'Alabang, Muntinlupa', 'Muntinlupa', '14 Orchid Lane, Hillsborough Village', 4, 3, '280.00', '350.00', 'AVAILABLE', 1, '2026-11-23 22:25:51', '2026-11-25 20:46:35'),
(3, NULL, 'Prime Commercial Corner Lot for Development', 'Strategic commercial parcel along major thoroughfare, ideal for retail plaza or office hub.', 'COMMERCIAL', 'SALE', '52000000.00', 'Quezon City', 'Quezon City', 'EDSA corner East Avenue, Diliman', 0, 0, '450.00', '800.00', 'AVAILABLE', 2, '2026-11-23 22:25:51', '2026-11-25 20:46:35'),
(4, NULL, 'Contemporary 3-Storey Townhouse', 'Gated community residence with automated garage, modular kitchen, and smart home lighting.', 'TOWNHOUSE', 'RENT', '75000.00', 'San Juan City', 'San Juan City', '88 P. Guevarra Street, Addition Hills', 3, 3, '195.00', '110.00', 'AVAILABLE', 2, '2026-11-23 22:25:51', '2026-11-25 20:46:35'),
(5, NULL, 'Cozy Studio Apartment in Makati Central Business District', 'Fully furnished studio unit walking distance from Greenbelt and Ayala Avenue business offices.', 'APARTMENT', 'RENT', '35000.00', 'Makati City', 'Makati', 'Legazpi Village, Dela Rosa Street', 1, 1, '38.00', '0.00', 'AVAILABLE', 1, '2026-11-23 22:25:51', '2026-11-25 20:46:35'),
(6, NULL, 'Scenic Agricultural & Residential Land', 'Fresh mountain breeze property suitable for leisure farm, vacation villa, or agritourism.', 'LAND', 'SALE', '12500000.00', 'Tagaytay, Cavite', 'Cavite', 'Barangay Mendez Crossing East', 0, 0, '0.00', '1500.00', 'AVAILABLE', 2, '2026-11-23 22:25:51', '2026-11-25 20:46:35');

-- Table structure for table `property_photos`
DROP TABLE IF EXISTS `property_photos`;
CREATE TABLE `property_photos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `propertyId` int NOT NULL,
  `filePath` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isPrimary` tinyint(1) NOT NULL DEFAULT '0',
  `caption` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IDX_property_photos_propertyId` (`propertyId`),
  CONSTRAINT `FK_property_photos_propertyId` FOREIGN KEY (`propertyId`) REFERENCES `properties` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping baseline seed photos for properties 1-6
INSERT INTO `property_photos` (`propertyId`, `filePath`, `isPrimary`, `caption`, `createdAt`) VALUES
(1, '/uploads/properties/bgc-penthouse-main.jpg', 1, 'Modern luxury condominium living room', NOW()),
(2, '/uploads/properties/suburban-home-facade.jpg', 1, 'Suburban family home front elevation', NOW()),
(3, '/uploads/properties/commercial-lot-aerial.jpg', 1, 'Prime commercial corner lot overview', NOW()),
(4, '/uploads/properties/townhouse-exterior.jpg', 1, 'Contemporary multi-storey townhouse facade', NOW()),
(5, '/uploads/properties/makati-studio-interior.jpg', 1, 'Furnished studio unit with balcony view', NOW()),
(6, '/uploads/properties/tagaytay-land-vista.jpg', 1, 'Scenic rolling agricultural land vista', NOW());

-- Table structure for table `inquiries`
DROP TABLE IF EXISTS `inquiries`;
CREATE TABLE `inquiries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clientId` int NOT NULL,
  `propertyId` int NOT NULL,
  `inquiryType` enum('GENERAL','VIEWING','FINANCING','OFFER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'GENERAL',
  `assignedAgentId` int DEFAULT NULL,
  `subject` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `offerAmount` decimal(12,2) DEFAULT NULL,
  `contactNumber` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('PENDING','CONTACTED','QUALIFIED','CLOSED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `legacyStatus` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IDX_inquiries_status` (`status`),
  KEY `FK_inquiries_clientId` (`clientId`),
  KEY `FK_inquiries_propertyId` (`propertyId`),
  KEY `FK_inquiries_assignedAgentId` (`assignedAgentId`),
  CONSTRAINT `FK_inquiries_assignedAgentId` FOREIGN KEY (`assignedAgentId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `FK_inquiries_clientId` FOREIGN KEY (`clientId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `FK_inquiries_propertyId` FOREIGN KEY (`propertyId`) REFERENCES `properties` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `inquiries` (7 records)
INSERT INTO `inquiries` (`id`, `clientId`, `propertyId`, `inquiryType`, `assignedAgentId`, `subject`, `message`, `offerAmount`, `contactNumber`, `status`, `legacyStatus`, `createdAt`, `updatedAt`) VALUES
(1, 4, 1, 'GENERAL', 2, 'Request for BGC Condo Viewing & Payment Terms', 'Hello Maria, I am interested in cash discount options and available bank financing partners.', NULL, '+63 917 555 0101', 'QUALIFIED', 'QUALIFIED', '2026-11-23 22:25:51', '2026-11-25 20:46:35'),
(6, 4, 1, 'GENERAL', 2, 'Client Juan Private Inquiry', 'Confidential financing questions.', NULL, '+63 917 111 2222', 'PENDING', 'PENDING', '2026-11-23 23:22:30', '2026-11-25 20:46:35'),
(7, 4, 1, 'GENERAL', 2, 'Client Juan Private Inquiry', 'Confidential financing questions.', NULL, '+63 917 111 2222', 'PENDING', 'PENDING', '2026-11-23 23:22:52', '2026-11-25 20:46:35'),
(9, 4, 1, 'GENERAL', 2, 'Phase 1 Contract Verification Inquiry', 'Verifying nested POST /api/v1/properties/:id/inquiries route compliance.', NULL, '+63 917 555 0199', 'PENDING', 'PENDING', '2026-11-24 02:50:55', '2026-11-25 20:46:35'),
(3, 4, 2, 'GENERAL', 2, 'Alabang House Title Status Verification', 'Inquiring if the property title is clean and ready for immediate transfer upon closing.', NULL, '+63 917 555 0101', 'CONTACTED', 'CONTACTED', '2026-11-23 22:25:51', '2026-11-25 20:46:35'),
(2, 5, 4, 'GENERAL', 3, 'Lease Terms and Parking Allocation', 'Good day Carlos, does the monthly rent include the condominium association dues and parking?', NULL, '+63 920 555 0202', 'PENDING', 'PENDING', '2026-11-23 22:25:51', '2026-11-25 20:46:35'),
(8, 4, 5, 'GENERAL', 2, 'Inquiry regarding Cozy Studio Apartment in Makati Central Business District', 'assd', NULL, '96262626', 'CLOSED', 'CLOSED', '2026-11-24 02:07:20', '2026-11-25 20:46:35');

-- Table structure for table `appointments`
DROP TABLE IF EXISTS `appointments`;
CREATE TABLE `appointments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `propertyId` int NOT NULL,
  `clientId` int NOT NULL,
  `agentId` int NOT NULL,
  `appointmentDate` date NOT NULL,
  `appointmentTime` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('PENDING','CONFIRMED','COMPLETED','CANCELLED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IDX_appointments_date` (`appointmentDate`),
  KEY `IDX_appointments_status` (`status`),
  KEY `FK_appointments_propertyId` (`propertyId`),
  KEY `FK_appointments_clientId` (`clientId`),
  KEY `FK_appointments_agentId` (`agentId`),
  CONSTRAINT `FK_appointments_agentId` FOREIGN KEY (`agentId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_appointments_clientId` FOREIGN KEY (`clientId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_appointments_propertyId` FOREIGN KEY (`propertyId`) REFERENCES `properties` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `appointments` (4 records)
INSERT INTO `appointments` (`id`, `propertyId`, `clientId`, `agentId`, `appointmentDate`, `appointmentTime`, `status`, `notes`, `createdAt`, `updatedAt`) VALUES
(1, 1, 4, 2, '2026-12-04 16:00:00', '10:00', 'CONFIRMED', 'Client requested physical site visit with building engineer.', '2026-11-23 22:25:51', '2026-11-23 22:25:51'),
(5, 1, 4, 2, '2026-11-26 16:00:00', '14:00', 'CANCELLED', 'Tour with architect.', '2026-11-23 23:22:30', '2026-11-23 23:22:30'),
(6, 1, 4, 2, '2026-11-26 16:00:00', '14:00', 'CANCELLED', 'Tour with architect.', '2026-11-23 23:22:52', '2026-11-23 23:22:52'),
(2, 4, 5, 3, '2026-12-06 16:00:00', '14:30', 'PENDING', 'Prospective tenant viewing with spouse.', '2026-11-23 22:25:51', '2026-11-23 22:25:51');

-- Table structure for table `property_transactions`
DROP TABLE IF EXISTS `property_transactions`;
CREATE TABLE `property_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `propertyId` int NOT NULL,
  `buyerId` int NOT NULL,
  `agentId` int NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `transactionType` enum('SALE','RENT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `paymentMethod` enum('CASH','BANK_TRANSFER','CHECK','FINANCING') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BANK_TRANSFER',
  `status` enum('PENDING','COMPLETED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `transactionDate` date NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IDX_transactions_propertyId` (`propertyId`),
  KEY `IDX_transactions_buyerId` (`buyerId`),
  KEY `IDX_transactions_agentId` (`agentId`),
  KEY `IDX_transactions_status` (`status`),
  KEY `IDX_transactions_date` (`transactionDate`),
  CONSTRAINT `FK_transactions_agentId` FOREIGN KEY (`agentId`) REFERENCES `agents` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `FK_transactions_buyerId` FOREIGN KEY (`buyerId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `FK_transactions_propertyId` FOREIGN KEY (`propertyId`) REFERENCES `properties` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ========================================================================
-- End of SQL Export: EstateCore Final Project Database
-- ========================================================================
