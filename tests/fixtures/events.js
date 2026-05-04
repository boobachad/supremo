export const validEvent = () => ({
	title: "Test Concert",
	description: "A great concert",
	venue: "Test Arena",
	event_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
	total_seats: 100,
	price: 50,
});

export const pastEvent = () => ({
	title: "Past Concert",
	description: "Already happened",
	venue: "Past Arena",
	event_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
	total_seats: 100,
	price: 50,
});

export const singleSeatEvent = () => ({
	title: "Exclusive Concert",
	description: "Only one seat available",
	venue: "Tiny Venue",
	event_date: new Date(Date.now() + 86400000).toISOString(),
	total_seats: 1,
	price: 100,
});
