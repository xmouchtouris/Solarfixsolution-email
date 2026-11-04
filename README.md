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

1. Build the upload folder with `npm run build`.
2. Download a backup of the current site through Afrihost File Manager or your FTP client.
3. In Afrihost ClientZone, select the domain under Hosting and open Website Manager (cPanel or CWP).
4. Confirm the domain uses a supported PHP version, **PHP 8.2 or newer**, through MultiPHP Manager or PHP Selector. This setup assumes an Afrihost Linux hosting plan with PHP enabled.
5. Upload the **contents of `dist/`** into the domain's document root, usually `public_html`. Keep the `css`, `js` and `images` folders intact. `index.html` and `send-email.php` must be directly in that root, not inside an extra `dist` folder.
6. Open the HTTPS website and check every page, the mobile menu, gallery and contact form. Confirm one real test enquiry arrives in `info@solarfixsolutions.co.za` and that replying goes to the address entered in the form.

Only upload `dist/`. The build includes the five HTML pages, the CSS, browser JavaScript, required images and the PHP endpoint. It excludes `.env`, `.git`, `node_modules`, the local preview server and development files. If any private files were uploaded previously, remove those copies from the public web directory.

Official instructions: [upload website files](https://help.afrihost.com/entry/how-to-publish-or-upload-your-website-files-to-the-internet-and-make-your-website-live/) · [change PHP version](https://help.afrihost.com/entry/how-to-update-your-domain-php-version/) · [supported scripts on Linux hosting](https://help.afrihost.com/entry/can-i-run-my-own-software-on-my-site/).

## How the contact form works

```text
Visitor → contact.html → send-email.php on Afrihost → hosting mail service → business inbox
```

The endpoint validates input, rejects header injection and a hidden spam field, and limits accepted requests to five per client IP per 15 minutes and 50 in total per hour. Counters are kept in the server's temporary directory, outside the public website. A locked counter file prevents concurrent requests from skipping the limit. Messages use plain text and a fixed recipient and sender, with the visitor's email as `Reply-To`.

The endpoint uses PHP's `mail()` function with `info@solarfixsolutions.co.za` as sender and recipient. It needs working outbound mail on the hosting account and a writable PHP temporary directory. PHP support is documented by Afrihost, but **outbound mail configuration and inbox delivery must be verified on this specific account**. If mail is unavailable, the form keeps the visitor's message and offers a direct email link. PHP accepting a message is not proof that it arrived in the inbox.

If a test does not arrive, check spam and the domain's mail routing/authentication in cPanel, then ask Afrihost whether PHP mail is enabled for the account. If they require authenticated SMTP, the PHP endpoint will need a server-side SMTP configuration; credentials must be kept outside `public_html`.

The allowed browser origins are the HTTPS versions of `solarfixsolutions.co.za` and `www.solarfixsolutions.co.za`. Update `$allowedOrigins` in `send-email.php` if the production domain changes. Use HTTPS. Without JavaScript, the regular form displays a result page with contact links.

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

The existing `.html` addresses and original photographs are preserved. Fonts load from Google Fonts with local sans-serif fallbacks. No framework or database is needed.

For this site, keeping Afrihost and using its PHP support is the simplest deployment. A Git-connected static host can automate publishing, but would require another solution for the PHP form. Staying on Afrihost keeps the public pages and contact endpoint together.
