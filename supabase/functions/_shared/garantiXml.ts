// Garanti BBVA VPServlet XML (dev.garantibbva.com.tr: sorgulama-siparis-*, iade-*).
import { hashedPassword } from "./garantiHash.ts";

const hex512 = async (s: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-512", new TextEncoder().encode(s))), (x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
/** XML HashData = SHA512(orderId + terminalId + cardNumber + amount + currency + SHA1(password + 0-padded terminalId)). */
export async function xmlHash(password: string, terminalId: string, orderId: string, cardNumber: string, amount: string, currency: string) {
  return hex512(orderId + terminalId + cardNumber + amount + currency + await hashedPassword(password, terminalId));
}
const esc = (s: string) => s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
export type XmlReq = { mode: string; provUser: string; password: string; terminalId: string; merchantId: string; orderId: string;
  type: "orderinq" | "orderhistoryinq" | "refund"; amount: string; currency: string; ip: string; email: string };
export async function buildXml(r: XmlReq) {
  const hash = await xmlHash(r.password, r.terminalId, r.orderId, "", r.amount, r.currency);
  return `<?xml version="1.0" encoding="iso-8859-9"?><GVPSRequest><Mode>${r.mode}</Mode><Version>512</Version>` +
    `<Terminal><ProvUserID>${r.provUser}</ProvUserID><HashData>${hash}</HashData><UserID>${r.provUser}</UserID><ID>${r.terminalId}</ID><MerchantID>${r.merchantId}</MerchantID></Terminal>` +
    `<Customer><IPAddress>${esc(r.ip)}</IPAddress><EmailAddress>${esc(r.email)}</EmailAddress></Customer>` +
    `<Order><OrderID>${esc(r.orderId)}</OrderID><GroupID/></Order>` +
    `<Transaction><Type>${r.type}</Type>${r.type !== "refund" ? "<ListPageNum>0</ListPageNum>" : ""}<Amount>${r.amount}</Amount><CurrencyCode>${r.currency}</CurrencyCode>` +
    `<CardholderPresentCode>0</CardholderPresentCode><MotoInd>N</MotoInd></Transaction></GVPSRequest>`;
}
export const tag = (xml: string, name: string) => xml.match(new RegExp(`<${name}>([^<]*)</${name}>`))?.[1]?.trim() ?? null;
export const blocks = (xml: string, name: string) => [...xml.matchAll(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, "g"))].map((m) => m[1]);
export function summarize(xml: string) {
  const txn = blocks(xml, "Transaction")[0] ?? "";
  return { returnCode: tag(txn, "ReasonCode") ?? tag(xml, "ReasonCode"), message: tag(xml, "Message"), errorMsg: tag(xml, "ErrorMsg"), sysErr: tag(xml, "SysErrMsg"),
    retref: tag(txn, "RetrefNum"), authCode: tag(txn, "AuthCode"), status: tag(xml, "Status"), authAmount: tag(xml, "AuthAmount"), authDate: tag(xml, "AuthDate"),
    recurringStatus: tag(xml, "RecurringStatus"), recurringInfo: tag(xml, "RecurringInfo"), chargeType: tag(xml, "ChargeType") };
}
/** OrderTxn rows from orderhistoryinq; a row counts as a confirmed sale only with ReturnCode 00 and sales type. */
export function historySales(xml: string) {
  return blocks(xml, "OrderTxn").map((b) => ({ type: (tag(b, "Type") ?? "").toLowerCase(), status: tag(b, "Status"), returnCode: tag(b, "ReturnCode"),
    amount: tag(b, "AuthAmount"), date: tag(b, "AuthDate"), retref: tag(b, "RetrefNum"), voidDate: tag(b, "VoidDate") }))
    .filter((t) => t.returnCode === "00" && t.type.includes("sales") && !t.voidDate && t.retref);
}
