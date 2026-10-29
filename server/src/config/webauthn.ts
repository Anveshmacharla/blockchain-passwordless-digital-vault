const rpName = process.env.WEBAUTHN_RP_NAME;
const rpID = process.env.WEBAUTHN_RP_ID;
const origin = process.env.WEBAUTHN_ORIGIN;

if (!rpName) {
  throw new Error("WEBAUTHN_RP_NAME is not defined");
}

if (!rpID) {
  throw new Error("WEBAUTHN_RP_ID is not defined");
}

if (!origin) {
  throw new Error("WEBAUTHN_ORIGIN is not defined");
}

export const webauthnConfig = {
  rpName,
  rpID,
  origin,
};