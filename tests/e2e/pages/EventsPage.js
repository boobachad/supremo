export class EventsPage {
	constructor(page) {
		this.page = page;
		this.eventsTable = page.getByTestId("events-table");
		this.errorMessage = page.getByTestId("error-message");
	}

	async goto() {
		await this.page.goto("/events");
	}

	getEventRow(eventId) {
		return this.page.getByTestId(`event-row-${eventId}`);
	}

	async viewEvent(eventId) {
		await this.page.getByTestId(`view-event-${eventId}`).click();
	}
}
