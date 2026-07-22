export class LoginPage {
	constructor(page) {
		this.page = page;
		this.emailInput = page.getByTestId("email-input");
		this.passwordInput = page.getByTestId("password-input");
		this.submitButton = page.getByTestId("login-button");
		this.errorMessage = page.getByTestId("error-message");
	}

	async goto() {
		await this.page.goto("/login");
	}

	async login(email, password) {
		await this.emailInput.fill(email);
		await this.passwordInput.fill(password);
		await this.submitButton.click();
	}
}
