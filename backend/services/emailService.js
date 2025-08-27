// Email service - Simplified version without verification
// This can be used for future features like notifications

class EmailService {
  constructor() {
    // Email service disabled - no verification needed
    console.log('📧 Email verification disabled - users can register directly');
  }

  async sendNotificationEmail(user, subject, message) {
    // Placeholder for future notification features
    console.log(`📧 Email notification would be sent to ${user.email}: ${subject}`);
    return Promise.resolve();
  }

  // Placeholder methods for future use
  async sendWelcomeEmail(user) {
    console.log(`📧 Welcome email would be sent to ${user.email}`);
    return Promise.resolve();
  }

  async sendPasswordResetEmail(user, token) {
    console.log(`📧 Password reset email would be sent to ${user.email}`);
    console.log(`🔑 Reset token: ${token}`);
    return Promise.resolve();
  }
}

module.exports = new EmailService();
