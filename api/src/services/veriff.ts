import { VeriffSessionResponse } from "../../../common/src/types/Veriff";

export async function createVeriffSession(
    userId: string,
    firstName: string,
    lastName: string,
    email: string
): Promise<VeriffSessionResponse> {
    const apiUrl = process.env.VERIFF_BASE_URL || "https://stationapi.veriff.com/v1";
    // 🔹 Normalize base URL (remove trailing slash and /v1 if double added)
    const normalizedUrl = apiUrl.replace(/\/+$/, "") // remove trailing slashes
    const hasVersion = /\/v1$/.test(normalizedUrl)

    // 🔹 Always ensure exactly one /v1/sessions in final URL
    const sessionUrl = hasVersion
        ? `${normalizedUrl}/sessions`
        : `${normalizedUrl}/v1/sessions`
    if (!sessionUrl) {
        throw new Error("Missing VERIFF_BASE_URL env variable");
    }

    const apiKey = process.env.VERIFF_API_KEY;
    if (!apiKey) {
        throw new Error("Missing VERIFF_API_KEY env variable");
    }
    console.log("[Veriff] Creating session with payload:", {
        userId,
        firstName,
        lastName,
        email,
    });

    const payload = {
        verification: {
            person: {
                firstName,
                lastName
            },
            email,
            vendorData: userId,
            lang: "en",
        },
    };

    console.log("[Veriff] Request URL:", `${sessionUrl}/v1/sessions`);
    console.log("[Veriff] Request Headers:", {
        "Content-Type": "application/json",
        "X-AUTH-CLIENT": apiKey,
    });
    console.log("[Veriff] Request Body:", payload);


    const res = await fetch(`${sessionUrl}/sessions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-AUTH-CLIENT": apiKey,
        },
        body: JSON.stringify(payload),
    });

    console.log("[Veriff] Raw response status:", res.status, res.statusText);

    const json = await res.json().catch(() => null);
    console.log("[Veriff] Raw response JSON:", json);

    if (!res.ok) {
        throw new Error(
            `Failed to create Veriff session: ${res.status} ${res.statusText}`
        );
    }


    return json as VeriffSessionResponse;
}
