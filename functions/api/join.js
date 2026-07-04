function htmlResponse(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildErrorPage(message) {
  return htmlResponse(`<!doctype html>
<html lang="en-GB">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Join enquiry error</title>
    <style>
      body { font-family: system-ui, sans-serif; max-width: 42rem; margin: 4rem auto; padding: 0 1.25rem; line-height: 1.6; color: #1f2937; }
      a { color: #142b4d; }
      .panel { border: 1px solid #e5e1d8; background: #fafaf8; padding: 1.25rem; border-radius: 1rem; }
    </style>
  </head>
  <body>
    <div class="panel">
      <h1>We could not send your enquiry</h1>
      <p>${escapeHtml(message)}</p>
      <p><a href="/join/">Return to the form</a></p>
    </div>
  </body>
</html>`, 422);
}

async function verifyTurnstile(secret, token, ipAddress) {
  const payload = new URLSearchParams();
  payload.set("secret", secret);
  payload.set("response", token);
  if (ipAddress) {
    payload.set("remoteip", ipAddress);
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: payload,
  });

  if (!response.ok) {
    throw new Error("Turnstile verification request failed.");
  }

  return response.json();
}

async function sendEmail(env, enquiry) {
  const toEmail = env.JOIN_TO_EMAIL;
  const fromEmail = env.JOIN_FROM_EMAIL;
  if (!toEmail || !fromEmail) {
    throw new Error("Missing JOIN_TO_EMAIL or JOIN_FROM_EMAIL.");
  }

  const body = {
    personalizations: [
      {
        to: [{ email: toEmail, name: "Waterfall Lodge" }],
      },
    ],
    from: {
      email: fromEmail,
      name: env.JOIN_FROM_NAME || "Waterfall Lodge website",
    },
    reply_to: {
      email: enquiry.email,
      name: enquiry.name,
    },
    subject: `New join enquiry from ${enquiry.name}`,
    content: [
      {
        type: "text/plain",
        value: [
          "A new join enquiry was submitted.",
          "",
          `Name: ${enquiry.name}`,
          `Email: ${enquiry.email}`,
          `Phone: ${enquiry.phone}`,
          "",
          "Message:",
          enquiry.message,
          "",
          `Submitted at: ${new Date().toISOString()}`,
        ].join("\n"),
      },
    ],
  };

  const response = await fetch("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Email delivery failed with status ${response.status}.`);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const form = await request.formData();
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const message = String(form.get("message") || "").trim();
    const consent = String(form.get("consent") || "");
    const token = String(form.get("cf-turnstile-response") || "").trim();

    if (!name || !email || !phone || !message) {
      return buildErrorPage("Please complete all of the required fields.");
    }

    if (!consent) {
      return buildErrorPage("You must confirm the privacy notice before sending the form.");
    }

    if (!token) {
      return buildErrorPage("Turnstile verification is required.");
    }

    const turnstileSecret = env.TURNSTILE_SECRET_KEY;
    if (!turnstileSecret) {
      return buildErrorPage("The site is missing its Turnstile secret key.");
    }

    const verification = await verifyTurnstile(
      turnstileSecret,
      token,
      request.headers.get("CF-Connecting-IP") || ""
    );

    if (!verification.success) {
      return buildErrorPage("Turnstile verification failed. Please try again.");
    }

    await sendEmail(env, {
      name,
      email,
      phone,
      message,
    });

    return Response.redirect(new URL("/join/thanks/", request.url), 303);
  } catch (error) {
    return htmlResponse(`<!doctype html>
<html lang="en-GB">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Join enquiry error</title>
    <style>
      body { font-family: system-ui, sans-serif; max-width: 42rem; margin: 4rem auto; padding: 0 1.25rem; line-height: 1.6; color: #1f2937; }
      a { color: #142b4d; }
      .panel { border: 1px solid #e5e1d8; background: #fafaf8; padding: 1.25rem; border-radius: 1rem; }
    </style>
  </head>
  <body>
    <div class="panel">
      <h1>We could not send your enquiry</h1>
      <p>${escapeHtml(error instanceof Error ? error.message : "An unexpected error occurred.")}</p>
      <p><a href="/join/">Return to the form</a></p>
    </div>
  </body>
</html>`, 500);
  }
}
