CREATE TABLE `admin_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`action` varchar(256) NOT NULL,
	`targetType` varchar(64),
	`targetId` int,
	`details` json,
	`ipAddress` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(128) NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`imageUrl` text,
	`parentId` int,
	`isVisible` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`discountType` enum('percent','fixed_usd') NOT NULL,
	`discountValue` decimal(10,2) NOT NULL,
	`maxUses` int,
	`usedCount` int NOT NULL DEFAULT 0,
	`minOrderUSD` decimal(10,2) DEFAULT '0.00',
	`expiresAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coupons_id` PRIMARY KEY(`id`),
	CONSTRAINT `coupons_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `exchange_rates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromCurrency` varchar(8) NOT NULL,
	`toCurrency` varchar(8) NOT NULL,
	`rate` decimal(18,6) NOT NULL,
	`source` varchar(64) NOT NULL DEFAULT 'manual',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exchange_rates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fulfillment_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`orderItemId` int,
	`providerKey` varchar(64) NOT NULL,
	`supplierOrderId` varchar(256),
	`status` enum('pending','success','failed','partial') NOT NULL,
	`deliveryData` text,
	`rawResponse` json,
	`errorMessage` text,
	`userViewed` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fulfillment_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(64) NOT NULL,
	`title` varchar(256) NOT NULL,
	`message` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`relatedOrderId` int,
	`relatedTicketId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`productTitle` varchar(512) NOT NULL,
	`quantity` int NOT NULL,
	`unitPriceUSD` decimal(18,2) NOT NULL,
	`totalPriceUSD` decimal(18,2) NOT NULL,
	`supplierProductId` varchar(256),
	`providerKey` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`status` enum('pending_payment','paid','processing','fulfilled','partial','failed','cancelled','refunded','disputed') NOT NULL DEFAULT 'pending_payment',
	`subtotalUSD` decimal(18,2) NOT NULL,
	`discountUSD` decimal(18,2) NOT NULL DEFAULT '0.00',
	`totalUSD` decimal(18,2) NOT NULL,
	`currency` enum('NGN','USD','EUR','GBP') NOT NULL DEFAULT 'USD',
	`totalInCurrency` decimal(18,2) NOT NULL,
	`exchangeRateSnapshot` decimal(18,6),
	`couponCode` varchar(64),
	`couponDiscountUSD` decimal(18,2) DEFAULT '0.00',
	`billingEmail` varchar(320),
	`billingCountry` varchar(64),
	`fraudFlag` boolean NOT NULL DEFAULT false,
	`fraudReason` text,
	`isLocked` boolean NOT NULL DEFAULT false,
	`adminNotes` text,
	`supplierOrderId` varchar(256),
	`supplierStatus` varchar(64),
	`fulfillmentRetries` int NOT NULL DEFAULT 0,
	`lastFulfillmentAttempt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `payment_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paymentId` int,
	`orderId` int,
	`gateway` varchar(64) NOT NULL,
	`eventType` varchar(128) NOT NULL,
	`payload` json,
	`isProcessed` boolean NOT NULL DEFAULT false,
	`isDuplicate` boolean NOT NULL DEFAULT false,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payment_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`userId` int NOT NULL,
	`gateway` enum('paystack','monnify','nowpayments','manual') NOT NULL,
	`gatewayReference` varchar(256),
	`gatewayTransactionId` varchar(256),
	`status` enum('pending','success','failed','refunded','disputed') NOT NULL DEFAULT 'pending',
	`amount` decimal(18,2) NOT NULL,
	`currency` enum('NGN','USD','EUR','GBP') NOT NULL,
	`amountUSD` decimal(18,2),
	`exchangeRate` decimal(18,6),
	`paymentMethod` varchar(64),
	`metadata` json,
	`webhookVerified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_gatewayReference_unique` UNIQUE(`gatewayReference`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(256) NOT NULL,
	`supplierProductId` int,
	`providerKey` varchar(64) NOT NULL,
	`categoryId` int,
	`title` varchar(512) NOT NULL,
	`description` text,
	`shortDescription` text,
	`imageUrl` text,
	`tags` json,
	`supplierPrice` decimal(18,8) NOT NULL,
	`supplierCurrency` varchar(16) NOT NULL DEFAULT 'USD',
	`markupPercent` decimal(10,2) NOT NULL DEFAULT '20.00',
	`customerPriceUSD` decimal(18,2) NOT NULL,
	`customerPriceNGN` decimal(18,2),
	`stockQuantity` int NOT NULL DEFAULT 0,
	`stockUnlimited` boolean NOT NULL DEFAULT false,
	`isVisible` boolean NOT NULL DEFAULT true,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`isDigital` boolean NOT NULL DEFAULT true,
	`regionRestrictions` json,
	`allowedPaymentMethods` json,
	`riskFlag` boolean NOT NULL DEFAULT false,
	`requiresAgeVerification` boolean NOT NULL DEFAULT false,
	`deliveryNote` text,
	`refundPolicy` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `provider_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`providerKey` varchar(64) NOT NULL,
	`displayName` varchar(128) NOT NULL,
	`baseUrl` text NOT NULL,
	`apiKey` text,
	`webhookSecret` text,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`syncIntervalMinutes` int NOT NULL DEFAULT 30,
	`lastSyncAt` timestamp,
	`defaultMarkupPercent` decimal(10,2) NOT NULL DEFAULT '20.00',
	`settings` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `provider_configs_id` PRIMARY KEY(`id`),
	CONSTRAINT `provider_configs_providerKey_unique` UNIQUE(`providerKey`)
);
--> statement-breakpoint
CREATE TABLE `provider_sync_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`providerKey` varchar(64) NOT NULL,
	`syncType` enum('categories','products','stock','prices','full') NOT NULL,
	`status` enum('running','success','failed','partial') NOT NULL,
	`itemsSynced` int DEFAULT 0,
	`itemsFailed` int DEFAULT 0,
	`errorMessage` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `provider_sync_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saved_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supplier_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`providerKey` varchar(64) NOT NULL,
	`supplierProductId` varchar(256) NOT NULL,
	`supplierCategoryId` varchar(128),
	`supplierSlug` varchar(256),
	`rawTitle` text,
	`rawDescription` text,
	`rawPrice` decimal(18,8),
	`rawCurrency` varchar(16),
	`rawStock` int DEFAULT 0,
	`rawData` json,
	`lastSyncedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supplier_products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `support_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketNumber` varchar(32) NOT NULL,
	`userId` int NOT NULL,
	`orderId` int,
	`subject` varchar(512) NOT NULL,
	`status` enum('open','pending','resolved','closed') NOT NULL DEFAULT 'open',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`resolvedAt` timestamp,
	CONSTRAINT `support_tickets_id` PRIMARY KEY(`id`),
	CONSTRAINT `support_tickets_ticketNumber_unique` UNIQUE(`ticketNumber`)
);
--> statement-breakpoint
CREATE TABLE `system_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`level` enum('info','warn','error','critical') NOT NULL,
	`category` varchar(64) NOT NULL,
	`message` text NOT NULL,
	`details` json,
	`userId` int,
	`orderId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `system_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticket_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`senderId` int NOT NULL,
	`senderRole` enum('user','admin') NOT NULL,
	`message` text NOT NULL,
	`attachmentUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ticket_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionToken` varchar(256) NOT NULL,
	`ipAddress` varchar(64),
	`userAgent` text,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_sessions_sessionToken_unique` UNIQUE(`sessionToken`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` text;--> statement-breakpoint
ALTER TABLE `users` ADD `country` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `referralCode` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `referredBy` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerifyToken` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordResetToken` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordResetExpiry` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `isSuspended` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `suspendedReason` text;--> statement-breakpoint
ALTER TABLE `users` ADD `twoFactorEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `twoFactorSecret` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `notifyEmail` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `notifyOrders` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `preferredCurrency` enum('NGN','USD','EUR','GBP') DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);