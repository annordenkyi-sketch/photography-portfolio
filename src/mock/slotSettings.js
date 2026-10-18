// Default slot configuration for the photographer.
// workingDays: 0 = Sun, 1 = Mon, ... 6 = Sat
// slots: ordered list of daily time slots
// packageSlots: how many consecutive slots each package occupies
const slotSettings = {
  workingDays: [1, 2, 3, 4, 5, 6], // Mon–Sat
  slots: [
    { id: 'slot_1', label: '08:00 – 10:00', start: '08:00', end: '10:00' },
    { id: 'slot_2', label: '10:00 – 12:00', start: '10:00', end: '12:00' },
    { id: 'slot_3', label: '13:00 – 15:00', start: '13:00', end: '15:00' },
    { id: 'slot_4', label: '15:00 – 17:00', start: '15:00', end: '17:00' },
  ],
  maxBookingsPerSlot: 1,
  packageSlots: {
    Essential: 1,
    Standard: 2,
    Premium: 4,
  },
}

export default slotSettings
