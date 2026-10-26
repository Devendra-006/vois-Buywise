import { env } from "../config/env.js";

interface PriceDropAlertData {
  userEmail: string;
  productTitle: string;
  currentPrice: number;
  targetPrice: number;
  productUrl: string;
  store: string;
}

export async function sendPriceAlertEmail(data: PriceDropAlertData): Promise<boolean> {
  const { userEmail, productTitle, currentPrice, targetPrice, productUrl, store } = data;

  console.log(`🔔 [PRICE ALERT TRIGGERED] Sending email to ${userEmail} for "${productTitle}" - Current ₹${currentPrice} (Target: ₹${targetPrice})`);

  if (!env.RESEND_API_KEY) {
    console.log(`ℹ️ [MOCK EMAIL DISPATCHER] (Resend API key not set)
      To: ${userEmail}
      From: ${env.MAIL_FROM}
      Subject: Price Drop Alert: ${productTitle} is now ₹${currentPrice}!
      Body: Good news! The product you tracked on ${store} has dropped to ₹${currentPrice}, hitting your target of ₹${targetPrice}.
      Buy Now: ${productUrl}
    `);
    return true;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: env.MAIL_FROM,
        to: userEmail,
        subject: `🎯 Price Drop Alert: ${productTitle} is now ₹${currentPrice.toLocaleString("en-IN")}!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E7E2DA; border-radius: 8px;">
            <h2 style="color: #1F6F54; margin-top: 0;">BuyWise Price Alert</h2>
            <p>Great news! The product you tracked has dropped below your target price.</p>
            <div style="background: #FAF8F5; padding: 16px; border-radius: 6px; margin: 16px 0;">
              <h3 style="margin: 0 0 8px 0; color: #14130F;">${productTitle}</h3>
              <p style="margin: 4px 0; font-size: 18px; font-weight: bold; color: #1F6F54;">
                Current Price: ₹${currentPrice.toLocaleString("en-IN")}
              </p>
              <p style="margin: 4px 0; color: #5C574F;">
                Your Target Price: ₹${targetPrice.toLocaleString("en-IN")} | Store: ${store}
              </p>
            </div>
            <a href="${productUrl}" style="display: inline-block; background: #1F6F54; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              View on ${store} &rarr;
            </a>
          </div>
        `
      })
    });

    return res.ok;
  } catch (err: any) {
    console.error("❌ Failed to send alert email via Resend:", err.message);
    return false;
  }
}
