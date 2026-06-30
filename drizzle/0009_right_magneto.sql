CREATE TABLE `affiliate_balances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`balanceUSD` decimal(18,6) NOT NULL DEFAULT '0.000000',
	`totalEarned` decimal(18,6) NOT NULL DEFAULT '0.000000',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `affiliate_balances_id` PRIMARY KEY(`id`),
	CONSTRAINT `affiliate_balances_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `affiliate_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('signup_bonus','withdrawal') NOT NULL,
	`amountUSD` decimal(18,6) NOT NULL,
	`description` varchar(256) NOT NULL,
	`referredUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliate_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `affiliate_withdrawals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amountUSD` decimal(18,6) NOT NULL,
	`bankName` varchar(128) NOT NULL,
	`accountNumber` varchar(64) NOT NULL,
	`accountName` varchar(128) NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`adminNote` text,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `affiliate_withdrawals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`keyHash` varchar(256) NOT NULL,
	`keyPrefix` varchar(16) NOT NULL,
	`label` varchar(128) NOT NULL DEFAULT 'Default',
	`isEnabled` boolean NOT NULL DEFAULT true,
	`adminEnabled` boolean NOT NULL DEFAULT true,
	`lastUsedAt` timestamp,
	`requestCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_keys_keyHash_unique` UNIQUE(`keyHash`)
);
--> statement-breakpoint
CREATE TABLE `product_credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`data` text NOT NULL,
	`isUsed` boolean NOT NULL DEFAULT false,
	`usedByOrderId` int,
	`usedByUserId` int,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_credentials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reward_points` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`points` int NOT NULL DEFAULT 0,
	`lifetimeEarned` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reward_points_id` PRIMARY KEY(`id`),
	CONSTRAINT `reward_points_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `reward_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tier` varchar(32) NOT NULL,
	`cashbackPercent` decimal(5,2) NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reward_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `reward_settings_tier_unique` UNIQUE(`tier`)
);
--> statement-breakpoint
CREATE TABLE `reward_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('earn','redeem') NOT NULL,
	`points` int NOT NULL,
	`description` varchar(256) NOT NULL,
	`orderId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reward_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `products` ADD `isManual` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `isSubscription` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `signupCountry` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `signupIp` varchar(64);