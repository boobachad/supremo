export class EventDetailPage {
	constructor(page) {
		this.page = page;
		this.quantityInput = page.getByTestId("quantity-input");
		this.bookButton = page.getByTestId("book-button");
		this.errorMessage = page.getByTestId("error-message");
		this.successMessage = page.getByTestId("success-message");
	}

	async goto(eventId) {
		await this.page.goto(`/events/${eventId}`);
	}

	async bookTickets(quantity) {
		await this.quantityInput.fill(quantity.toString());
		await this.bookButton.click();
	}
}
