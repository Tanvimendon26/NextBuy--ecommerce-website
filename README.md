# Ecommerce (Static Demo)

A small static e-commerce demo built with plain HTML, CSS and JavaScript. It uses `data.json` as a product/catalog data source and provides a simple UI in `index.html` to browse products and categories.

**Purpose:** Example frontend for learning, prototyping, and UI experimentation. No server-side logic or persistent backend included.

---

## Features
- Browse product categories and product listing
- Product details shown from `data.json`
- Simple responsive layout using `style.css`
- Small, dependency-free codebase (vanilla JS)

---

## File Overview
- `index.html`: Main page and UI.
- `style.css`: Styles for layout and components.
- `script.js`: Client-side JavaScript that loads `data.json` and renders the UI.
- `data.json`: Product & category data used by the app.

---

## Data (`data.json`) Schema
The repository includes a ready dataset located at `data.json`. The top-level keys are `categories` and `products`.

- Category object fields (example): `id`, `name`, `description`, `image`, `isRecentlyViewed` (optional)
- Product object fields (example): `id`, `name`, `brand`, `category`, `price`, `originalPrice`, `discount`, `rating`, `description`, `image`, `colors`, `sizes`, `inStock`

Prices are integers in this dataset (e.g., `2999`), which represent currency units (adjust formatting in the UI as you need).

---

## Quick Start

Open the site in a browser by either:

- Directly double-clicking `index.html` to open it in your default browser (suitable for local testing), or
- Serve the folder with a simple static server (recommended to avoid CORS issues when loading `data.json`).

PowerShell (from the `ecommerce` folder):

```powershell
python -m http.server 8000
# then open http://localhost:8000 in your browser
```

Or with Node (if you have `serve` installed):

```powershell
npx serve -l 8000
# then open http://localhost:8000
```

---

## Development Notes
- The app is intentionally small and dependency-free.
- `script.js` expects `data.json` to be colocated with `index.html` (relative fetch). If you move files, update the fetch path.
- Images in `data.json` are externally hosted; you can replace them with local images if desired.

---

## Contributing
- Feel free to open issues or send PRs for improvements such as search, cart, filtering, or accessibility updates.

---

## License
This project is provided as-is for learning and demonstration. Add a license file if you want to set explicit reuse terms.
