-- Bulnix essential data export
-- Generated: 2026-04-26T03:11:55.158Z

SET FOREIGN_KEY_CHECKS=0;

-- Table: users (14 rows)
INSERT INTO `users` (`id`, `openId`, `name`, `email`, `loginMethod`, `role`, `createdAt`, `updatedAt`, `lastSignedIn`, `username`, `passwordHash`, `country`, `signupCountry`, `signupIp`, `referralCode`, `referredBy`, `emailVerified`, `emailVerifyToken`, `passwordResetToken`, `passwordResetExpiry`, `isSuspended`, `suspendedReason`, `twoFactorEnabled`, `twoFactorSecret`, `notifyEmail`, `notifyOrders`, `preferredCurrency`, `otpCode`, `otpExpiry`, `otpPurpose`, `otpExpiry`, `lastLoginIp`) VALUES
  (1, '4ckdc6Mzg3vbSx8KUQSufS', 'ethanmitchell3077', 'ethanmitchell3077@gmail.com', 'email', 'admin', '2026-03-20 07:51:04', '2026-04-26 00:07:01', '2026-04-26 00:07:02', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, 1, NULL, 0, NULL, 1, 1, 'USD', NULL, NULL, NULL, NULL, NULL),
  (138, 'gAiZ8n3oaqdC6Ee23WHwdW', 'Young ', 'youngelhajj48@gmail.com', 'email', 'user', '2026-03-20 08:48:16', '2026-04-19 16:09:28', '2026-04-19 16:09:28', NULL, '$2b$12$C2iTD3z02rThBtbR5cq47.sV.UA69xzG4o82BYP3uF0SIV5hCrSs.', '', NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, 0, NULL, 0, NULL, 1, 1, 'NGN', NULL, NULL, NULL, NULL, NULL),
  (360108, 'WFwgBPXoyF4u3XByg2n4KQ', 'abike', 'abikechram@gmail.com', 'email', 'user', '2026-03-23 15:23:18', '2026-04-23 05:53:01', '2026-04-23 05:53:02', NULL, '$2b$12$YkvX.uNQiariRmP.cKdZyOLk.8Ng6pvo//cSf/zrIP1dprZ.dGwlO', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, 0, NULL, 0, NULL, 1, 1, 'USD', NULL, NULL, NULL, NULL, NULL),
  (360125, 'cgFqD7DKMUZ5xG687y75zh', 'asp781066', 'asp781066@gmail.com', 'email', 'user', '2026-03-23 15:37:20', '2026-04-23 01:47:19', '2026-04-23 01:47:19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, NULL, 0, NULL, 1, 1, 'USD', NULL, NULL, NULL, NULL, NULL),
  (510006, 'VJ2ojxYfeRTWyEEx48f63o', 'peakmotion012', 'peakmotion012@gmail.com', 'email', 'user', '2026-03-26 03:00:47', '2026-04-15 19:05:34', '2026-04-15 19:05:35', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, NULL, 0, NULL, 1, 1, 'USD', NULL, NULL, NULL, NULL, NULL),
  (630022, 'admin_1776577099684', 'Qazeem Ayobami', 'qazeemayobami@gmail.com', NULL, 'admin', '2026-04-19 09:38:19', '2026-04-26 07:11:53', '2026-04-26 07:11:54', NULL, '$2b$12$VKMTVWb9mN88ZfHuQWfDfOmAqriQybF7yAZryCnoby/E7pZ1Zgoo2', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, 0, NULL, 1, '5PMRCSCVUWC5JVLYQDAULAVCOAZDCNRK', 1, 1, 'USD', NULL, NULL, NULL, NULL, NULL),
  (630089, 'custom_1776579281756_6s9l0zja', 'skilledadeniyi', 'skilledadeniyi@gmail.com', 'email', 'user', '2026-04-19 10:14:41', '2026-04-19 16:00:12', '2026-04-19 16:00:12', NULL, '$2b$12$6uwRuHFcp4HypXDH61Ql0undK1GPM5peXsl4bYY.HsV0AMBmmQYy2', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, 0, NULL, 0, NULL, 1, 1, 'USD', NULL, NULL, NULL, NULL, NULL),
  (690313, 'custom_1776616976862_jng5o3g4', 'Musty', 'mujaheedayobami@gmail.com', 'email', 'user', '2026-04-19 20:42:56', '2026-04-23 22:23:14', '2026-04-23 22:23:14', NULL, '$2b$12$T/alYHEwBUGcLZQEcuFCG.mOx77l6g7NlugRmjlxvkDywjqrE7Wvy', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, 0, NULL, 0, NULL, 1, 1, 'USD', NULL, NULL, NULL, NULL, NULL),
  (690376, 'custom_1776617823064_q6a9aonn', 'Maximum Cody', 'maximummcody@gmail.com', 'email', 'user', '2026-04-19 20:57:03', '2026-04-23 23:44:36', '2026-04-23 23:44:37', NULL, '$2b$12$sr6TLqCpHM4MYRkBGq3VtOYyd8.ChSmM4.kNQmOdGVpakCGLQJpwS', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, 0, NULL, 0, NULL, 1, 1, 'USD', NULL, NULL, NULL, NULL, NULL),
  (690412, 'custom_1776618173917_y1ej6wbi', 'Abdulsalam', 'salamabc04@gmail.com', 'email', 'user', '2026-04-19 21:02:53', '2026-04-19 22:35:14', '2026-04-19 22:35:15', NULL, '$2b$12$Q3iININ5twhf921bpW94tubpoCZX1ykhSWl2bYGkhDnUD30do8Vt.', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, 0, NULL, 0, NULL, 1, 1, 'USD', NULL, NULL, NULL, NULL, NULL),
  (900957, 'google:116801125995996398417', 'Abikechram', 'abikechram@gmail.com', 'google', 'user', '2026-04-23 01:45:31', '2026-04-23 05:53:22', '2026-04-23 05:53:22', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, NULL, 0, NULL, 1, 1, 'USD', NULL, NULL, NULL, NULL, NULL),
  (900982, 'google:101586046471016985962', 'Amelia Sophia 723', 'asp781066@gmail.com', 'google', 'user', '2026-04-23 01:47:31', '2026-04-23 01:47:32', '2026-04-23 01:47:33', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, NULL, 0, NULL, 1, 1, 'USD', NULL, NULL, NULL, NULL, NULL),
  (900985, 'google:108553895550313919492', 'Patrick frank', 'patrickfrankk081@gmail.com', 'google', 'user', '2026-04-23 01:48:17', '2026-04-23 01:48:39', '2026-04-23 01:48:40', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, NULL, 0, NULL, 1, 1, 'USD', NULL, NULL, NULL, NULL, NULL),
  (902508, 'google:105010527862416937085', 'Apex Team', 'apexteam2010@gmail.com', 'google', 'user', '2026-04-23 09:36:04', '2026-04-23 09:36:08', '2026-04-23 09:36:08', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, 0, NULL, 0, NULL, 1, 1, 'USD', NULL, NULL, NULL, NULL, NULL);

-- Table: wallets (14 rows)
INSERT INTO `wallets` (`id`, `userId`, `balanceUSD`, `totalDeposited`, `totalSpent`, `createdAt`, `updatedAt`) VALUES
  (1, 1, '56.500000', '100.000000', '52.500000', '2026-03-23 08:03:59', '2026-03-23 08:41:40'),
  (30001, 138, '0.000000', '0.000000', '0.000000', '2026-03-23 21:19:17', '2026-03-23 21:19:17'),
  (60001, 510006, '0.000000', '0.000000', '0.000000', '2026-04-15 19:05:31', '2026-04-15 19:05:31'),
  (90001, 630022, '18.680000', '21.000000', '3.140000', '2026-04-19 09:42:50', '2026-04-23 06:11:30'),
  (90002, 630089, '0.000000', '0.000000', '0.000000', '2026-04-19 10:15:04', '2026-04-19 10:15:04'),
  (120001, 690313, '0.000000', '0.000000', '0.960000', '2026-04-19 20:43:33', '2026-04-19 21:05:30'),
  (120002, 690376, '3.010000', '6.000000', '2.990000', '2026-04-19 20:57:11', '2026-04-22 23:30:40'),
  (120003, 690412, '0.000000', '0.000000', '0.000000', '2026-04-19 21:03:13', '2026-04-19 21:03:13'),
  (150001, 360108, '0.000000', '0.000000', '0.000000', '2026-04-23 00:43:56', '2026-04-23 00:43:56'),
  (150002, 360125, '0.000000', '0.000000', '0.000000', '2026-04-23 00:44:34', '2026-04-23 00:44:34'),
  (150003, 900957, '0.000000', '0.000000', '0.000000', '2026-04-23 01:45:33', '2026-04-23 01:45:33'),
  (150004, 900982, '0.000000', '0.000000', '0.000000', '2026-04-23 01:47:32', '2026-04-23 01:47:32'),
  (150005, 900985, '0.000000', '0.000000', '0.000000', '2026-04-23 01:48:18', '2026-04-23 01:48:18'),
  (150006, 902508, '0.000000', '0.000000', '0.000000', '2026-04-23 09:36:08', '2026-04-23 09:36:08');

-- Table: wallet_transactions (61 rows)
INSERT INTO `wallet_transactions` (`id`, `userId`, `type`, `amountUSD`, `balanceAfterUSD`, `description`, `reference`, `orderId`, `paymentId`, `status`, `gateway`, `gatewayRef`, `createdAt`) VALUES
  (1, 1, 'deposit', '50.000000', '50.000000', 'Wallet top-up via Paystack', 'PAY_REF_001', NULL, NULL, 'completed', 'paystack', NULL, '2026-03-13 08:36:33'),
  (2, 1, 'deposit', '50.000000', '100.000000', 'Wallet top-up via Paystack', 'PAY_REF_002', NULL, NULL, 'completed', 'paystack', NULL, '2026-03-16 08:36:33'),
  (3, 1, 'spend', '12.990000', '87.010000', 'Order BLX-2026-0001 payment', 'ORD_001', NULL, NULL, 'completed', 'wallet', NULL, '2026-03-18 08:36:33'),
  (4, 1, 'spend', '22.500000', '64.510000', 'Order BLX-2026-0002 payment', 'ORD_002', NULL, NULL, 'completed', 'wallet', NULL, '2026-03-20 08:36:33'),
  (5, 1, 'refund', '8.990000', '73.500000', 'Refund for Order BLX-2026-0003', 'REF_001', NULL, NULL, 'completed', 'wallet', NULL, '2026-03-21 08:36:33'),
  (6, 1, 'spend', '8.990000', '64.510000', 'Order BLX-2026-0003 payment', 'ORD_003', NULL, NULL, 'completed', 'wallet', NULL, '2026-03-22 08:36:33'),
  (7, 1, 'deposit', '50.000000', '50.000000', 'Wallet top-up via Paystack', 'PAY_REF_001', NULL, NULL, 'completed', 'paystack', NULL, '2026-03-13 08:36:51'),
  (8, 1, 'deposit', '50.000000', '100.000000', 'Wallet top-up via Paystack', 'PAY_REF_002', NULL, NULL, 'completed', 'paystack', NULL, '2026-03-16 08:36:51'),
  (9, 1, 'spend', '12.990000', '87.010000', 'Order BLX-2026-0001 payment', 'ORD_001', NULL, NULL, 'completed', 'wallet', NULL, '2026-03-18 08:36:51'),
  (10, 1, 'spend', '22.500000', '64.510000', 'Order BLX-2026-0002 payment', 'ORD_002', NULL, NULL, 'completed', 'wallet', NULL, '2026-03-20 08:36:51'),
  (11, 1, 'refund', '8.990000', '73.500000', 'Refund for Order BLX-2026-0003', 'REF_001', NULL, NULL, 'completed', 'wallet', NULL, '2026-03-21 08:36:51'),
  (12, 1, 'spend', '8.990000', '64.510000', 'Order BLX-2026-0003 payment', 'ORD_003', NULL, NULL, 'completed', 'wallet', NULL, '2026-03-22 08:36:51'),
  (13, 1, 'refund', '9.000000', '56.500000', 'Refund: thanks', 'REFUND-60001-1774240900083', 60001, NULL, 'completed', NULL, NULL, '2026-03-23 08:41:40'),
  (14, 1, 'deposit', '5.000000', '0.000000', 'Wallet top-up via paystack', 'TOPUP-1-1774241208776', NULL, NULL, 'pending', 'paystack', NULL, '2026-03-23 08:46:48'),
  (15, 1, 'deposit', '5.000000', '0.000000', 'Wallet top-up via nowpayments', 'TOPUP-1-1774241212660', NULL, NULL, 'pending', 'nowpayments', NULL, '2026-03-23 08:46:52'),
  (30001, 630022, 'deposit', '3.000000', '0.000000', 'Wallet top-up via flutterwave', 'TOPUP-630022-1776603077536', NULL, NULL, 'pending', 'flutterwave', NULL, '2026-04-19 16:51:17'),
  (30002, 630022, 'deposit', '5.000000', '0.000000', 'Wallet top-up via nowpayments', 'TOPUP-630022-1776603113435', NULL, NULL, 'pending', 'nowpayments', NULL, '2026-04-19 16:51:53'),
  (30003, 630022, 'deposit', '3.000000', '0.000000', 'Wallet top-up via flutterwave', 'TOPUP-630022-1776603424828', NULL, NULL, 'pending', 'flutterwave', NULL, '2026-04-19 16:57:05'),
  (30004, 630022, 'deposit', '5.000000', '0.000000', 'Wallet top-up via paystack', 'TOPUP-630022-1776607879277', NULL, NULL, 'pending', 'paystack', NULL, '2026-04-19 18:11:19'),
  (30005, 630022, 'deposit', '3.000000', '3.000000', 'Wallet top-up via paystack', 'TOPUP-630022-1776608907037', NULL, NULL, 'completed', 'paystack', NULL, '2026-04-19 18:28:27'),
  (60001, 630022, 'spend', '0.110000', '2.890000', 'Payment for order #BLX-1776613074995-KXTCEX', 'WALLET-ORDER-150001-1776613075405', 150001, NULL, 'completed', 'wallet', NULL, '2026-04-19 19:37:55'),
  (60002, 630022, 'spend', '0.600000', '2.290000', 'Payment for order #BLX-1776613252179-6ILKA6', 'WALLET-ORDER-150002-1776613252642', 150002, NULL, 'completed', 'wallet', NULL, '2026-04-19 19:40:52'),
  (60003, 630022, 'refund', '0.110000', '2.400000', 'Refund for order #BLX-1776613074995-KXTCEX: refund', 'REFUND-150001-1776615307577', 150001, NULL, 'completed', NULL, NULL, '2026-04-19 20:15:07'),
  (60004, 630022, 'refund', '0.110000', '2.510000', 'Refund for order #BLX-1776609618199-B-FFE4: refund', 'REFUND-120002-1776615314532', 120002, NULL, 'completed', NULL, NULL, '2026-04-19 20:15:14'),
  (60005, 630022, 'refund', '0.600000', '3.110000', 'Refund for order #BLX-1776613252179-6ILKA6: refund', 'REFUND-150002-1776615323990', 150002, NULL, 'completed', NULL, NULL, '2026-04-19 20:15:24'),
  (60006, 630022, 'spend', '0.110000', '3.000000', 'Payment for order #BLX-1776615863455-HUBFPT', 'WALLET-ORDER-150003-1776615863939', 150003, NULL, 'completed', 'wallet', NULL, '2026-04-19 20:24:23'),
  (60007, 690376, 'deposit', '3.000000', '0.000000', 'Wallet top-up via paystack', 'TOPUP-690376-1776617862709', NULL, NULL, 'pending', 'paystack', NULL, '2026-04-19 20:57:43'),
  (60008, 690376, 'deposit', '3.000000', '3.000000', 'Wallet top-up via paystack', 'TOPUP-690376-1776618087589', NULL, NULL, 'completed', 'paystack', NULL, '2026-04-19 21:01:28'),
  (60009, 690313, 'refund', '0.960000', '0.960000', 'Refund for order #BLX-1776618005395-3ZWYDN: refund', 'REFUND-150013-1776618225714', 150013, NULL, 'completed', NULL, NULL, '2026-04-19 21:03:45'),
  (60010, 690313, 'spend', '0.960000', '0.000000', 'Payment for order #BLX-1776618329870-9GGSCQ', 'WALLET-ORDER-150015-1776618330503', 150015, NULL, 'completed', 'wallet', NULL, '2026-04-19 21:05:30'),
  (60011, 690376, 'spend', '2.990000', '0.010000', 'Payment for order #BLX-1776618399146-TNCOSW', 'WALLET-ORDER-150016-1776618399924', 150016, NULL, 'completed', 'wallet', NULL, '2026-04-19 21:06:39'),
  (90001, 630022, 'deposit', '5.000000', '0.000000', 'Wallet top-up via flutterwave', 'TOPUP-630022-1776880332954', NULL, NULL, 'pending', 'flutterwave', NULL, '2026-04-22 21:52:13'),
  (90002, 630022, 'deposit', '20.000000', '0.000000', 'Wallet top-up via nowpayments', 'TOPUP-630022-1776880391324', NULL, NULL, 'pending', 'nowpayments', NULL, '2026-04-22 21:53:11'),
  (90003, 630022, 'deposit', '5.000000', '0.000000', 'Wallet top-up via korapay', 'TOPUP-630022-1776885638598', NULL, NULL, 'pending', 'korapay', NULL, '2026-04-22 23:20:38'),
  (90004, 630022, 'deposit', '3.000000', '6.000000', 'Wallet top-up via korapay', 'TOPUP-630022-1776885769118', NULL, NULL, 'completed', 'korapay', NULL, '2026-04-22 23:22:49'),
  (90005, 690376, 'deposit', '3.000000', '3.010000', 'Wallet top-up via korapay', 'TOPUP-690376-1776886083144', NULL, NULL, 'completed', 'korapay', NULL, '2026-04-22 23:28:03'),
  (90006, 690376, 'deposit', '3.000000', '0.000000', 'Wallet top-up via flutterwave', 'TOPUP-690376-1776886401359', NULL, NULL, 'pending', 'flutterwave', NULL, '2026-04-22 23:33:21'),
  (90007, 630022, 'deposit', '10.000000', '0.000000', 'Wallet top-up via korapay', 'TOPUP-630022-1776886887883', NULL, NULL, 'pending', 'korapay', NULL, '2026-04-22 23:41:28'),
  (90008, 630022, 'deposit', '10.000000', '0.000000', 'Wallet top-up via korapay', 'TOPUP-630022-1776886918044', NULL, NULL, 'pending', 'korapay', NULL, '2026-04-22 23:41:58'),
  (90009, 630022, 'deposit', '10.000000', '0.000000', 'Wallet top-up via korapay', 'TOPUP-630022-1776886941509', NULL, NULL, 'pending', 'korapay', NULL, '2026-04-22 23:42:21'),
  (90010, 690376, 'deposit', '3.000000', '0.000000', 'Wallet top-up via flutterwave', 'TOPUP-690376-1776887009594', NULL, NULL, 'pending', 'flutterwave', NULL, '2026-04-22 23:43:29'),
  (90011, 630022, 'deposit', '3.000000', '0.000000', 'Wallet top-up via flutterwave', 'TOPUP-630022-1776887204507', NULL, NULL, 'pending', 'flutterwave', NULL, '2026-04-22 23:46:44'),
  (90012, 690376, 'deposit', '3.000000', '0.000000', 'Wallet top-up via flutterwave', 'TOPUP-690376-1776887282322', NULL, NULL, 'pending', 'flutterwave', NULL, '2026-04-22 23:48:02'),
  (90013, 630022, 'deposit', '3.000000', '0.000000', 'Wallet top-up via flutterwave', 'TOPUP-630022-1776887312890', NULL, NULL, 'pending', 'flutterwave', NULL, '2026-04-22 23:48:33'),
  (90014, 630022, 'deposit', '3.000000', '0.000000', 'Wallet top-up via korapay', 'TOPUP-630022-1776888253746', NULL, NULL, 'pending', 'korapay', NULL, '2026-04-23 00:04:14'),
  (90015, 630022, 'deposit', '10.000000', '0.000000', 'Wallet top-up via korapay', 'TOPUP-630022-1776888425180', NULL, NULL, 'pending', 'korapay', NULL, '2026-04-23 00:07:05'),
  (90016, 630022, 'deposit', '5.000000', '0.000000', 'Wallet top-up via flutterwave', 'TOPUP-630022-1776891489092', NULL, NULL, 'pending', 'flutterwave', NULL, '2026-04-23 00:58:12'),
  (90017, 630022, 'deposit', '10.000000', '0.000000', 'Wallet top-up via flutterwave', 'TOPUP-630022-1776891540775', NULL, NULL, 'pending', 'flutterwave', NULL, '2026-04-23 00:59:00'),
  (90018, 630022, 'deposit', '3.000000', '9.000000', 'Wallet top-up via flutterwave', 'TOPUP-630022-1776891554097', NULL, NULL, 'completed', 'flutterwave', NULL, '2026-04-23 00:59:14'),
  (90019, 630022, 'deposit', '10.000000', '0.000000', 'Wallet top-up via nowpayments', 'TOPUP-630022-1776894666720', NULL, NULL, 'pending', 'nowpayments', NULL, '2026-04-23 01:51:06');
INSERT INTO `wallet_transactions` (`id`, `userId`, `type`, `amountUSD`, `balanceAfterUSD`, `description`, `reference`, `orderId`, `paymentId`, `status`, `gateway`, `gatewayRef`, `createdAt`) VALUES
  (90020, 630022, 'deposit', '20.000000', '0.000000', 'Wallet top-up via nowpayments', 'TOPUP-630022-1776895065221', NULL, NULL, 'pending', 'nowpayments', NULL, '2026-04-23 01:57:45'),
  (90021, 630022, 'deposit', '15.000000', '0.000000', 'Wallet top-up via nowpayments', 'TOPUP-630022-1776895191442', NULL, NULL, 'pending', 'nowpayments', NULL, '2026-04-23 01:59:51'),
  (90022, 630022, 'deposit', '12.000000', '0.000000', 'Wallet top-up via nowpayments', 'TOPUP-630022-1776895205684', NULL, NULL, 'pending', 'nowpayments', NULL, '2026-04-23 02:00:05'),
  (90023, 630022, 'deposit', '10.980000', '0.000000', 'Wallet top-up via nowpayments', 'TOPUP-630022-1776895219267', NULL, NULL, 'pending', 'nowpayments', NULL, '2026-04-23 02:00:19'),
  (90024, 900957, 'deposit', '3.000000', '0.000000', 'Wallet top-up via flutterwave', 'TOPUP-900957-1776897085798', NULL, NULL, 'pending', 'flutterwave', NULL, '2026-04-23 02:31:26'),
  (90025, 630022, 'spend', '0.110000', '8.890000', 'Payment for order #BLX-1776899105819--NJZTN', 'WALLET-ORDER-180001-1776899106504', 180001, NULL, 'completed', 'wallet', NULL, '2026-04-23 03:05:06'),
  (90026, 630022, 'spend', '0.110000', '8.780000', 'Payment for order #BLX-1776901393665-MPNRN_', 'WALLET-ORDER-180002-1776901394122', 180002, NULL, 'completed', 'wallet', NULL, '2026-04-23 03:43:14'),
  (90027, 630022, 'spend', '0.600000', '8.180000', 'Payment for order #BLX-1776901424603-GGDN9Q', 'WALLET-ORDER-180003-1776901425147', 180003, NULL, 'completed', 'wallet', NULL, '2026-04-23 03:43:45'),
  (90028, 630022, 'spend', '1.500000', '6.680000', 'Payment for order #BLX-1776909810394-CTFSRX', 'WALLET-ORDER-180004-1776909810746', 180004, NULL, 'completed', 'wallet', NULL, '2026-04-23 06:03:30'),
  (90029, 630022, 'deposit', '12.000000', '18.680000', 'Wallet top-up via nowpayments', 'TOPUP-630022-1776910120760', NULL, NULL, 'completed', 'nowpayments', NULL, '2026-04-23 06:08:40'),
  (90030, 630022, 'deposit', '5.000000', '0.000000', 'Wallet top-up via korapay', 'TOPUP-630022-1776913550797', NULL, NULL, 'pending', 'korapay', NULL, '2026-04-23 07:05:51');

-- Table: orders (32 rows)
INSERT INTO `orders` (`id`, `orderNumber`, `userId`, `status`, `subtotalUSD`, `discountUSD`, `totalUSD`, `currency`, `totalInCurrency`, `exchangeRateSnapshot`, `couponCode`, `couponDiscountUSD`, `billingEmail`, `billingCountry`, `fraudFlag`, `fraudReason`, `isLocked`, `adminNotes`, `supplierOrderId`, `supplierStatus`, `fulfillmentRetries`, `lastFulfillmentAttempt`, `createdAt`, `updatedAt`) VALUES
  (1, 'BLX-1773981388453-4QUDUJ', 1, 'pending_payment', '6.78', '0.00', '6.78', 'USD', '6.78', '1.000000', NULL, '0.00', 'ethanmitchell3077@gmail.com', NULL, 0, NULL, 0, NULL, NULL, NULL, 0, NULL, '2026-03-20 08:36:28', '2026-03-20 08:36:28'),
  (30001, 'BLX-1773985987001-BIZVGO', 1, 'pending_payment', '5.40', '0.00', '5.40', 'GBP', '4.27', '0.790000', NULL, '0.00', 'ethanmitchell3077@gmail.com', NULL, 0, NULL, 0, NULL, NULL, NULL, 0, NULL, '2026-03-20 09:53:07', '2026-03-23 09:37:47'),
  (60001, 'BLX-2026-0001', 1, 'fulfilled', '12.99', '0.00', '12.99', 'USD', '12.99', '1.000000', NULL, '0.00', NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, 0, NULL, '2026-03-18 08:35:36', '2026-03-18 08:35:36'),
  (60002, 'BLX-2026-0002', 1, 'fulfilled', '24.50', '2.00', '22.50', 'USD', '22.50', '1.000000', NULL, '0.00', NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, 0, NULL, '2026-03-20 08:35:36', '2026-03-20 08:35:36'),
  (60003, 'BLX-2026-0003', 1, 'processing', '8.99', '0.00', '8.99', 'USD', '8.99', '1.000000', NULL, '0.00', NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, 1486, NULL, '2026-03-22 08:35:36', '2026-04-26 07:07:07'),
  (60004, 'BLX-2026-0004', 1, 'pending_payment', '15.00', '0.00', '15.00', 'NGN', '22500.00', '1500.000000', NULL, '0.00', NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, 0, NULL, '2026-03-23 08:35:36', '2026-03-23 08:35:36'),
  (90001, 'BLX-1774265377051-X64MX1', 360108, 'pending_payment', '1.08', '0.00', '1.08', 'USD', '1.08', '1.000000', NULL, '0.00', 'abikechram@gmail.com', NULL, 0, NULL, 0, NULL, NULL, NULL, 0, NULL, '2026-03-23 15:29:37', '2026-03-23 15:29:37'),
  (90002, 'BLX-1774265885174-COHWFV', 360125, 'pending_payment', '1.80', '0.00', '1.80', 'USD', '1.80', '1.000000', NULL, '0.00', 'asp781066@gmail.com', NULL, 0, NULL, 0, NULL, NULL, NULL, 0, NULL, '2026-03-23 15:38:05', '2026-03-23 15:38:05'),
  (90003, 'BLX-1774266106924-RNKKYX', 360108, 'pending_payment', '1.08', '0.00', '1.08', 'USD', '1.08', '1.000000', NULL, '0.00', 'abikechram@gmail.com', NULL, 0, NULL, 0, NULL, NULL, NULL, 0, NULL, '2026-03-23 15:41:46', '2026-03-23 15:41:46'),
  (90004, 'BLX-1774266999085-LRLQ_G', 360108, 'pending_payment', '1.08', '0.00', '1.08', 'USD', '1.08', '1.000000', NULL, '0.00', 'abikechram@gmail.com', NULL, 0, NULL, 0, NULL, NULL, NULL, 0, NULL, '2026-03-23 15:56:39', '2026-03-23 15:56:39'),
  (120001, 'BLX-1776609216972-5A1NNU', 630022, 'pending_payment', '0.11', '0.00', '0.11', 'USD', '0.11', '1.000000', NULL, '0.00', 'qazeemayobami@gmail.com', NULL, 0, NULL, 1, NULL, NULL, NULL, 0, NULL, '2026-04-19 18:33:36', '2026-04-19 18:33:37'),
  (120002, 'BLX-1776609618199-B-FFE4', 630022, 'refunded', '0.11', '0.00', '0.11', 'USD', '0.11', '1.000000', NULL, '0.00', 'qazeemayobami@gmail.com', NULL, 0, NULL, 1, NULL, NULL, NULL, 0, NULL, '2026-04-19 18:40:18', '2026-04-19 20:15:14'),
  (150001, 'BLX-1776613074995-KXTCEX', 630022, 'refunded', '0.11', '0.00', '0.11', 'USD', '0.11', '1.000000', NULL, '0.00', 'qazeemayobami@gmail.com', NULL, 0, NULL, 0, NULL, NULL, NULL, 1, NULL, '2026-04-19 19:37:55', '2026-04-19 20:15:07'),
  (150002, 'BLX-1776613252179-6ILKA6', 630022, 'refunded', '0.60', '0.00', '0.60', 'USD', '0.60', '1.000000', NULL, '0.00', 'qazeemayobami@gmail.com', NULL, 0, NULL, 0, NULL, NULL, NULL, 1, NULL, '2026-04-19 19:40:52', '2026-04-19 20:15:24'),
  (150003, 'BLX-1776615863455-HUBFPT', 630022, 'fulfilled', '0.11', '0.00', '0.11', 'USD', '0.11', '1.000000', NULL, '0.00', 'qazeemayobami@gmail.com', NULL, 0, NULL, 0, NULL, NULL, NULL, 0, NULL, '2026-04-19 20:24:23', '2026-04-19 20:24:27'),
  (150004, 'BLX-1776616976200-P-P26B', 630022, 'pending_payment', '0.11', '0.00', '0.11', 'USD', '0.11', '1.000000', NULL, '0.00', 'qazeemayobami@gmail.com', NULL, 0, NULL, 0, NULL, NULL, NULL, 0, NULL, '2026-04-19 20:42:56', '2026-04-19 20:42:56'),
  (150005, 'BLX-1776616986240-1RWVYH', 630022, 'pending_payment', '0.11', '0.00', '0.11', 'USD', '0.11', '1.000000', NULL, '0.00', 'qazeemayobami@gmail.com', NULL, 0, NULL, 0, NULL, NULL, NULL, 0, NULL, '2026-04-19 20:43:06', '2026-04-19 20:43:06'),
  (150006, 'BLX-1776616991496-O3NENE', 630022, 'pending_payment', '0.11', '0.00', '0.11', 'NGN', '181.50', '1650.000000', NULL, '0.00', 'qazeemayobami@gmail.com', NULL, 0, NULL, 0, NULL, NULL, NULL, 0, NULL, '2026-04-19 20:43:11', '2026-04-19 20:43:11'),
  (150007, 'BLX-1776616997023-8M7-IY', 630022, 'pending_payment', '0.11', '0.00', '0.11', 'NGN', '181.50', '1650.000000', NULL, '0.00', 'qazeemayobami@gmail.com', NULL, 0, NULL, 1, NULL, NULL, NULL, 0, NULL, '2026-04-19 20:43:17', '2026-04-19 20:43:17'),
  (150008, 'BLX-1776617060205-OKAAEJ', 630022, 'pending_payment', '0.11', '0.00', '0.11', 'USD', '0.11', '1.000000', NULL, '0.00', 'qazeemayobami@gmail.com', 'nigeria', 0, NULL, 0, NULL, NULL, NULL, 0, NULL, '2026-04-19 20:44:20', '2026-04-19 20:44:20'),
  (150009, 'BLX-1776617069503-IJE-M5', 630022, 'pending_payment', '0.11', '0.00', '0.11', 'USD', '0.11', '1.000000', NULL, '0.00', 'qazeemayobami@gmail.com', 'nigeria', 0, NULL, 0, NULL, NULL, NULL, 0, NULL, '2026-04-19 20:44:29', '2026-04-19 20:44:29'),
  (150010, 'BLX-1776617089708-G6-WCM', 630022, 'pending_payment', '0.11', '0.00', '0.11', 'NGN', '181.50', '1650.000000', NULL, '0.00', 'qazeemayobami@gmail.com', 'nigeria', 0, NULL, 0, NULL, NULL, NULL, 0, NULL, '2026-04-19 20:44:49', '2026-04-19 20:44:49'),
  (150011, 'BLX-1776617095154-1ZZFXY', 630022, 'pending_payment', '0.11', '0.00', '0.11', 'NGN', '181.50', '1650.000000', NULL, '0.00', 'qazeemayobami@gmail.com', 'nigeria', 0, NULL, 1, NULL, NULL, NULL, 0, NULL, '2026-04-19 20:44:55', '2026-04-19 20:44:56'),
  (150012, 'BLX-1776617790657-E7ZOXN', 690313, 'pending_payment', '2.39', '0.00', '2.39', 'USD', '2.39', '1.000000', NULL, '0.00', 'mujaheedayobami@gmail.com', NULL, 0, NULL, 1, NULL, NULL, NULL, 0, NULL, '2026-04-19 20:56:30', '2026-04-19 20:56:31'),
  (150013, 'BLX-1776618005395-3ZWYDN', 690313, 'refunded', '0.96', '0.00', '0.96', 'USD', '0.96', '1.000000', NULL, '0.00', 'mujaheedayobami@gmail.com', NULL, 0, NULL, 1, NULL, NULL, NULL, 0, NULL, '2026-04-19 21:00:05', '2026-04-19 21:03:45'),
  (150014, 'BLX-1776618231230-PDP3NI', 690412, 'fulfilled', '1.44', '0.00', '1.44', 'USD', '1.44', '1.000000', NULL, '0.00', 'salamabc04@gmail.com', NULL, 0, NULL, 1, NULL, NULL, NULL, 0, NULL, '2026-04-19 21:03:51', '2026-04-19 21:04:23'),
  (150015, 'BLX-1776618329870-9GGSCQ', 690313, 'fulfilled', '0.96', '0.00', '0.96', 'USD', '0.96', '1.000000', NULL, '0.00', 'mujaheedayobami@gmail.com', NULL, 0, NULL, 0, NULL, NULL, NULL, 0, NULL, '2026-04-19 21:05:29', '2026-04-19 21:05:31'),
  (150016, 'BLX-1776618399146-TNCOSW', 690376, 'fulfilled', '2.99', '0.00', '2.99', 'USD', '2.99', '1.000000', NULL, '0.00', 'maximummcody@gmail.com', 'Nigeria ', 0, NULL, 0, NULL, NULL, NULL, 0, NULL, '2026-04-19 21:06:39', '2026-04-19 21:06:41'),
  (180001, 'BLX-1776899105819--NJZTN', 630022, 'fulfilled', '0.11', '0.00', '0.11', 'USD', '0.11', '1.000000', NULL, '0.00', 'qazeemayobami@gmail.com', NULL, 0, NULL, 0, NULL, NULL, NULL, 0, NULL, '2026-04-23 03:05:05', '2026-04-23 03:05:10'),
  (180002, 'BLX-1776901393665-MPNRN_', 630022, 'fulfilled', '0.11', '0.00', '0.11', 'USD', '0.11', '1.000000', NULL, '0.00', 'qazeemayobami@gmail.com', NULL, 0, NULL, 0, NULL, NULL, NULL, 0, NULL, '2026-04-23 03:43:13', '2026-04-23 03:43:16'),
  (180003, 'BLX-1776901424603-GGDN9Q', 630022, 'fulfilled', '0.60', '0.00', '0.60', 'USD', '0.60', '1.000000', NULL, '0.00', 'qazeemayobami@gmail.com', NULL, 0, NULL, 0, NULL, NULL, NULL, 0, NULL, '2026-04-23 03:43:44', '2026-04-23 03:43:47'),
  (180004, 'BLX-1776909810394-CTFSRX', 630022, 'fulfilled', '1.50', '0.00', '1.50', 'USD', '1.50', '1.000000', NULL, '0.00', 'qazeemayobami@gmail.com', NULL, 0, NULL, 0, NULL, NULL, NULL, 0, NULL, '2026-04-23 06:03:30', '2026-04-23 06:03:32');

-- Table: order_items (31 rows)
INSERT INTO `order_items` (`id`, `orderId`, `productId`, `productTitle`, `quantity`, `unitPriceUSD`, `totalPriceUSD`, `supplierProductId`, `providerKey`, `createdAt`) VALUES
  (1, 1, 8, 'Twitter aged 2009 + auth_token + firstmail included + 2FA', 1, '6.78', '6.78', '1125', 'accszone', '2026-03-20 08:36:28'),
  (30001, 30001, 1, 'Twitter aged 2009-2019 +0 Followers + auth_token + firstmail included + 2FA', 2, '2.70', '5.40', '1009', 'accszone', '2026-03-20 09:53:07'),
  (60001, 60001, 605, 'Facebook Aged Account 2018', 1, '12.99', '12.99', NULL, NULL, '2026-03-23 08:36:51'),
  (60002, 60002, 602, 'Gmail Account Verified', 2, '11.25', '22.50', NULL, NULL, '2026-03-23 08:36:51'),
  (60003, 60003, 92, 'Instagram Account 500 Followers', 1, '8.99', '8.99', NULL, NULL, '2026-03-23 08:36:51'),
  (90001, 90001, 373, 'IG Accounts | Email address is included (outlook.com/hotmail.com) | Verified by SMS | Account is empty (no posts, no profile picture etc.) | Registered from UK IPS.', 1, '1.08', '1.08', '1315', 'accszone', '2026-03-23 15:29:37'),
  (90002, 90002, 510, 'Facebook Accounts | USA | Marketplace + Professional Mode + 2FA Enabled | SMS & Email Verified | Email Included | Registered from USA IP', 1, '1.80', '1.80', '1221', 'accszone', '2026-03-23 15:38:05'),
  (90003, 90003, 373, 'IG Accounts | Email address is included (outlook.com/hotmail.com) | Verified by SMS | Account is empty (no posts, no profile picture etc.) | Registered from UK IPS.', 1, '1.08', '1.08', '1315', 'accszone', '2026-03-23 15:41:46'),
  (90004, 90004, 373, 'IG Accounts | Email address is included (outlook.com/hotmail.com) | Verified by SMS | Account is empty (no posts, no profile picture etc.) | Registered from UK IPS.', 1, '1.08', '1.08', '1315', 'accszone', '2026-03-23 15:56:39'),
  (120001, 120001, 164, 'Stable Outlook/Hotmail Accounts (3–6 Months Active) | Login via Email:Password | Reliable & Ready to Use', 1, '0.11', '0.11', '879', 'accszone', '2026-04-19 18:33:37'),
  (120002, 120002, 164, 'Stable Outlook/Hotmail Accounts (3–6 Months Active) | Login via Email:Password | Reliable & Ready to Use', 1, '0.11', '0.11', '879', 'accszone', '2026-04-19 18:40:18'),
  (150001, 150001, 164, 'Stable Outlook/Hotmail Accounts (3–6 Months Active) | Login via Email:Password | Reliable & Ready to Use', 1, '0.11', '0.11', '879', 'accszone', '2026-04-19 19:37:55'),
  (150002, 150002, 600001, 'Instagram Accounts | Email Access Outlook/Hotmail | Profile Created | 2FA Enable | Mixed Country', 1, '0.60', '0.60', '1402', 'accszone', '2026-04-19 19:40:52'),
  (150003, 150003, 164, 'Stable Outlook/Hotmail Accounts (3–6 Months Active) | Login via Email:Password | Reliable & Ready to Use', 1, '0.11', '0.11', '879', 'accszone', '2026-04-19 20:24:23'),
  (150004, 150004, 164, 'Stable Outlook/Hotmail Accounts (3–6 Months Active) | Login via Email:Password | Reliable & Ready to Use', 1, '0.11', '0.11', '879', 'accszone', '2026-04-19 20:42:56'),
  (150005, 150005, 164, 'Stable Outlook/Hotmail Accounts (3–6 Months Active) | Login via Email:Password | Reliable & Ready to Use', 1, '0.11', '0.11', '879', 'accszone', '2026-04-19 20:43:06'),
  (150006, 150006, 164, 'Stable Outlook/Hotmail Accounts (3–6 Months Active) | Login via Email:Password | Reliable & Ready to Use', 1, '0.11', '0.11', '879', 'accszone', '2026-04-19 20:43:11'),
  (150007, 150007, 164, 'Stable Outlook/Hotmail Accounts (3–6 Months Active) | Login via Email:Password | Reliable & Ready to Use', 1, '0.11', '0.11', '879', 'accszone', '2026-04-19 20:43:17'),
  (150008, 150008, 164, 'Stable Outlook/Hotmail Accounts (3–6 Months Active) | Login via Email:Password | Reliable & Ready to Use', 1, '0.11', '0.11', '879', 'accszone', '2026-04-19 20:44:20'),
  (150009, 150009, 164, 'Stable Outlook/Hotmail Accounts (3–6 Months Active) | Login via Email:Password | Reliable & Ready to Use', 1, '0.11', '0.11', '879', 'accszone', '2026-04-19 20:44:29'),
  (150010, 150010, 164, 'Stable Outlook/Hotmail Accounts (3–6 Months Active) | Login via Email:Password | Reliable & Ready to Use', 1, '0.11', '0.11', '879', 'accszone', '2026-04-19 20:44:49'),
  (150011, 150011, 164, 'Stable Outlook/Hotmail Accounts (3–6 Months Active) | Login via Email:Password | Reliable & Ready to Use', 1, '0.11', '0.11', '879', 'accszone', '2026-04-19 20:44:55'),
  (150012, 150012, 510015, 'Gmail Accounts | Created 2025 | Random Gender | 2FA Enabled | USA IP Created', 1, '2.39', '2.39', '708', 'accszone', '2026-04-19 20:56:30'),
  (150013, 150013, 374, 'IG Accounts | Email address is included (outlook.com/hotmail.com) | Verified by SMS | 2FA Enabled | An avatar is added | Registered from Brazil IPS.', 1, '0.96', '0.96', '1316', 'accszone', '2026-04-19 21:00:05'),
  (150014, 150014, 90001, 'Discord accounts - (mail:password:token) email included + Activated via SMS Avatar installed', 1, '1.44', '1.44', '1355', 'accszone', '2026-04-19 21:03:51'),
  (150015, 150015, 374, 'IG Accounts | Email address is included (outlook.com/hotmail.com) | Verified by SMS | 2FA Enabled | An avatar is added | Registered from Brazil IPS.', 1, '0.96', '0.96', '1316', 'accszone', '2026-04-19 21:05:29'),
  (150016, 150016, 224, 'TikTok Accounts | Random 0-50 followers | Verified by email (original email included) | The profiles information is partially filled | Accounts are registered in IP addresses of USA.', 1, '2.99', '2.99', '924', 'accszone', '2026-04-19 21:06:39'),
  (180001, 180001, 164, 'Stable Outlook/Hotmail Accounts (3–6 Months Active) | Login via Email:Password | Reliable & Ready to Use', 1, '0.11', '0.11', '879', 'accszone', '2026-04-23 03:05:05'),
  (180002, 180002, 164, 'Stable Outlook/Hotmail Accounts (3–6 Months Active) | Login via Email:Password | Reliable & Ready to Use', 1, '0.11', '0.11', '879', 'accszone', '2026-04-23 03:43:13'),
  (180003, 180003, 363, 'IG Accounts | Email address is included (outlook.com/hotmail.com) | Verified by SMS | Account is empty (no posts, no profile picture etc.) | Registered from USA IPS.', 1, '0.60', '0.60', '1299', 'accszone', '2026-04-23 03:43:44'),
  (180004, 180004, 930056, 'FOREIGN EMPTY TIKTOK', 1, '1.50', '1.50', '161', 'fadded', '2026-04-23 06:03:30');

-- Table: payments (16 rows)
INSERT INTO `payments` (`id`, `orderId`, `userId`, `gateway`, `gatewayReference`, `gatewayTransactionId`, `status`, `amount`, `currency`, `amountUSD`, `exchangeRate`, `paymentMethod`, `metadata`, `webhookVerified`, `createdAt`, `updatedAt`) VALUES
  (1, 120001, 630022, 'paystack', 'BLX-PAY-XQGPA9QT4VBIX5R2', NULL, 'pending', '0.11', 'USD', '0.11', '1.000000', NULL, NULL, 0, '2026-04-19 18:33:37', '2026-04-19 18:33:37'),
  (2, 120002, 630022, 'paystack', 'BLX-PAY-RD1MLIFLMHJRWXKP', NULL, 'success', '0.11', 'USD', '0.11', '1.000000', NULL, NULL, 1, '2026-04-19 18:40:18', '2026-04-19 18:41:07'),
  (30001, 150001, 630022, 'manual', 'WALLET-ORDER-150001-1776613075405', NULL, 'success', '0.11', 'USD', NULL, NULL, NULL, NULL, 1, '2026-04-19 19:37:55', '2026-04-19 19:37:55'),
  (30002, 150002, 630022, 'manual', 'WALLET-ORDER-150002-1776613252642', NULL, 'success', '0.60', 'USD', NULL, NULL, NULL, NULL, 1, '2026-04-19 19:40:52', '2026-04-19 19:40:52'),
  (30003, 150003, 630022, 'manual', 'WALLET-ORDER-150003-1776615863939', NULL, 'success', '0.11', 'USD', NULL, NULL, NULL, NULL, 1, '2026-04-19 20:24:23', '2026-04-19 20:24:23'),
  (30004, 150007, 630022, 'nowpayments', 'BLX-PAY-XIRSRM3F71Z00QQL', '6017452875', 'pending', '181.50', 'NGN', '0.11', '1650.000000', NULL, NULL, 0, '2026-04-19 20:43:17', '2026-04-19 20:43:17'),
  (30005, 150011, 630022, 'paystack', 'BLX-PAY-AGUF5-2ZUDOLOLVP', NULL, 'pending', '181.50', 'NGN', '0.11', '1650.000000', NULL, NULL, 0, '2026-04-19 20:44:56', '2026-04-19 20:44:56'),
  (30006, 150012, 690313, 'paystack', 'BLX-PAY-8DGL4N8IBQOGYXIC', NULL, 'pending', '2.39', 'USD', '2.39', '1.000000', NULL, NULL, 0, '2026-04-19 20:56:31', '2026-04-19 20:56:31'),
  (30007, 150013, 690313, 'paystack', 'BLX-PAY-8EOK1UKH2MRY5CPH', NULL, 'success', '0.96', 'USD', '0.96', '1.000000', NULL, NULL, 1, '2026-04-19 21:00:06', '2026-04-19 21:01:21'),
  (30008, 150014, 690412, 'paystack', 'BLX-PAY-EHI1-_ASCXPF-WCB', NULL, 'success', '1.44', 'USD', '1.44', '1.000000', NULL, NULL, 1, '2026-04-19 21:03:52', '2026-04-19 21:04:20'),
  (30009, 150015, 690313, 'manual', 'WALLET-ORDER-150015-1776618330503', NULL, 'success', '0.96', 'USD', NULL, NULL, NULL, NULL, 1, '2026-04-19 21:05:30', '2026-04-19 21:05:30'),
  (30010, 150016, 690376, 'manual', 'WALLET-ORDER-150016-1776618399924', NULL, 'success', '2.99', 'USD', NULL, NULL, NULL, NULL, 1, '2026-04-19 21:06:39', '2026-04-19 21:06:39'),
  (60001, 180001, 630022, 'manual', 'WALLET-ORDER-180001-1776899106504', NULL, 'success', '0.11', 'USD', NULL, NULL, NULL, NULL, 1, '2026-04-23 03:05:06', '2026-04-23 03:05:06'),
  (60002, 180002, 630022, 'manual', 'WALLET-ORDER-180002-1776901394122', NULL, 'success', '0.11', 'USD', NULL, NULL, NULL, NULL, 1, '2026-04-23 03:43:14', '2026-04-23 03:43:14'),
  (60003, 180003, 630022, 'manual', 'WALLET-ORDER-180003-1776901425147', NULL, 'success', '0.60', 'USD', NULL, NULL, NULL, NULL, 1, '2026-04-23 03:43:45', '2026-04-23 03:43:45'),
  (60004, 180004, 630022, 'manual', 'WALLET-ORDER-180004-1776909810746', NULL, 'success', '1.50', 'USD', NULL, NULL, NULL, NULL, 1, '2026-04-23 06:03:30', '2026-04-23 06:03:30');

-- Table payment_events: empty

-- Table: fulfillment_records (9 rows)
INSERT INTO `fulfillment_records` (`id`, `orderId`, `orderItemId`, `providerKey`, `supplierOrderId`, `status`, `deliveryData`, `rawResponse`, `errorMessage`, `userViewed`, `createdAt`, `updatedAt`) VALUES
  (9, 150003, 150003, 'accszone', '33797', 'success', '["MimiVaroz129@hotmail.com:kA34AbCs2:M.C505_SN1.0.U.-Crcy1etZdImfsHClPrE5bv7Nut7QsYS4X2FjjloOhUQsI20!RTuexyuEU8h4ZUIHaMPG4qVphrZ8IoUnnBYQbg1vETIQzIK6HFubJPCp9BHUo3dXYzqjcOGxk3ZbT22PyWRap*yepHhNMbzeKNu6Jy3OG8hCO17qnoputnpg6WvZPC40qdjmWS7uf1UfMRbCxUwQSraJUHlV0XMB5SMdTPIWB53sIpXhErFn5!VhqAtXKeKuGEdIjtf2LD4xv4qj136NV1uL2KYPtKtY7uII47SJbj8c8CeTwyF2632GKn4xcN3Fqg2up7Xq!4TI7VhDH4XaIEUeVUKcDPaTFx2KLmJjd2Rg0V6VVmOAPbi7aicAXcyzUIRYwCcHH7mRc9Gn6GshTU9QiPi3xJKiE*W9t4A$:8b4ba9dd-3ea5-4e5f-86f1-ddba2230dcf2"]', 'MimiVaroz129@hotmail.com:kA34AbCs2:M.C505_SN1.0.U.-Crcy1etZdImfsHClPrE5bv7Nut7QsYS4X2FjjloOhUQsI20!RTuexyuEU8h4ZUIHaMPG4qVphrZ8IoUnnBYQbg1vETIQzIK6HFubJPCp9BHUo3dXYzqjcOGxk3ZbT22PyWRap*yepHhNMbzeKNu6Jy3OG8hCO17qnoputnpg6WvZPC40qdjmWS7uf1UfMRbCxUwQSraJUHlV0XMB5SMdTPIWB53sIpXhErFn5!VhqAtXKeKuGEdIjtf2LD4xv4qj136NV1uL2KYPtKtY7uII47SJbj8c8CeTwyF2632GKn4xcN3Fqg2up7Xq!4TI7VhDH4XaIEUeVUKcDPaTFx2KLmJjd2Rg0V6VVmOAPbi7aicAXcyzUIRYwCcHH7mRc9Gn6GshTU9QiPi3xJKiE*W9t4A$:8b4ba9dd-3ea5-4e5f-86f1-ddba2230dcf2', NULL, 1, '2026-04-19 20:24:26', '2026-04-19 20:24:37'),
  (10, 150013, 150013, 'accszone', '33801', 'success', '["annalizmonteiro4:Ubt4OLocu7wv:JaymesBuckingham6934@outlook.com:OpeiFe5WpAkG:AAYY VZVB QHJN JLAJ TMPU UBLQ Q6WH 2ZSA"]', 'annalizmonteiro4:Ubt4OLocu7wv:JaymesBuckingham6934@outlook.com:OpeiFe5WpAkG:AAYY VZVB QHJN JLAJ TMPU UBLQ Q6WH 2ZSA', NULL, 0, '2026-04-19 21:01:23', '2026-04-19 21:01:23'),
  (11, 150014, 150014, 'accszone', '33802', 'success', '["carbiocalbar1976@ro.ru:jCCT3xrMm:MTQ4NTIwNDMzMTg1MzUxNjkxMQ.G-Vf3N.rvUSrHQB8yvrfetXgSlMooqzWKgPLvE2_VkBN4"]', 'carbiocalbar1976@ro.ru:jCCT3xrMm:MTQ4NTIwNDMzMTg1MzUxNjkxMQ.G-Vf3N.rvUSrHQB8yvrfetXgSlMooqzWKgPLvE2_VkBN4', NULL, 1, '2026-04-19 21:04:22', '2026-04-19 21:07:32'),
  (12, 150015, 150015, 'accszone', '33803', 'success', '["elisapires4278:BkT6rdufPz5K:AdairComes76@outlook.com:WrnTE1owIO0y:IGSP ZYAU OVNV RIRT 6N3Y VXLX MH6R 5LSB"]', 'elisapires4278:BkT6rdufPz5K:AdairComes76@outlook.com:WrnTE1owIO0y:IGSP ZYAU OVNV RIRT 6N3Y VXLX MH6R 5LSB', NULL, 1, '2026-04-19 21:05:31', '2026-04-19 21:07:22'),
  (13, 150016, 150016, 'accszone', '33804', 'success', '["@rebeccaflowerscol:n0vBBG*wtMDF:r.s.flowerscole2020@gmail.com:G5WjvlP8sXcG0zAf:JoneNamdar155@hotmail.com:l7wm p7yz v2sj zvyz jc6a jxlb uogi q4dy:https://www.tiktok.com/@rebeccaflowerscol"]', '@rebeccaflowerscol:n0vBBG*wtMDF:r.s.flowerscole2020@gmail.com:G5WjvlP8sXcG0zAf:JoneNamdar155@hotmail.com:l7wm p7yz v2sj zvyz jc6a jxlb uogi q4dy:https://www.tiktok.com/@rebeccaflowerscol', NULL, 1, '2026-04-19 21:06:41', '2026-04-19 21:07:08'),
  (30001, 180001, 180001, 'accszone', '34688', 'success', '["KaraBalcazar812@hotmail.com:zBRSllooDXUt:M.C537_BL2.0.U.-CkzqYv1NZrpniCCXtxP*qlGsYAG6SB0q9zHoyOGleWNfruIrO3zPVCSq!McOoipRgZEqPIXjYds1UtGvTJEBdkh!is09aePfHvwJPCyfyZyAy!henBI*hB*L0X1vZbVIVc1T5Trcbv!1GTojc6FJoZa7E9T0644RvANOfCuLBrjMxmlucl3*J49oXmnA8XmIJ4Qicla2BjHX5cBQpRiNqTR1QsRPtT5qePoLpedfnCbeSF4UffMt!4QM!ztIQW*DsgQKZJUnOzBC5d5Cch9*uA5suasQYB3FPEhofIwKUuLvW7omFxT1k57wJTuPedd9uHDOfxBjU7JbikxULImJZ1dd7!nrTNp5PO3BMOKTUDcYH0GLHbeDc9gMyx2PiqvVqbULYPwH20DFHO4DTdzuFRA$:8b4ba9dd-3ea5-4e5f-86f1-ddba2230dcf2"]', 'KaraBalcazar812@hotmail.com:zBRSllooDXUt:M.C537_BL2.0.U.-CkzqYv1NZrpniCCXtxP*qlGsYAG6SB0q9zHoyOGleWNfruIrO3zPVCSq!McOoipRgZEqPIXjYds1UtGvTJEBdkh!is09aePfHvwJPCyfyZyAy!henBI*hB*L0X1vZbVIVc1T5Trcbv!1GTojc6FJoZa7E9T0644RvANOfCuLBrjMxmlucl3*J49oXmnA8XmIJ4Qicla2BjHX5cBQpRiNqTR1QsRPtT5qePoLpedfnCbeSF4UffMt!4QM!ztIQW*DsgQKZJUnOzBC5d5Cch9*uA5suasQYB3FPEhofIwKUuLvW7omFxT1k57wJTuPedd9uHDOfxBjU7JbikxULImJZ1dd7!nrTNp5PO3BMOKTUDcYH0GLHbeDc9gMyx2PiqvVqbULYPwH20DFHO4DTdzuFRA$:8b4ba9dd-3ea5-4e5f-86f1-ddba2230dcf2', NULL, 1, '2026-04-23 03:05:10', '2026-04-23 03:05:22'),
  (30002, 180002, 180002, 'accszone', '34693', 'success', '["BillieBallagh28@hotmail.com:7VBmktEIk:M.C556_BL2.0.U.-CqONuJk1YVCDPbbTXcd2tBpDv!4YVR8TxvqqBn51ztlK066D6b*q2lI5m0VBE6woEzDxG8r4jRXx0BEOrNfV8bgyKMzju4wfCXs1YKVYEJzCEY2FUNsMlXTTHPEX7snNq6gLZ9pTpenHBKiy2L1vAkErEgjMArfzZHCXU*co7xyDLpMbIKqNSrtLDMK!9aRAmZeO4KrSeBfSNv4wir!v8ZJY9YUqMYzn1oI*So9ciKXWHTIkSx0!a0sGMwqzBd6nfaXyYQHv5zMv3kCTNciPtBt8OB5bDZ9XbSBnulytyJy7RxVWrWc0KB6CEpcDnw6et9IMGQVPvVDH78vvTRbWD!bu!FTg71Dfl4i7D9SQVx3IBvz7c9!mNCiRqB1A85TFEKm8I1db8JAw2G6j**YbnTn8XkjQ0hKlA*UU3GYlJyb5:8b4ba9dd-3ea5-4e5f-86f1-ddba2230dcf2"]', 'BillieBallagh28@hotmail.com:7VBmktEIk:M.C556_BL2.0.U.-CqONuJk1YVCDPbbTXcd2tBpDv!4YVR8TxvqqBn51ztlK066D6b*q2lI5m0VBE6woEzDxG8r4jRXx0BEOrNfV8bgyKMzju4wfCXs1YKVYEJzCEY2FUNsMlXTTHPEX7snNq6gLZ9pTpenHBKiy2L1vAkErEgjMArfzZHCXU*co7xyDLpMbIKqNSrtLDMK!9aRAmZeO4KrSeBfSNv4wir!v8ZJY9YUqMYzn1oI*So9ciKXWHTIkSx0!a0sGMwqzBd6nfaXyYQHv5zMv3kCTNciPtBt8OB5bDZ9XbSBnulytyJy7RxVWrWc0KB6CEpcDnw6et9IMGQVPvVDH78vvTRbWD!bu!FTg71Dfl4i7D9SQVx3IBvz7c9!mNCiRqB1A85TFEKm8I1db8JAw2G6j**YbnTn8XkjQ0hKlA*UU3GYlJyb5:8b4ba9dd-3ea5-4e5f-86f1-ddba2230dcf2', NULL, 1, '2026-04-23 03:43:16', '2026-04-23 03:43:16'),
  (30003, 180003, 180003, 'accszone', '34694', 'success', '["nataliewilliamson134:VkZNHv7zGS25:AdalinePapitto5403@outlook.com:SxFDlUXlQi6vV:https://www.instagram.com/nataliewilliamson134/"]', 'nataliewilliamson134:VkZNHv7zGS25:AdalinePapitto5403@outlook.com:SxFDlUXlQi6vV:https://www.instagram.com/nataliewilliamson134/', NULL, 1, '2026-04-23 03:43:47', '2026-04-23 03:43:47'),
  (30004, 180004, 180004, 'fadded', 'fadded-180004', 'success', '[{"product_detail_id":287013,"details":"user167188033927|@K4a@J8gCj!Q|peschadanha@hotmail.com|Tlpass2025!lalavivi|peschadanha.tltik2025@fviainboxes.com"}]', '[object Object]', NULL, 1, '2026-04-23 06:03:32', '2026-04-23 06:03:33');

-- Table saved_products: empty

-- Table supplier_refund_claims: empty

-- Table: support_tickets (3 rows)
INSERT INTO `support_tickets` (`id`, `ticketNumber`, `userId`, `orderId`, `subject`, `status`, `priority`, `createdAt`, `updatedAt`, `resolvedAt`) VALUES
  (1, 'TKT-DEMO-001', 1, 60001, 'Order BLX-2026-0001 account not working', 'resolved', 'high', '2026-03-19 08:36:51', '2026-03-23 08:41:52', '2026-03-23 08:41:53'),
  (2, 'TKT-DEMO-002', 1, 60002, 'Request refund for duplicate order', 'pending', 'medium', '2026-03-21 08:36:51', '2026-03-21 08:36:51', NULL),
  (3, 'TKT-DEMO-003', 1, NULL, 'How do I top up my wallet', 'resolved', 'low', '2026-03-15 08:36:51', '2026-03-16 08:36:51', NULL);

-- Table: ticket_messages (3 rows)
INSERT INTO `ticket_messages` (`id`, `ticketId`, `senderId`, `senderRole`, `message`, `attachmentUrl`, `createdAt`) VALUES
  (1, 1, 1, 'user', 'I purchased an account but it is not working. Please help me resolve this issue.', NULL, '2026-03-19 08:36:51'),
  (2, 1, 1, 'admin', 'resolved', NULL, '2026-03-23 08:41:19'),
  (3, 1, 1, 'admin', 'done', NULL, '2026-03-23 08:41:52');

-- Table notifications: empty

-- Table: admin_actions (5 rows)
INSERT INTO `admin_actions` (`id`, `adminId`, `action`, `targetType`, `targetId`, `details`, `ipAddress`, `createdAt`) VALUES
  (1, 1, 'Processed refund of $9 to user 1', 'user', 1, '[object Object]', NULL, '2026-03-23 08:41:40'),
  (30001, 630022, 'Manual refund of $0.11 for order #BLX-1776613074995-KXTCEX', 'order', 150001, '[object Object]', NULL, '2026-04-19 20:15:07'),
  (30002, 630022, 'Manual refund of $0.11 for order #BLX-1776609618199-B-FFE4', 'order', 120002, '[object Object]', NULL, '2026-04-19 20:15:14'),
  (30003, 630022, 'Manual refund of $0.60 for order #BLX-1776613252179-6ILKA6', 'order', 150002, '[object Object]', NULL, '2026-04-19 20:15:24'),
  (30004, 630022, 'Manual refund of $0.96 for order #BLX-1776618005395-3ZWYDN', 'order', 150013, '[object Object]', NULL, '2026-04-19 21:03:45');

SET FOREIGN_KEY_CHECKS=1;
