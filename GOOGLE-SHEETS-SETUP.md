# Connect committee updates with Google Sheets

Google Sheets is the committee's free editing dashboard. The website reads a **published, read-only CSV**; committee members edit the private sheet itself. No counts or events are pre-filled with invented information.

## One-time setup

1. Sign in to a Google account and create a new Google Sheet. Rename its first tab `Website updates`.
2. Copy the header row below and paste it into cell A1. Keep the columns in this order:

   ```text
   type	key	value	title	role	date	details	urdu	education	image	link	status
   ```

   Or use the ready-to-import [website-updates-example.csv](./website-updates-example.csv): select cell A1 in the `Website updates` tab, choose **File → Import → Upload**, select the CSV, and choose **Replace data at selected cell**. The CSV includes the committee's example Tata hospital food distribution event from 14 October 2026, already in the correct date format, along with blank counter rows; edit or remove the event if its details change. After import, check **File → Share → Publish to web** and publish the `Website updates` tab as CSV if it is not already published.

3. Add one row for each counter. Enter the row's `type` and `key` as shown; leave `value` blank until the committee confirms the figure:

   | `type` | `key` |
   | --- | --- |
   | `counter` | `beneficiaries` |
   | `counter` | `aadhaar` |
   | `counter` | `counselling` |
   | `counter` | `food` |

   Leave `value` blank until the committee confirms the figure, then enter a non-negative whole number. The website labels these **People benefited**, **Aadhaar update sessions**, **Counselling sessions**, and **Free food distributions**.

4. To publish an event or open session, add a row with `type` set to `event` or `session`, a unique `key` (for example `tata-hospital-food-distribution`), a `title`, a `date` in `YYYY-MM-DD` format (for example `2026-10-14`, not `14/10/2026`), optional `details` and full HTTP(S) `link`, and `status` set to `published`. Set the date column to **Format → Number → Plain text** so Google Sheets preserves that format. Only published events/sessions dated today or later appear on the website; past ones disappear automatically. Use `draft` until an event is ready.

5. To update a current committee member, add one row with `type` `member` and that member's key from the list below. Edit that same row for future changes. Use `title` for the name, `role` for the position, `details` for the short bio, `urdu` for the Urdu bio, `education` for education/affiliations, `image` for a publicly viewable HTTPS photo URL, and `link` for an optional public profile. Existing values remain unchanged when a field is left blank. Set `status` to `draft` to temporarily hide that member. To add a member, use a new unique key, fill in `title` and `role`, and set `status` to `published`.

   Existing member keys:

   ```text
   anwar-ahmed-shaikh
   furquan-rizwan-shaikh
   azmat-ali
   badrul-hasan-siddiqui
   abulais-shaikh
   kasim-shaikh
   dastagir-ansari
   ```

6. Restrict the sheet's **Share** permissions to committee members who should be able to edit it. Then choose **File → Share → Publish to web**, select the `Website updates` tab and **Comma-separated values (.csv)**, and publish. Publishing makes this tab's contents publicly readable, so put only information that is okay to show on the website in it. Do not put phone numbers, private notes, or other sensitive information in the published tab.
7. Copy the published CSV link into `impact-config.js`, replacing the empty string. Commit and redeploy the website once. Check the publish settings to ensure changes to the sheet are automatically republished.

After setup, the committee can update the sheet without changing website code. Google Sheets and the existing website hosting can both be used on their free plans; this setup does not require a paid database or expose the sheet's edit permissions to website visitors.
