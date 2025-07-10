import { BRoute } from '../types';
import { request as fetchRequest } from '../utils';
import { DIRECTUS_URL, DIRECTUS_AUTH_BEARER,BASE_URL } from '../config';
import crypto from 'crypto';
import sendEmail from '../services/email';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';;
import fs from "fs/promises";
import path from "path";
import fs2 from "fs/promises";

// Path to your HTML email template
const FRONTEND_VERIFY_URL = `https://kazaswap.co/contract`;

const route: BRoute = {
  routes: {
    submit: {
      post: async (req, res) => {
        try {
          const {
            name,
            email,
            role,
            start_date,
            end_date,
            verification_token,
            ...otherFields
          } = req.body;

          if (!name || !email || !role) {
            return res.status(400).send({ error: 'Missing required fields' });
          }

          if (verification_token) {
            const contractRes = await fetchRequest(`${DIRECTUS_URL}/items/contract?filter[verification_token][_eq]=${verification_token}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${DIRECTUS_AUTH_BEARER}`,
              },
            });
            const contractData = await contractRes.json();
            const contract = contractData.data?.[0];

            if (!contract) return res.status(400).send({ error: 'Invalid or expired token' });
            if (new Date(contract.verification_expires_at) < new Date()) return res.status(400).send({ error: 'Token expired' });

            const contract_id = contract.id;

            const existingRes = await fetchRequest(`${DIRECTUS_URL}/items/contract_details?filter[contract_id][_eq]=${contract_id}&filter[role][_eq]=${role}`, {
              method: 'GET',
              headers: { Authorization: `Bearer ${DIRECTUS_AUTH_BEARER}` },
            });
            const existingData = await existingRes.json();
            if (existingData.data?.length) {
              return res.status(400).send({ error: `${role} has already submitted` });
            }

            const saveRes = await fetchRequest(`${DIRECTUS_URL}/items/contract_details`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${DIRECTUS_AUTH_BEARER}`,
              },
              body: JSON.stringify({
                contract_id,
                role,
                name,
                email,
                start_date,
                end_date,
                ...otherFields,
              }),
            });

            const saved = await saveRes.json();
            if (!saved.data) return res.status(500).send({ error: 'Failed to save guest/host data' });

            const allDetailsRes = await fetchRequest(`${DIRECTUS_URL}/items/contract_details?filter[contract_id][_eq]=${contract_id}`, {
              method: 'GET',
              headers: { Authorization: `Bearer ${DIRECTUS_AUTH_BEARER}` },
            });
            const allDetails = await allDetailsRes.json();
            const rolesSubmitted = [...new Set(allDetails.data.map((d: any) => d.role))];

            if (rolesSubmitted.includes('host') && rolesSubmitted.includes('guest')) {
              await fetchRequest(`${DIRECTUS_URL}/items/contract/${contract_id}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${DIRECTUS_AUTH_BEARER}`,
                },
                body: JSON.stringify({ is_complete: true }),
              });

              await finalizeContract(contract_id);
            }

            return res.status(201).send({ success: true, details: saved.data, contract_id });
          }

          if (!start_date || !end_date || !['host', 'guest'].includes(role)) {
  return res.status(400).send({ error: 'Start and end dates are required for the initiator (host or guest)' });
}

          const token = crypto.randomBytes(32).toString('hex');
          const expiresAt = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString();


          const contractPayload = {
            start_date,
            end_date,
            verification_token: token,
            verification_expires_at: expiresAt,
            is_complete: false,
          };
          const contractRes = await fetchRequest(`${DIRECTUS_URL}/items/contract`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${DIRECTUS_AUTH_BEARER}`,
            },
            body: JSON.stringify(contractPayload),
          });

          const contractData = await contractRes.json();
          if (!contractData.data?.id) return res.status(500).send({ error: 'Failed to create contract' });

          const contract_id = contractData.data.id;

          const detailRes = await fetchRequest(`${DIRECTUS_URL}/items/contract_details`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${DIRECTUS_AUTH_BEARER}`,
            },
            body: JSON.stringify({
              contract_id,
              name,
              email,
              role,
              start_date,
              end_date,
              ...otherFields,
            }),
          });

          const detailData = await detailRes.json();
          if (!detailData.data) return res.status(500).send({ error: 'Failed to save host data' });

          return res.status(201).send({
            contract: contractData.data,
            contract_details: detailData.data,
          });
        } catch (err) {
          console.error('Combined contract submission error', err);
          return res.status(500).send({ error: 'Internal server error' });
        }
      },
    },
    "": {
  get: async (req, res) => {
    try {
      const token = req.query.token as string;
      if (!token) return res.status(400).send({ error: 'Missing verification token' });

      const contractRes = await fetchRequest(`${DIRECTUS_URL}/items/contract?filter[verification_token][_eq]=${token}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${DIRECTUS_AUTH_BEARER}`,
        },
      });

      const contractData = await contractRes.json();
      const contract = contractData?.data?.[0];
      if (!contract) return res.status(404).send({ error: 'Invalid or expired token' });

      // ✅ Check expiration
      const now = new Date();
      const expiresAt = new Date(contract.verification_expires_at);
      if (expiresAt < now) {
        return res.status(403).send({ error: 'Verification token has expired' });
      }

      const detailsRes = await fetchRequest(`${DIRECTUS_URL}/items/contract_details?filter[contract_id][_eq]=${contract.id}`, {
        headers: {
          Authorization: `Bearer ${DIRECTUS_AUTH_BEARER}`,
        },
      });

      const detailsData = await detailsRes.json();
      const host = detailsData.data.find((d: any) => d.role === 'host') || null;
      const guest = detailsData.data.find((d: any) => d.role === 'guest') || null;

      return res.status(200).send({
        contract_id: contract.id,
        start_date: contract.start_date,
        end_date: contract.end_date,
        verification_expires_at: contract.verification_expires_at,
        is_complete: contract.is_complete,
        match_score: contract.match_score,
        host,
        guest,
      });
    } catch (err) {
      console.error('❌ Error fetching contract:', err);
      return res.status(500).send({ error: 'Internal server error' });
    }
  }
},

'send-email': {
  post: async (req, res) => {
    try {
      const { contract_id } = req.body;

      if (!contract_id) {
        return res.status(400).send({ error: 'Missing contract_id' });
      }

      // Capitalize helper
      const capitalize = (str:any) =>
        str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';

      // 1. Fetch contract
      const contractRes = await fetchRequest(`${DIRECTUS_URL}/items/contract/${contract_id}`, {
        headers: { Authorization: `Bearer ${DIRECTUS_AUTH_BEARER}` },
      });
      const contractJson = await contractRes.json();
      const contract = contractJson?.data;

      if (!contract || !contract.verification_token) {
        return res.status(404).send({ error: 'Contract not found or invalid' });
      }

      // 2. Fetch host & guest details
      const detailsRes = await fetchRequest(
        `${DIRECTUS_URL}/items/contract_details?filter[contract_id][_eq]=${contract_id}`,
        {
          headers: { Authorization: `Bearer ${DIRECTUS_AUTH_BEARER}` },
        }
      );
      const detailsJson = await detailsRes.json();
      const allDetails = detailsJson?.data || [];

      // 3. Prepare recipients
      const recipients = allDetails
        .filter((d:any) => d.email && (d.name || d.surname))
        .map((d:any) => ({
          email: d.email,
          name: capitalize(d.name),
          surname: capitalize(d.surname),
        }));

      if (!recipients.length) {
        return res.status(404).send({ error: 'No valid recipients found (host or guest)' });
      }
      console.log('Recipient:', recipients);


      // 4. Load and fill the HTML template
      // 4. Load email template from Directus translations
const transRes = await fetchRequest(
  `${DIRECTUS_URL}/items/translations?filter=${encodeURIComponent(JSON.stringify({
    _or: [
      { id: "email_houseswap_contract" }
    ]
  }))}`,
  {
    headers: { Authorization: `Bearer ${DIRECTUS_AUTH_BEARER}` },
  }
);

const transJson = await transRes.json();
const translations = transJson?.data || [];

const templateItem = translations.find((t: { id: any; }) => t.id === "email_houseswap_contract");


if (!templateItem) {
  return res.status(500).send({ error: 'Email template or subject not found in Directus' });
}

let rawHtml = templateItem.english;
if (rawHtml.startsWith("file://")) {
  rawHtml = await fs.readFile(rawHtml.replace("file:/", "."), { encoding: "utf8" });
}

      const verifyUrl = `${FRONTEND_VERIFY_URL}?token=${contract.verification_token}`;
      const expiry = new Date(contract.verification_expires_at).toLocaleDateString();

      // 5. Send email to each recipient
      const promises = recipients.map((recipient:any) => {
        const personalizedHtml = rawHtml
          .replace(/%name%/g, recipient.name)
          .replace(/%surname%/g, recipient.surname)
          .replace(/%url%/g, verifyUrl)
          .replace(/%expires_at%/g, expiry);

        return sendEmail({
          to: [{ email: recipient.email, name: `${recipient.name} ${recipient.surname}` }],
          subject: 'Share Contract - KazaSwap',
          content: personalizedHtml,
          contentType: 'text/html',
        });
      });

      await Promise.all(promises);

      return res.status(200).send({ message: 'Verification emails sent successfully.' });
    } catch (error) {
      console.error('❌ Email sending error:', error);
      return res.status(500).send({ error: 'Failed to send verification emails.' });
    }
  },
},




   'generate-pdf': {
  post: async (req, res) => {
    try {
      const { contract_id } = req.body;

      if (!contract_id) {
        return res.status(400).send({ error: 'Missing contract_id' });
      }

      // Fetch contract
      const contractRes = await fetchRequest(`${DIRECTUS_URL}/items/contract/${contract_id}`, {
        headers: { Authorization: `Bearer ${DIRECTUS_AUTH_BEARER}` },
      });
      const contractJson = await contractRes.json();
      const contract = contractJson?.data;
      if (!contract) {
        return res.status(404).send({ error: 'Contract not found' });
      }

      // Fetch host & guest
      const detailsRes = await fetchRequest(`${DIRECTUS_URL}/items/contract_details?filter[contract_id][_eq]=${contract_id}`, {
        headers: { Authorization: `Bearer ${DIRECTUS_AUTH_BEARER}` },
      });
      const detailsJson = await detailsRes.json();
      const host = detailsJson?.data?.find((d: any) => d.role === 'host');
      const guest = detailsJson?.data?.find((d: any) => d.role === 'guest');
      if (!host || !guest) {
        return res.status(404).send({ error: 'Host or Guest not found' });
      }

      // Create PDF
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Embed logo
      const logoPath = path.resolve(__dirname, '../../assets/KazaSwap_horizontal logo_black and yellow.png');
      const logoBytes = await fs2.readFile(logoPath);
      const logoImage = await pdfDoc.embedPng(logoBytes);

      const logoWidth = 110.74;
      const logoHeight = 43.73;
      const topMargin = 100;

      page.drawImage(logoImage, {
        x: (width - logoWidth) / 2,
        y: height - topMargin,
        width: logoWidth,
        height: logoHeight,
      });

      // Title below logo
      const title = 'Generated Contract';
      const titleSize = 18;
      const titleWidth = boldFont.widthOfTextAtSize(title, titleSize);

      const titleY = height - topMargin - logoHeight - 10;
      page.drawText(title, {
        x: (width - titleWidth) / 2,
        y: titleY,
        size: titleSize,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
     const formatDate = (date: string | number | Date): string => {
  if (!date) return 'Invalid Date';
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return 'Invalid Date';

  return parsedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};


const formattedDate = formatDate(new Date());
const formattedStartDate = formatDate(contract.start_date);
const formattedEndDate = formatDate(contract.end_date);

      // Body content with left padding
      const lines = [
        ``,
        `This contract is made between <b>${host.name} ${host.surname}</b> (referred to as the Host) and`,
        `<b>${guest.name} ${guest.surname}</b> (referred to as the Guest).`,
        `The swap will take place from <b>${formattedStartDate}</b> to <b>${formattedEndDate}</b>.`,
        ``,
        `The Host agrees to provide access to their home for the duration of this period.`,
        `Any changes to the agreed dates must be communicated by the Host to the`,
        `Guest in advance, so appropriate arrangements can be made.`,
        `The Host confirms that the home is described as <b>${host.cleanliness || 'N/A'}</b>.`,
        ``,
        `The Guest is expected to maintain the cleanliness of the home and leave it in`,
        `the same condition it was found.`,
        `The Guest expects the place to be <b>${host.cleanliness} </b> upon arrival and agrees to`,
        `<b>${guest.expectations?.trash ? 'take out the trash' : 'no trash duties'}</b> before departure. The Guest will <b>${guest.rules?.petsAllowed ? '' : 'not '}</b> bring pets`,
        `and is considered smoking <b>${guest.rules?.smokingAllowed ? 'allowed' : 'not allowed'}</b>.`,
        ``,
        `Both parties agree to:`,
        `• Share photos of their homes to show the current condition.`,
        `• Arrange a call before the swap to ensure expectations are aligned.`,
        ``,
        `Date of Agreement: <b>${formattedDate}</b>`,
      ];

      const leftPadding = 82; // 1 inch padding (72 points = 1 inch)
      let y = titleY - 30;
      
      // for (const line of lines) {
      //   page.drawText(line, {
      //     x: leftPadding, // Apply consistent left padding
      //     y,
      //     size: 12,
      //     font,
      //     color: rgb(140 / 255, 140 / 255, 140 / 255), 
      //   });
      //   y -= 20; // Slightly reduced line spacing for better readability
      // }
// Function to draw text with bold formatting
const drawFormattedText = (text: string, x: number, y: number) => {
  // Split the text by bold tags
  const parts = text.split(/(<b>|<\/b>)/);
  let currentX = x;
  let isBold = false;

  for (const part of parts) {
    if (part === '<b>') {
      isBold = true;
      continue;
    }
    if (part === '</b>') {
      isBold = false;
      continue;
    }
    
    if (part.trim().length > 0) {
      page.drawText(part, {
        x: currentX,
        y,
        size: 12,
        font: isBold ? boldFont : font,
        color: rgb(140 / 255, 140 / 255, 140 / 255),
      });
      // Move the x position based on the text width
      currentX += (isBold ? boldFont : font).widthOfTextAtSize(part, 12);
    }
  }
};

// Draw each line with proper formatting
for (const line of lines) {
  if (line.trim() === '') {
    y -= 20; // Empty line spacing
    continue;
  }

  if (line.startsWith('•')) {
    // Handle bullet points
    page.drawText('•', {
      x: leftPadding,
      y,
      size: 12,
      font,
      color: rgb(140 / 255, 140 / 255, 140 / 255),
    });
    drawFormattedText(line.slice(1), leftPadding + 10, y);
  } else {
    // Regular line
    drawFormattedText(line, leftPadding, y);
  }
  
  y -= 20; // Move to next line
}

      const pdfBytes = await pdfDoc.save();
      const base64 = Buffer.from(pdfBytes).toString('base64');

      return res.status(200).send({
        message: 'PDF generated successfully.',
        pdf: base64,
        filename: `${host.name}-contract-houseSwap.pdf`,
        contentType: 'application/pdf',
      });
    } catch (err) {
      console.error('❌ PDF Generation Error:', err);
      return res.status(500).send({ error: 'Internal Server Error' });
    }
  }
}
  }
};

export default route;

async function finalizeContract(contract_id: string) {
  try {
    const detailsRes = await fetchRequest(`${DIRECTUS_URL}/items/contract_details?filter[contract_id][_eq]=${contract_id}`, {
      headers: {
        Authorization: `Bearer ${DIRECTUS_AUTH_BEARER}`,
      },
    });
    const details = await detailsRes.json();
    const [host, guest] = ['host', 'guest'].map(role => details.data.find((d: any) => d.role === role));

    if (!host || !guest) return;

    let score = 0;
    const rules = ['petsAllowed', 'smokingAllowed', 'sharedSpace'];
    const expectations = ['trash', 'guests'];

    rules.forEach(key => {
      if (host.rules?.[key] === guest.rules?.[key]) score += 20;
    });

    expectations.forEach(key => {
      if (host.expectations?.[key] === guest.expectations?.[key]) score += 20;
    });

    await fetchRequest(`${DIRECTUS_URL}/items/contract/${contract_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DIRECTUS_AUTH_BEARER}`,
      },
      body: JSON.stringify({ match_score: score }),
    });

    console.log(`✅ Match score ${score} saved for contract ${contract_id}`);
  } catch (e) {
    console.error('❌ Failed to finalize contract:', e);
  }
}
