import nodemailer from "nodemailer";

/**
 * CampusEats Centralized Nodemailer Service
 * Supports real SMTP delivery and automatic test/preview fallback.
 * Strictly escapes user inputs and enforces attachment whitelist.
 */

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || "CampusEats <no-reply@campuseats.edu.bd>";

// Check if SMTP credentials are provided for real delivery
const isSmtpConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS && SMTP_HOST !== "localhost");

let transporter = null;

if (isSmtpConfigured) {
  try {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  } catch (err) {
    console.warn("[Mailer] Failed to configure SMTP transporter:", err.message);
  }
}

/**
 * HTML escaper to prevent email template injection / XSS.
 */
function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Validates and sanitizes email attachments.
 * Prevents path traversal and restricts to known safe types.
 */
const ALLOWED_MIME_TYPES = ["application/pdf", "text/plain", "image/png", "image/jpeg"];
const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateAttachment(attachment) {
  if (!attachment) return null;

  // Validate filename
  const filename = attachment.filename || "invoice.pdf";
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Validate MIME
  const contentType = attachment.contentType || "application/pdf";
  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    throw new Error(`Disallowed attachment type: ${contentType}`);
  }

  // Validate size if content is Buffer or string
  if (attachment.content) {
    const size = Buffer.byteLength(attachment.content);
    if (size > MAX_ATTACHMENT_SIZE_BYTES) {
      throw new Error(`Attachment exceeds 5MB size limit (${size} bytes)`);
    }
  }

  return {
    filename: sanitizedFilename,
    content: attachment.content,
    contentType,
  };
}

/**
 * Core sendMail function with audit logging and test/preview mode.
 */
export async function sendEmail({ to, subject, html, text, attachments = [] }) {
  if (!to || typeof to !== "string" || !to.includes("@")) {
    console.warn("[Mailer] Skipped email: invalid recipient address", to);
    return { success: false, reason: "invalid_recipient" };
  }

  // Validate attachments
  const cleanAttachments = [];
  for (const att of attachments) {
    try {
      const valid = validateAttachment(att);
      if (valid) cleanAttachments.push(valid);
    } catch (attErr) {
      console.warn("[Mailer] Attachment rejected:", attErr.message);
    }
  }

  const mailOptions = {
    from: EMAIL_FROM,
    to: to.trim(),
    subject: subject.trim(),
    text: text || html.replace(/<[^>]+>/g, " "),
    html,
    attachments: cleanAttachments,
  };

  if (!isSmtpConfigured || process.env.NODE_ENV === "test") {
    // Test / Preview mode: log outcome safely without leaking secrets
    console.log(
      `[Mailer: Preview Mode] Sent to: ${to} | Subject: "${subject}" | Attachments: ${cleanAttachments.length}`
    );
    return {
      success: true,
      mode: "preview",
      messageId: `preview-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      recipient: to,
    };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Mailer: Delivered] Sent to: ${to} | MessageId: ${info.messageId}`);
    return {
      success: true,
      mode: "delivered",
      messageId: info.messageId,
      recipient: to,
    };
  } catch (err) {
    console.error(`[Mailer: Delivery Failed] To: ${to} | Error: ${err.message}`);
    // Return structured failure rather than throwing so callers don't abort transactions
    return {
      success: false,
      mode: "failed",
      error: err.message,
      recipient: to,
    };
  }
}

/**
 * Standard Email Templates for CampusEats Lifecycle Events
 */

export const emailTemplates = {
  orderPlaced(order, customer) {
    return {
      subject: `[CampusEats] Order #${order.id} Confirmed at ${order.shopName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #18241c;">
          <h2 style="color: #047857;">Order Confirmed!</h2>
          <p>Hello ${escapeHtml(customer?.name || "Student")},</p>
          <p>Your order <strong>#${escapeHtml(order.id)}</strong> has been placed with <strong>${escapeHtml(order.shopName)}</strong>.</p>
          <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Delivery To:</strong> ${escapeHtml(order.deliveryAddressSnapshot)}</p>
            <p style="margin: 4px 0;"><strong>Total Amount:</strong> ৳${order.total}</p>
            <p style="margin: 4px 0;"><strong>Escrow Status:</strong> Payment safely held in Escrow</p>
          </div>
          <p>The shop is preparing your meal. A student rider will be assigned shortly.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 12px; color: #6b7280;">CampusEats — University Peer-to-Peer Dormitory Food Delivery</p>
        </div>
      `,
    };
  },

  /**
   * Section 8 requirement:
   * "On the actual picked_up event, send separate notifications to:
   *  1. the student/customer who placed the order; and
   *  2. the owner of the shop that prepared it."
   */
  orderPickedUpCustomer(order, customer, rider) {
    return {
      subject: `[CampusEats] Order #${order.id} is On The Way to Your Dorm!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #18241c;">
          <h2 style="color: #2563eb;">Your Food Has Been Picked Up!</h2>
          <p>Hello ${escapeHtml(customer?.name || "Student")},</p>
          <p>Rider <strong>${escapeHtml(rider?.name || "Campus Rider")}</strong> (${escapeHtml(rider?.phone || "Phone verified")}) has picked up your food from <strong>${escapeHtml(order.shopName)}</strong> and is en route to your dorm.</p>
          <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Destination:</strong> ${escapeHtml(order.deliveryAddressSnapshot)}</p>
            <p style="margin: 4px 0;"><strong>Your 4-Digit Delivery Code:</strong> <span style="font-size: 20px; font-weight: bold; letter-spacing: 2px;">${escapeHtml(order.deliveryVerificationCode || "----")}</span></p>
            <p style="margin: 4px 0; font-size: 13px; color: #4b5563;">Provide this 4-digit code to the rider when they arrive at your dorm lobby to confirm delivery.</p>
          </div>
          <p>Enjoy your meal!</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 12px; color: #6b7280;">CampusEats University Delivery Service</p>
        </div>
      `,
    };
  },

  orderPickedUpShopOwner(order, shopOwner, rider) {
    return {
      subject: `[CampusEats] Order #${order.id} Picked Up by Rider ${rider?.name || ""}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #18241c;">
          <h2 style="color: #d97706;">Package Dispatched from Shop</h2>
          <p>Hello ${escapeHtml(shopOwner?.name || "Shop Manager")},</p>
          <p>Rider <strong>${escapeHtml(rider?.name || "Campus Rider")}</strong> (${escapeHtml(rider?.phone || "")}) has verified pickup and collected order <strong>#${escapeHtml(order.id)}</strong> from your counter.</p>
          <div style="background: #fffbeb; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Order Total:</strong> ৳${order.total}</p>
            <p style="margin: 4px 0;"><strong>Status:</strong> Handed over to rider for dorm delivery</p>
          </div>
          <p>Escrow funds will be settled into your canteen balance as soon as the student enters their receipt code.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 12px; color: #6b7280;">CampusEats Merchant Operations</p>
        </div>
      `,
    };
  },

  orderDeliveredCustomer(order, customer) {
    return {
      subject: `[CampusEats] Order #${order.id} Successfully Delivered!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #18241c;">
          <h2 style="color: #059669;">Delivered!</h2>
          <p>Hello ${escapeHtml(customer?.name || "Student")},</p>
          <p>Your order <strong>#${escapeHtml(order.id)}</strong> has been marked as delivered at ${escapeHtml(order.deliveryAddressSnapshot)}.</p>
          <p>The escrow payment of ৳${order.total} has been settled. Please take a moment to rate your meal and rider experience!</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 12px; color: #6b7280;">Thank you for ordering with CampusEats.</p>
        </div>
      `,
    };
  },
};
