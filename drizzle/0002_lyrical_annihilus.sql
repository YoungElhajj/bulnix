CREATE TABLE `wallet_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('deposit','spend','refund','adjustment') NOT NULL,
	`amountUSD` decimal(18,6) NOT NULL,
	`balanceAfterUSD` decimal(18,6) NOT NULL,
	`description` varchar(512) NOT NULL,
	`reference` varchar(256),
	`orderId` int,
	`paymentId` int,
	`status` enum('pending','completed','failed','reversed') NOT NULL DEFAULT 'completed',
	`gateway` varchar(64),
	`gatewayRef` varchar(256),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wallet_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`balanceUSD` decimal(18,6) NOT NULL DEFAULT '0.000000',
	`totalDeposited` decimal(18,6) NOT NULL DEFAULT '0.000000',
	`totalSpent` decimal(18,6) NOT NULL DEFAULT '0.000000',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wallets_id` PRIMARY KEY(`id`),
	CONSTRAINT `wallets_userId_unique` UNIQUE(`userId`)
);
