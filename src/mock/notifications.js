// Admin notifications.
// type: 'new_booking' | 'payment_received' | 'booking_cancelled' | 'shoot_tomorrow'
// targetType: 'booking' | 'payment'
// Seeded relative to "today" = 2026-10-14 so Today/Yesterday/Earlier groups
// render meaningfully.
const notifications = [
  // --- Today ---
  {
    id: 'notif_001',
    type: 'new_booking',
    message: 'Akosua Boateng booked a Standard shoot for 25 Oct',
    targetType: 'booking',
    targetId: 'bk_004',
    createdAt: '2026-10-14T08:20:00Z',
    readAt: null,
  },
  {
    id: 'notif_002',
    type: 'payment_received',
    message: 'Kwabena Appiah paid GH₵ 250 by Cash',
    targetType: 'payment',
    targetId: 'pay_008',
    createdAt: '2026-10-14T05:00:00Z',
    readAt: null,
  },
  // --- Yesterday ---
  {
    id: 'notif_003',
    type: 'new_booking',
    message: 'Nana Yaa Attah booked a Premium shoot for 21 Nov',
    targetType: 'booking',
    targetId: 'bk_009',
    createdAt: '2026-10-13T20:10:00Z',
    readAt: null,
  },
  {
    id: 'notif_004',
    type: 'payment_received',
    message: 'Kwame Asante paid GH₵ 500 by MoMo',
    targetType: 'payment',
    targetId: 'pay_001',
    createdAt: '2026-10-13T10:00:00Z',
    readAt: '2026-10-13T12:00:00Z',
  },
  // --- Earlier ---
  {
    id: 'notif_005',
    type: 'new_booking',
    message: 'Kofi Mensah booked an Essential shoot for 20 Oct',
    targetType: 'booking',
    targetId: 'bk_003',
    createdAt: '2026-10-11T16:45:00Z',
    readAt: null,
  },
  {
    id: 'notif_006',
    type: 'payment_received',
    message: 'Ama Owusu paid GH₵ 475 by Card',
    targetType: 'payment',
    targetId: 'pay_012',
    createdAt: '2026-10-11T15:45:00Z',
    readAt: '2026-10-12T08:00:00Z',
  },
  {
    id: 'notif_007',
    type: 'new_booking',
    message: 'Yaw Nkrumah booked a Premium shoot for 7 Nov',
    targetType: 'booking',
    targetId: 'bk_005',
    createdAt: '2026-10-05T12:00:00Z',
    readAt: '2026-10-05T15:00:00Z',
  },
  {
    id: 'notif_008',
    type: 'booking_cancelled',
    message: 'Abena Ofori cancelled her Essential shoot on 15 Sep',
    targetType: 'booking',
    targetId: 'bk_010',
    createdAt: '2026-09-12T09:00:00Z',
    readAt: '2026-09-12T09:30:00Z',
  },
  {
    id: 'notif_009',
    type: 'payment_received',
    message: 'Benjamin Osei paid GH₵ 475 by Card',
    targetType: 'payment',
    targetId: 'pay_016',
    createdAt: '2026-08-10T14:00:00Z',
    readAt: '2026-08-10T15:00:00Z',
  },
  {
    id: 'notif_010',
    type: 'payment_received',
    message: 'Comfort Addo paid GH₵ 500 by MoMo',
    targetType: 'payment',
    targetId: 'pay_013',
    createdAt: '2026-07-18T15:00:00Z',
    readAt: '2026-07-19T09:00:00Z',
  },
]

export default notifications
