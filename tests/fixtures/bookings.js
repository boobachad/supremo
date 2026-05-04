export const validBooking = (eventId) => ({
	eventId,
	quantity: 2,
});

export const overCapacityBooking = (eventId) => ({
	eventId,
	quantity: 9999,
});

export const zeroQuantityBooking = (eventId) => ({
	eventId,
	quantity: 0,
});

export const negativeQuantityBooking = (eventId) => ({
	eventId,
	quantity: -1,
});

export const floatQuantityBooking = (eventId) => ({
	eventId,
	quantity: 1.5,
});
