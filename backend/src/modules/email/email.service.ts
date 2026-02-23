import { Resend } from 'resend';

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'Vertex Football <noreply@vertex-football.com>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://vertex-football.com';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    console.log(`📧 Sending email to ${to}: ${subject}`);
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('❌ Email send error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log(`✅ Email sent successfully to ${to}`);
    return data;
  } catch (error) {
    console.error('❌ Email service error:', error);
    throw error;
  }
}

// ========================================
// EMAIL TEMPLATES
// ========================================

const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #22c55e, #10b981); padding: 16px; border-radius: 16px;">
        <span style="font-size: 32px; color: white;">△</span>
      </div>
      <h1 style="color: white; margin: 16px 0 0 0; font-size: 24px;">Vertex</h1>
    </div>
    
    <!-- Content -->
    <div style="background-color: #171717; border-radius: 16px; padding: 32px; border: 1px solid #262626;">
      ${content}
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px;">
      <p style="color: #525252; font-size: 12px; margin: 0;">
        © ${new Date().getFullYear()} Vertex Football. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`;

// ========================================
// WELCOME EMAIL
// ========================================
export async function sendWelcomeEmail(
  to: string,
  firstName: string,
  role: 'COACH' | 'PARENT' | 'PLAYER'
) {
  const roleMessages: Record<string, { title: string; message: string; features: string[] }> = {
    COACH: {
      title: 'Welcome to Vertex, Coach!',
      message: "You're all set to start managing your players and building champions.",
      features: [
        '👥 Add and manage your players',
        '📅 Create and schedule training sessions',
        '📊 Track player development over time',
        '📝 Provide detailed session feedback',
      ],
    },
    PARENT: {
      title: 'Welcome to Vertex!',
      message: "You can now track your child's football development journey.",
      features: [
        "📊 Monitor your child's progress",
        '📅 Book training sessions',
        '💬 Receive coach feedback',
        '🏆 Celebrate achievements together',
      ],
    },
    PLAYER: {
      title: 'Welcome to Vertex!',
      message: 'Your football development journey starts here.',
      features: [
        '📊 Track your progress',
        '🎯 Set and achieve goals',
        '💬 Get coach feedback',
        '🏆 Earn achievements',
      ],
    },
  };

  const content = roleMessages[role];
  
  const html = emailWrapper(`
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 48px;">🎉</span>
    </div>
    
    <h2 style="color: white; margin: 0 0 16px 0; font-size: 20px; text-align: center;">
      ${content.title}
    </h2>
    
    <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 24px 0;">
      Hi ${firstName},
    </p>
    
    <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 24px 0;">
      ${content.message}
    </p>
    
    <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 16px 0;">
      Here's what you can do:
    </p>
    
    <ul style="color: #a3a3a3; line-height: 2; margin: 0 0 24px 0; padding-left: 0; list-style: none;">
      ${content.features.map(f => `<li>${f}</li>`).join('')}
    </ul>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${FRONTEND_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #22c55e, #10b981); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Go to Dashboard
      </a>
    </div>
  `);

  return sendEmail({
    to,
    subject: `Welcome to Vertex, ${firstName}! 🎉`,
    html,
  });
}

// ========================================
// PASSWORD RESET EMAIL
// ========================================
export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  resetToken: string
) {
  const resetUrl = `${FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

  const html = emailWrapper(`
    <h2 style="color: white; margin: 0 0 16px 0; font-size: 20px;">Reset Your Password</h2>
    
    <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 24px 0;">
      Hi ${firstName},
    </p>
    
    <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 24px 0;">
      We received a request to reset your password. Click the button below to create a new password:
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #22c55e, #10b981); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Reset Password
      </a>
    </div>
    
    <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 16px 0; font-size: 14px;">
      This link will expire in 1 hour for security reasons.
    </p>
    
    <p style="color: #a3a3a3; line-height: 1.6; margin: 0; font-size: 14px;">
      If you didn't request this, you can safely ignore this email.
    </p>
  `);

  return sendEmail({
    to,
    subject: 'Reset your Vertex password',
    html,
  });
}

// ========================================
// BOOKING CONFIRMATION EMAIL
// ========================================
export async function sendBookingConfirmationEmail(
  to: string,
  recipientName: string,
  playerName: string,
  sessionDate: string,
  sessionTime: string,
  sessionLocation: string,
  coachName: string,
  status: 'PENDING' | 'CONFIRMED'
) {
  const isPending = status === 'PENDING';
  
  const html = emailWrapper(`
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 48px;">${isPending ? '📅' : '✅'}</span>
    </div>
    
    <h2 style="color: white; margin: 0 0 16px 0; font-size: 20px; text-align: center;">
      ${isPending ? 'Booking Request Sent' : 'Session Confirmed!'}
    </h2>
    
    <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 24px 0;">
      Hi ${recipientName},
    </p>
    
    <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 24px 0;">
      ${isPending 
        ? `Your booking request for ${playerName}'s training session has been sent to Coach ${coachName}. You'll receive a confirmation once it's approved.`
        : `Great news! ${playerName}'s training session with Coach ${coachName} has been confirmed.`
      }
    </p>
    
    <div style="background-color: #262626; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <h3 style="color: white; margin: 0 0 16px 0; font-size: 16px;">Session Details</h3>
      
      <div style="margin-bottom: 12px;">
        <span style="color: #737373; font-size: 14px;">📆 Date</span>
        <p style="color: white; margin: 4px 0 0 0; font-weight: 600;">${sessionDate}</p>
      </div>
      
      <div style="margin-bottom: 12px;">
        <span style="color: #737373; font-size: 14px;">⏰ Time</span>
        <p style="color: white; margin: 4px 0 0 0; font-weight: 600;">${sessionTime}</p>
      </div>
      
      <div style="margin-bottom: 12px;">
        <span style="color: #737373; font-size: 14px;">📍 Location</span>
        <p style="color: white; margin: 4px 0 0 0; font-weight: 600;">${sessionLocation}</p>
      </div>
      
      <div>
        <span style="color: #737373; font-size: 14px;">👤 Coach</span>
        <p style="color: white; margin: 4px 0 0 0; font-weight: 600;">${coachName}</p>
      </div>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${FRONTEND_URL}/bookings" style="display: inline-block; background: linear-gradient(135deg, #22c55e, #10b981); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View Booking
      </a>
    </div>
  `);

  return sendEmail({
    to,
    subject: isPending 
      ? `Booking request for ${playerName} - Awaiting confirmation`
      : `Session confirmed for ${playerName} on ${sessionDate}`,
    html,
  });
}

// ========================================
// SESSION REMINDER EMAIL (24h before)
// ========================================
export async function sendSessionReminderEmail(
  to: string,
  recipientName: string,
  playerName: string,
  sessionDate: string,
  sessionTime: string,
  sessionLocation: string,
  coachName: string
) {
  const html = emailWrapper(`
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 48px;">⏰</span>
    </div>
    
    <h2 style="color: white; margin: 0 0 16px 0; font-size: 20px; text-align: center;">
      Training Session Tomorrow!
    </h2>
    
    <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 24px 0;">
      Hi ${recipientName},
    </p>
    
    <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 24px 0;">
      This is a friendly reminder that ${playerName} has a training session scheduled for tomorrow.
    </p>
    
    <div style="background-color: #262626; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <div style="margin-bottom: 12px;">
        <span style="color: #737373; font-size: 14px;">📆 Date</span>
        <p style="color: white; margin: 4px 0 0 0; font-weight: 600;">${sessionDate}</p>
      </div>
      
      <div style="margin-bottom: 12px;">
        <span style="color: #737373; font-size: 14px;">⏰ Time</span>
        <p style="color: white; margin: 4px 0 0 0; font-weight: 600;">${sessionTime}</p>
      </div>
      
      <div style="margin-bottom: 12px;">
        <span style="color: #737373; font-size: 14px;">📍 Location</span>
        <p style="color: white; margin: 4px 0 0 0; font-weight: 600;">${sessionLocation}</p>
      </div>
      
      <div>
        <span style="color: #737373; font-size: 14px;">👤 Coach</span>
        <p style="color: white; margin: 4px 0 0 0; font-weight: 600;">${coachName}</p>
      </div>
    </div>
    
    <p style="color: #a3a3a3; line-height: 1.6; margin: 0; font-size: 14px;">
      📝 Don't forget: Bring water, appropriate footwear, and arrive 10 minutes early!
    </p>
  `);

  return sendEmail({
    to,
    subject: `Reminder: ${playerName}'s training session tomorrow at ${sessionTime}`,
    html,
  });
}

// ========================================
// SESSION FEEDBACK EMAIL
// ========================================
export async function sendSessionFeedbackEmail(
  to: string,
  recipientName: string,
  playerName: string,
  sessionDate: string,
  coachName: string,
  effortRating: number,
  highlights?: string,
  improvements?: string
) {
  const html = emailWrapper(`
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 48px;">📊</span>
    </div>
    
    <h2 style="color: white; margin: 0 0 16px 0; font-size: 20px; text-align: center;">
      Session Feedback for ${playerName}
    </h2>
    
    <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 24px 0;">
      Hi ${recipientName},
    </p>
    
    <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 24px 0;">
      Coach ${coachName} has submitted feedback for ${playerName}'s session on ${sessionDate}.
    </p>
    
    <div style="text-align: center; margin: 24px 0;">
      <p style="color: #737373; font-size: 14px; margin: 0 0 8px 0;">Effort Rating</p>
      <p style="color: #22c55e; font-size: 36px; font-weight: bold; margin: 0;">${effortRating}/10</p>
    </div>
    
    ${highlights ? `
    <div style="background-color: #262626; border-radius: 12px; padding: 16px; margin: 16px 0; border-left: 4px solid #22c55e;">
      <p style="color: #22c55e; font-size: 12px; font-weight: 600; margin: 0 0 8px 0;">✨ HIGHLIGHTS</p>
      <p style="color: white; margin: 0; line-height: 1.6;">${highlights}</p>
    </div>
    ` : ''}
    
    ${improvements ? `
    <div style="background-color: #262626; border-radius: 12px; padding: 16px; margin: 16px 0; border-left: 4px solid #f59e0b;">
      <p style="color: #f59e0b; font-size: 12px; font-weight: 600; margin: 0 0 8px 0;">📈 AREAS TO IMPROVE</p>
      <p style="color: white; margin: 0; line-height: 1.6;">${improvements}</p>
    </div>
    ` : ''}
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${FRONTEND_URL}/performance" style="display: inline-block; background: linear-gradient(135deg, #22c55e, #10b981); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View Full Report
      </a>
    </div>
  `);

  return sendEmail({
    to,
    subject: `${playerName}'s session feedback from Coach ${coachName}`,
    html,
  });
}

// ========================================
// PLAYER INVITATION EMAIL
// ========================================
export async function sendPlayerInvitationEmail(
  to: string,
  recipientName: string,
  playerName: string,
  coachName: string,
  inviteToken: string,
  isParent: boolean
) {
  const setupUrl = `${FRONTEND_URL}/auth/setup-account?token=${inviteToken}`;

  const html = emailWrapper(`
    <h2 style="color: white; margin: 0 0 16px 0; font-size: 20px;">
      ${isParent ? `Your child ${playerName} has been added!` : `Welcome to Vertex, ${playerName}!`}
    </h2>
    
    <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 24px 0;">
      Hi ${recipientName},
    </p>
    
    <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 24px 0;">
      ${isParent 
        ? `Coach <strong style="color: white;">${coachName}</strong> has added ${playerName} to their training program on Vertex.`
        : `Coach <strong style="color: white;">${coachName}</strong> has invited you to join their training program on Vertex.`
      }
    </p>
    
    <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 24px 0;">
      Create your account to:
    </p>
    
    <ul style="color: #a3a3a3; line-height: 1.8; margin: 0 0 24px 0; padding-left: 20px;">
      <li>📊 Track ${isParent ? "your child's" : 'your'} progress and development</li>
      <li>📅 Book and manage training sessions</li>
      <li>💬 Receive feedback from the coach</li>
      <li>🏆 View achievements and milestones</li>
    </ul>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${setupUrl}" style="display: inline-block; background: linear-gradient(135deg, #22c55e, #10b981); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Create Your Account
      </a>
    </div>
    
    <p style="color: #a3a3a3; line-height: 1.6; margin: 0; font-size: 14px;">
      This invitation link will expire in 7 days.
    </p>
  `);

  return sendEmail({
    to,
    subject: isParent 
      ? `${playerName} has been added to Vertex by Coach ${coachName}`
      : `Coach ${coachName} has invited you to Vertex`,
    html,
  });
}

// ========================================
// BOOKING CANCELLED EMAIL
// ========================================
export async function sendBookingCancelledEmail(
  to: string,
  recipientName: string,
  playerName: string,
  sessionDate: string,
  sessionTime: string,
  coachName: string
) {
  const html = emailWrapper(`
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 48px;">❌</span>
    </div>
    
    <h2 style="color: white; margin: 0 0 16px 0; font-size: 20px; text-align: center;">
      Session Cancelled
    </h2>
    
    <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 24px 0;">
      Hi ${recipientName},
    </p>
    
    <p style="color: #a3a3a3; line-height: 1.6; margin: 0 0 24px 0;">
      The session scheduled for ${playerName} has been cancelled.
    </p>
    
    <div style="background-color: #262626; border-radius: 12px; padding: 20px; margin: 24px 0; opacity: 0.7;">
      <p style="color: #ef4444; font-size: 12px; font-weight: 600; margin: 0 0 12px 0;">CANCELLED SESSION</p>
      <p style="color: #a3a3a3; margin: 4px 0;"><s>📆 ${sessionDate}</s></p>
      <p style="color: #a3a3a3; margin: 4px 0;"><s>⏰ ${sessionTime}</s></p>
      <p style="color: #a3a3a3; margin: 4px 0;"><s>👤 Coach ${coachName}</s></p>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${FRONTEND_URL}/sessions" style="display: inline-block; background: linear-gradient(135deg, #22c55e, #10b981); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Book Another Session
      </a>
    </div>
  `);

  return sendEmail({
    to,
    subject: `Session cancelled: ${sessionDate} at ${sessionTime}`,
    html,
  });
}
