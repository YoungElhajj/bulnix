ALTER TABLE `users` ADD `otpCode` varchar(6);--> statement-breakpoint
ALTER TABLE `users` ADD `otpExpiry` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `otpPurpose` varchar(16);