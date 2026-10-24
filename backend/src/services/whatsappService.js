async function sendTemplateMessage(
  to,
  templateName,
  languageCode = "tr",
  parameters = []
) {
  const accessToken =
    process.env.WHATSAPP_ACCESS_TOKEN;

  const phoneNumberId =
    process.env.WHATSAPP_PHONE_NUMBER_ID;

  const apiVersion =
    process.env.WHATSAPP_API_VERSION;

  if (
    !accessToken ||
    !phoneNumberId ||
    !apiVersion
  ) {
    throw new Error(
      "WhatsApp .env bilgileri eksik."
    );
  }

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",

      headers: {
        Authorization:
          `Bearer ${accessToken}`,

        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        messaging_product: "whatsapp",

        to,

        type: "template",

        template: {
          name: templateName,

          language: {
            code: languageCode,
          },

          components: [
            {
              type: "body",

              parameters:
                parameters.map(
                  (value) => ({
                    type: "text",
                    text: String(value),
                  })
                ),
            },
          ],
        },
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error(
      "WhatsApp API hatası:",
      data
    );

    throw new Error(
      data?.error?.message ||
        "WhatsApp mesajı gönderilemedi."
    );
  }

  return data;
}

module.exports = {
  sendTemplateMessage,
};