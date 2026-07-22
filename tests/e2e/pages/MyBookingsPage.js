export class MyBookingsPage {
	constructor(page) {
		this.page = page;
		this.bookingsTable = page.getByTestId("bookings-table");
		this.errorMessage = page.getByTestId("error-message");
	}

	async goto() {
		await this.page.goto("/my-bookings");
	}

	getBookingRow(bookingId) {
		return this.page.getByTestId(`booking-row-${bookingId}`);
	}

	async cancelBooking(bookingId) {
		await this.page.getByTestId(`cancel-button-${bookingId}`).click();
	}
}
