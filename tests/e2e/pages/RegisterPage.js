export class RegisterPage {
	constructor(page) {
		this.page = page;
		this.emailInput = page.getByTestId("email-input");
		this.passwordInput = page.getByTestId("password-input");
		this.submitButton = page.getByTestId("register-button");
		this.errorMessage = page.getByTestId("error-message");
	}

	async goto() {
		await this.page.goto("/register");
	}

	async register(email, password) {
		await this.emailInput.fill(email);
		await this.passwordInput.fill(password);
		await this.submitButton.click();
	}
}
