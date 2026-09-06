/* The 52 weeks of the report year (Sep 2025 - Aug 2026), transcribed from
   the prototype's weekly figures. Values are direct bookings and revenue,
   with the prior year's same week alongside. */

export type Week = {
  start: string; // ISO date of the week's Monday
  bookings: number;
  rev: number;
  priorBookings: number;
  priorRev: number;
  visits: number;
  adViews: number;
};

export const WEEKS: Week[] = [
  { start: "2025-09-01", bookings: 7, rev: 3710, priorBookings: 5, priorRev: 2625, visits: 204, adViews: 1378 },
  { start: "2025-09-08", bookings: 8, rev: 3793, priorBookings: 5, priorRev: 2776, visits: 194, adViews: 1157 },
  { start: "2025-09-15", bookings: 6, rev: 3240, priorBookings: 5, priorRev: 2782, visits: 172, adViews: 1110 },
  { start: "2025-09-22", bookings: 8, rev: 3818, priorBookings: 6, priorRev: 3080, visits: 222, adViews: 1456 },
  { start: "2025-09-29", bookings: 8, rev: 4491, priorBookings: 6, priorRev: 2959, visits: 253, adViews: 1672 },
  { start: "2025-10-06", bookings: 10, rev: 4790, priorBookings: 8, priorRev: 3731, visits: 256, adViews: 1716 },
  { start: "2025-10-13", bookings: 9, rev: 4390, priorBookings: 8, priorRev: 3928, visits: 242, adViews: 1566 },
  { start: "2025-10-20", bookings: 9, rev: 4115, priorBookings: 6, priorRev: 3146, visits: 237, adViews: 1441 },
  { start: "2025-10-27", bookings: 7, rev: 3151, priorBookings: 5, priorRev: 2479, visits: 189, adViews: 1172 },
  { start: "2025-11-03", bookings: 4, rev: 2282, priorBookings: 4, priorRev: 1896, visits: 126, adViews: 756 },
  { start: "2025-11-10", bookings: 3, rev: 1551, priorBookings: 2, priorRev: 1176, visits: 85, adViews: 571 },
  { start: "2025-11-17", bookings: 3, rev: 1724, priorBookings: 3, priorRev: 1426, visits: 93, adViews: 572 },
  { start: "2025-11-24", bookings: 4, rev: 2065, priorBookings: 3, priorRev: 1563, visits: 112, adViews: 712 },
  { start: "2025-12-01", bookings: 5, rev: 2428, priorBookings: 3, priorRev: 1731, visits: 139, adViews: 940 },
  { start: "2025-12-08", bookings: 5, rev: 2603, priorBookings: 4, priorRev: 1728, visits: 133, adViews: 788 },
  { start: "2025-12-15", bookings: 5, rev: 2522, priorBookings: 4, priorRev: 2151, visits: 131, adViews: 777 },
  { start: "2025-12-22", bookings: 5, rev: 2512, priorBookings: 4, priorRev: 1899, visits: 147, adViews: 855 },
  { start: "2025-12-29", bookings: 6, rev: 2814, priorBookings: 4, priorRev: 2164, visits: 148, adViews: 978 },
  { start: "2026-01-05", bookings: 6, rev: 2985, priorBookings: 5, priorRev: 2267, visits: 151, adViews: 880 },
  { start: "2026-01-12", bookings: 6, rev: 3017, priorBookings: 5, priorRev: 2322, visits: 152, adViews: 1014 },
  { start: "2026-01-19", bookings: 7, rev: 3547, priorBookings: 6, priorRev: 2747, visits: 192, adViews: 1135 },
  { start: "2026-01-26", bookings: 7, rev: 3072, priorBookings: 5, priorRev: 2674, visits: 168, adViews: 1102 },
  { start: "2026-02-02", bookings: 7, rev: 3697, priorBookings: 5, priorRev: 2341, visits: 221, adViews: 1386 },
  { start: "2026-02-09", bookings: 7, rev: 3430, priorBookings: 5, priorRev: 2514, visits: 197, adViews: 1274 },
  { start: "2026-02-16", bookings: 7, rev: 3393, priorBookings: 5, priorRev: 2840, visits: 188, adViews: 1166 },
  { start: "2026-02-23", bookings: 6, rev: 3178, priorBookings: 4, priorRev: 2210, visits: 170, adViews: 1094 },
  { start: "2026-03-02", bookings: 5, rev: 2681, priorBookings: 5, priorRev: 2181, visits: 138, adViews: 888 },
  { start: "2026-03-09", bookings: 5, rev: 2563, priorBookings: 4, priorRev: 2190, visits: 149, adViews: 893 },
  { start: "2026-03-16", bookings: 6, rev: 2751, priorBookings: 3, priorRev: 1820, visits: 149, adViews: 895 },
  { start: "2026-03-23", bookings: 4, rev: 1938, priorBookings: 3, priorRev: 1514, visits: 100, adViews: 631 },
  { start: "2026-03-30", bookings: 2, rev: 827, priorBookings: 3, priorRev: 1066, visits: 77, adViews: 543 },
  { start: "2026-04-06", bookings: 2, rev: 982, priorBookings: 2, priorRev: 725, visits: 62, adViews: 396 },
  { start: "2026-04-13", bookings: 2, rev: 1027, priorBookings: 2, priorRev: 833, visits: 49, adViews: 302 },
  { start: "2026-04-20", bookings: 2, rev: 638, priorBookings: 2, priorRev: 915, visits: 60, adViews: 380 },
  { start: "2026-04-27", bookings: 1, rev: 436, priorBookings: 2, priorRev: 901, visits: 74, adViews: 519 },
  { start: "2026-05-04", bookings: 4, rev: 2042, priorBookings: 3, priorRev: 1354, visits: 91, adViews: 592 },
  { start: "2026-05-11", bookings: 4, rev: 1946, priorBookings: 3, priorRev: 1539, visits: 114, adViews: 691 },
  { start: "2026-05-18", bookings: 4, rev: 2167, priorBookings: 4, priorRev: 1857, visits: 119, adViews: 718 },
  { start: "2026-05-25", bookings: 6, rev: 2569, priorBookings: 4, priorRev: 2089, visits: 138, adViews: 808 },
  { start: "2026-06-01", bookings: 6, rev: 3497, priorBookings: 5, priorRev: 2662, visits: 170, adViews: 1152 },
  { start: "2026-06-08", bookings: 7, rev: 3506, priorBookings: 6, priorRev: 2990, visits: 209, adViews: 1352 },
  { start: "2026-06-15", bookings: 7, rev: 3779, priorBookings: 7, priorRev: 3542, visits: 217, adViews: 1425 },
  { start: "2026-06-22", bookings: 8, rev: 4254, priorBookings: 6, priorRev: 3115, visits: 242, adViews: 1473 },
  { start: "2026-06-29", bookings: 8, rev: 4197, priorBookings: 6, priorRev: 3287, visits: 248, adViews: 1501 },
  { start: "2026-07-06", bookings: 9, rev: 4360, priorBookings: 7, priorRev: 3806, visits: 240, adViews: 1401 },
  { start: "2026-07-13", bookings: 10, rev: 5362, priorBookings: 9, priorRev: 4209, visits: 309, adViews: 1955 },
  { start: "2026-07-20", bookings: 9, rev: 4479, priorBookings: 8, priorRev: 3938, visits: 296, adViews: 1910 },
  { start: "2026-07-27", bookings: 10, rev: 5066, priorBookings: 8, priorRev: 4197, visits: 258, adViews: 1627 },
  { start: "2026-08-03", bookings: 11, rev: 5776, priorBookings: 9, priorRev: 4330, visits: 287, adViews: 1791 },
  { start: "2026-08-10", bookings: 10, rev: 5528, priorBookings: 8, priorRev: 4208, visits: 295, adViews: 1905 },
  { start: "2026-08-17", bookings: 9, rev: 4408, priorBookings: 7, priorRev: 3799, visits: 268, adViews: 1710 },
  { start: "2026-08-24", bookings: 11, rev: 5668, priorBookings: 8, priorRev: 3860, visits: 330, adViews: 2014 },
];

/* Expected September: last September's weekly shape scaled to the
   prototype's $18,444 expectation. */
export const FORECAST: { start: string; rev: number }[] = [
  { start: "2026-08-31", rev: 4699 },
  { start: "2026-09-07", rev: 4804 },
  { start: "2026-09-14", rev: 4104 },
  { start: "2026-09-21", rev: 4837 },
];

export const LAST_AUGUST_TOTAL = 16197;
export const SEPTEMBER_EXPECTED = 18444;
