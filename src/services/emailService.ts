
// In a real application, this would connect to a backend service
// For this demo, we'll simulate sending emails

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
}

/**
 * Simulate sending an email
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  console.log('Sending email:', options);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Simulate a 95% success rate
  const success = Math.random() > 0.05;
  
  if (!success) {
    throw new Error('Failed to send email');
  }
  
  return true;
};

/**
 * Send a webinar registration confirmation email
 */
export const sendWebinarConfirmationEmail = async (
  email: string,
  name: string,
  webinarTitle: string,
  webinarDate: string,
  webinarTime: string,
  webinarId: string
): Promise<boolean> => {
  const webinarUrl = `${window.location.origin}/webinar/${webinarId}`;
  
  const emailBody = `
    <h1>Registration Confirmed!</h1>
    <p>Hello ${name},</p>
    <p>Thank you for registering for "${webinarTitle}".</p>
    <p><strong>Date:</strong> ${webinarDate}<br>
    <strong>Time:</strong> ${webinarTime}</p>
    <p>You can access the webinar details at any time by visiting:<br>
    <a href="${webinarUrl}">${webinarUrl}</a></p>
    <p>We'll send you a reminder email 24 hours before the webinar starts.</p>
    <p>If you have any questions, simply reply to this email.</p>
    <p>Looking forward to seeing you there!</p>
    <p>Best regards,<br>
    The Webinar Fusion Team</p>
  `;
  
  return sendEmail({
    to: email,
    subject: `Confirmation: You're registered for "${webinarTitle}"`,
    body: emailBody
  });
};

/**
 * Send a webinar reminder email
 */
export const sendWebinarReminderEmail = async (
  email: string,
  name: string,
  webinarTitle: string,
  webinarDate: string,
  webinarTime: string,
  webinarId: string
): Promise<boolean> => {
  const webinarUrl = `${window.location.origin}/webinar/${webinarId}`;
  
  const emailBody = `
    <h1>Your Webinar is Tomorrow!</h1>
    <p>Hello ${name},</p>
    <p>This is a friendly reminder that you're registered for "${webinarTitle}" which is happening tomorrow.</p>
    <p><strong>Date:</strong> ${webinarDate}<br>
    <strong>Time:</strong> ${webinarTime}</p>
    <p>You can access the webinar details at any time by visiting:<br>
    <a href="${webinarUrl}">${webinarUrl}</a></p>
    <p>We're looking forward to seeing you there!</p>
    <p>Best regards,<br>
    The Webinar Fusion Team</p>
  `;
  
  return sendEmail({
    to: email,
    subject: `Reminder: "${webinarTitle}" is tomorrow`,
    body: emailBody
  });
};
