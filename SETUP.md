# Duct Divers Sales System — Setup Guide

## Overview
- **Frontend**: GitHub Pages (`sales.ductdiversllc.com`)
- **Backend**: Google Apps Script (acts as API)
- **Database**: Google Sheets

---

## Step 1 — Set Up Google Apps Script

1. Open your **Duct Divers Sales System** Google Sheet
2. Click **Extensions → Apps Script**
3. Delete all default code in the editor
4. Open `apps-script.js` from this repo and paste the entire contents
5. Find this line near the top and replace with your actual Spreadsheet ID:
   ```js
   const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";
   ```
   > **How to find your Spreadsheet ID**: It's in the URL of your Google Sheet:
   > `https://docs.google.com/spreadsheets/d/`**THIS_PART_HERE**`/edit`

6. Click **Save** (floppy disk icon)
7. Click **Deploy → New deployment**
8. Click the gear icon ⚙ next to "Select type" → choose **Web app**
9. Set:
   - Description: `Duct Divers Sales API`
   - Execute as: **Me**
   - Who has access: **Anyone**
10. Click **Deploy**
11. **Copy the Web App URL** — it looks like:
    `https://script.google.com/macros/s/XXXXXXXXXX/exec`

---

## Step 2 — Configure the Frontend

1. Open `js/config.js`
2. Replace `YOUR_APPS_SCRIPT_URL_HERE` with the URL you just copied:
   ```js
   SCRIPT_URL: "https://script.google.com/macros/s/XXXXXXXXXX/exec",
   ```
3. Save the file

---

## Step 3 — Push to GitHub

```bash
cd duct-divers-sales
git init
git add .
git commit -m "Initial deploy"
git branch -M main
git remote add origin https://github.com/boraytuna/duct-divers-sales.git
git push -u origin main
```

---

## Step 4 — Enable GitHub Pages

1. Go to your repo: `https://github.com/boraytuna/duct-divers-sales`
2. Click **Settings → Pages**
3. Under "Source" select **Deploy from a branch**
4. Branch: **main**, Folder: **/ (root)**
5. Click **Save**
6. Wait ~60 seconds — your site will be live at:
   `https://boraytuna.github.io/duct-divers-sales`

---

## Step 5 — Connect Custom Domain (sales.ductdiversllc.com)

### On GitHub:
1. Go to **Settings → Pages**
2. Under "Custom domain" enter: `sales.ductdiversllc.com`
3. Click **Save** — GitHub will create a `CNAME` file in your repo automatically

### On Hostinger:
1. Log into Hostinger → go to your domain DNS settings
2. Add a new DNS record:
   - Type: **CNAME**
   - Name: `sales`
   - Value: `boraytuna.github.io`
   - TTL: 3600 (or default)
3. Save

DNS propagation takes 5–30 minutes. After that,
`https://sales.ductdiversllc.com` will load your GitHub Pages site.

> **Enable HTTPS**: Back in GitHub Pages settings, check
> "Enforce HTTPS" after the domain connects.

---

## Step 6 — Test Everything

Run through this checklist:

- [ ] Open `sales.ductdiversllc.com` on your phone
- [ ] Submit a test sale — check Google Sheet "Sales" tab for the new row
- [ ] Clock in on Hours page — check "Hours" tab for a row with Clock In time
- [ ] Clock out — check that Clock Out and Total Hours filled in
- [ ] View Leaderboard — confirm your test sale shows up under "Today"
- [ ] Test autocomplete — type a name and confirm roster names appear

---

## Updating the Roster (Adding/Removing Salespeople)

Just edit the **Roster** tab in Google Sheets — add names below the header row.
No code changes needed. The site pulls the list live on every session.

---

## Redeploying After Code Changes

Whenever you update `apps-script.js`:
1. Go back to Apps Script → **Deploy → Manage deployments**
2. Click the pencil ✏ on your deployment
3. Change version to **New version**
4. Click **Deploy**

For frontend changes (HTML/CSS/JS), just push to GitHub — Pages redeploys automatically within ~60 seconds.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Form submits but no data in sheet | Check SCRIPT_URL in `config.js` is correct |
| Autocomplete shows nothing | Verify Roster tab has names in column A starting row 2 |
| Clock out says "no open session" | Name must match exactly what was used to clock in |
| Custom domain not working | DNS can take up to 48hrs; check CNAME record is correct |
| Apps Script error on redeploy | Make sure "Execute as: Me" and you're logged in as Duct Divers Gmail |