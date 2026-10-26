# BuyWise – UI Content Specification

## Overview

This document outlines all content, features, and UI elements that should be available in the BuyWise application interface.

---

## 1. Header Section

### Logo & Branding
- **Logo**: BuyWise icon/logo
- **Title**: "BuyWise" (large, gradient text)
- **Tagline**: "Agentic AI Buying Assistant"
- **Status Badge**: "Multi-Agent Orchestrated" indicator

### Navigation Elements
- Home/Reset button
- Search bar (global)
- Settings gear icon
- User profile/Login button
- Dark/Light mode toggle

---

## 2. Search Interface

### Search Bar
- Large input field with placeholder: "What are you looking for?"
- Search button with loading state
- Recent searches dropdown
- Voice search microphone icon
- Autocomplete suggestions

### Search Filters
- **Category dropdown**: Electronics, Fashion, Home, Beauty, Sports, Books, etc.
- **Brand filter**: Multi-select brand chips
- **Price range slider**: Min-Max INR inputs
- **Platform filter**: Amazon, Flipkart, Croma, Reliance, Myntra checkboxes
- **Rating filter**: Star rating minimum selector
- **Availability filter**: In Stock Only toggle

### Preference Weights Panel
| Slider | Label | Default | Icon |
|--------|-------|---------|------|
| Price | Price Weight | 0.30 | 💰 |
| Reviews | Reviews Weight | 0.30 | 💬 |
| Rating | Rating Weight | 0.20 | ⭐ |
| Delivery | Delivery Weight | 0.20 | 🚚 |

---

## 3. Agent Progress Indicator

### Pipeline Visualization
When processing, show animated pipeline with stages:

| Step | Icon | Label | Duration |
|------|------|-------|----------|
| 1 | 🌐 | Searching websites | 0-1.5s |
| 2 | 📦 | Retrieving products | 1.5-3.5s |
| 3 | 💬 | Analyzing reviews | 3.5-5s |
| 4 | 💰 | Evaluating prices | 5-6.5s |
| 5 | ⚖️ | Scoring & ranking | 6.5-7.5s |
| 6 | 🎯 | Selecting top picks | 7.5-8.5s |
| 7 | 🧾 | Generating explanation | 8.5-10s |

### Status Indicators
- Active stage highlighted with shimmer animation
- Completed stages dimmed
- Pending stages grayed out
- Overall progress percentage

---

## 4. Results Summary Bar

### Search Metadata
- **Query**: Original search query displayed
- **Products Found**: Count (e.g., "Found 6 products")
- **Sources**: Platform badges (Amazon, Flipkart, etc.)
- **Search Time**: "Completed in 2.3s"
- **Filters Applied**: Active filter tags

---

## 5. Top 3 Recommendations Cards

### Best Overall (🥇 Gold)
- **Card Header**: "Best Overall" label
- **Product Title**: Full product name
- **Smart Score**: Large number (0-100)
- **Platform Badge**: Source e-commerce site
- **Price**: Current price in ₹
- **Original Price**: Strikethrough MRP
- **Rating**: Star rating
- **Delivery Time**: Days estimate
- **Warranty**: Warranty period
- **Why Selected**: 2 bullet points with checkmarks
- **Trade-off**: One consideration (italic)
- **Buy Button**: "View on [Platform]" link
- **Quick Add**: Wishlist heart icon

### Best Budget (💰 Green)
- Same fields as Best Overall
- Green accent color
- Highlight: "Lowest price with good score"

### Premium Pick (⭐ Purple)
- Same fields as Best Overall
- Purple accent color
- Highlight: "Highest quality & features"

---

## 6. Comparison Table

### Table Headers
| Column | Alignment | Description |
|--------|-----------|-------------|
| Rank | Left | Position number (1, 2, 3...) |
| Product | Left | Title, warranty, buy signal |
| Platform | Left | Source badge |
| Price | Right | Current price, original price |
| Rating | Right | Stars + number |
| Delivery | Right | Days |
| Score | Right | Smart Score |

### Table Features
- Sortable columns (click header)
- Row click → select for detail view
- Highlight selected row
- Buy recommendation badge (🟢 Buy, 🟡 Wait, ⚪ Neutral)
- Pagination for large result sets

### Row Actions
- Quick view icon (expand to modal)
- Compare checkbox
- Wishlist heart
- Share button

---

## 7. Product Detail Panel

### When a row is clicked, show expanded details:

#### Basic Info
- Large product image placeholder
- Full product title
- Brand name
- Platform + direct link
- Price (current + original)
- Discount percentage

#### Scores Breakdown
- **Smart Score**: Circular progress indicator
- Score components:
  - Price Score: (0-10)
  - Review Score: (0-10)
  - Rating Score: (0-10)
  - Delivery Score: (0-10)

#### Price Intelligence
- Current vs Original price
- Discount % badge
- Price fairness score (0-10)
- Buy/Wait recommendation
- Price trend chart (line graph)
- Risk level indicator

#### Review Summary
- Overall sentiment score
- Top 5 Pros (green bullets)
- Top 5 Cons (red bullets)
- Common complaints
- Durability assessment (Low/Medium/High)

#### Specifications (if available)
- Key specs table
- Technical details

#### Actions
- "View on [Platform]" button
- "Add to Wishlist" button
- "Set Price Alert" button
- "Compare" checkbox

---

## 8. Price Trend Chart

### Chart Elements
- **Type**: Line chart
- **X-Axis**: Time (T-30, T-25, ... T-0)
- **Y-Axis**: Price in ₹
- **Line**: Sky blue (#38bdf8)
- **Fill**: Gradient below line
- **Points**: Highlighted data points
- **Current Price**: Horizontal dashed line

### Chart Controls
- Time range selector (7d, 30d, 90d)
- Zoom in/out
- Hover tooltips with exact values

---

## 9. Explanation Section

### "Why These Recommendations?"
- Title: "Why these recommendations?"
- Icon: 🧾
- 5 bullet points maximum
- Each point: Arrow icon + explanation text

### Content Types
- Why Best Overall was selected
- Why Budget option differs from #1
- Trade-off considerations
- Platform-specific notes
- Final recommendation summary

---

## 10. Sidebar (Desktop)

### Quick Links
- Home
- Search History
- Wishlist
- Price Alerts
- Settings

### Trending Searches
- "Laptop under 50k"
- "Running shoes"
- "Wireless earbuds"
- etc.

### Categories
- Electronics
- Fashion
- Home & Kitchen
- Beauty
- Sports
- Books

---

## 11. User Account Section

### Logged Out State
- "Sign In" button
- "Create Account" link
- Benefits of signing in

### Logged In State
- User avatar/name
- Profile dropdown
- Menu items:
  - My Searches
  - Wishlist
  - Price Alerts
  - Settings
  - Sign Out

---

## 12. Wishlist Page

### Wishlist Item Card
- Product image
- Title
- Current price
- Price drop indicator (↓ from ₹X)
- Platform badge
- "View" button
- "Remove" button
- "Set Alert" button

### Features
- Sort by: Date Added, Price, Price Drop
- Filter by platform
- Empty state illustration

---

## 13. Price Alerts Page

### Alert Card
- Product thumbnail
- Product title
- Target price set
- Current price
- Price difference
- Alert status (Active/Triggered/Expired)
- "Edit" button
- "Delete" button

### Create Alert Modal
- Product info
- Target price input
- "Above/Below" selector
- Notify via: Email / SMS / Push
- Create button

---

## 14. Search History Page

### History Entry
- Date/time of search
- Query text
- Number of results
- "Re-run" button
- "Delete" button

### Features
- Clear all history
- Export history

---

## 15. Settings Page

### Sections

#### Account Settings
- Change email
- Change password
- Delete account

#### Notification Preferences
- Email notifications toggle
- Push notifications toggle
- SMS notifications toggle
- Alert frequency (Instant/Daily/Digest)

#### Display Preferences
- Dark/Light mode
- Default category
- Default platform filters
- Results per page

#### Weight Presets
- Save current weights as preset
- Load preset dropdown
- Default presets: Budget Buyer, Balanced, Quality First

---

## 16. Mobile Navigation

### Bottom Tab Bar
| Tab | Icon | Label |
|-----|------|-------|
| Home | 🏠 | Home |
| Search | 🔍 | Search |
| Wishlist | ❤️ | Wishlist |
| Alerts | 🔔 | Alerts |
| Profile | 👤 | Profile |

### Mobile Search Flow
- Full-screen search overlay
- Recent searches
- Category chips
- Voice search prominent

---

## 17. Comparison View

### Head-to-Head Mode
- Select 2 products to compare
- Side-by-side layout
- Spec by spec comparison

### Comparison Table
| Feature | Product A | Product B |
|---------|-----------|-----------|
| Price | ₹X | ₹Y |
| Rating | X stars | Y stars |
| Warranty | X months | Y months |
| Delivery | X days | Y days |
| Smart Score | XX | YY |

### Actions
- Swap products
- Add third product
- Remove from compare
- Return to list

---

## 18. Loading States

### Skeleton Screens
- Product card skeletons
- Table row skeletons
- Chart skeleton
- Explanation skeleton

### Progress Indicators
- Circular spinner
- Linear progress bar
- "Agents working..." text

---

## 19. Empty States

### No Results
- Illustration
- "No products found for '[query]'"
- Suggestions: Try different keywords, adjust filters
- "Clear Filters" button

### Empty Wishlist
- Illustration
- "Your wishlist is empty"
- "Start searching to add products"

### Empty Alerts
- Illustration
- "No price alerts set"
- "Set alerts to track product prices"

### No Search History
- "No recent searches"
- "Start searching to see history"

---

## 20. Error States

### Network Error
- Illustration
- "Unable to connect. Please check your internet."
- "Retry" button

### Server Error
- Illustration
- "Something went wrong on our end."
- "Try again in a few minutes"

### Rate Limit
- "Too many requests. Please wait a moment."
- Countdown timer

### API Error
- Specific error message
- Support contact link

---

## 21. Toast Notifications

### Types
- Success (green): "Added to wishlist"
- Error (red): "Failed to add. Try again."
- Info (blue): "Price alert created"
- Warning (amber): "Product may be out of stock"

### Position
- Bottom right (desktop)
- Bottom center (mobile)

---

## 22. Footer

### Content
- Product name: "BuyWise"
- Tagline: "Multi-Agent AI Buying Assistant"
- Links:
  - About
  - Privacy Policy
  - Terms of Service
  - Contact
- Social icons: GitHub, Twitter, LinkedIn
- Copyright: "© 2024 BuyWise"

---

## 23. Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile | < 640px | Single column, bottom nav |
| Tablet | 640-1024px | 2 column grid |
| Desktop | > 1024px | Full layout with sidebar |

---

## 24. Accessibility Features

### Keyboard Navigation
- Tab through all interactive elements
- Enter/Space to activate
- Escape to close modals
- Arrow keys for sliders

### Screen Reader
- ARIA labels on all elements
- Alt text for images
- Role attributes
- Live regions for updates

### Visual
- Sufficient color contrast (WCAG AA)
- Focus indicators
- Resizable text
- No seizure-inducing animations

---

## Priority Implementation Order

| Priority | Feature | Complexity |
|----------|---------|-----------|
| P0 | Search bar & filters | Low |
| P0 | Preference weights | Low |
| P0 | Top 3 cards | Medium |
| P0 | Comparison table | Medium |
| P0 | Price chart | Medium |
| P0 | Explanation section | Low |
| P1 | Wishlist | Medium |
| P1 | Price alerts | Medium |
| P1 | Search history | Low |
| P1 | User authentication | High |
| P2 | Comparison view | Medium |
| P2 | Mobile responsive | Medium |
| P2 | Settings page | Medium |
| P3 | Dark/Light mode | Low |
| P3 | Voice search | Medium |
| P3 | Notifications | Medium |
