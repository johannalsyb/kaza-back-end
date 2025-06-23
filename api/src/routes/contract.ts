import { BRoute } from '../types';
import { request as fetchRequest } from '../utils';
import { DIRECTUS_URL, DIRECTUS_AUTH_BEARER,BASE_URL } from '../config';
import crypto from 'crypto';
import sendEmail from '../services/email';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

const FRONTEND_VERIFY_URL = `${BASE_URL}/kaza/contract`;

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
            const contractRes = await fetchRequest(`${DIRECTUS_URL}/items/contracts?filter[verification_token][_eq]=${verification_token}`, {
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
              await fetchRequest(`${DIRECTUS_URL}/items/contracts/${contract_id}`, {
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

          if (!start_date || !end_date || role !== 'host') {
            return res.status(400).send({ error: 'Missing dates for host' });
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

          const contractRes = await fetchRequest(`${DIRECTUS_URL}/items/contracts`, {
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
      get: async (req, res) => {
        try {
          const token = req.query.token as string;
          if (!token) {
            return res.status(400).send({ error: 'Missing verification token' });
          }
  
          // Fetch contract by token
          const contractRes = await fetchRequest(`${DIRECTUS_URL}/items/contracts?filter[verification_token][_eq]=${token}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${DIRECTUS_AUTH_BEARER}`,
            },
          });
  
          const contractData = await contractRes.json();
          const contract = contractData?.data?.[0];
  
          if (!contract) {
            return res.status(404).send({ error: 'Invalid or expired token' });
          }
  
          // Fetch host and guest details
          const detailsRes = await fetchRequest(`${DIRECTUS_URL}/items/contract_details?filter[contract_id][_eq]=${contract.id}`, {
            method: 'GET',
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
            is_complete: contract.is_complete,
            match_score: contract.match_score,
            host,
            guest,
          });
        } catch (err) {
          console.error('❌ Error fetching contract by token:', err);
          return res.status(500).send({ error: 'Internal server error' });
        }
      }
    },
    'send-email': {
      post: async (req, res) => {
        try {
          const { email, name, verification_token } = req.body;
          if (!email || !name || !verification_token) {
            return res.status(400).send({ error: 'Email is required' });
          }
          const verifyUrl = `${FRONTEND_VERIFY_URL}?token=${verification_token}`;
          await sendEmail({
            to: [{ email, name }],
            subject: 'Verify your contract',
            content: `<p>Please complete the other side of the contract <a href="${verifyUrl}">here</a>.</p>`,
            contentType: 'text/html',
          });
          return res.status(200).send({ message: 'Verification email sent successfully.' });
        } catch (error) {
          console.log(error);
          return res.status(500).send({ error: 'Failed to send verification email.' });
        }
      }
    },
    'generate-pdf': {
      post: async (req, res) => {
        try {
          const { contract_id } = req.body;

          if (!contract_id) {
            return res.status(400).send({ error: 'Missing contract_id' });
          }

          // Fetch contract
          const contractRes = await fetchRequest(`${DIRECTUS_URL}/items/contracts/${contract_id}`, {
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
          const logoBytes = fs.readFileSync(logoPath);
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
          const titleSize = 14;
          const titleWidth = boldFont.widthOfTextAtSize(title, titleSize);

          const titleY = height - topMargin - logoHeight - 30;
          page.drawText(title, {
            x: (width - titleWidth) / 2,
            y: titleY,
            size: titleSize,
            font: boldFont,
            color: rgb(0, 0, 0),
          });

          // Body content
          const lines = [
            ``,
            `This contract is made between ${host.name} (Host) and ${guest.name} (Guest).`,
            `The swap will take place from ${contract.start_date} to ${contract.end_date}.`,
            ``,
            `The Host agrees to provide access to their home for the duration of this period.`,
            `Any changes to the agreed dates must be communicated by the Host to the Guest`,
            `in advance, so appropriate arrangements can be made.`,
            `The Host confirms that the home is described as ${host.cleanliness || 'N/A'}.`,
            ``,
            `The Guest is expected to maintain the cleanliness of the home and leave it in`,
            `the same condition it was found.`,
            `The Guest expects the place to be ${host.cleanliness} upon arrival and agrees to`,
            `${guest.expectations?.trash ? 'take out the trash' : 'no trash duties'} before departure. The Guest will ${guest.rules?.petsAllowed ? '' : 'not '}bring pets`,
            `and Smoking is ${guest.rules?.smokingAllowed ? 'allowed' : 'not allowed'}.`,
            ``,
            `Both parties agree to:`,
            `• Share photos of their homes to show the current condition.`,
            `• Arrange a call before the swap to ensure expectations are aligned.`,
            ``,
            `Date of Agreement: ${new Date().toISOString().split('T')[0]}`,
          ];

          let y = titleY - 50;
          for (const line of lines) {
            page.drawText(line, {
              x: 50,
              y,
              size: 12,
              font,
              color: rgb(0, 0, 0),
            });
            y -= 16; // tighter spacing
          }

          const pdfBytes = await pdfDoc.save();
          const base64 = Buffer.from(pdfBytes).toString('base64');

          return res.status(200).send({
            message: 'PDF generated successfully.',
            pdf: base64,
            filename: `contract-${contract_id}.pdf`,
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

    await fetchRequest(`${DIRECTUS_URL}/items/contracts/${contract_id}`, {
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
