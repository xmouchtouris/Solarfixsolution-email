# Solar Fix Solutions

A five-page website for Afrihost Linux hosting. The public website uses HTML, CSS and JavaScript. Its contact form runs on the same hosting account using `send-email.php`; Railway is no longer part of the application.

## Local preview

Node.js 18 or later is needed for the development tools. There are no npm dependencies to install.

```sh
npm run dev
```

Open http://127.0.0.1:8080. This is a UI preview: it serves only the generated public folder and deliberately returns an error for email submissions. It never reads `.env` or sends email. Re-run the command after editing files to refresh the generated folder.

```sh
npm run check
npm test
# If PHP is installed locally:
npm run check:php
```

The checks cover page links, local assets, headings, navigation, the form route, upload contents and the local server's handling of private files. They do not prove delivery of email on Afrihost.

## Publish on Afrihost

1. Run `npm run package:afrihost` to rebuild the public files and create `solar-fix-solutions-afrihost.zip`. This uses the `zip` utility included with macOS. Run it again after any website changes to generate a fresh archive.
2. Download a backup of the current site through Afrihost File Manager or your FTP client.
3. In Afrihost ClientZone, select the domain under Hosting and open Website Manager (cPanel or CWP).
4. Confirm the domain uses a supported PHP version, **PHP 8.2 or newer**, through MultiPHP Manager or PHP Selector. In cPanel **Domains**, enable **Force HTTPS Redirect** for `solarfixsolutions.co.za` once its SSL certificate is valid. The contact endpoint intentionally rejects HTTP browser origins. This setup assumes an Afrihost Linux hosting plan with PHP enabled.
5. In cPanel File Manager, open the domain's document root (usually `public_html`), click **Upload**, and upload the single ZIP. Return to File Manager, select the ZIP, click **Extract**, and extract into that same document root. The archive preserves the `css`, `js` and `images` folders, with `index.html` and `send-email.php` directly in the root. It does not add a `dist` folder. Confirm the existing site files have been replaced with the new version.
6. Open the HTTPS website and check every page, the mobile menu, gallery and contact form. Confirm one real test enquiry arrives in `info@solarfixsolutions.co.za` and that replying goes to the address entered in the form. After verifying the update, remove the uploaded ZIP from the server.

Only upload the generated ZIP or the contents of `dist/`. The build includes the five HTML pages, the CSS, browser JavaScript, required images and the PHP endpoint. It excludes `.env`, `.git`, `node_modules`, the local preview server and development files. If any private files were uploaded previously, remove those copies from the public web directory. If you prefer an FTP client, `npm run build` still prepares `dist/` for a folder upload.

Official instructions: [upload website files](https://help.afrihost.com/entry/how-to-publish-or-upload-your-website-files-to-the-internet-and-make-your-website-live/) · [upload and extract a ZIP in cPanel](https://support.cpanel.net/hc/en-us/articles/360055141854-Using-File-Manager-To-Extract-Files) · [change PHP version](https://help.afrihost.com/entry/how-to-update-your-domain-php-version/) · [supported scripts on Linux hosting](https://help.afrihost.com/entry/can-i-run-my-own-software-on-my-site/).

## How the contact form works

```text
Visitor → contact.html → send-email.php on Afrihost → hosting mail service → business inbox
```

The endpoint validates input, rejects header injection and a hidden spam field, and limits accepted requests to five per client IP per 15 minutes and 50 in total per hour. Counters are kept in the server's temporary directory, outside the public website. A locked counter file prevents concurrent requests from skipping the limit. Messages use plain text and a fixed recipient and sender, with the visitor's email as `Reply-To`.

The endpoint uses PHP's `mail()` function with `info@solarfixsolutions.co.za` as sender and recipient. It needs working outbound mail on the hosting account and a writable PHP temporary directory. PHP support is documented by Afrihost, but **outbound mail configuration and inbox delivery must be verified on this specific account**. If mail is unavailable, the form keeps the visitor's message and offers a direct email link. PHP accepting a message is not proof that it arrived in the inbox.

If a test does not arrive, check spam and the domain's mail routing/authentication in cPanel, then ask Afrihost whether PHP mail is enabled for the account. If they require authenticated SMTP, the PHP endpoint will need a server-side SMTP configuration; credentials must be kept outside `public_html`.

The allowed browser origins are the HTTPS versions of `solarfixsolutions.co.za` and `www.solarfixsolutions.co.za`. Update `$allowedOrigins` in `send-email.php` if the production domain changes. Use HTTPS. Without JavaScript, the regular form displays a result page with contact links.

If the form shows an error, first confirm the address starts with `https://`. The site must redirect HTTP visitors to HTTPS using cPanel's [Force HTTPS Redirect setting](https://docs.cpanel.net/cpanel/domains/domains/); simply serving a valid HTTPS page does not enable this redirect. Keep the HTTPS-only origin check in PHP.

The form displays the endpoint's public error message while preserving the visitor's input. If a request still fails over HTTPS, inspect the `send-email.php` request's status and response in the browser's Network panel. A 400 indicates invalid fields, 403 indicates a rejected origin, 429 indicates rate limiting, and 503 indicates a temporary-storage or mail-service failure. A non-JSON error may come from the web server or hosting firewall. Check the PHP error log in cPanel for the same time; use Email → Track Delivery if the mail server accepted a message but it did not arrive. A successful GET check (the endpoint's normal 405 response) only proves that PHP executes, not that sending works.

## Retiring Railway

The previous application used a Node/Express email service and a Railway URL. Those dependencies and references have been removed from the live website code. `server.js` is now only a dependency-free local UI preview.

After the Afrihost form is deployed and a test enquiry has arrived, stop/delete the old Railway service in its dashboard and cancel any associated resources or subscriptions you no longer need. This repository change does not close the Railway account or stop its billing. The old `.env` remains ignored locally and is no longer read by the application.

## Editing the website

- `index.html`: homepage, service overview, project highlights and contact links.
- `about.html`: company story and founders.
- `services.html`: service details and FAQs.
- `pictures.html`: project gallery with an accessible dialog and keyboard controls.
- `contact.html`: contact information and enquiry form.
- `css/styles.css`: shared colours, typography and responsive layouts.
- `js/scripts.js`: mobile navigation, gallery and form feedback.
- `send-email.php`: production email endpoint.

The existing `.html` addresses are preserved. Fonts load from Google Fonts with local sans-serif fallbacks. No framework or database is needed.

The gallery contains eight selected photographs: two existing rooftop views and six newer inverter/battery installations. Website images use descriptive, lowercase filenames. The full supplied logo appears in the footer; the header displays its roof-and-sun artwork alongside the business name. Source photographs are not retouched, and the originals supplied in Downloads are unchanged. Unselected older images remain in the repository but are excluded from `dist/`.

When adding or renaming an image, update its page references and the explicit public-file list in `scripts/build-static.mjs`, then run the checks and build again.

For this site, keeping Afrihost and using its PHP support is the simplest deployment. A Git-connected static host can automate publishing, but would require another solution for the PHP form. Staying on Afrihost keeps the public pages and contact endpoint together.
