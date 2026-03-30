import { pool } from "./db.js";
import { redis } from "./db.js";

const CHECK_INTERVAL_HOURS = 24;

export async function checkPriceAlerts() {
  console.log("🔔 Checking price alerts...");

  try {
    const result = await pool.query(`
      SELECT pa.*, u.email 
      FROM price_alerts pa 
      JOIN users u ON pa.user_id = u.id 
      WHERE pa.notified_at IS NULL 
      OR pa.notified_at < NOW() - INTERVAL '24 hours'
    `);

    const alerts = result.rows;
    console.log(`   Found ${alerts.length} alerts to check`);

    for (const alert of alerts) {
      try {
        const product = await fetchProductPrice(alert.product_id, alert.product_name);
        
        if (!product) continue;

        const currentPrice = parseFloat(product.price);
        const targetPrice = parseFloat(alert.target_price);

        await pool.query(
          "UPDATE price_alerts SET current_price = $1 WHERE id = $2",
          [currentPrice, alert.id]
        );

        if (currentPrice <= targetPrice) {
          await sendPriceAlertEmail(alert, currentPrice);
          
          await pool.query(
            "UPDATE price_alerts SET notified_at = NOW() WHERE id = $1",
            [alert.id]
          );
          
          console.log(`   ✅ Alert sent for ${alert.product_name} - Price dropped to ₹${currentPrice}`);
        }
      } catch (err) {
        console.error(`   ❌ Error checking alert ${alert.id}:`, err.message);
      }
    }

    console.log("✅ Price alert check complete");
  } catch (err) {
    console.error("❌ Price alert check failed:", err.message);
  }
}

async function fetchProductPrice(productId, productName) {
  if (redis) {
    const cached = await redis.get(`product:${productId}`);
    if (cached) {
      return JSON.parse(cached);
    }
  }

  return null;
}

async function sendPriceAlertEmail(alert, currentPrice) {
  console.log(`   📧 Price alert email would be sent to ${alert.email}`);
  console.log(`      Product: ${alert.product_name}`);
  console.log(`      Target: ₹${alert.target_price} → Current: ₹${currentPrice}`);
  console.log(`      Savings: ₹${alert.target_price - currentPrice}`);
}

export function startPriceAlertScheduler() {
  console.log(`🔔 Price alert scheduler started (checks every ${CHECK_INTERVAL_HOURS} hours)`);
  
  setInterval(() => {
    checkPriceAlerts();
  }, CHECK_INTERVAL_HOURS * 60 * 60 * 1000);

  checkPriceAlerts();
}
