import { generateKeyPair, exportJWK, exportPKCS8 } from "jose";

const { publicKey, privateKey } = await generateKeyPair("RS256", {
  extractable: true
});
const jwk = await exportJWK(publicKey);

jwk.use = "sig";
jwk.alg = "RS256";
jwk.kid = "convex-auth";

const pkcs8 = await exportPKCS8(privateKey);
const jwks = { keys: [jwk] };

console.log(`CONVEX_AUTH_PRIVATE_KEY="${pkcs8}"`);
console.log(`JWKS='${JSON.stringify(jwks)}'`);
